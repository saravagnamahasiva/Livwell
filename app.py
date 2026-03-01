from flask import Flask, render_template, request, jsonify
import os
import requests
import pandas as pd
import joblib
import difflib
from dotenv import load_dotenv

# Load environment variables from .env (local only)
load_dotenv()

app = Flask(__name__)

# ---------------- CONFIG ----------------
# Use Render environment variables in production
# Use .env locally
app.config['GOOGLE_MAPS_API_KEY'] = os.environ.get("GOOGLE_MAPS_API_KEY", "YOUR_LOCAL_GOOGLE_MAPS_KEY")
app.config['OPENWEATHER_API_KEY'] = os.environ.get("OPENWEATHER_API_KEY", "YOUR_LOCAL_OPENWEATHER_KEY")

# ---------------- ML LOAD (ON STARTUP) ----------------
# Ensure these exist in the same folder as app.py
# - final_dataset.csv
# - model.pkl
original_df = pd.read_csv("final_dataset.csv")
model, label_encoders, categorical_cols = joblib.load("model.pkl")


# ---------------- UTILITIES ----------------
def get_nearby_places(lat, lng, place_type, radius=1000):
    api_key = app.config['GOOGLE_MAPS_API_KEY']
    url = (
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        f"?location={lat},{lng}"
        f"&radius={radius}"
        f"&type={place_type}"
        f"&key={api_key}"
    )

    try:
        response = requests.get(url, timeout=15)
        results = response.json().get("results", [])
    except Exception:
        results = []

    places = []
    for place in results[:5]:
        places.append({
            "name": place.get("name"),
            "type": place_type,
            "vicinity": place.get("vicinity"),
            "distance_m": 500  # placeholder (Google doesn't return distance in nearbysearch)
        })
    return places


def get_real_aqi(lat, lon):
    api_key = app.config['OPENWEATHER_API_KEY']
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={api_key}"

    try:
        response = requests.get(url, timeout=15)
        if response.status_code != 200:
            return {"aqi": "N/A", "pm25": "N/A", "last_updated": "N/A"}

        data = response.json()
        aqi_index = data["list"][0]["main"]["aqi"]  # 1–5
        aqi_scaled = aqi_index * 20                 # 20–100 (your scaling)

        pm25 = data["list"][0]["components"].get("pm2_5", "N/A")

        return {"aqi": aqi_scaled, "pm25": pm25, "last_updated": "Real-Time"}
    except Exception:
        return {"aqi": "N/A", "pm25": "N/A", "last_updated": "N/A"}


# ---------------- ROUTES ----------------
@app.route("/")
def index():
    return render_template("index.html", google_maps_api_key=app.config["GOOGLE_MAPS_API_KEY"])


@app.route("/health")
def health():
    return "ok", 200


@app.route("/api/livability")
def get_livability():
    lat = request.args.get("lat")
    lng = request.args.get("lng")

    if not lat or not lng:
        return jsonify({"error": "Missing coordinates"}), 400

    # Real-time AQI
    aqi_data = get_real_aqi(lat, lng)

    # WQI still dummy (you can add real later)
    components = {
        "aqi": aqi_data,
        "wqi": {"wqi": 85}
    }

    # Nearby facilities
    facilities = []
    for place_type in ["hospital", "school", "grocery_or_supermarket"]:
        facilities.extend(get_nearby_places(lat, lng, place_type))

    result = {
        "score": 82,  # dummy overall score for now
        "category": "Good for Living",
        "components": {
            "aqi": components["aqi"],
            "wqi": components["wqi"],
            "facilities": facilities
        }
    }

    return jsonify(result)


# ---------------- ML PREDICTION ----------------
@app.route("/api/predict")
def predict():
    city_name = request.args.get("city")
    if not city_name:
        return jsonify({"error": "City parameter is required"}), 400

    matches = original_df[original_df["City"].astype(str).str.lower() == city_name.lower()]

    if matches.empty:
        possible_cities = original_df["City"].astype(str).unique()
        close_matches = difflib.get_close_matches(city_name, possible_cities, n=3, cutoff=0.6)
        return jsonify({
            "error": f"City '{city_name}' not found",
            "suggestions": [str(c) for c in close_matches]
        }), 404

    city_original = matches.iloc[0]

    # Encode for prediction
    encoded_row = city_original.copy()
    for col in categorical_cols:
        encoded_row[col] = label_encoders[col].transform([str(city_original[col])])[0]

    features = encoded_row.drop(["Livability Label", "Area ID"])

    prediction_val = model.predict([features])[0]
    livability = label_encoders["Livability Label"].inverse_transform([prediction_val])[0]

    result = {
        "city": str(city_original["City"]),
        "state": str(city_original["State"]),
        "aqi": float(city_original["AQI (%)"]),
        "wqi": float(city_original["WQI (%)"]),
        "water_quantity": float(city_original["Water Quantity (%)"]),
        "population_density": float(city_original["Population Density (%)"]),
        "industry_distance": float(city_original["Industry Distance (km)"]),
        "pollution": float(city_original["Pollution (%)"]),
        "cost_of_living": int(city_original["Cost of Living"]),
        "hospitals": int(city_original["Hospitals Nearby"]),
        "schools": int(city_original["Schools Nearby"]),
        "stores": int(city_original["Stores Nearby"]),
        "soil_type": str(city_original["Soil Type"]),
        "prediction": str(livability)
    }

    return jsonify(result)


# ---------------- SUGGESTIONS: NEARBY GOOD AREAS ----------------
@app.route("/api/suggestions")
def suggestions():
    city_name = request.args.get("city")
    if not city_name:
        return jsonify({"error": "City parameter is required"}), 400

    matches = original_df[original_df["City"].astype(str).str.lower() == city_name.lower()]
    if matches.empty:
        return jsonify({"error": "City not found"}), 404

    base_row = matches.iloc[0]
    state = str(base_row["State"])

    df_state = original_df[original_df["State"].astype(str) == state].copy()
    df_state["Livability Label"] = df_state["Livability Label"].astype(str)

    df_suitable = df_state[df_state["Livability Label"].str.lower() == "suitable"].copy()

    # Simple "goodness" score (higher = better)
    df_suitable["goodness"] = (
        (100 - df_suitable["AQI (%)"]) * 0.30 +
        (df_suitable["WQI (%)"]) * 0.30 +
        (100 - df_suitable["Pollution (%)"]) * 0.25 +
        (df_suitable["Industry Distance (km)"]) * 0.15
    )

    # remove same city
    df_suitable = df_suitable[df_suitable["City"].astype(str).str.lower() != city_name.lower()]

    top = df_suitable.sort_values("goodness", ascending=False).head(5)

    results = []
    for _, r in top.iterrows():
        results.append({
            "city": str(r["City"]),
            "state": str(r["State"]),
            "aqi": float(r["AQI (%)"]),
            "wqi": float(r["WQI (%)"]),
            "pollution": float(r["Pollution (%)"]),
            "industry_distance": float(r["Industry Distance (km)"]),
            "cost_of_living": int(r["Cost of Living"]),
            "hospitals": int(r["Hospitals Nearby"]),
            "schools": int(r["Schools Nearby"]),
            "stores": int(r["Stores Nearby"]),
        })

    return jsonify({
        "base_city": city_name,
        "state": state,
        "suggestions": results
    })


# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)