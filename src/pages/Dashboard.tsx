import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShieldMileLogo } from "@/components/ShieldMileLogo";
import { CDIGauge } from "@/components/CDIGauge";
import { Button } from "@/components/ui/button";
import { loadWorkerData, calculateCDI, runFraudCheck, type CDIInputs, type CDIResult } from "@/lib/shieldmile";
import { CloudRain, Wind, Thermometer, CloudFog, ShieldAlert, CheckCircle, AlertTriangle, MapPin, Smartphone, Activity, FileText, Zap } from "lucide-react";

const DEMO_INPUTS: CDIInputs = { rainfall: 47, orderSurge: 165, slaBreach: 58, riderSupplyDrop: 42 };
const SAFE_INPUTS: CDIInputs = { rainfall: 12, orderSurge: 80, slaBreach: 20, riderSupplyDrop: 15 };

export default function Dashboard() {
  const navigate = useNavigate();
  const [worker, setWorker] = useState(loadWorkerData());
  const [inputs, setInputs] = useState<CDIInputs>(SAFE_INPUTS);
  const [cdi, setCdi] = useState<CDIResult>(calculateCDI(SAFE_INPUTS));
  const [simulating, setSimulating] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const w = loadWorkerData();
    if (!w) { navigate("/"); return; }
    setWorker(w);
  }, [navigate]);

  const simulate = () => {
    setSimulating(true);
    setShowAlert(false);
    // Animate from safe to triggered
    const steps = 30;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const t = step / steps;
      const current: CDIInputs = {
        rainfall: SAFE_INPUTS.rainfall + (DEMO_INPUTS.rainfall - SAFE_INPUTS.rainfall) * t,
        orderSurge: SAFE_INPUTS.orderSurge + (DEMO_INPUTS.orderSurge - SAFE_INPUTS.orderSurge) * t,
        slaBreach: SAFE_INPUTS.slaBreach + (DEMO_INPUTS.slaBreach - SAFE_INPUTS.slaBreach) * t,
        riderSupplyDrop: SAFE_INPUTS.riderSupplyDrop + (DEMO_INPUTS.riderSupplyDrop - SAFE_INPUTS.riderSupplyDrop) * t,
      };
      setInputs(current);
      const result = calculateCDI(current);
      setCdi(result);
      if (step >= steps) {
        clearInterval(interval);
        setSimulating(false);
        setShowAlert(true);
      }
    }, 100);
  };

  if (!worker) return null;
  const fraud = runFraudCheck(0);
  const isMidRange = cdi.total >= 45 && cdi.total <= 60;

  const triggers = [
    { name: "Heavy Rain", icon: CloudRain, threshold: ">35mm/hr", value: `${Math.round(inputs.rainfall)}mm/hr`, triggered: inputs.rainfall > 35 },
    { name: "Cyclone Alert", icon: Wind, threshold: "Active", value: "Inactive", triggered: false },
    { name: "Extreme Heat", icon: Thermometer, threshold: ">43°C", value: "32°C", triggered: false },
    { name: "Severe AQI", icon: CloudFog, threshold: ">300", value: "187", triggered: false },
    { name: "Local Curfew", icon: ShieldAlert, threshold: "Active", value: "None", triggered: false },
  ];

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="animate-slide-up mb-4 pt-4"><ShieldMileLogo size="sm" /></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 animate-slide-up stagger-1">
          <h1 className="text-lg font-bold text-foreground">Live Shield Monitor</h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
            <span className="text-xs font-medium text-safe">Active</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4 animate-slide-up stagger-1">{worker.name} · {worker.zone}</p>

        {/* CDI Gauge */}
        <div className="card-surface p-6 mb-4 animate-slide-up stagger-2 flex flex-col items-center">
          <CDIGauge value={cdi.total} />
          {cdi.triggered && <span className="mt-2 text-sm font-bold text-triggered">PAYOUT TRIGGERED</span>}
        </div>

        {/* CDI Breakdown */}
        <div className="card-surface p-4 mb-4 animate-slide-up stagger-3">
          <p className="text-xs font-semibold text-card-foreground mb-3">CDI Breakdown</p>
          <div className="space-y-2 text-xs">
            {[
              { label: "Rainfall", raw: `${Math.round(inputs.rainfall)}mm/hr`, norm: cdi.rainfallNorm, weight: "35%", contrib: cdi.rainfallContrib },
              { label: "Order Surge", raw: `${Math.round(inputs.orderSurge)}%`, norm: cdi.orderSurgeNorm, weight: "25%", contrib: cdi.orderSurgeContrib },
              { label: "SLA Breach", raw: `${Math.round(inputs.slaBreach)}%`, norm: cdi.slaBreachNorm, weight: "25%", contrib: cdi.slaBreachContrib },
              { label: "Rider Supply Drop", raw: `${Math.round(inputs.riderSupplyDrop)}%`, norm: cdi.riderSupplyNorm, weight: "15%", contrib: cdi.riderSupplyContrib },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between text-muted-foreground">
                <span className="text-card-foreground font-medium w-32">{r.label}</span>
                <span>{r.raw}</span>
                <span>→ {Math.round(r.norm)}</span>
                <span>× {r.weight}</span>
                <span className="font-bold text-card-foreground">{r.contrib}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between font-bold text-card-foreground">
              <span>CDI Total</span>
              <span className={cdi.triggered ? "text-triggered" : "text-safe"}>{cdi.total}</span>
            </div>
          </div>
        </div>

        {/* Triggers */}
        <div className="space-y-2 mb-4">
          {triggers.map((t, i) => (
            <div key={t.name} className={`card-surface p-3 flex items-center gap-3 animate-slide-up stagger-${Math.min(i + 3, 6)}`}>
              <t.icon size={18} className={t.triggered ? "text-triggered" : "text-safe"} />
              <div className="flex-1">
                <p className="text-sm font-medium text-card-foreground">{t.name} <span className="text-muted-foreground font-normal">({t.threshold})</span></p>
              </div>
              {t.triggered ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-triggered animate-pulse-dot" />
                  <span className="text-xs font-bold text-triggered">{t.value}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-safe" />
                  <span className="text-xs text-safe">{t.value}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Fraud Check */}
        <div className="card-surface p-4 mb-4 animate-slide-up stagger-5">
          <p className="text-xs font-semibold text-card-foreground mb-3">Fraud Verification</p>
          <div className="space-y-2 text-xs">
            {[
              { icon: MapPin, label: `GPS Zone: ${worker.zone}`, ok: fraud.gpsValid },
              { icon: Activity, label: "Platform Activity: No deliveries during event", ok: fraud.activityClean },
              { icon: FileText, label: "Claim History: 0 claims this week", ok: fraud.claimHistoryOk },
              { icon: Smartphone, label: "Device Check: Single device", ok: fraud.deviceOk },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2 text-muted-foreground">
                <f.icon size={14} className="text-card-foreground" />
                <span className="flex-1">{f.label}</span>
                <CheckCircle size={14} className="text-safe" />
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1 border-t border-border text-card-foreground font-medium">
              <span>Fraud Score: Clean</span>
              <CheckCircle size={14} className="text-safe" />
            </div>
          </div>
        </div>

        {/* NCB Warning */}
        {cdi.triggered && (
          <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 mb-4 animate-fade-in-up">
            <div className="flex gap-2">
              <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-warning">
                ⚠️ This disruption will trigger a claim and reset your {worker.ncbStreak}-week no-claim streak. Discount resets to 0% next week.
              </p>
            </div>
          </div>
        )}

        {/* Proactive Nudge */}
        {isMidRange && !cdi.triggered && (
          <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 mb-4 animate-fade-in-up">
            <p className="text-xs text-primary">
              CDI at {cdi.total} — disruption possible but not triggered yet. Your {worker.ncbStreak}-week streak is safe today! 🎯
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Tip: Consider shifting to indoor tasks if rain worsens.</p>
          </div>
        )}

        {/* Alert Banner */}
        {showAlert && cdi.triggered && (
          <div className="rounded-lg bg-triggered/10 border border-triggered/30 p-3 mb-4 animate-fade-in-up">
            <p className="text-xs text-triggered font-semibold">
              🚨 CDI Score {cdi.total} — Heavy Rain triggered in {worker.zone}. Auto-claim initiated. Fraud check: Passed.
            </p>
          </div>
        )}

        <div className="flex gap-3 mb-4">
          <Button onClick={simulate} disabled={simulating} variant="outline" className="flex-1 h-11 border-primary/30 text-primary hover:bg-primary/10 active:scale-[0.98] transition-transform gap-1.5">
            <Zap size={16} /> {simulating ? "Simulating..." : "Simulate Disruption"}
          </Button>
          <Button onClick={() => navigate("/payout")} disabled={!cdi.triggered} className="flex-1 h-11 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-transform">
            View Payout
          </Button>
        </div>
      </div>
    </div>
  );
}
