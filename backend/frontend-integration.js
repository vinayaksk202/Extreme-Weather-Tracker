// Optional frontend integration.
// After the Flask backend is running, replace your mock-data initialization
// with: loadLiveEvents();

async function loadLiveEvents() {
  try {
    const response = await fetch("http://127.0.0.1:5000/api/live/events");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    console.log("Live IMD events:", payload);

    // TODO:
    // Feed payload.events into your existing map/timeline/chart rendering.
    // Example:
    // renderEvents(payload.events);

    return payload.events || [];
  } catch (error) {
    console.error("Unable to load live weather events:", error);
    return [];
  }
}
