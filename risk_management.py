import time

_city_payouts = {}          # city -> rolling 24h total
_weekly_claims_total = 0.0
_paused_cities = set()


def add_payout(city: str, amount: float):
    global _weekly_claims_total
    _city_payouts[city] = _city_payouts.get(city, 0.0) + amount
    _weekly_claims_total += amount


def check_stop_loss(city: str) -> bool:
    """Returns True if city payout exceeds ₹5,00,000 in 24h."""
    return _city_payouts.get(city, 0.0) > 500_000


def emergency_pause(city: str):
    """Pause new policy sales in a city."""
    _paused_cities.add(city)


def is_city_paused(city: str) -> bool:
    return city in _paused_cities


def evaluate_reinsurance() -> dict:
    """
    If weekly claims > ₹10,00,000 → 50% of excess covered by reinsurer.
    """
    covered_by_reinsurer = 0.0
    if _weekly_claims_total > 1_000_000:
        excess = _weekly_claims_total - 1_000_000
        covered_by_reinsurer = excess * 0.5

    return {
        "weekly_total": round(_weekly_claims_total, 2),
        "reinsurance_threshold": 1_000_000,
        "reinsurance_covered": round(covered_by_reinsurer, 2),
        "paused_cities": list(_paused_cities),
        "city_payouts": {c: round(v, 2) for c, v in _city_payouts.items()},
        "city_caps": {c: (v > 500_000) for c, v in _city_payouts.items()},
    }


def reset():
    global _city_payouts, _weekly_claims_total, _paused_cities
    _city_payouts = {}
    _weekly_claims_total = 0.0
    _paused_cities = set()
