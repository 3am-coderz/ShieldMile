# 🛡️ ShieldMile
### AI-Powered Parametric Income Insurance for India's Gig Economy

> *"When the rain stops deliveries, ShieldMile starts paying."*

![Phase](https://img.shields.io/badge/Phase-1%20Ideation-teal)
![Hackathon](https://img.shields.io/badge/Guidewire-DEVTrails%202026-navy)
![Status](https://img.shields.io/badge/Status-Active-green)

---

## 📌 One Line Description

ShieldMile protects Chennai's Zepto & Blinkit delivery partners from income loss due to weather disruptions. Our AI-powered CDI engine auto-detects disruptions, passes fraud checks, and transfers payouts to UPI in 5 minutes — all for just ₹59–₹99/week.

---

## 🎥 Demo Video
[Click to watch demo](https://www.youtube.com/watch?v=0Q1m76gxMmA)

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

## 🛡️ Adversarial Defense & Anti-Spoofing Strategy

> *Threat: A coordinated syndicate using GPS-spoofing apps to fake zone presence and drain the liquidity pool. Simple GPS verification is no longer sufficient.*

---

### 1. The Differentiation — Genuine Worker vs. GPS Spoofer

ShieldMile's defense goes far beyond checking a single GPS coordinate. A GPS spoofer can fake *where* they are, but they cannot simultaneously fake **everything else** their phone and the platform are reporting.

We cross-correlate GPS location against **six independent behavioral and sensor signals** in real time. A genuine stranded worker will pass most of these naturally. A spoofer's signals will contradict each other.

| Signal | Genuine Stranded Worker | GPS Spoofer |
|--------|------------------------|-------------|
| GPS location | In disruption zone | Spoofed to zone ✓ |
| Accelerometer / motion data | Near-zero movement (sheltering) | Inconsistent — may show walking/transit pattern from real location |
| Network cell tower ID | Tower in claimed zone | Tower in actual home area ✗ |
| App last active delivery timestamp | No completed orders during event | May show recent completed orders ✗ |
| Battery / signal behavior | Weak signal, intermittent (bad weather) | Normal signal strength ✗ |
| Platform order queue status | Worker marked unavailable / offline | May still be receiving order pings ✗ |

**The key insight:** GPS spoofing apps override the GPS chip. They **cannot** spoof the cellular network's cell tower registration, the accelerometer's motion signature, or the platform's backend delivery log. Any claim where GPS says "Velachery flood zone" but the cell tower says "Tambaram" is automatically escalated.

**ML Layer — Spoof Probability Score:**
The Isolation Forest model (already in our fraud stack) is extended with a **Spoof Probability Score (SPS)** combining these signals:

```
SPS = weighted_anomaly(
  cell_tower_zone_mismatch,       weight: 0.35
  motion_pattern_inconsistency,   weight: 0.25
  signal_strength_vs_weather,     weight: 0.20
  platform_activity_contradiction, weight: 0.20
)

SPS > 0.65 → claim flagged as spoofed
SPS 0.40–0.65 → soft review with grace window (see UX Balance below)
SPS < 0.40 → clean, proceed to payout
```

---

### 2. The Data — Detecting a Coordinated Fraud Ring

A single spoofed claim is hard to catch. A **coordinated syndicate of 500 workers** leaves unmistakable statistical fingerprints. ShieldMile monitors for ring-level patterns, not just individual claim anomalies.

#### Ring Detection Signals

**Temporal Clustering Analysis**
- Normal organic claims arrive over 15–40 minutes as workers notice the disruption and open the app.
- A coordinated ring triggers claims in a **tight burst window (< 3 minutes)** as Telegram message goes out.
- Our system flags any event where >15% of claims arrive within a 3-minute window as a **Coordinated Claim Surge (CCS)** — triggering ring-level investigation, not just individual review.

**Social Graph / Device Proximity**
- Device fingerprinting (Layer 5) already catches same-device multi-accounts.
- Extended: we now track **device proximity history** — workers whose devices have been co-located (same WiFi hotspot, same Bluetooth range) in the past 30 days are flagged as a social cluster.
- If >3 members of a social cluster file claims in the same event window → cluster is flagged for enhanced review.

**UPI Account Network Analysis**
- UPI IDs linked to the same bank account, same household address, or same registered mobile number across multiple worker profiles are flagged.
- Payouts to flagged UPI clusters are held pending manual review.

**New Account Pre-Storm Registration**
- Already covered in Layer 5. Enhanced rule: any account registered within **72 hours** before a CDI > 70 event is automatically ineligible for that event's payout. First payout only after 2 complete claim-free weeks.

**Zone Saturation Monitor**
- ShieldMile tracks the **expected vs. actual claim rate per zone per event** using historical baselines.
- If claims from Velachery exceed 3× the historical average for a CDI event of similar magnitude → zone-level fraud alert raised, all pending claims from that zone held for batch review before release.

#### Summary of Ring-Detection Data Points

| Data Point | Source | What It Catches |
|------------|--------|----------------|
| Cell tower zone vs GPS zone | Telecom network (carrier API / SIM data) | Individual spoofing |
| Claim burst timing (< 3 min window) | ShieldMile event log | Telegram-coordinated rings |
| Device co-location history | Device fingerprint + WiFi/BT metadata | Social cluster rings |
| UPI network graph | Payment processor (Razorpay) | Payout consolidation rings |
| New account pre-storm spike | Registration timestamp | Account farm rings |
| Zone claim rate vs historical baseline | ShieldMile internal analytics | Zone-level saturation attacks |

---

### 3. The UX Balance — Fair Handling of Flagged Claims

The #1 failure mode of aggressive fraud detection is **false positives** — blocking honest workers who happen to have a weak signal or an unusual pattern during a real storm. ShieldMile uses a **tiered resolution workflow** that protects genuine workers without letting bad actors slip through.

#### Three-Tier Claim Resolution

```
TIER 1 — AUTO APPROVE (SPS < 0.40, no ring flags)
All 5 fraud layers clean + spoof score low
→ UPI payout in 5 minutes. No friction for honest workers.

TIER 2 — GRACE WINDOW (SPS 0.40–0.65, or 1 soft flag)
Likely genuine but signal is ambiguous (network drop in storm)
→ Payout held for 90 minutes
→ System re-checks cell tower + platform data after weather event clears
→ If signals resolve to clean → auto-approved, payout released
→ Worker notified: "Payout verification in progress — expected in 90 mins"
→ NCB streak NOT broken during grace window

TIER 3 — MANUAL REVIEW (SPS > 0.65, or ring-level flag)
High-confidence fraud signal or coordinated cluster detected
→ Payout blocked
→ Worker notified with a specific, non-accusatory reason:
   "We detected a signal mismatch for this claim. 
    Reply with a 10-second video showing your surroundings to unlock review."
→ Video + admin manual review within 4 hours
→ If cleared: payout released + worker earns a "Verified Genuine" trust badge
→ If confirmed fraud: account suspended, reported to platform partner
```

#### Protecting Honest Workers from False Positives

**The Grace Window is key.** In real heavy rain, GPS accuracy degrades, cell signals weaken, and the app may not update cleanly. A 90-minute automatic re-check means a genuine worker sheltering under a bridge with intermittent connectivity is **not punished** — the system waits for signals to stabilize and re-evaluates automatically.

**NCB Streak Protection:** A claim entering Tier 2 (grace window) does **not** reset the NCB streak. Only a confirmed approved claim resets the streak. A worker under review retains their discount until a final determination is made.

**Transparent Communication:** Workers are never told "your claim is suspicious." They see: "Verification in progress" (Tier 2) or "Signal mismatch detected — here's how to resolve it" (Tier 3). This is factually accurate, non-accusatory, and gives honest workers a clear path to payout.

**Trust Badge System:** Workers who pass Tier 3 manual review earn a persistent **"Verified Genuine" badge** on their profile. After 3 badges, they are promoted to **Trusted Worker** status — future borderline claims are automatically upgraded from Tier 3 to Tier 2 resolution.

---

### Defense Architecture Summary

```
Claim Initiated
      ↓
GPS received → Cell tower cross-check (INSTANT)
      ↓
6-signal behavioral fusion → Spoof Probability Score calculated (< 2 sec)
      ↓
Ring detection: burst timing + social graph + zone saturation (< 2 sec)
      ↓
┌─────────────┬──────────────────┬──────────────────┐
│   TIER 1    │     TIER 2       │     TIER 3       │
│ Auto Approve│  Grace Window    │  Manual Review   │
│  (5 min)    │  (90 min re-chk) │  (4 hr)          │
└─────────────┴──────────────────┴──────────────────┘
```

> **Design principle:** Make spoofing harder than delivering honestly. The syndicate needs to simultaneously fake GPS, cell towers, motion data, platform activity, and network signals — coordinated across hundreds of accounts — faster than ShieldMile's ring detection fires. That is not a viable attack surface.

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
