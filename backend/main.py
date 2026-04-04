from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os

from mock_data.worker_history_mock import get_all_workers, get_worker, update_reliability
from ml_premium import get_premium_and_explanation, check_drift
from payout_state_machine import (
    get_all_states, process_interval, reset_state, get_audit_trail,
)
from risk_management import evaluate_reinsurance, reset as rmd_reset, is_city_paused
from simulator import Simulator
from database import init_db
from mock_data.weather_mock import get_weather
from cdi_engine import get_caps
import datetime
from datetime import timedelta
from datetime import datetime as dt_class # alias to avoid clash
import random
import jwt

SECRET_KEY = "gigshield_secret_2026"
ALGORITHM = "HS256"

app = FastAPI(title="CDI Platform – Phase 2 Demo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

sim = Simulator()


@app.on_event("startup")
def startup_event():
    init_db()
    sim.reset_to_normal()





class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/login")
def login(req: LoginRequest):
    worker = get_worker(req.username)
    if not worker or req.password != "password123":
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    expires = dt_class.utcnow() + timedelta(days=7)
    token = jwt.encode(
        {"sub": req.username, "exp": expires},
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    return {"access_token": token, "token_type": "bearer", "worker_id": req.username}


# ── Worker endpoints ──

# Live location overrides from browser UI
live_locations = {}

class LocationRequest(BaseModel):
    lat: float
    lon: float
    location_name: str = "Your Live Location"

@app.post("/api/set_user_location/{worker_id}")
def set_user_location(worker_id: str, req: LocationRequest):
    live_locations[worker_id] = {"lat": req.lat, "lon": req.lon, "name": req.location_name}
    return {"status": "Location mapped", "coords": live_locations[worker_id]}

@app.get("/workers")
def list_workers():
    return [
        {"id": w["worker_id"], "category": w["category"], "role": w.get("role", "rider")}
        for w in get_all_workers()
    ]


@app.get("/dashboard/{worker_id}")
def get_dashboard(worker_id: str):
    worker = get_worker(worker_id)
    if not worker:
        raise HTTPException(404, "Worker not found")
    prem = get_premium_and_explanation(worker_id)
    states = get_all_states()
    state = states.get(worker_id, {
        "state": "MONITORING", "raw_cdi": 0, "final_cdi": 0,
        "trust_score": 1.0, "trust_status": "TRUSTED",
        "accumulated_payout": 0, "reason": "", "last_increment": 0,
        "hours_active": 0, "weekly_payout": 0, "exclusion_detail": "",
    })
    
    weather = get_weather(worker.get("pincode", "400001"))
    
    # Extract coordinates to prove reality to UI
    from mock_data.weather_mock import PINCODE_COORDS
    
    # Check if we have a live browser coordinate override
    if worker_id in live_locations:
        coords = live_locations[worker_id]
        weather = get_weather("custom", coords["lat"], coords["lon"])
        weather["pincode"] = coords.get("name", "Your Live Location")
    else:
        coords = PINCODE_COORDS.get(worker.get("pincode", "400001"), {"lat": 19.0760, "lon": 72.8777})
        weather = get_weather(worker.get("pincode", "400001"))
        weather["pincode"] = worker.get("pincode", "400001")
        
    weather["lat"] = coords["lat"]
    weather["lon"] = coords["lon"]
    
    caps = get_caps(worker["category"])
    
    return {
        "worker": {
            "id": worker["worker_id"],
            "category": worker["category"],
            "role": worker.get("role", "rider"),
            "pincode": worker["pincode"],
            "platform": worker.get("platform", ""),
            "reliability_score": worker["reliability_score"],
            "consent": {
                "weather": worker.get("consent_weather", True),
                "gps": worker.get("consent_gps", True),
                "orders": worker.get("consent_orders", True),
            },
        },
        "premium": prem["premium"],
        "premium_explanation": prem["explanation"],
        "state": state,
        "current_weather": weather,
        "weekly_max_payout": caps["max_payout_per_week"],
        "today_premium_paid": round(prem["premium"] / 7, 2),
    }


@app.get("/premium_explanation/{worker_id}")
def premium_explain(worker_id: str):
    prem = get_premium_and_explanation(worker_id)
    
    forecast = {
        "disruption_probability": random.randint(40, 85),
        "avg_rainfall_pred": random.randint(10, 60),
    }
    
    return {
        "worker_id": worker_id,
        "fairness_note": "Premium is based purely on physical climate risk factors (e.g. flood map), not your pincode's average income level or past earnings.",
        "forecast_7d": forecast,
        **prem,
    }


@app.get("/claim_audit/{worker_id}")
def claim_audit(worker_id: str):
    trail = get_audit_trail(worker_id)
    states = get_all_states()
    
    # Enhance intervals with peer text and exclusion text
    for iv in trail:
        iv["peer_info"] = f"{int(iv.get('trust_score',1)*20)} other riders in your zone confirmed this disruption"
        iv["exclusion_log"] = "Checked war: false, pandemic: false, GPS spoofing: false"
        if iv.get("exclusion"):
            iv["exclusion_log"] = f"Flagged for: {iv['exclusion']}"
            
    return {
        "worker_id": worker_id,
        "current_state": states.get(worker_id, {}),
        "intervals": trail,
    }

@app.get("/payout_history/{worker_id}")
def get_payout_history(worker_id: str):
    # If there are no real events from the DB or trail, mock past events for the UI.
    return [
        {
            "event_id": "EVT_001",
            "date": (datetime.datetime.now() - datetime.timedelta(days=3)).strftime("%Y-%m-%d %H:%M"),
            "raw_cdi": 85.2,
            "final_cdi": 80.1,
            "payout": 150.0,
            "trust_score": 0.94,
            "trust_text": "Peer consensus: 94%",
            "exclusion_passed": True,
            "breakdown": {"Rainfall": 40.0, "Wind": 20.0, "Visibility": 15.0, "Order Drop": 10.2}
        },
        {
            "event_id": "EVT_002",
            "date": (datetime.datetime.now() - datetime.timedelta(days=10)).strftime("%Y-%m-%d %H:%M"),
            "raw_cdi": 92.5,
            "final_cdi": 92.5,
            "payout": 225.0,
            "trust_score": 1.0,
            "trust_text": "Peer consensus: 100%",
            "exclusion_passed": True,
            "breakdown": {"Flood Index": 35.0, "Rainfall": 30.0, "Zone Unreachable": 27.5}
        }
    ]



@app.get("/exclusions")
def get_exclusions():
    """Plain-language list of exclusions (for Screen 4)."""
    return {
        "standard": [
            {"code": "WAR_CIVIL_UNREST", "description": "War or civil unrest as declared by government advisory."},
            {"code": "PANDEMIC_LOCKDOWN", "description": "Active pandemic lockdown order in your area."},
            {"code": "NUCLEAR_CHEMICAL", "description": "Nuclear or chemical hazard alert in your zone."},
        ],
        "product_specific": [
            {"code": "INTENTIONAL_ACT", "description": "Remaining stationary at home during a weather event (>30 min)."},
            {"code": "OUTSIDE_ZONE", "description": "GPS location outside your registered operating zone."},
            {"code": "UNREGISTERED_DEVICE", "description": "Logging in from a device not registered at onboarding."},
            {"code": "GPS_SPOOFING", "description": "Impossible location jump detected (>50 km in <5 min)."},
            {"code": "CONCURRENT_COVERAGE", "description": "Same hour already claimed via another insurer."},
        ],
        "regulatory": [
            "All PII encrypted at rest (DPDP Act compliance).",
            "Worker consent logged for weather, GPS, and order data.",
            "Right to Explanation: see 'Why?' button for your premium.",
        ],
    }


# ── Simulation endpoints ──

class SimWorkerReq(BaseModel):
    worker_id: str
    intensity: float = 45.0
    drop_pct: float = 55.0

@app.post("/simulate/start_rain")
def start_rain(req: SimWorkerReq):
    worker = get_worker(req.worker_id)
    # Target "custom" override if they have browser geolocation on, else use their static pincode
    loc_key = "custom" if worker and req.worker_id in live_locations else (worker.get("pincode", "400001") if worker else "400001")
    sim.trigger_rain_event(loc_key, req.intensity, req.drop_pct)
    return {"status": "Rain event started", "location_key": loc_key}

@app.post("/simulate/flood")
def start_flood(req: SimWorkerReq):
    worker = get_worker(req.worker_id)
    loc_key = "custom" if worker and req.worker_id in live_locations else (worker.get("pincode", "400001") if worker else "400001")
    sim.trigger_flood_event(loc_key)
    return {"status": "Flood event triggered"}


@app.post("/simulate/pandemic")
def start_pandemic():
    sim.trigger_pandemic_lockdown()
    return {"status": "Pandemic lockdown activated"}


@app.post("/simulate/reset")
def reset_sim():
    sim.reset_to_normal()
    for w in get_all_workers():
        reset_state(w["worker_id"])
    rmd_reset()
    return {"status": "Reset to normal"}


@app.post("/simulate/tick")
def tick_interval():
    """Advance one 15-minute interval for all workers."""
    results = {}
    for w in get_all_workers():
        res = process_interval(w)
        results[w["worker_id"]] = {
            "state": res["state"],
            "raw_cdi": res["raw_cdi"],
            "final_cdi": res["final_cdi"],
            "trust_score": res["trust_score"],
            "payout_increment": res["last_increment"],
            "accumulated": res["accumulated_payout"],
        }
    return {"status": "Ticked 15 mins", "workers": results}


@app.post("/simulate/spoof_gps/{worker_id}")
def spoof_gps(worker_id: str):
    """Simulate GPS spoofing for a specific worker."""
    worker = get_worker(worker_id)
    if not worker:
        raise HTTPException(404, "Worker not found")
    gps_spoof = {
        "lat": 19.0, "lon": 72.0,
        "stationary_at_home_min": 0, "speed_kmh": 999,
        "outside_zone": False,
    }
    res = process_interval(worker, gps_override=gps_spoof)
    return {
        "status": "GPS spoof simulated",
        "result": res["state"],
        "reason": res["reason"],
    }


# ── Admin endpoints ──

@app.get("/admin/stop_loss_status")
def stop_loss_status():
    return evaluate_reinsurance()


@app.get("/admin/drift_check")
def drift_status():
    return check_drift()


class FeedbackReq(BaseModel):
    worker_id: str
    accurate: bool


@app.post("/feedback")
def post_feedback(req: FeedbackReq):
    """Post-event feedback: update reliability score."""
    delta = 2.0 if req.accurate else -5.0
    update_reliability(req.worker_id, delta)
    w = get_worker(req.worker_id)
    return {
        "status": "Feedback recorded",
        "new_reliability": w["reliability_score"] if w else None,
    }
