from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)
app.config['GOOGLE_MAPS_API_KEY'] = "AIzaSyBEDZYrAqbXLIMh4z-HsyI9YyRI0QRAj3Q"
app.config['OPENWEATHER_API_KEY'] = "cfe48a7245126131a4ac309b754d03fa"

# --- UTILITIES ---

def get_nearby_places(lat, lng, place_type, radius=1000):
    api_key = app.config['GOOGLE_MAPS_API_KEY']
    url = (
        f"https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        f"?location={lat},{lng}"
        f"&radius={radius}"
        f"&type={place_type}"
        f"&key={api_key}"
    )
    response = requests.get(url)
    results = response.json().get('results', [])

    places = []
    for place in results[:5]:  # Top 5 places
        places.append({
            'name': place.get('name'),
            'type': place_type,
            'vicinity': place.get('vicinity'),
            'distance_m': 500  # Placeholder distance
        })
    return places


def get_real_aqi(lat, lon):
    api_key = app.config['OPENWEATHER_API_KEY']
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={api_key}"

    response = requests.get(url)
    if response.status_code != 200:
        print(f"OpenWeather API error: {response.status_code}")
        return {'aqi': 'N/A', 'pm25': 'N/A', 'last_updated': 'N/A'}

    data = response.json()
    aqi_index = data['list'][0]['main']['aqi']    # 1 to 5 scale
    aqi_scaled = aqi_index * 20                   # Scale to 1-100

    components = data['list'][0]['components']
    pm25 = components.get('pm2_5', 'N/A')

    return {
        'aqi': aqi_scaled,
        'pm25': pm25,
        'last_updated': 'Real-Time'
    }

# --- ROUTES ---

@app.route('/')
def index():
    return render_template('index.html', google_maps_api_key=app.config['GOOGLE_MAPS_API_KEY'])


@app.route('/api/livability')
def get_livability():
    lat = request.args.get('lat')
    lng = request.args.get('lng')

    if not lat or not lng:
        return jsonify({'error': 'Missing coordinates'}), 400

    # Get real-time AQI data
    aqi_data = get_real_aqi(lat, lng)

    components = {
        'aqi': aqi_data,
        'wqi': {'wqi': 85}  # Dummy WQI
    }

    facilities = []
    for place_type in ['hospital', 'school', 'grocery_or_supermarket']:
        facilities.extend(get_nearby_places(lat, lng, place_type))

    result = {
        'score': 82,
        'category': 'Good for Living',
        'components': {
            'aqi': components['aqi'],
            'wqi': components['wqi'],
            'facilities': facilities
        }
    }

    return jsonify(result)


# --- PROXY ENDPOINT FOR ML SERVICE ---
@app.route("/api/predict")
def proxy_predict():
    city = request.args.get("city")
    if not city:
        return jsonify({"error": "City parameter is required"}), 400

    try:
        # Forward request to ML service (port 5001)
        resp = requests.get(f"http://127.0.0.1:5001/api/predict?city={city}")

        if resp.status_code != 200:
            return jsonify({"error": "ML service error", "details": resp.text}), resp.status_code

        # Always return JSON
        return jsonify(resp.json())

    except Exception as e:
        return jsonify({"error": f"Proxy error: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
