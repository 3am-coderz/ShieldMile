CDI_PROFILES = {
    "food_delivery": {
        "variables": {
            "rainfall":       {"weight": 0.40, "max": 50,  "inverted": False},
            "wind_speed":     {"weight": 0.25, "max": 60,  "inverted": False},
            "visibility":     {"weight": 0.20, "max": 10,  "inverted": True},
            "order_drop_pct": {"weight": 0.15, "max": 80,  "inverted": False}
        },
        "threshold": 65,
        "payout_bands": {
            # (lower, upper) -> rate ₹/hour
            (0, 65):   0,
            (65, 75):  30,
            (75, 85):  50,
            (85, 101): 75
        },
        "secondary_check": "order_drop_pct >= 40",
        "max_hours_per_event": 6,
        "max_payout_per_event": 450,
        "max_events_per_week": 2,
        "max_payout_per_week": 900
    },
    "ecommerce": {
        "variables": {
            "road_flood_index":        {"weight": 0.35, "max": 100, "inverted": False},
            "rainfall":                {"weight": 0.30, "max": 40,  "inverted": False},
            "zone_reachability":       {"weight": 0.25, "max": 100, "inverted": True},
            "delivery_completion_drop":{"weight": 0.10, "max": 80,  "inverted": False}
        },
        "threshold": 70,
        "payout_bands": {
            (0, 70):   0,
            (70, 80):  40,
            (80, 90):  65,
            (90, 101): 90
        },
        "secondary_check": "zone_unreachable_hours >= 2",
        "max_hours_per_event": 6,
        "max_payout_per_event": 540,
        "max_events_per_week": 2,
        "max_payout_per_week": 1080
    },
    "qcommerce": {
        "variables": {
            "rainfall":              {"weight": 0.35, "max": 40,  "inverted": False},
            "order_surge_rate":      {"weight": 0.25, "max": 250, "inverted": False},
            "sla_breach_pct":        {"weight": 0.25, "max": 80,  "inverted": False},
            "rider_supply_drop_pct": {"weight": 0.15, "max": 70,  "inverted": False}
        },
        "threshold": 60,
        "payout_bands_rider": {
            (0, 60):   0,
            (60, 75):  50,
            (75, 90):  80,
            (90, 101): 120
        },
        "payout_bands_picker": {
            (0, 60):   0,
            (60, 75):  30,
            (75, 90):  60,
            (90, 101): 60
        },
        "secondary_check": "sla_breach_pct > 50",
        "max_hours_per_event": 6,
        "max_payout_per_event": 450,
        "max_events_per_week": 2,
        "max_payout_per_week": 900
    }
}
