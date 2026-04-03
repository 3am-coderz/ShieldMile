import json
import urllib.request
import urllib.error
import random

_weather_state = {}

# Approximate center coordinates for Mumbai pincodes
PINCODE_COORDS = {
    "400001": {"lat": 18.9322, "lon": 72.8368},
    "400002": {"lat": 18.9469, "lon": 72.8276},
    "400003": {"lat": 18.9566, "lon": 72.8340},
    "400004": {"lat": 18.9554, "lon": 72.8184},
    "400005": {"lat": 18.9038, "lon": 72.8157},
    "400006": {"lat": 18.9551, "lon": 72.7981},
    "400007": {"lat": 18.9610, "lon": 72.8154},
    "400008": {"lat": 18.9686, "lon": 72.8262},
    "400009": {"lat": 18.9592, "lon": 72.8398},
    "400010": {"lat": 18.9734, "lon": 72.8447},
}

def get_real_weather(pincode: str, custom_lat: float = None, custom_lon: float = None) -> dict:
    if custom_lat is not None and custom_lon is not None:
        coords = {"lat": custom_lat, "lon": custom_lon}
    else:
        coords = PINCODE_COORDS.get(pincode, {"lat": 19.0760, "lon": 72.8777}) # Default Mumbai
    url = f"https://api.open-meteo.com/v1/forecast?latitude={coords['lat']}&longitude={coords['lon']}&current=precipitation,wind_speed_10m,visibility"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'GigShield/1.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read())
            current = data.get("current", {})
            
            # Visibility comes in meters in Open-Meteo, convert to km
            visibility_m = current.get("visibility", 10000)
            visibility_km = visibility_m / 1000.0

            return {
                "rainfall": current.get("precipitation", 0.0),
                "wind_speed": current.get("wind_speed_10m", 0.0),
                "visibility": visibility_km,
                "source": "api.open-meteo.com"
            }
    except Exception as e:
        print(f"Weather API Error: {e}")
        return None

def get_weather(pincode: str, custom_lat: float = None, custom_lon: float = None) -> dict:
    """
    Returns weather metrics for a pincode or custom coordinate.
    Prioritizes simulator overrides (if any), then tries real free API, 
    then falls back to sensible mock defaults.
    """
    if pincode in _weather_state:
        # Simulator has overridden the weather
        return _weather_state[pincode]
    
    # Try fetching real data
    real_data = get_real_weather(pincode, custom_lat, custom_lon)
    if real_data:
        return real_data
    
    # Fallback default
    return {
        "rainfall": random.uniform(0.0, 5.0),
        "wind_speed": random.uniform(5.0, 15.0),
        "visibility": random.uniform(8.0, 10.0),
        "source": "mock_fallback"
    }

def set_weather(pincode: str, **kwargs):
    """Used by simulator to force a weather state (e.g. rain event)"""
    if pincode not in _weather_state:
        _weather_state[pincode] = get_weather(pincode)
    _weather_state[pincode].update(kwargs)
    _weather_state[pincode]["source"] = "simulator"

def clear_weather_override():
    _weather_state.clear()
