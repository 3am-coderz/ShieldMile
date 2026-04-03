# GigShield CDI – Gig Worker Weather Disruption Insurance Platform

> A compliant, explainable, fraud-resistant parametric insurance that pays for **proven income loss** – not just rain.

## What This Is

A parametric micro-insurance platform for gig workers in India (Zomato, Swiggy, Amazon, Flipkart, Zepto, Blinkit riders). It uses real-time weather + platform data to confirm actual disruption and triggers graduated payouts automatically.

## Phase 1 (Parametric CDI Core)
- **CDI Engine**: Composite Disruption Index (0–100) with category-specific weights for Food Delivery, E-Commerce, and Q-Commerce.
- **Graduated Payouts**: Not binary. CDI bands determine payout rate (₹30–₹120/hr depending on category and severity).
- **ML Premium Pricing**: XGBoost model predicts weekly risk → sets premium (₹20–₹100/week). ML **never** triggers payout.

## Phase 2 (Compliance + Fraud + Explainability)
- **Exclusion Gate**: War, pandemic, nuclear, GPS spoofing, unregistered device → instant rejection before CDI calc.
- **Zone Consensus**: 10–20 peer workers in 2km radius verified. <30% agreement = fraud rejection.
- **SHAP Explainability**: Workers see **why** their premium is high (DPDP Act "Right to Explanation").
- **Stop-Loss & Reinsurance**: City-level payout caps (₹5L/24h). Reinsurance simulation for excess claims.
- **Audit Trail**: Every 15-min interval logged with CDI, trust score, exclusion status, payout.

## Setup

```bash
cd /home/ASHU/Downloads/guidectf
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Run

### Option 1: CLI Demo (no server needed)
```bash
python demo_runner.py
```
Shows: legitimate claim → payout, pandemic rejection, GPS spoof rejection, SHAP explanation, stop-loss trigger.

### Option 2: Web Dashboard
```bash
uvicorn main:app --reload
```
Open **http://127.0.0.1:8000/app/index.html**

5 screens: Dashboard, Premium/SHAP, Audit Trail, Policy & Exclusions, Proactive Alerts.

### Run Tests
```bash
pytest test_core.py -v
```

## Key Differentiators for Judges

| Feature | How We Do It |
|---|---|
| **Compliance** | Mandatory exclusion gate runs before CDI calc (war, pandemic, fraud) |
| **Fraud Prevention** | Zone consensus: if 10 riders say sunny and 1 says rain → rejected |
| **Explainable AI** | SHAP breakdown: "Flood history +₹20, Monsoon +₹15, Reliability -₹5" |
| **Graduated Payouts** | Not binary. 3 bands per category. Q-commerce has rider/picker rates |
| **Risk Management** | Stop-loss + reinsurance simulation. Emergency city pause |
| **Audit Trail** | Every 15-min decision logged with full provenance |
| **3 Categories** | Food, E-commerce, Q-commerce – each with unique CDI profile |

## Architecture

```
mock_data/         → Weather, platform, GPS, worker data generators
cdi_config.py      → 3 category profiles with weights, bands, caps
cdi_engine.py      → CDI calculation, normalization, payout rates
exclusion_gate.py  → Compliance exclusion checks
consensus_verifier.py → Zone-level fraud prevention
ml_premium.py      → XGBoost + SHAP premium predictor
payout_state_machine.py → 8-state event processor with audit trail
risk_management.py → Stop-loss, reinsurance, emergency pause
database.py        → SQLite schema with consent tracking
simulator.py       → Rain, flood, pandemic event generators
main.py            → FastAPI endpoints
frontend/          → 5-screen dark-themed dashboard
demo_runner.py     → CLI demo script
test_core.py       → Unit + integration tests
```
