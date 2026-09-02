import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from services.open_meteo import OpenMeteoClient
from services.normalizer import build_live_events, build_live_stats

load_dotenv()
app = Flask(__name__)
CORS(app)
weather = OpenMeteoClient(cache_ttl=int(os.getenv("WEATHER_CACHE_TTL", "180")))

@app.get("/api/health")
def health():
    return jsonify({"status":"ok","service":"Extreme Weather Tracker API","source":"Open-Meteo","live":True,"api_key_required":False})

@app.get("/api/live/events")
def live_events():
    events = build_live_events(weather.get_live_weather())
    return jsonify({"source":"Open-Meteo","live":True,"derived_events":True,"count":len(events),"events":events})

@app.get("/api/live/weather")
def live_weather():
    return jsonify(weather.get_live_weather(city=request.args.get("city")))

@app.get("/api/live/warnings")
def live_warnings():
    events = build_live_events(weather.get_live_weather())
    return jsonify({"source":"Open-Meteo","live":True,"derived":True,"warnings":events})

@app.get("/api/live/nowcast")
def live_nowcast():
    return jsonify(weather.get_live_weather())

@app.get("/api/live/cyclones")
def live_cyclones():
    return jsonify({"source":"Open-Meteo","live":True,"message":"Cyclone tracking reserved for future IMD integration.","cyclones":[]})

@app.get("/api/live/stats")
def live_stats():
    return jsonify(build_live_stats(build_live_events(weather.get_live_weather())))

@app.errorhandler(404)
def not_found(_):
    return jsonify({"error":"Endpoint not found","hint":"Try /api/health or /api/live/events"}), 404

if __name__ == "__main__":
    app.run(host=os.getenv("HOST","127.0.0.1"), port=int(os.getenv("PORT","5000")), debug=os.getenv("FLASK_DEBUG","true").lower()=="true")
