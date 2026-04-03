from enum import Enum
from datetime import datetime
from cdi_engine import calculate_cdi, check_secondary_conditions, get_payout_rate, get_threshold, get_caps
from exclusion_gate import ExclusionChecker
from consensus_verifier import verify_zone_consensus, apply_consensus
from mock_data.weather_mock import get_weather
from mock_data.platform_mock import get_platform_data
from mock_data.govt_alerts_mock import get_govt_alerts
from risk_management import add_payout, check_stop_loss, emergency_pause, is_city_paused


class State(str, Enum):
    MONITORING = "MONITORING"
    EXCLUSION_CHECK = "EXCLUSION_CHECK"
    THRESHOLD_BREACH = "THRESHOLD_BREACH"
    CONSENSUS_CHECK = "CONSENSUS_CHECK"
    DISRUPTION_CONFIRMED = "DISRUPTION_CONFIRMED"
    CALCULATING_PAYOUT = "CALCULATING_PAYOUT"
    STOP_LOSS_CHECK = "STOP_LOSS_CHECK"
    COMPLIANCE_SWEEP = "COMPLIANCE_SWEEP"
    RELEASED = "RELEASED"
    REJECTED = "REJECTED"
    FLAGGED = "FLAGGED"


_worker_states = {}
_audit_trails = {}   # worker_id -> list of interval records


def get_state(worker_id: str) -> dict:
    if worker_id not in _worker_states:
        _worker_states[worker_id] = {
            "state": State.MONITORING.value,
            "raw_cdi": 0.0,
            "final_cdi": 0.0,
            "trust_score": 1.0,
            "trust_status": "TRUSTED",
            "accumulated_payout": 0.0,
            "hours_active": 0.0,
            "events_this_week": 0,
            "weekly_payout": 0.0,
            "consecutive_drops": 0,
            "reason": "",
            "last_increment": 0.0,
            "exclusion_detail": "",
        }
    return _worker_states[worker_id]


def reset_state(worker_id: str):
    if worker_id in _worker_states:
        del _worker_states[worker_id]
    if worker_id in _audit_trails:
        del _audit_trails[worker_id]


def get_audit_trail(worker_id: str) -> list:
    return _audit_trails.get(worker_id, [])


def _log_interval(worker_id: str, state_data: dict, weather: dict, platform: dict):
    if worker_id not in _audit_trails:
        _audit_trails[worker_id] = []
    _audit_trails[worker_id].append({
        "timestamp": datetime.now().isoformat(),
        "state": state_data["state"],
        "raw_cdi": state_data["raw_cdi"],
        "final_cdi": state_data["final_cdi"],
        "trust_score": state_data["trust_score"],
        "trust_status": state_data["trust_status"],
        "exclusion": state_data["exclusion_detail"],
        "payout_increment": state_data["last_increment"],
        "accumulated_payout": state_data["accumulated_payout"],
        "reason": state_data["reason"],
        "rainfall": weather.get("rainfall", 0),
        "wind_speed": weather.get("wind_speed", 0),
        "visibility": weather.get("visibility", 10),
    })


def _build_variables(category: str, weather: dict, platform: dict) -> dict:
    """Map weather + platform data to CDI variable names per category."""
    if category == "food_delivery":
        return {
            "rainfall": weather.get("rainfall", 0),
            "wind_speed": weather.get("wind_speed", 0),
            "visibility": weather.get("visibility", 10),
            "order_drop_pct": platform.get("order_drop_pct", 0),
        }
    elif category == "ecommerce":
        return {
            "road_flood_index": platform.get("road_flood_index", 0),
            "rainfall": weather.get("rainfall", 0),
            "zone_reachability": platform.get("zone_reachability", 100),
            "delivery_completion_drop": platform.get("delivery_completion_drop", 0),
        }
    elif category == "qcommerce":
        return {
            "rainfall": weather.get("rainfall", 0),
            "order_surge_rate": platform.get("order_surge_rate", 100),
            "sla_breach_pct": platform.get("sla_breach_pct", 0),
            "rider_supply_drop_pct": platform.get("rider_supply_drop_pct", 0),
        }
    return {}


def process_interval(worker: dict, gps_override: dict = None) -> dict:
    """
    Process one 15-minute interval for a worker.
    Full state machine: MONITORING → EXCLUSION → THRESHOLD → CONSENSUS →
    DISRUPTION → PAYOUT → STOP_LOSS → COMPLIANCE → RELEASED/REJECTED/FLAGGED
    """
    worker_id = worker["worker_id"]
    category = worker["category"]
    pincode = worker.get("pincode", worker.get("home_pincode", "400001"))
    device_id = worker["device_id"]
    role = worker.get("role", "rider")

    state_data = get_state(worker_id)
    caps = get_caps(category)

    # Reset transient fields
    state_data["last_increment"] = 0.0
    state_data["exclusion_detail"] = ""

    # Fetch live data
    weather = get_weather(pincode)
    platform = get_platform_data(category)
    gov = get_govt_alerts()
    current_gps = gps_override or {
        "lat": 19.0, "lon": 72.0,
        "stationary_at_home_min": 0, "speed_kmh": 0,
        "outside_zone": False,
    }

    # ── STATE 1: EXCLUSION CHECK (must run BEFORE CDI calc) ──
    state_data["state"] = State.EXCLUSION_CHECK.value
    passed, reason = ExclusionChecker.check_all(worker_id, current_gps, device_id, gov)
    if not passed:
        state_data["state"] = State.REJECTED.value
        state_data["reason"] = reason
        state_data["exclusion_detail"] = reason
        _log_interval(worker_id, state_data, weather, platform)
        _worker_states[worker_id] = state_data
        return state_data

    # ── STATE 2: CDI CALCULATION + THRESHOLD CHECK ──
    variables = _build_variables(category, weather, platform)
    raw_cdi = calculate_cdi(category, variables)
    state_data["raw_cdi"] = raw_cdi
    threshold = get_threshold(category)

    if raw_cdi > threshold and check_secondary_conditions(category, platform):
        state_data["state"] = State.THRESHOLD_BREACH.value

        # ── STATE 3: CONSENSUS CHECK ──
        state_data["state"] = State.CONSENSUS_CHECK.value
        trust_score = verify_zone_consensus(worker_id, current_gps, pincode)
        state_data["trust_score"] = trust_score
        final_cdi, trust_status = apply_consensus(raw_cdi, trust_score)
        state_data["final_cdi"] = final_cdi
        state_data["trust_status"] = trust_status

        if trust_status == "REJECTED":
            state_data["state"] = State.REJECTED.value
            state_data["reason"] = "FRAUD_CONSENSUS_FAILED"
            _log_interval(worker_id, state_data, weather, platform)
            _worker_states[worker_id] = state_data
            return state_data
        elif trust_status == "FLAGGED":
            state_data["state"] = State.FLAGGED.value
            state_data["reason"] = "MANUAL_REVIEW_NEEDED"
            _log_interval(worker_id, state_data, weather, platform)
            _worker_states[worker_id] = state_data
            return state_data

        # ── STATE 4: DISRUPTION CONFIRMED ──
        if final_cdi > threshold:
            state_data["state"] = State.DISRUPTION_CONFIRMED.value
            state_data["consecutive_drops"] = 0

            # ── STATE 5: CALCULATING PAYOUT ──
            state_data["state"] = State.CALCULATING_PAYOUT.value
            rate = get_payout_rate(category, final_cdi, role)
            increment = rate * 0.25  # 15-min = 0.25 hr

            # Per-event caps
            if state_data["hours_active"] >= caps["max_hours_per_event"]:
                increment = 0
            if state_data["accumulated_payout"] + increment > caps["max_payout_per_event"]:
                increment = max(0, caps["max_payout_per_event"] - state_data["accumulated_payout"])
            # Per-week caps
            if state_data["weekly_payout"] + increment > caps["max_payout_per_week"]:
                increment = max(0, caps["max_payout_per_week"] - state_data["weekly_payout"])

            # ── STATE 6: STOP-LOSS CHECK ──
            state_data["state"] = State.STOP_LOSS_CHECK.value
            if increment > 0 and check_stop_loss(pincode):
                emergency_pause(pincode)
                increment = 0
                state_data["reason"] = "CITY_STOP_LOSS_HIT"

            # ── STATE 7: COMPLIANCE FINAL SWEEP ──
            state_data["state"] = State.COMPLIANCE_SWEEP.value
            passed2, reason2 = ExclusionChecker.check_all(worker_id, current_gps, device_id, gov)
            if not passed2:
                state_data["state"] = State.REJECTED.value
                state_data["reason"] = f"MID_EVENT_{reason2}"
                state_data["exclusion_detail"] = reason2
                _log_interval(worker_id, state_data, weather, platform)
                _worker_states[worker_id] = state_data
                return state_data

            if increment > 0:
                state_data["accumulated_payout"] = round(state_data["accumulated_payout"] + increment, 2)
                state_data["weekly_payout"] = round(state_data["weekly_payout"] + increment, 2)
                state_data["hours_active"] = round(state_data["hours_active"] + 0.25, 2)
                state_data["last_increment"] = increment
                add_payout(pincode, increment)
                state_data["state"] = State.RELEASED.value
                state_data["reason"] = ""
            else:
                if not state_data["reason"]:
                    state_data["reason"] = "CAPPED_OUT"
                state_data["state"] = State.RELEASED.value
        else:
            state_data["state"] = State.MONITORING.value
    else:
        # CDI below threshold – check if event is ending
        if state_data["state"] in (
            State.RELEASED.value, State.DISRUPTION_CONFIRMED.value,
            State.CALCULATING_PAYOUT.value
        ):
            state_data["consecutive_drops"] += 1
            if state_data["consecutive_drops"] >= 2:
                state_data["state"] = State.MONITORING.value
                if state_data["accumulated_payout"] > 0:
                    state_data["events_this_week"] += 1
                state_data["hours_active"] = 0
                state_data["accumulated_payout"] = 0
        else:
            state_data["state"] = State.MONITORING.value

    _log_interval(worker_id, state_data, weather, platform)
    _worker_states[worker_id] = state_data
    return state_data


def get_all_states():
    return _worker_states
