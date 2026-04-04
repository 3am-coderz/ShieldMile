import random

_platform_state = {}


def get_platform_data(category: str) -> dict:
    """
    Returns realistic platform metrics per category including
    order volume, order drop %, delivery completion %, SLA breach %,
    rider supply %, order surge rate, zone reachability, zone unreachable hours,
    road flood index, delivery completion drop.
    """
    if category in _platform_state:
        return _platform_state[category]
    return {
        "category": category,
        "order_volume": int(random.uniform(500, 1000)),
        "order_drop_pct": random.uniform(0.0, 5.0),
        "delivery_completion_pct": random.uniform(90.0, 100.0),
        "delivery_completion_drop": random.uniform(0.0, 5.0),
        "sla_breach_pct": random.uniform(0.0, 5.0),
        "rider_supply_pct": random.uniform(95.0, 100.0),
        "rider_supply_drop_pct": random.uniform(0.0, 5.0),
        "order_surge_rate": random.uniform(100, 110),
        "zone_reachability": random.uniform(90, 100),
        "zone_unreachable_hours": 0,
        "road_flood_index": random.uniform(0, 10),
    }


def set_platform_data(category: str, **kwargs):
    if category not in _platform_state:
        _platform_state[category] = get_platform_data(category)
    _platform_state[category].update(kwargs)


def reset_platform():
    _platform_state.clear()
