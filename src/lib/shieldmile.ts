// ===== ZONE DATA =====
export type Zone = "Velachery" | "Adyar" | "T-Nagar" | "Anna Nagar" | "OMR";
export type Platform = "Zepto" | "Blinkit" | "Swiggy Instamart";
export type Tier = "Basic" | "Standard" | "Max";

export const ZONE_SCORES: Record<Zone, number> = {
  Velachery: 62, Adyar: 71, "T-Nagar": 76, "Anna Nagar": 84, OMR: 88,
};

export const ZONE_MULTIPLIERS: Record<Zone, number> = {
  Velachery: 1.4, Adyar: 1.2, "T-Nagar": 1.1, "Anna Nagar": 1.0, OMR: 0.9,
};

export const TIER_BASE_RATES: Record<Tier, number> = {
  Basic: 49, Standard: 69, Max: 99,
};

export const TIER_MAX_PAYOUTS: Record<Tier, number> = {
  Basic: 1200, Standard: 2500, Max: 4000,
};

export const ZONES: Zone[] = ["Velachery", "Adyar", "T-Nagar", "Anna Nagar", "OMR"];
export const PLATFORMS: Platform[] = ["Zepto", "Blinkit", "Swiggy Instamart"];
export const TIERS: Tier[] = ["Basic", "Standard", "Max"];

// ===== ShieldScore =====
export function getShieldScore(zone: Zone): number {
  return ZONE_SCORES[zone];
}

export function getRiskLabel(score: number): { label: string; color: "red" | "yellow" | "green" } {
  if (score <= 70) return { label: "High Risk Zone", color: "red" };
  if (score <= 79) return { label: "Medium Risk Zone", color: "yellow" };
  return { label: "Low Risk Zone", color: "green" };
}

// ===== Seasonal Factor =====
export function getSeasonalFactor(date: Date = new Date()): number {
  const month = date.getMonth(); // 0-indexed
  return (month === 10 || month === 11) ? 1.3 : 1.0;
}

// ===== NCB Discount =====
export function getNCBDiscount(streakWeeks: number): number {
  if (streakWeeks >= 4) return 0.20;
  if (streakWeeks === 3) return 0.15;
  if (streakWeeks === 2) return 0.10;
  if (streakWeeks === 1) return 0.05;
  return 0;
}

// ===== SHAP ML Premium Engine (Ported from 1.5 ml_premium.py) =====
export interface SHAPBreakdown {
  feature: string;
  impactLabel: string;
  impactValue: number;
  sign: "+" | "-";
}

export function calculateMLPremium(tier: Tier, zone: Zone, ncbStreak: number = 0, reliabilityScore: number = 85): {
  base: number; 
  multiplier: number; 
  seasonal: number; 
  ncbDiscount: number;
  originalPremium: number; 
  finalPremium: number;
  riskScore: number;
  shapData: SHAPBreakdown[];
} {
  const base = TIER_BASE_RATES[tier];
  
  // Pseudo-XGBoost variables
  const rainfall7dAvg = (ZONE_SCORES[zone] / 100) * 30 + (Math.random() * 5); 
  const floodHistory = zone === "Velachery" || zone === "OMR" ? 1 : 0;
  const rainVelocity = Math.random() * 10;
  
  // The y = function from ml_premium.py
  // y = (rainfall * 0.8) + (flood_history * 15) - (reliability - 60) * 0.5 + ...
  const rawRisk = (rainfall7dAvg * 0.8) + (floodHistory * 15) - ((reliabilityScore - 60) * 0.5) + (rainVelocity * 0.3) + 20;
  const riskScore = Math.min(100, Math.max(0, rawRisk));

  // Determine SHAP pseudo-impacts explicitly
  const shapData: SHAPBreakdown[] = [];
  
  const addShap = (feature: string, val: number) => {
    const monetary = Math.round(Math.abs(val) * 0.5);
    if (monetary >= 1) {
       shapData.push({ feature, impactLabel: `₹${monetary}`, impactValue: monetary, sign: val >= 0 ? "+" : "-" });
    }
  };

  addShap("Avg rainfall (7d)", (rainfall7dAvg * 0.8) - 15);
  addShap("Flood history", floodHistory * 15);
  addShap("Your reliability", -((reliabilityScore - 60) * 0.5));
  addShap("Rain acceleration", rainVelocity * 0.3);

  // Re-adjust tier base using riskScore directly simulating the Python tier logic
  let adjustedBase = base;
  if (riskScore > 75) adjustedBase += Math.round((riskScore - 75) * 0.8);
  else if (riskScore < 50) adjustedBase -= 10;

  const multiplier = ZONE_MULTIPLIERS[zone];
  const seasonal = getSeasonalFactor(new Date());
  const ncbDiscount = getNCBDiscount(ncbStreak);
  
  const originalPremium = Math.round(adjustedBase * multiplier * seasonal);
  const finalPremium = Math.round(originalPremium * (1 - ncbDiscount));

  return { base: adjustedBase, multiplier, seasonal, ncbDiscount, originalPremium, finalPremium, riskScore, shapData };
}

// ===== CDI Calculation =====
export interface CDIInputs {
  rainfall: number;      // mm/hr
  orderSurge: number;    // percentage
  slaBreach: number;     // percentage
  riderSupplyDrop: number; // percentage
}

export interface CDIResult {
  rainfallNorm: number; orderSurgeNorm: number; slaBreachNorm: number; riderSupplyNorm: number;
  rainfallContrib: number; orderSurgeContrib: number; slaBreachContrib: number; riderSupplyContrib: number;
  total: number; triggered: boolean;
}

function normalize(value: number, max: number): number {
  return Math.min(100, Math.max(0, (value / max) * 100));
}

export function calculateCDI(inputs: CDIInputs): CDIResult {
  const rainfallNorm = normalize(inputs.rainfall, 50);
  const orderSurgeNorm = normalize(inputs.orderSurge, 250);
  const slaBreachNorm = normalize(inputs.slaBreach, 80);
  const riderSupplyNorm = normalize(inputs.riderSupplyDrop, 70);

  const rainfallContrib = Math.round(rainfallNorm * 0.35);
  const orderSurgeContrib = Math.round(orderSurgeNorm * 0.25);
  const slaBreachContrib = Math.round(slaBreachNorm * 0.25);
  const riderSupplyContrib = Math.round(riderSupplyNorm * 0.15);

  const total = rainfallContrib + orderSurgeContrib + slaBreachContrib + riderSupplyContrib;
  const triggered = total > 60 && inputs.slaBreach > 50;

  return {
    rainfallNorm, orderSurgeNorm, slaBreachNorm, riderSupplyNorm,
    rainfallContrib, orderSurgeContrib, slaBreachContrib, riderSupplyContrib,
    total, triggered,
  };
}

// ===== Payout =====
export function getPayoutRate(cdi: number): number {
  if (cdi >= 90) return 120;
  if (cdi >= 75) return 80;
  if (cdi >= 60) return 50;
  return 0;
}

export function calculatePayout(weeklyEarnings: number, hoursLost: number, cdi: number) {
  const hourlyRate = weeklyEarnings / 40;
  const payoutRate = getPayoutRate(cdi);
  const payout = hoursLost * hourlyRate;
  return { hourlyRate: Math.round(hourlyRate), payoutRate, payout: Math.round(payout) };
}

// ===== Partner ID Validation =====
export function validatePartnerId(id: string, platform: Platform): boolean {
  if (platform === "Zepto") return /^ZPT-\d{5}$/.test(id);
  if (platform === "Blinkit") return /^BLK-\d{5}$/.test(id);
  return id.length > 0;
}

// ===== Event ID =====
export function generateEventId(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `EVT-CH-${digits}`;
}

// ===== Fraud Checks =====
export interface FraudResult {
  gpsValid: boolean; activityClean: boolean; claimHistoryOk: boolean;
  weatherHistoryMatchOk: boolean; deviceOk: boolean; overallClean: boolean;
  pandemicActive: boolean; rejectionReason?: string;
}

export function runFraudCheck(claimsThisWeek: number = 0, triggerGpsSpoof: boolean = false, triggerWeatherMismatch: boolean = false, triggerPandemicLockdown: boolean = false): FraudResult {
  const gpsValid = !triggerGpsSpoof;
  const weatherHistoryMatchOk = !triggerWeatherMismatch;
  const activityClean = true;
  const claimHistoryOk = claimsThisWeek < 2;
  const deviceOk = true;
  const pandemicActive = triggerPandemicLockdown;
  
  const overallClean = gpsValid && activityClean && claimHistoryOk && deviceOk && weatherHistoryMatchOk && !pandemicActive;
  
  let rejectionReason = undefined;
  if (pandemicActive) rejectionReason = "Pandemic Lockdown Active (Standard Exclusion)";
  else if (!gpsValid) rejectionReason = "Impossible Velocity Detected (GPS Spoofing)";
  else if (!weatherHistoryMatchOk) rejectionReason = "Open-Meteo Historical Archive Mismatch";
  else if (!claimHistoryOk) rejectionReason = "Claim Frequency Limit Exceeded";

  return { gpsValid, activityClean, claimHistoryOk, weatherHistoryMatchOk, deviceOk, pandemicActive, overallClean, rejectionReason };
}

// ===== Worker Data (sessionStorage) =====
export interface WorkerData {
  id?: string;
  name: string; phone: string; partnerId: string; platform: Platform;
  zone: Zone; weeklyEarnings: number; upiId: string;
  selectedTier?: Tier; ncbStreak: number;
}

export function saveWorkerData(data: WorkerData) {
  sessionStorage.setItem("shieldmile_worker", JSON.stringify(data));
}

export function loadWorkerData(): WorkerData | null {
  const raw = sessionStorage.getItem("shieldmile_worker");
  return raw ? JSON.parse(raw) : null;
}
