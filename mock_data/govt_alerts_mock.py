_alerts_state = {
    "lockdown_active": False,
    "civil_unrest": False,
    "nuclear_chemical_hazard": False,
    "flood_zone_alerts": []
}

def get_govt_alerts():
    return _alerts_state

def set_govt_alerts(lockdown=False, unrest=False, hazard=False, flood_zones=None):
    _alerts_state["lockdown_active"] = lockdown
    _alerts_state["civil_unrest"] = unrest
    _alerts_state["nuclear_chemical_hazard"] = hazard
    if flood_zones is not None:
        _alerts_state["flood_zone_alerts"] = flood_zones
