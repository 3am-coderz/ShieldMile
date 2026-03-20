import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShieldMileLogo } from "@/components/ShieldMileLogo";
import { ShieldScoreBadge } from "@/components/ShieldScoreBadge";
import { Button } from "@/components/ui/button";
import {
  loadWorkerData, saveWorkerData, getShieldScore, getRiskLabel, calculatePremium,
  getNCBDiscount, TIERS, TIER_MAX_PAYOUTS, type Tier, type WorkerData,
} from "@/lib/shieldmile";
import { Shield, CheckCircle, Flame, ChevronRight } from "lucide-react";

const COVERED_EVENTS = [
  "Heavy Rain (>35mm/hr)", "Cyclone Alert", "Extreme Heat (>43°C)",
  "Severe AQI (>300)", "Local Curfew",
];

export default function Policy() {
  const navigate = useNavigate();
  const [worker, setWorker] = useState<WorkerData | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier>("Standard");

  useEffect(() => {
    const w = loadWorkerData();
    if (!w) { navigate("/"); return; }
    setWorker(w);
    if (w.selectedTier) setSelectedTier(w.selectedTier);
  }, [navigate]);

  if (!worker) return null;

  const score = getShieldScore(worker.zone);
  const risk = getRiskLabel(score);
  const ncbStreak = worker.ncbStreak;
  const ncbDiscount = getNCBDiscount(ncbStreak);
  const ncbPercent = Math.round(ncbDiscount * 100);

  const activate = () => {
    saveWorkerData({ ...worker, selectedTier });
    navigate("/dashboard");
  };

  const riskColorClass = risk.color === "red" ? "text-triggered" : risk.color === "yellow" ? "text-warning" : "text-safe";

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="animate-slide-up mb-6 pt-4"><ShieldMileLogo /></div>

        {/* Worker info */}
        <div className="card-surface p-4 mb-4 animate-slide-up stagger-1 flex items-center justify-between">
          <div>
            <p className="font-semibold text-card-foreground">{worker.name}</p>
            <p className="text-sm text-muted-foreground">{worker.zone} · {worker.platform}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${risk.color === "red" ? "badge-triggered" : risk.color === "yellow" ? "badge-warning" : "badge-safe"}`}>
            {risk.label}
          </span>
        </div>

        {/* Score */}
        <div className="card-surface p-6 mb-4 animate-slide-up stagger-2 flex flex-col items-center">
          <ShieldScoreBadge score={score} />
          <p className={`mt-2 font-semibold ${riskColorClass}`}>{risk.label}</p>
        </div>

        {/* NCB Streak */}
        <div className="card-surface p-4 mb-4 animate-slide-up stagger-3">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={20} className="text-streak" />
            <span className="font-bold text-card-foreground">{ncbStreak} Week Streak 🔥</span>
            <span className="text-xs text-safe ml-auto font-medium">{ncbPercent}% discount</span>
          </div>
          <div className="h-2 rounded-full bg-surface overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-streak to-warning transition-all duration-700" style={{ width: `${Math.min(ncbStreak / 4, 1) * 100}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {ncbStreak < 4 ? `${4 - ncbStreak} more no-claim week${4 - ncbStreak > 1 ? "s" : ""} to reach 20% discount` : "Maximum 20% discount achieved! 🎉"}
          </p>
        </div>

        {/* Tier Cards */}
        <div className="space-y-3 mb-4">
          {TIERS.map((tier, i) => {
            const p = calculatePremium(tier, worker.zone, ncbStreak);
            const isSelected = selectedTier === tier;
            const isRecommended = tier === "Standard";
            return (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`animate-slide-up stagger-${i + 3} w-full text-left card-surface p-4 transition-all duration-200 active:scale-[0.98] ${isSelected ? "ring-2 ring-primary shadow-xl shadow-primary/10" : "hover:shadow-lg"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-card-foreground">{tier}</span>
                    {isRecommended && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">RECOMMENDED</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground line-through mr-2">₹{p.originalPremium}</span>
                    <span className="text-lg font-bold text-primary">₹{p.finalPremium}</span>
                    <span className="text-xs text-muted-foreground">/week</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Max payout: ₹{TIER_MAX_PAYOUTS[tier].toLocaleString("en-IN")}</p>
              </button>
            );
          })}
        </div>

        {/* Formula */}
        {(() => {
          const p = calculatePremium(selectedTier, worker.zone, ncbStreak);
          return (
            <div className="card-surface p-4 mb-4 animate-fade-in-up">
              <p className="text-xs font-semibold text-card-foreground mb-2">Premium Breakdown</p>
              <p className="text-xs text-muted-foreground font-mono">
                ₹{p.base} × {p.multiplier} × {p.seasonal} × {(1 - p.ncbDiscount).toFixed(2)} = <span className="text-primary font-bold">₹{p.finalPremium}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Base × Zone Multiplier × Seasonal × NCB Discount</p>
            </div>
          );
        })()}

        {/* Covered Events */}
        <div className="card-surface p-4 mb-4 animate-slide-up stagger-5">
          <p className="text-xs font-semibold text-card-foreground mb-3">Covered Events</p>
          <div className="flex flex-wrap gap-2">
            {COVERED_EVENTS.map(e => (
              <span key={e} className="text-xs px-2.5 py-1 rounded-full bg-surface text-surface-foreground">{e}</span>
            ))}
          </div>
        </div>

        {/* Fraud Badge */}
        <div className="card-surface p-3 mb-6 animate-slide-up stagger-6 flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          <span className="text-xs font-semibold text-card-foreground">AI Fraud Shield Active</span>
          <CheckCircle size={14} className="text-safe ml-auto" />
        </div>

        <Button onClick={activate} className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
          Activate Coverage <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
}
