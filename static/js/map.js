let map;
let marker;
let infowindow;
let autocomplete;
let geocoder;

function initMap() {
  const defaultPos = { lat: 17.385044, lng: 78.486671 }; // Hyderabad center

  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultPos,
    zoom: 12,
  });

  infowindow = new google.maps.InfoWindow();
  marker = new google.maps.Marker({ map: map });
  geocoder = new google.maps.Geocoder();

  setupAutocomplete();

  // Click on map
  map.addListener("click", (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    placeMarkerAndPanTo(e.latLng);
    fetchLivability(lat, lng);

    // Reverse geocode clicked lat/lng to city name -> ML + Suggestions
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results.length > 0) {
        const cityName = extractCityName(results[0]);
        if (cityName) {
          fetchMLPrediction(cityName);
          fetchSuggestions(cityName);
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
    // ML + Suggestions using place name
    if (place.name) {
      fetchMLPrediction(place.name);
      fetchSuggestions(place.name);
    }
  });
}

function placeMarkerAndPanTo(latLng) {
  marker.setPosition(latLng);
  map.panTo(latLng);
}

// -------------------- CITY NAME EXTRACT --------------------
function extractCityName(geocodeResult) {
  let cityName = null;

  // Prefer locality
  geocodeResult.address_components.forEach((comp) => {
    if (comp.types.includes("locality")) {
      cityName = comp.long_name;
    }
  });

  // Fallback: admin area level 2
  if (!cityName) {
    geocodeResult.address_components.forEach((comp) => {
      if (comp.types.includes("administrative_area_level_2")) {
        cityName = comp.long_name;
      }
    });
  }

  return cityName;
}

// -------------------- LIVABILITY API --------------------
async function fetchLivability(lat, lng) {
  try {
    const resp = await fetch(`/api/livability?lat=${lat}&lng=${lng}`);
    const data = await resp.json();
    renderLivability(data);
  } catch (err) {
    console.error("Error fetching livability:", err);

    document.getElementById("summary-content").innerHTML =
      `<li class="list-group-item text-danger">Error fetching data.</li>`;

    document.getElementById("facilities-list").innerHTML =
      `<li class="list-group-item">No facilities data.</li>`;
  }
}

function renderLivability(data) {
  if (data.error) {
    document.getElementById("summary-content").innerHTML =
      `<li class="list-group-item text-danger">${data.error}</li>`;
    document.getElementById("facilities-list").innerHTML =
      `<li class="list-group-item">No facilities data.</li>`;
    return;
  }

  // PM2.5 health impact
  const pm25 = data.components.aqi.pm25;
  let pm25Health = "Unknown";

  if (pm25 !== "N/A") {
    if (pm25 <= 12) pm25Health = "Good air quality";
    else if (pm25 <= 35.4) pm25Health = "Moderate air quality";
    else if (pm25 <= 55.4) pm25Health = "Unhealthy for sensitive groups";
    else if (pm25 <= 150.4) pm25Health = "Unhealthy";
    else pm25Health = "Very unhealthy or hazardous";
  }

  // Summary UI
  const summaryHTML = `
    <li class="list-group-item"><strong>Score:</strong>
      <span class="badge bg-success">${data.score}</span>
    </li>
    <li class="list-group-item"><strong>Category:</strong>
      <span class="badge bg-info">${data.category}</span>
    </li>
    <li class="list-group-item"><strong>Live AQI:</strong>
      ${data.components.aqi.aqi} (PM2.5: ${pm25}) (${pm25Health})
    </li>
    <li class="list-group-item"><strong>WQI:</strong> ${data.components.wqi.wqi}</li>
    <li class="list-group-item"><small><em>Last updated: ${data.components.aqi.last_updated}</em></small></li>
  `;

  document.getElementById("summary-content").innerHTML = summaryHTML;

  // Facilities grouped
  const facilitiesByType = {
    hospital: [],
    school: [],
    grocery_or_supermarket: [],
  };

  data.components.facilities.forEach((f) => {
    if (facilitiesByType[f.type]) facilitiesByType[f.type].push(f);
  });

  let facilitiesHTML = "";

  for (const [type, places] of Object.entries(facilitiesByType)) {
    if (places.length > 0) {
      const readableType = type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      facilitiesHTML += `
        <li class="list-group-item active text-dark">
          <strong>${readableType}</strong>
        </li>
      `;

      places.forEach((place) => {
        facilitiesHTML += `
          <li class="list-group-item">
            <i class="bi bi-building"></i>
            ${place.name} — ${place.vicinity} (${place.distance_m}m)
          </li>
        `;
      });
    }
  }

  document.getElementById("facilities-list").innerHTML =
    facilitiesHTML || `<li class="list-group-item">No nearby facilities found.</li>`;

  // Popup info window
  if (marker) {
    infowindow.setContent(
      `<div><strong>Livability: ${data.score} (${data.category})</strong></div>`
    );
    infowindow.open(map, marker);
  }
}

// -------------------- ML PREDICTION API --------------------
async function fetchMLPrediction(city) {
  const target = document.getElementById("ml-content");
  if (!target) return;

  target.innerHTML = `<li class="list-group-item">Loading ML prediction...</li>`;

  try {
    const resp = await fetch(`/api/predict?city=${encodeURIComponent(city)}`);
    const data = await resp.json();

    if (data.error) {
      target.innerHTML = `
        <li class="list-group-item text-warning">
          ${data.error}
          ${data.suggestions ? `<br/><small>Suggestions: ${data.suggestions.join(", ")}</small>` : ""}
        </li>`;
      return;
    }

    target.innerHTML = `
      <li class="list-group-item list-group-item-info">
        <strong>ML Prediction:</strong> ${data.prediction}
      </li>
      <li class="list-group-item"><strong>City:</strong> ${data.city}, ${data.state}</li>
      <li class="list-group-item"><strong>Dataset AQI:</strong> ${data.aqi}%</li>
      <li class="list-group-item"><strong>Dataset WQI:</strong> ${data.wqi}%</li>
      <li class="list-group-item"><strong>Water Quantity:</strong> ${data.water_quantity}%</li>
      <li class="list-group-item"><strong>Population Density:</strong> ${data.population_density}%</li>
      <li class="list-group-item"><strong>Industry Distance:</strong> ${data.industry_distance} km</li>
      <li class="list-group-item"><strong>Pollution:</strong> ${data.pollution}%</li>
      <li class="list-group-item"><strong>Cost of Living:</strong> ₹${data.cost_of_living}</li>
      <li class="list-group-item"><strong>Hospitals Nearby:</strong> ${data.hospitals}</li>
      <li class="list-group-item"><strong>Schools Nearby:</strong> ${data.schools}</li>
      <li class="list-group-item"><strong>Stores Nearby:</strong> ${data.stores}</li>
      <li class="list-group-item"><strong>Soil Type:</strong> ${data.soil_type}</li>
    `;
  } catch (err) {
    console.error("Error fetching ML prediction:", err);
    target.innerHTML =
      `<li class="list-group-item text-danger">Error fetching ML prediction.</li>`;
  }
}

// -------------------- SUGGESTIONS API --------------------
async function fetchSuggestions(city) {
  const box = document.getElementById("future-content");
  if (!box) return;

  box.innerHTML = `<p class="text-muted mb-0">Loading nearby good areas...</p>`;

  try {
    const resp = await fetch(`/api/suggestions?city=${encodeURIComponent(city)}`);
    const data = await resp.json();

    if (data.error) {
      box.innerHTML = `<div class="text-danger">${data.error}</div>`;
      return;
    }

    if (!data.suggestions || data.suggestions.length === 0) {
      box.innerHTML = `<div class="text-muted">No better nearby suggestions found.</div>`;
      return;
    }

    box.innerHTML = data.suggestions
      .map(
        (s, i) => `
        <div class="suggestion-item">
          <div class="d-flex justify-content-between align-items-center">
            <strong>${i + 1}. ${s.city}</strong>
            <span class="badge bg-success">Suitable</span>
          </div>
          <small class="text-muted">${s.state}</small>
          <div class="mt-1 small">
            AQI: ${s.aqi}% | WQI: ${s.wqi}% | Pollution: ${s.pollution}% | Industry: ${s.industry_distance}km
          </div>
          <div class="small">
            Cost: ₹${s.cost_of_living} | Hospitals: ${s.hospitals} | Schools: ${s.schools} | Stores: ${s.stores}
          </div>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    box.innerHTML = `<div class="text-danger">Error loading suggestions.</div>`;
  }
}