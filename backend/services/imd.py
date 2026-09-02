import requests
from services.cache import TTLCache

class IMDClient:
    """
    Small IMD API wrapper.

    The exact set of endpoints available to an account can vary.
    Keep endpoint paths in one place so they can be adjusted without
    changing the rest of the application.
    """

    def __init__(self, base_url, api_key="", cache_ttl=180):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.cache_ttl = cache_ttl
        self.cache = TTLCache()
        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/json",
            "User-Agent": "ExtremeWeatherTracker/1.0",
        })
        if self.api_key:
            self.session.headers.update({
                "Authorization": f"Bearer {self.api_key}",
                "X-API-Key": self.api_key,
            })

    def _get(self, path, params=None, cache_key=None):
        key = cache_key or f"{path}:{params}"
        cached = self.cache.get(key)
        if cached is not None:
            return cached

        url = f"{self.base_url}/{path.lstrip('/')}"
        response = self.session.get(url, params=params, timeout=20)
        response.raise_for_status()
        data = response.json()
        self.cache.set(key, data, self.cache_ttl)
        return data

    def get_warnings(self):
        return self._get(
            "/api/warnings_district",
            cache_key="warnings_district",
        )

    def get_nowcast(self):
        return self._get(
            "/api/nowcast_district",
            cache_key="nowcast_district",
        )

    def get_cyclones(self):
        return self._get(
            "/api/v1/cyclone_track",
            cache_key="cyclone_track",
        )

    def get_current_weather(self, station=None):
        params = {"station": station} if station else None
        return self._get(
            "/api/current_weather",
            params=params,
            cache_key=f"current_weather:{station or 'all'}",
        )

    def get_live_sources(self):
        return {
            "warnings": self.get_warnings(),
            "nowcast": self.get_nowcast(),
            "cyclones": self.get_cyclones(),
        }
