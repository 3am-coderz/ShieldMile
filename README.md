# 🛡️ ShieldMile
### AI-Powered Parametric Income Insurance for India's Gig Economy

> *"When the rain stops deliveries, ShieldMile starts paying."*

![Phase](https://img.shields.io/badge/Phase-1%20Ideation-teal)
![Hackathon](https://img.shields.io/badge/Guidewire-DEVTrails%202026-navy)
![Status](https://img.shields.io/badge/Status-Active-green)

---

## 📌 One Line Description

ShieldMile protects Chennai's Zepto & Blinkit delivery partners from income loss due to weather disruptions. Our AI-powered CDI engine auto-detects disruptions, passes fraud checks, and transfers payouts to UPI in 5 minutes — all for just ₹49–₹99/week.

---

## 🎥 Demo Video
Coming Soon — will be updated before Phase 1 deadline

---



## 📋 Table of Contents
- [The Problem](#the-problem)
- [Our Persona](#our-persona)
- [The Solution](#the-solution)
- [CDI Engine](#cdi-engine)
- [Parametric Triggers](#parametric-triggers)
- [Weekly Premium Model](#weekly-premium-model)
- [No-Claim Bonus System](#no-claim-bonus-system)
- [Fraud Detection](#fraud-detection)
- [App Workflow](#app-workflow)
- [AI/ML Integration](#aiml-integration)
- [Tech Stack](#tech-stack)
- [Development Plan](#development-plan)
- [Team](#team)

---

## ❗ The Problem

India has over 12 million platform-based gig delivery workers. Every time it rains, every time a cyclone hits, every time a curfew is declared — they lose their entire day's income with zero protection. External disruptions cause 20–30% monthly income loss with no safety net in place.

**Real scenario:** During Cyclone Michaung (December 2023), Chennai delivery partners lost 3–4 days of work. Average income loss per worker: ₹2,400–₹3,600. Insurance payout received: ₹0.

---

## 👤 Our Persona

**Karthik, 26 — Zepto Delivery Partner, Velachery, Chennai**

| Detail | Value |
|--------|-------|
| Working hours | 8–10 hrs/day, 6 days/week |
| Weekly earnings | ₹3,000–₹5,000 |
| Operating zones | Velachery, Pallikaranai, Medavakkam |
| Biggest risk | Northeast monsoon (Nov–Dec), Cyclones |
| Current protection | ₹0 |

**Karthik's disruption calendar:**
| Month | Disruption | Income Lost |
|-------|-----------|-------------|
| Nov–Dec | Northeast Monsoon / Cyclone | 4–6 days |
| Apr–Jun | Extreme Heat (>43°C) | 2–3 days |
| Anytime | Local Hartal / Curfew | 1–2 days |

---

## 💡 The Solution

ShieldMile is a **parametric income insurance platform** that:
- Automatically detects disruptions via real-time data feeds
- Calculates a Composite Disruption Index (CDI) score in real-time
- Validates claims through 5-layer AI fraud detection
- Processes UPI payouts within 5 minutes
- Charges a simple weekly premium of ₹49–₹99/week
- Rewards claim-free workers with No-Claim Bonus discounts

**No paperwork. No claims process. No waiting. No human intervention.**

---

## ⚙️ CDI Engine

The Composite Disruption Index (CDI) is the core of ShieldMile. It calculates a real-time disruption score (0–100) using four weighted signals specific to Q-Commerce delivery partners.

### CDI Formula

```
CDI = (rainfall_normalized × 0.35) +
      (order_surge_normalized × 0.25) +
      (sla_breach_normalized × 0.25) +
      (rider_supply_drop_normalized × 0.15)
```

Each variable is normalized to a 0–100 scale before weighting.

### CDI Variables

| Variable | Weight | Data Source | Normalization |
|----------|--------|-------------|---------------|
| Rainfall intensity (mm/hr) | 35% | OpenWeatherMap / IMD | 0mm=0, 50mm+=100 |
| Order surge rate | 25% | Platform proxy | 100%=0, 250%+=100 |
| SLA breach rate | 25% | Platform data | 0%=0, 80%+=100 |
| Rider supply drop | 15% | Platform GPS data | 0%=0, 70%+=100 |

### Payout Trigger Conditions
- CDI must exceed **60** AND
- SLA breach rate must be above **50%**

### Graduated Payout Structure

| CDI Range | Payout Rate |
|-----------|-------------|
| Below 60 | ₹0 (no payout) |
| 60–75 | ₹50/hour |
| 75–90 | ₹80/hour |
| 90–100 | ₹120/hour |

> Payout = hours_lost × CDI_band_rate
> This is NOT binary. The more severe the disruption, the higher the payout.

---

## ⚡ Parametric Triggers

ShieldMile monitors 5 real-time triggers for Chennai zones:

| # | Trigger | Threshold | Data Source | Payout |
|---|---------|-----------|-------------|--------|
| 1 | Heavy Rainfall | >35mm/hr in worker's zone | IMD / OpenWeatherMap | CDI-based |
| 2 | Cyclone Warning | Orange/Red alert for Chennai | IMD Alerts API | CDI-based |
| 3 | Extreme Heat | >43°C between 11am–4pm | OpenWeatherMap | CDI-based |
| 4 | Severe AQI | >300 in worker's zone | CPCB AQI API | CDI-based |
| 5 | Local Disruption | Hartal/Curfew in pincode | News API (mock) | CDI-based |

---

## 💰 Weekly Premium Model

Gig workers earn and spend weekly. Our premium model mirrors this exactly.

### Premium Formula

```
Weekly Premium = Base Rate × Zone Multiplier × Seasonal Factor × NCB Discount
```

### Base Rates (Coverage Tiers)

| Tier | Base Rate | Max Weekly Payout | Best For |
|------|-----------|-------------------|----------|
| Basic | ₹49/week | ₹1,200 | Part-time / low earnings |
| Standard | ₹69/week | ₹2,500 | Full-time workers |
| Max | ₹99/week | ₹4,000 | High-earning partners |

### Zone Risk Multipliers (Chennai)

| Zone | Multiplier | Reason |
|------|-----------|--------|
| Velachery | 1.4× | High flood risk, low-lying |
| Adyar | 1.2× | Moderate flood risk |
| T-Nagar | 1.1× | Moderate traffic disruption |
| Anna Nagar | 1.0× | Base rate zone |
| OMR | 0.9× | Low disruption history |

### Seasonal Factors

| Season | Factor | Period |
|--------|--------|--------|
| Northeast Monsoon | 1.3× | Nov–Dec |
| Normal | 1.0× | Rest of year |

### ML Dynamic Pricing
The ML model (XGBoost) adjusts premiums weekly based on:
- Zone historical flood and disruption data
- Upcoming 7-day weather forecast per zone
- Worker's own claim history
- Seasonal risk calendar

---

## 🎁 No-Claim Bonus (NCB) System

Workers who go claim-free for consecutive weeks earn cumulative premium discounts.

### NCB Progression

| Consecutive Weeks | Discount |
|-------------------|----------|
| 1 week | 5% off next week |
| 2 weeks | 10% off |
| 3 weeks | 15% off |
| 4+ weeks | 20% off (maximum) |

Any claim resets the streak back to 0%.

### Why NCB Works

- **For workers:** Pays less premium over time — genuine reward for low-risk behaviour
- **For insurers:** Reduces claim frequency — improves loss ratio by est. 23%
- **For fraud prevention:** Workers think twice before filing small false claims

### Proactive Nudge Layer
When CDI is between 45–60 (approaching but not triggered):
> "CDI at 52 — disruption possible but not triggered yet. Your 3-week streak is safe today! Consider shifting to indoor tasks if rain worsens."

This actively helps workers protect their streak and avoid unnecessary claims.

---

## 🔒 Fraud Detection

ShieldMile uses 5 layers of AI fraud detection before any payout is released:

### Layer 1 — GPS Validation
Worker's last known GPS location must be within the claimed disruption zone boundary. If worker was in OMR during a Velachery rain event → claim blocked.

### Layer 2 — Platform Activity Check
Cross-validates with platform delivery data. If worker completed deliveries during the claimed disruption window → claim flagged. You cannot be working and disrupted simultaneously.

### Layer 3 — Anomaly Detection
ML model (Isolation Forest) learns each worker's normal claim pattern. Claims exceeding 2 per week or showing unusual frequency → flagged for review.

### Layer 4 — Duplicate Prevention
Every disruption event gets a unique Event ID (EVT-CH-XXXXXX). One claim per worker per event ID. System rejects any duplicate claim for the same event automatically.

### Layer 5 — Device Fingerprinting
Multiple accounts from the same device, same UPI ID registered under two accounts, or new accounts created just before a major storm → all flagged as suspicious.

### Fraud Flow
```
Claim initiated
      ↓
All 5 layers checked simultaneously (< 2 seconds)
      ↓
Clean → UPI payout in 5 minutes ✓
Flagged → Blocked + logged on admin dashboard ⚠️
```

---

## 🔄 App Workflow

```
ONBOARDING
Worker registers → enters zone, platform, earnings, Partner ID
      ↓
AI generates ShieldScore (zone-based risk rating)
      ↓
Worker selects coverage tier → weekly auto-debit activated

ACTIVE COVERAGE
ShieldMile monitors 5 triggers 24/7 for worker's zone
CDI recalculated every 15 minutes
      ↓
CDI > 60 AND SLA breach > 50% → disruption confirmed
      ↓
Worker notified: "Disruption detected. Payout clock started."

AUTO CLAIM
5-layer fraud check runs automatically (< 2 seconds)
      ↓
Clean → payout calculated per CDI band × hours lost
      ↓
UPI transfer initiated → worker notified via app + SMS
      ↓
NCB streak reset if claim approved

DASHBOARD
Worker: CDI score, earnings protected, payout history, streak
Admin: loss ratios, zone CDI heatmap, fraud alerts, NCB analytics
```

---

## 🤖 AI/ML Integration

### 1. Dynamic Premium Calculation
- **Model:** XGBoost (Gradient Boosted Regression)
- **Features:** Zone risk score, seasonal index, claim history, 7-day weather forecast, historical flood data per pincode
- **Output:** Weekly premium in ₹, personalised per worker per zone
- **Training data:** IMD 5-year historical rainfall, Chennai flood zone maps, mock gig worker earnings data

### 2. Fraud Detection
- **Model:** Isolation Forest (anomaly detection)
- **Features:** Claim frequency, GPS coordinates, platform activity logs, device ID, event timestamps
- **Output:** Fraud probability score per claim
- **Threshold:** Score > 0.7 → flagged for review

### 3. CDI Risk Scoring
- **Model:** Rule-based weighted scoring engine
- **Features:** Real-time weather, platform order data, SLA metrics, rider availability
- **Output:** CDI score 0–100, payout band determination

### 4. Proactive Nudge (Phase 3)
- **Model:** 7-day disruption probability forecast
- **Input:** OpenWeatherMap forecast API + historical SLA data
- **Output:** Next-day risk alert pushed to worker app

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React.js + Tailwind CSS | UI, mobile-first |
| Charts | Recharts | Admin analytics |
| Backend | Supabase | Database, auth, real-time |
| ML Models | XGBoost + Isolation Forest | Premium + fraud |
| Weather API | OpenWeatherMap (free tier) | Real-time Chennai weather |
| AQI API | CPCB / OpenAQ | Air quality monitoring |
| Alerts API | IMD RSS + News API (mock) | Cyclone + curfew detection |
| Payments | Razorpay Test Mode | UPI payout simulation |
| Hosting | Vercel (frontend) + Render (backend) | Free tier deployment |

---

## 📅 Development Plan

### Phase 1 (Mar 4–20): Ideation & Foundation ✅
- [x] Problem research and persona definition
- [x] CDI engine design and weight configuration
- [x] Weekly premium model design
- [x] NCB system design
- [x] Parametric trigger definition
- [x] Fraud detection architecture
- [x] Tech stack finalisation
- [x] README and strategy document
- [x] UI prototype (Lovable)
- [x] 2-minute video

### Phase 2 (Mar 21–Apr 4): Core Build
- [ ] Worker registration and onboarding flow
- [ ] ShieldScore AI risk profiling
- [ ] Dynamic weekly premium calculator
- [ ] Policy creation and management
- [ ] CDI engine implementation
- [ ] 5 parametric trigger integrations (OpenWeatherMap + mocks)
- [ ] Auto-claim initiation engine
- [ ] Basic fraud detection (GPS + duplicate check)
- [ ] UPI payout simulation (Razorpay test mode)
- [ ] NCB streak tracking

### Phase 3 (Apr 5–17): Scale & Optimise
- [ ] Advanced ML fraud detection (Isolation Forest)
- [ ] XGBoost premium prediction model
- [ ] Worker dashboard (CDI gauge, streak, payout history)
- [ ] Admin dashboard (loss ratios, zone heatmap, fraud alerts, NCB analytics)
- [ ] Proactive disruption nudge notifications
- [ ] Disruption simulation for demo
- [ ] 5-minute demo video
- [ ] Final pitch deck

---

## 👥 Team

**ShieldMile** — Guidewire DEVTrails 2026

| Member | Role |
|--------|------|
| B. Dhanush Kathir | Frontend Lead — React UI, dashboards |
| Y. Yuvashankar | Frontend Dev — Onboarding, policy screens |
| Syed Ashraf | Backend Dev — CDI engine, claim logic |
| Metla Srinath | ML Engineer — Premium model, fraud detection |

---

## 🏆 Why ShieldMile Wins

| Factor | ShieldMile Advantage |
|--------|---------------------|
| Payout model | Graduated CDI-based, not binary on/off |
| Precision | Zone/pincode level, not city level |
| Triggers | Multi-variable CDI, not just rainfall |
| Fraud | 5-layer AI shield, not just rule-based |
| Loyalty | NCB system reduces loss ratio by 23% |
| UX | Zero-touch, zero paperwork, 5-min payout |

---

## 📊 Business Viability

```
1,000 workers × ₹69/week = ₹69,000 collected
Bad week: 100 claims × ₹400 avg = ₹40,000 paid out
Loss Ratio: 38% — highly sustainable
NCB program: reduces claims by est. 23%
```

---

*ShieldMile — Every mile protected.*
