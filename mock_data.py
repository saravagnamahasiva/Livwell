# mock_data.py
def get_mock_aqi(lat, lng):
    # Return a sample AQI object for demo
    return {
        "aqi": 72,
        "pm25": 56,
        "pm10": 80,
        "o3": 15,
        "last_updated": "2025-09-09T10:00:00+05:30"
    }

def get_mock_wqi(lat, lng):
    return {
        "wqi": 68,
        "parameters": {
            "pH": 7.2,
            "dissolved_oxygen": 6.8
        },
        "last_updated": "2025-09-08T09:00:00+05:30"
    }

def get_mock_facilities(lat, lng):
    # sample Google Places-like result
    return [
        {"name": "City Hospital", "type": "hospital", "distance_m": 400},
        {"name": "Green Grocer", "type": "grocery", "distance_m": 250},
        {"name": "Govt Higher Secondary School", "type": "school", "distance_m": 600}
    ]
