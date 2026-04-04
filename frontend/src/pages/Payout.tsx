import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShieldMileLogo } from "@/components/ShieldMileLogo";
import { CountUp } from "@/components/CountUp";
import { Button } from "@/components/ui/button";
import { loadWorkerData, calculatePayout, calculateMLPremium, getNCBDiscount, generateEventId } from "@/lib/shieldmile";
import { CheckCircle, ArrowRight, Landmark, Smartphone, ShieldCheck, Banknote } from "lucide-react";

export default function Payout() {
  const navigate = useNavigate();
  const [worker, setWorker] = useState(loadWorkerData());
  const [eventId] = useState(generateEventId());
  
  // Mock UPI Transaction ID
  const [txnId] = useState(`TXN${Math.floor(1000000000 + Math.random() * 9000000000)}`);

  useEffect(() => {
    const w = loadWorkerData();
    if (!w) { navigate("/"); return; }
    setWorker(w);
  }, [navigate]);

  if (!worker) return null;

  const tier = worker.selectedTier || "Standard";
  // Demo forces CDI=76 to fetch middle-tier payouts representing standard claims.
  const payout = calculatePayout(worker.weeklyEarnings, 4, 76);
  const premium = calculateMLPremium(tier, worker.zone, worker.ncbStreak);
  const premiumNoNCB = calculateMLPremium(tier, worker.zone, 0);
  const ncbSaved = premiumNoNCB.finalPremium - premium.finalPremium;
  const netProtection = payout.payout - premium.finalPremium;
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute:"2-digit" });

  return (
    <div className="page-container bg-black/90">
      <div className="page-content min-h-screen pb-12">
        <div className="animate-slide-up mb-6 pt-4 flex justify-center"><ShieldMileLogo size="sm" /></div>

        {/* UPI Style Credit Success Header */}
        <div className="flex flex-col items-center mb-8 animate-slide-up stagger-1">
          <div className="bg-safe/20 p-4 rounded-full mb-4 ring-8 ring-safe/10">
             <CheckCircle size={48} className="text-safe animate-bounce" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Payment Successful</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center max-w-[280px]">Instant Parametric Smart Contract Execution via IMPS</p>
        </div>

        {/* Huge Money Dispenser */}
        <div className="bg-gradient-to-br from-surface to-surface/40 p-6 rounded-3xl mb-6 animate-slide-up stagger-2 border border-border/50 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute -top-10 -right-10 opacity-5"><Banknote size={120}/></div>
          <div className="absolute -bottom-10 -left-10 opacity-5"><Landmark size={120}/></div>
          <p className="text-xs text-muted-foreground font-semibold tracking-widest uppercase mb-2">Amount Credited</p>
          <div className="flex justify-center items-center gap-1.5 tabular-nums text-5xl font-extrabold text-white">
             <span className="text-safe">₹</span>
             <CountUp target={payout.payout} />
          </div>
        </div>

        {/* UPI Terminal Receipt */}
        <div className="card-surface p-5 rounded-2xl mb-6 animate-slide-up stagger-3">
          
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border/40">
             <div className="bg-indigo-500/10 p-3 rounded-full"><Landmark className="text-indigo-400" size={24}/></div>
             <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Paid To</p>
                <p className="text-sm font-bold text-card-foreground">{worker.name}</p>
                <p className="text-xs text-muted-foreground">{worker.upiId}</p>
             </div>
          </div>

          <div className="flex items-center gap-4 mb-6 pt-2">
             <div className="bg-primary/10 p-3 rounded-full"><ShieldCheck className="text-primary" size={24}/></div>
             <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Paid From</p>
                <p className="text-sm font-bold text-card-foreground">ShieldMile Auto-Contract</p>
                <p className="text-xs text-muted-foreground">HDFC Nodal Escrow A/C</p>
             </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-dashed border-border/40 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-[11px]">UPI Transaction ID</span>
              <span className="font-mono text-card-foreground">{txnId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-[11px]">Oracle Event ID</span>
              <span className="font-mono text-card-foreground">{eventId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-[11px]">Date & Time</span>
              <span className="text-card-foreground font-medium">{today}</span>
            </div>
          </div>
        </div>

        {/* Parametric Breakdown */}
        <div className="bg-surface/30 p-4 rounded-xl border border-border/30 mb-6 animate-slide-up stagger-4">
           <p className="text-xs font-bold text-card-foreground mb-3 flex items-center gap-2">
              <Smartphone size={14} className="text-primary"/> Disruption Analysis
           </p>
           <div className="space-y-2 text-[11px]">
              <div className="flex justify-between text-muted-foreground">
                 <span>Trigger Condition</span>
                 <span className="text-card-foreground font-medium">Heavy Rainfall (CDI 76)</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                 <span>Coverage Rate</span>
                 <span className="text-card-foreground font-medium">₹{payout.hourlyRate}/hr × {payout.payoutRate}%</span>
              </div>
              <div className="flex justify-between text-muted-foreground pb-2 border-b border-border/30">
                 <span>Estimated Hours Lost</span>
                 <span className="text-card-foreground font-medium">4 Hours</span>
              </div>
              <div className="flex justify-between text-card-foreground font-bold pt-1">
                 <span>Net Protection ROI</span>
                 <span className="text-safe">+₹{Math.round(netProtection)} vs Premium</span>
              </div>
           </div>
        </div>

        {/* NCB Warning */}
        <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 mb-6 animate-slide-up stagger-5 text-center">
          <p className="text-[10px] text-warning font-semibold">
            ⚠️ As you have claimed against your policy, your {worker.ncbStreak}-week No Claim Bonus returns to 0% next week.
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => navigate("/dashboard")} className="flex-1 h-12 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-transform rounded-xl font-bold flex items-center justify-center gap-2">
            Return to Live Dashboard <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
