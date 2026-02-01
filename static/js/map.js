let map;
let marker;
let infowindow;
let autocomplete;
let geocoder;

function initMap() {
  const defaultPos = { lat: 17.385044, lng: 78.486671 };  // Hyderabad center
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultPos,
    zoom: 12,
  });

  infowindow = new google.maps.InfoWindow();
  marker = new google.maps.Marker({ map: map });
  geocoder = new google.maps.Geocoder();

  setupAutocomplete();

  map.addListener("click", (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    placeMarkerAndPanTo(e.latLng);
    fetchLivability(lat, lng);
    loadStreetView(lat, lng);

    // 🔥 Reverse geocode clicked lat/lng to city & call ML API
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        let cityName = null;
        results[0].address_components.forEach(comp => {
          if (comp.types.includes("locality")) {
            cityName = comp.long_name;
          }
        });
        if (cityName) {
          fetchMLPrediction(cityName, lat, lng);
        }
      }
    });
  });
}

function setupAutocomplete() {
  const input = document.getElementById("search-bar");
  autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo("bounds", map);

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) {
      alert("No details available for input: '" + place.name + "'");
      return;
    }

    map.panTo(place.geometry.location);
    map.setZoom(15);

    marker.setPosition(place.geometry.location);
    marker.setVisible(true);

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    fetchLivability(lat, lng);
    loadStreetView(lat, lng);

    // 🔥 Call ML API using city name from autocomplete
    if (place.name) {
      fetchMLPrediction(place.name, lat, lng);
    }
  });
}

function placeMarkerAndPanTo(latLng) {
  marker.setPosition(latLng);
  map.panTo(latLng);
}

async function fetchLivability(lat, lng) {
  try {
    const resp = await fetch(`/api/livability?lat=${lat}&lng=${lng}`);
    const data = await resp.json();
    renderInfo(data); // still used for facilities
  } catch (err) {
    console.error("Error fetching livability:", err);
    document.getElementById("summary-content").innerHTML =
      `<li class="list-group-item text-danger">Error fetching data.</li>`;
    document.getElementById("facilities-list").innerHTML =
      `<li class="list-group-item">No facilities data.</li>`;
  }
}

// ✅ ML API Fetch Function with OpenWeather AQI
async function fetchMLPrediction(city, lat, lng) {
  try {
    const resp = await fetch(`/api/predict?city=${encodeURIComponent(city)}`);
    const data = await resp.json();
    console.log("ML Prediction:", data);

    if (data.error) {
      document.getElementById("ml-summary").innerHTML =
        `<li class="list-group-item text-warning">ML Prediction: ${data.error}</li>`;
      return;
    }

    // 🎯 Generate random score based on ML prediction
    let score;
    if (data.prediction === "Not Suitable") {
      score = Math.floor(Math.random() * (50 - 35 + 1)) + 35; // 35–50
    } else {
      score = Math.floor(Math.random() * (90 - 60 + 1)) + 60; // 60–90
    }

    // ✅ Fetch OpenWeather Live AQI using lat/lng
    const aqiResp = await fetch(`/api/livability?lat=${lat}&lng=${lng}`);
    const aqiData = await aqiResp.json();
    const liveAQI = aqiData.components.aqi.aqi || "N/A";
    const pm25 = aqiData.components.aqi.pm25 || "N/A";

    let pm25Health = 'Unknown';
    if (pm25 !== 'N/A') {
      if (pm25 <= 12) pm25Health = 'Good air quality';
      else if (pm25 <= 35.4) pm25Health = 'Moderate air quality';
      else if (pm25 <= 55.4) pm25Health = 'Unhealthy for sensitive groups';
      else if (pm25 <= 150.4) pm25Health = 'Unhealthy';
      else pm25Health = 'Very unhealthy or hazardous';
    }

    // 🟢 Update Livability Summary (Score + Category + Live AQI)
    const summaryHTML = `
      <li class="list-group-item"><strong>Score:</strong> 
        <span class="badge bg-success">${score}</span></li>
      <li class="list-group-item"><strong>Category:</strong> 
        <span class="badge bg-info">${data.prediction}</span></li>
      <li class="list-group-item"><strong>Live AQI:</strong> ${liveAQI} 
        (PM2.5: ${pm25}) (${pm25Health})</li>
      <li class="list-group-item"><small><em>Last updated: ${aqiData.components.aqi.last_updated}</em></small></li>
    `;
    document.getElementById("summary-content").innerHTML = summaryHTML;

    // 🟢 Keep ML Prediction Summary as detailed block
    const mlHTML = `
      <li class="list-group-item bg-light"><strong>Prediction:</strong> ${data.prediction}</li>
      <li class="list-group-item"><strong>City:</strong> ${data.city}, ${data.state}</li>
      <li class="list-group-item"><strong>AQI:</strong> ${data.aqi}</li>
      <li class="list-group-item"><strong>WQI:</strong> ${data.wqi}</li>
      <li class="list-group-item"><strong>Water Quantity:</strong> ${data.water_quantity}</li>
      <li class="list-group-item"><strong>Population Density:</strong> ${data.population_density}</li>
      <li class="list-group-item"><strong>Industry Distance:</strong> ${data.industry_distance} km</li>
      <li class="list-group-item"><strong>Pollution:</strong> ${data.pollution}%</li>
      <li class="list-group-item"><strong>Cost of Living:</strong> ₹${data.cost_of_living}</li>
      <li class="list-group-item"><strong>Hospitals Nearby:</strong> ${data.hospitals}</li>
      <li class="list-group-item"><strong>Schools Nearby:</strong> ${data.schools}</li>
      <li class="list-group-item"><strong>Stores Nearby:</strong> ${data.stores}</li>
      <li class="list-group-item"><strong>Soil Type:</strong> ${data.soil_type}</li>
    `;
    document.getElementById("ml-summary").innerHTML = mlHTML;

  } catch (err) {
    console.error("Error fetching ML prediction:", err);
    document.getElementById("ml-summary").innerHTML =
      `<li class="list-group-item text-danger">Error fetching ML prediction.</li>`;
  }
}

function renderInfo(data) {
  // keep only nearby facilities rendering
  if (data.error) {
    document.getElementById("facilities-list").innerHTML =
      `<li class="list-group-item">No facilities data.</li>`;
    return;
  }

  const facilitiesByType = { hospital: [], school: [], grocery_or_supermarket: [] };
  data.components.facilities.forEach(f => {
    if (facilitiesByType[f.type]) {
      facilitiesByType[f.type].push(f);
    }
  });

  let facilitiesHTML = '';
  for (const [type, places] of Object.entries(facilitiesByType)) {
    if (places.length > 0) {
      const readableType = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      facilitiesHTML += `<li class="list-group-item active"><strong>${readableType}</strong></li>`;
      places.forEach(place => {
        facilitiesHTML += `<li class="list-group-item"><i class="bi bi-building"></i> ${place.name} — ${place.vicinity} (${place.distance_m}m)</li>`;
      });
    }
  }

  document.getElementById("facilities-list").innerHTML = facilitiesHTML ||
    `<li class="list-group-item">No nearby facilities found.</li>`;
}
