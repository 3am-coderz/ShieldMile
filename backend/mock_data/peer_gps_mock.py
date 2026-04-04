import random

# Determines the ratio of users who report bad conditions
_global_disruption_factor = 0.1

def set_global_disruption(factor: float):
    global _global_disruption_factor
    _global_disruption_factor = factor

def get_global_disruption():
    return _global_disruption_factor

def get_peers_in_radius(worker_gps: dict, radius_km: float = 2.0):
    """
    Generate 10–20 virtual workers in same 2km radius with varied disruption reports
    worker_gps: {"lat": 19.0, "lon": 72.0} -> float values
    """
    num_peers = random.randint(10, 20)
    peers = []
    lat = worker_gps.get("lat", 19.0)
    lon = worker_gps.get("lon", 72.0)
    for i in range(num_peers):
        # 1 degree lat is ~111km, so 0.01 is ~1km
        peers.append({
            "worker_id": f"peer_{i}",
            "lat": lat + random.uniform(-0.015, 0.015),
            "lon": lon + random.uniform(-0.015, 0.015),
            # whether they are reporting conditions >= threshold/CDI>50
            "reported_disruption": random.random() < _global_disruption_factor
        })
    return peers
