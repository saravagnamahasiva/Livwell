// static/js/streetview.js
let svPanorama;

function loadStreetView(lat, lng) {
  const svContainer = document.getElementById("streetview_container");

  // Create panorama if not exists
  if (!svPanorama) {
    svPanorama = new google.maps.StreetViewPanorama(svContainer, {
      position: { lat: lat, lng: lng },
      pov: { heading: 165, pitch: 0 },
      visible: true,
      motionTracking: false,
    });
  } else {
    svPanorama.setPosition({ lat: lat, lng: lng });
    svPanorama.setPov({ heading: 165, pitch: 0 });
  }

  // If no imagery available, show fallback
  google.maps.event.addListenerOnce(svPanorama, 'status_changed', () => {
    // status handling is subtle — StreetViewPanorama has getVisible/controls,
    // We'll fallback if no pano data is shown after a short delay.
    setTimeout(() => {
      if (!svPanorama.getVisible()) {
        svContainer.innerHTML = "<div style='padding:12px;'>Street View not available for this location.</div>";
      }
    }, 1000);
  });
}
