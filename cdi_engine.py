from cdi_config import CDI_PROFILES


def normalize(raw: float, max_val: float, inverted: bool = False) -> float:
    """Normalizes raw value to 0-100 scale."""
    if max_val <= 0:
        return 0.0
    val = min(max(raw, 0.0), max_val)
    score = (val / max_val) * 100.0
    if inverted:
        return 100.0 - score
    return score


def calculate_cdi(worker_category: str, variables_dict: dict) -> float:
    """
    Calculate CDI score (0-100) using category-specific weights.
    variables_dict keys must match the profile variable names.
    """
    profile = CDI_PROFILES.get(worker_category)
    if not profile:
        return 0.0

    total_cdi = 0.0
    for var_name, config in profile["variables"].items():
        raw_val = variables_dict.get(var_name, 0.0)
        norm = normalize(raw_val, config["max"], config.get("inverted", False))
        total_cdi += norm * config["weight"]

    return round(total_cdi, 2)


def check_secondary_conditions(worker_category: str, platform_data: dict) -> bool:
    """
    Secondary condition check required alongside CDI threshold.
    Returns True if conditions are satisfied (payout may proceed).
    """
    if worker_category == "food_delivery":
        return platform_data.get("order_drop_pct", 0) >= 40.0
    elif worker_category == "ecommerce":
        return platform_data.get("zone_unreachable_hours", 0) >= 2
    elif worker_category == "qcommerce":
        return platform_data.get("sla_breach_pct", 0) > 50.0
    return False


def get_payout_rate(worker_category: str, cdi_score: float, role: str = "rider") -> int:
    """
    Returns hourly payout rate (₹) for a given CDI score and category.
    Q-commerce has separate rider/picker rates.
    """
    profile = CDI_PROFILES.get(worker_category)
    if not profile:
        return 0

    if worker_category == "qcommerce":
        bands = profile.get(f"payout_bands_{role}", profile.get("payout_bands_rider", {}))
    else:
        bands = profile.get("payout_bands", {})

    for (lo, hi), rate in bands.items():
        if lo <= cdi_score < hi:
            return rate
    return 0


def get_threshold(worker_category: str) -> int:
    profile = CDI_PROFILES.get(worker_category)
    return profile["threshold"] if profile else 65


def get_caps(worker_category: str) -> dict:
    profile = CDI_PROFILES.get(worker_category, {})
    return {
        "max_hours_per_event": profile.get("max_hours_per_event", 6),
        "max_payout_per_event": profile.get("max_payout_per_event", 450),
        "max_events_per_week": profile.get("max_events_per_week", 2),
        "max_payout_per_week": profile.get("max_payout_per_week", 900),
    }
