import time
from threading import Lock

class TTLCache:
    def __init__(self):
        self._items = {}
        self._lock = Lock()

    def get(self, key):
        with self._lock:
            item = self._items.get(key)
            if not item:
                return None
            value, expires_at = item
            if time.time() >= expires_at:
                self._items.pop(key, None)
                return None
            return value

    def set(self, key, value, ttl):
        with self._lock:
            self._items[key] = (value, time.time() + ttl)
