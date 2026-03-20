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

// ===== Premium Calculation =====
export function calculatePremium(tier: Tier, zone: Zone, ncbStreak: number = 0, date?: Date): {
  base: number; multiplier: number; seasonal: number; ncbDiscount: number;
  originalPremium: number; finalPremium: number;
} {
  const base = TIER_BASE_RATES[tier];
  const multiplier = ZONE_MULTIPLIERS[zone];
  const seasonal = getSeasonalFactor(date);
  const ncbDiscount = getNCBDiscount(ncbStreak);
  const originalPremium = Math.round(base * multiplier * seasonal);
  const finalPremium = Math.round(originalPremium * (1 - ncbDiscount));
  return { base, multiplier, seasonal, ncbDiscount, originalPremium, finalPremium };
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
  deviceOk: boolean; overallClean: boolean;
}

export function runFraudCheck(claimsThisWeek: number = 0): FraudResult {
  const gpsValid = true;
  const activityClean = true;
  const claimHistoryOk = claimsThisWeek < 2;
  const deviceOk = true;
  const overallClean = gpsValid && activityClean && claimHistoryOk && deviceOk;
  return { gpsValid, activityClean, claimHistoryOk, deviceOk, overallClean };
}

// ===== Worker Data (sessionStorage) =====
export interface WorkerData {
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
