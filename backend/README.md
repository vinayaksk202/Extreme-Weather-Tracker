# Extreme Weather Tracker — Live MVP Backend

This version uses Open-Meteo for live/current weather and requires no API key.

Run:
```powershell
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Test:
- http://127.0.0.1:5000/api/health
- http://127.0.0.1:5000/api/live/events
- http://127.0.0.1:5000/api/live/weather

Important: `/api/live/events` derives extreme-event flags from current Open-Meteo observations using transparent MVP thresholds. They are not official IMD warnings. IMD can be added later as the authoritative warning source.
