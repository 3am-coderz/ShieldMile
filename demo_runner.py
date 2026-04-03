"""
CDI Platform Phase 2 Demo Runner
Demonstrates: legitimate claim, pandemic exclusion, GPS spoofing rejection,
SHAP premium explanation, and stop-loss trigger.
"""
import sys
import os

# Ensure project root is on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pprint import pprint
from simulator import Simulator
from mock_data.worker_history_mock import get_all_workers, get_worker
from payout_state_machine import process_interval, reset_state, get_audit_trail
from exclusion_gate import ExclusionChecker
from consensus_verifier import verify_zone_consensus, apply_consensus
from ml_premium import get_premium_and_explanation
from risk_management import (
    evaluate_reinsurance, add_payout, reset as rmd_reset,
)
from mock_data.govt_alerts_mock import get_govt_alerts


def separator(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def run_demo():
    sim = Simulator()
    sim.reset_to_normal()
    rmd_reset()

    workers = get_all_workers()
    food = next(w for w in workers if w["category"] == "food_delivery")
    ecom = next(w for w in workers if w["category"] == "ecommerce")
    qcom = next(w for w in workers if w["category"] == "qcommerce")

    # ── 1. Onboard ──
    separator("1. ONBOARDING")
    for w in [food, ecom, qcom]:
        prem = get_premium_and_explanation(w["worker_id"])
        print(f"Worker: {w['worker_id']} ({w['category']}/{w.get('role','rider')})")
        print(f"  Premium: ₹{prem['premium']}/week | Risk: {prem['risk_score']}")
    print("✅ 3 workers onboarded\n")

    # ── 2. SHAP Explanation ──
    separator("2. PREMIUM EXPLANATION (SHAP)")
    for w in [food, ecom]:
        prem = get_premium_and_explanation(w["worker_id"])
        print(f"\n{w['worker_id']}:")
        print(f"  {prem['explanation']}")
        print(f"  SHAP breakdown: {prem['shap_breakdown']}")

    # ── 3. Legitimate Claim – 4-hour rain ──
    separator("3. LEGITIMATE CLAIM – 4-HOUR RAIN EVENT")
    sim.trigger_rain_event()
    print("🌧️ Rain event triggered (45mm/hr, 55% order drop)\n")

    for i in range(16):  # 16 × 15min = 4 hours
        res = process_interval(food)
    trail = get_audit_trail(food["worker_id"])
    print(f"  Food worker state:   {res['state']}")
    print(f"  Accumulated payout:  ₹{res['accumulated_payout']}")
    print(f"  Hours active:        {res['hours_active']}h")
    print(f"  Total intervals:     {len(trail)}")
    print(f"  Trust score:         {res['trust_score']}")
    print(f"  Trust status:        {res['trust_status']}")
    print("✅ Legitimate claim processed and payout released\n")

    # ── 4. Exclusion Gate – Pandemic ──
    separator("4. EXCLUSION GATE – PANDEMIC LOCKDOWN")
    sim.trigger_pandemic_lockdown()
    for w2 in [food, ecom]:
        reset_state(w2["worker_id"])
    res_pan = process_interval(food)
    print(f"  State:  {res_pan['state']}")
    print(f"  Reason: {res_pan['reason']}")
    print("✅ Pandemic exclusion correctly rejected the claim\n")

    # Reset
    sim.reset_to_normal()
    for w2 in [food, ecom, qcom]:
        reset_state(w2["worker_id"])

    # ── 5. Fraud – GPS Spoofing ──
    separator("5. FRAUD DETECTION – GPS SPOOFING")
    sim.trigger_rain_event()
    gps_spoof = {
        "lat": 19.0, "lon": 72.0,
        "stationary_at_home_min": 0, "speed_kmh": 999,
        "outside_zone": False,
    }
    res_spoof = process_interval(ecom, gps_override=gps_spoof)
    print(f"  State:  {res_spoof['state']}")
    print(f"  Reason: {res_spoof['reason']}")
    print("✅ GPS spoofing detected and rejected\n")

    # ── 6. Consensus Rejection ──
    separator("6. ZONE CONSENSUS – FRAUD ATTEMPT")
    from mock_data.peer_gps_mock import set_global_disruption
    set_global_disruption(0.1)  # Only 10% peers agree → low trust
    trust = verify_zone_consensus(food["worker_id"], {"lat": 19.0, "lon": 72.0}, "400001")
    final_cdi, status = apply_consensus(80.0, trust)
    print(f"  Trust score: {trust}")
    print(f"  Consensus status: {status}")
    print(f"  Final CDI (after consensus): {final_cdi}")
    print("✅ Low consensus → claim flagged / rejected\n")

    # ── 7. Stop-Loss ──
    separator("7. STOP-LOSS & REINSURANCE")
    add_payout("400001", 600000)
    status = evaluate_reinsurance()
    print(f"  City payouts:        {status['city_payouts']}")
    print(f"  Weekly total:        ₹{status['weekly_total']}")
    print(f"  Reinsurance covered: ₹{status['reinsurance_covered']}")
    print(f"  Paused cities:       {status['paused_cities']}")
    print("✅ Stop-loss cap triggered\n")

    separator("DEMO COMPLETE")
    print("All Phase 1 + Phase 2 features demonstrated:")
    print("  ✅ CDI Engine (3 categories, graduated bands)")
    print("  ✅ Exclusion Gate (pandemic rejection)")
    print("  ✅ Zone Consensus (fraud prevention)")
    print("  ✅ SHAP Explainability (premium explanation)")
    print("  ✅ Stop-Loss & Reinsurance")
    print("  ✅ Audit Trail (15-min intervals)")
    print("\nRun the server with: uvicorn main:app --reload")
    print("Open dashboard at: http://127.0.0.1:8000/app/index.html")


if __name__ == "__main__":
    run_demo()
