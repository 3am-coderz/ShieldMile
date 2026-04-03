import random

worker_db = []
_initialized = False

FLOOD_RISK_BY_PINCODE = {
    "400001": 1, "400002": 0, "400003": 1, "400004": 0, "400005": 1,
    "400006": 0, "400007": 1, "400008": 0, "400009": 1,
}


def initialize_workers():
    global _initialized
    if _initialized:
        return
    _initialized = True
    categories = ["food_delivery", "ecommerce", "qcommerce"]
    for cat in categories:
        for i in range(1, 11):
            pincode = f"40000{i % 9 + 1}"
            worker_db.append({
                "worker_id": f"worker_{cat}_{i}",
                "category": cat,
                "role": "rider" if cat != "qcommerce" else ("rider" if i <= 5 else "picker"),
                "pincode": pincode,
                "home_pincode": pincode,
                "platform": {
                    "food_delivery": random.choice(["Zomato", "Swiggy"]),
                    "ecommerce": random.choice(["Amazon", "Flipkart"]),
                    "qcommerce": random.choice(["Zepto", "Blinkit"]),
                }[cat],
                "avg_working_hours": round(random.uniform(6, 12), 1),
                "history_30d_orders": int(random.uniform(50, 300)),
                "personal_30d_hourly_avg": round(random.uniform(4, 12), 1),
                "past_claims_count": int(random.uniform(0, 5)),
                "past_claims_valid": int(random.uniform(0, 3)),
                "reliability_score": round(random.uniform(60, 100), 1),
                "device_id": f"DEVICE_{cat}_{i}",
                "upi_id": f"worker{cat}{i}@upi",
                "consent_weather": True,
                "consent_gps": True,
                "consent_orders": True,
                "flood_zone": FLOOD_RISK_BY_PINCODE.get(pincode, 0),
            })


initialize_workers()


def get_worker(worker_id: str):
    for w in worker_db:
        if w["worker_id"] == worker_id:
            return w
    return None


def get_all_workers():
    return worker_db


def update_reliability(worker_id: str, delta: float):
    w = get_worker(worker_id)
    if w:
        w["reliability_score"] = round(max(0, min(100, w["reliability_score"] + delta)), 1)
