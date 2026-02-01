from flask import Flask, request, jsonify
import pandas as pd
import joblib
import difflib

app = Flask(__name__)

# Load dataset and model
original_df = pd.read_csv("final_dataset.csv")
model, label_encoders, categorical_cols = joblib.load("model.pkl")

@app.route("/api/predict", methods=["GET"])
def predict():
    city_name = request.args.get("city")
    if not city_name:
        return jsonify({"error": "City is required"}), 400

    matches = original_df[original_df['City'].str.lower() == city_name.lower()]

    if matches.empty:
        possible_cities = original_df['City'].unique()
        close_matches = difflib.get_close_matches(city_name, possible_cities, n=3, cutoff=0.6)
        return jsonify({"error": f"City '{city_name}' not found", "suggestions": [str(c) for c in close_matches]}), 404

    city_original = matches.iloc[0]

    # Encode features
    encoded_row = city_original.copy()
    for col in categorical_cols:
        encoded_row[col] = label_encoders[col].transform([city_original[col]])[0]
    features = encoded_row.drop(['Livability Label', 'Area ID'])

    # Predict
    prediction = model.predict([features])[0]
    livability = label_encoders['Livability Label'].inverse_transform([prediction])[0]

    # ✅ Convert to Python native types (str/int/float)
    result = {
        "city": str(city_original['City']),
        "state": str(city_original['State']),
        "aqi": float(city_original['AQI (%)']),
        "wqi": float(city_original['WQI (%)']),
        "water_quantity": float(city_original['Water Quantity (%)']),
        "population_density": float(city_original['Population Density (%)']),
        "industry_distance": float(city_original['Industry Distance (km)']),
        "pollution": float(city_original['Pollution (%)']),
        "cost_of_living": int(city_original['Cost of Living']),
        "hospitals": int(city_original['Hospitals Nearby']),
        "schools": int(city_original['Schools Nearby']),
        "stores": int(city_original['Stores Nearby']),
        "soil_type": str(city_original['Soil Type']),
        "prediction": str(livability)
    }

    return jsonify(result)

if __name__ == "__main__":
    app.run(port=5001, debug=True)
