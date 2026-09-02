import requests
from services.cache import TTLCache

INDIA_LOCATIONS = [
{"city":"Mumbai","state":"Maharashtra","lat":19.076,"lon":72.8777},{"city":"Pune","state":"Maharashtra","lat":18.5204,"lon":73.8567},{"city":"Nagpur","state":"Maharashtra","lat":21.1458,"lon":79.0882},{"city":"Delhi","state":"Delhi","lat":28.6139,"lon":77.209},{"city":"Jaipur","state":"Rajasthan","lat":26.9124,"lon":75.7873},{"city":"Ahmedabad","state":"Gujarat","lat":23.0225,"lon":72.5714},{"city":"Bhopal","state":"Madhya Pradesh","lat":23.2599,"lon":77.4126},{"city":"Lucknow","state":"Uttar Pradesh","lat":26.8467,"lon":80.9462},{"city":"Kolkata","state":"West Bengal","lat":22.5726,"lon":88.3639},{"city":"Bhubaneswar","state":"Odisha","lat":20.2961,"lon":85.8245},{"city":"Guwahati","state":"Assam","lat":26.1445,"lon":91.7362},{"city":"Patna","state":"Bihar","lat":25.5941,"lon":85.1376},{"city":"Ranchi","state":"Jharkhand","lat":23.3441,"lon":85.3096},{"city":"Chennai","state":"Tamil Nadu","lat":13.0827,"lon":80.2707},{"city":"Bengaluru","state":"Karnataka","lat":12.9716,"lon":77.5946},{"city":"Hyderabad","state":"Telangana","lat":17.385,"lon":78.4867},{"city":"Kochi","state":"Kerala","lat":9.9312,"lon":76.2673},{"city":"Srinagar","state":"Jammu and Kashmir","lat":34.0837,"lon":74.7973},{"city":"Chandigarh","state":"Chandigarh","lat":30.7333,"lon":76.7794},{"city":"Dehradun","state":"Uttarakhand","lat":30.3165,"lon":78.0322}
]

class OpenMeteoClient:
    def __init__(self, cache_ttl=180):
        self.url="https://api.open-meteo.com/v1/forecast"
        self.cache=TTLCache(); self.cache_ttl=cache_ttl
        self.session=requests.Session()
        self.session.headers.update({"Accept":"application/json","User-Agent":"ExtremeWeatherTracker/1.0"})

    def _get_city(self, loc):
        params={"latitude":loc["lat"],"longitude":loc["lon"],"current":"temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m,wind_gusts_10m","hourly":"precipitation_probability,precipitation,weather_code,wind_gusts_10m","forecast_days":1,"timezone":"auto"}
        key="weather:"+loc["city"]
        cached=self.cache.get(key)
        if cached is not None: return cached
        r=self.session.get(self.url,params=params,timeout=20); r.raise_for_status(); p=r.json()
        result={**loc,"source":"Open-Meteo","current":p.get("current",{}),"hourly":p.get("hourly",{}),"timezone":p.get("timezone"),"updated_at":p.get("current",{}).get("time")}
        self.cache.set(key,result,self.cache_ttl); return result

    def get_live_weather(self, city=None):
        locs=INDIA_LOCATIONS if not city else [x for x in INDIA_LOCATIONS if x["city"].lower()==city.lower()]
        if not locs:
            return {"source":"Open-Meteo","live":True,"error":f"City '{city}' is not in the MVP location list.","available_cities":[x["city"] for x in INDIA_LOCATIONS]}
        results=[self._get_city(x) for x in locs]
        return {"source":"Open-Meteo","live":True,"count":len(results),"locations":results}
