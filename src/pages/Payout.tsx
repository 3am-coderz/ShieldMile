import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShieldMileLogo } from "@/components/ShieldMileLogo";
import { CountUp } from "@/components/CountUp";
import { Button } from "@/components/ui/button";
import { loadWorkerData, calculatePayout, calculatePremium, getNCBDiscount, generateEventId } from "@/lib/shieldmile";
import { CheckCircle, ArrowRight } from "lucide-react";

const CDI_VALUE = 76;
const HOURS_LOST = 4;

export default function Payout() {
  const navigate = useNavigate();
  const [worker, setWorker] = useState(loadWorkerData());
  const [eventId] = useState(generateEventId());

  useEffect(() => {
    const w = loadWorkerData();
    if (!w) { navigate("/"); return; }
    setWorker(w);
  }, [navigate]);

  if (!worker) return null;

  const tier = worker.selectedTier || "Standard";
  const payout = calculatePayout(worker.weeklyEarnings, HOURS_LOST, CDI_VALUE);
  const premium = calculatePremium(tier, worker.zone, worker.ncbStreak);
  const premiumNoNCB = calculatePremium(tier, worker.zone, 0);
  const ncbSaved = premiumNoNCB.finalPremium - premium.finalPremium;
  const netProtection = payout.payout - premium.finalPremium;
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const steps = ["Trigger Detected", "CDI Calculated", "Fraud Check Passed", "Payout Sent"];

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="animate-slide-up mb-6 pt-4"><ShieldMileLogo size="sm" /></div>

        {/* Checkmark */}
        <div className="flex flex-col items-center mb-6 animate-slide-up stagger-1">
          <svg width="80" height="80" viewBox="0 0 80 80" className="mb-4">
            <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(142 71% 45%)" strokeWidth="3" opacity="0.2" />
            <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(142 71% 45%)" strokeWidth="3"
              strokeDasharray="226" strokeDashoffset="226"
              style={{ animation: "gauge-fill 1s cubic-bezier(0.16,1,0.3,1) 0.3s forwards" }} />
            <path d="M24 40 L35 51 L56 30" fill="none" stroke="hsl(142 71% 45%)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="50" strokeDashoffset="50"
              style={{ animation: "check-draw 0.6s cubic-bezier(0.16,1,0.3,1) 0.8s forwards" }} />
          </svg>
          <h1 className="text-2xl font-extrabold text-foreground">Payout Approved!</h1>
          <p className="text-sm text-muted-foreground mt-1">CDI Score {CDI_VALUE} — Heavy rain disruption confirmed in {worker.zone}</p>
        </div>

        {/* Payout Amount */}
        <div className="card-surface p-6 mb-4 animate-slide-up stagger-2 text-center">
          <p className="text-xs text-muted-foreground mb-1">Payout Amount</p>
          <p className="text-4xl font-extrabold text-safe"><CountUp target={payout.payout} prefix="₹" /></p>
        </div>

        {/* Receipt */}
        <div className="card-surface p-4 mb-4 animate-slide-up stagger-3">
          <p className="text-xs font-semibold text-card-foreground mb-3">Payout Receipt</p>
          <div className="space-y-2 text-xs">
            {[
              ["Disruption Type", `Heavy Rain (47mm/hr)`],
              ["CDI Score", `${CDI_VALUE} (Band: ₹${payout.payoutRate}/hour)`],
              ["Date", today],
              ["Hours Lost", `${HOURS_LOST} hrs`],
              ["Hourly Rate", `₹${payout.hourlyRate}`],
              ["Payout Amount", `₹${payout.payout}`],
              ["UPI ID", worker.upiId],
              ["Event ID", eventId],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium text-card-foreground">{v}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">Status</span>
              <span className="text-safe font-semibold flex items-center gap-1">Transferred <CheckCircle size={12} /></span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fraud Verdict</span>
              <span className="text-safe font-semibold flex items-center gap-1">Clean <CheckCircle size={12} /></span>
            </div>
          </div>
        </div>

        {/* NCB Reset Notice */}
        <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 mb-4 animate-slide-up stagger-4">
          <p className="text-xs text-warning font-medium">
            Your {worker.ncbStreak}-week no-claim streak has been reset. Premium discount returns to 0% next week. Build your streak again to earn discounts! 💪
          </p>
        </div>

        {/* Timeline */}
        <div className="card-surface p-4 mb-4 animate-slide-up stagger-5">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-safe flex items-center justify-center">
                    <CheckCircle size={14} className="text-safe-foreground" />
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 text-center max-w-[70px]">{s}</span>
                </div>
                {i < steps.length - 1 && <div className="w-6 h-0.5 bg-safe mx-1 mb-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Savings */}
        <div className="card-surface p-4 mb-6 animate-slide-up stagger-6">
          <p className="text-xs font-semibold text-card-foreground mb-3">Savings Summary</p>
          <div className="space-y-2 text-xs">
            {[
              ["Weekly Premium Paid", `₹${premium.finalPremium}`],
              ["Payout Received", `₹${payout.payout}`],
              ["Net Protection", `₹${netProtection}`],
              ["NCB Discount Saved", `₹${ncbSaved}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium text-card-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => navigate("/policy")} variant="outline" className="flex-1 h-11 border-primary/30 text-primary hover:bg-primary/10 active:scale-[0.98] transition-transform">
            View Coverage
          </Button>
          <Button onClick={() => navigate("/admin")} className="flex-1 h-11 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-transform gap-1.5">
            Admin Dashboard <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
