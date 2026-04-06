import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShieldMileLogo } from "@/components/ShieldMileLogo";
import { CDIGauge } from "@/components/CDIGauge";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/api";
import { loadWorkerData, calculateCDI, runFraudCheck, type CDIInputs, type CDIResult } from "@/lib/shieldmile";
import { CloudRain, Wind, Thermometer, CloudFog, ShieldAlert, CheckCircle, AlertTriangle, MapPin, Smartphone, Activity, FileText, Zap, User, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useGeolocation } from "@/hooks/useGeolocation";

const SAFE_INPUTS: CDIInputs = { rainfall: 12, orderSurge: 80, slaBreach: 20, riderSupplyDrop: 15 };

export default function Dashboard() {
  const navigate = useNavigate();
  const [worker, setWorker] = useState(loadWorkerData());
  const [inputs, setInputs] = useState<CDIInputs>(SAFE_INPUTS);
  const [cdi, setCdi] = useState<CDIResult>(calculateCDI(SAFE_INPUTS));
  const [simulating, setSimulating] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const [payoutState, setPayoutState] = useState<"IDLE" | "MONITORING" | "EXCLUSION_CHECK" | "THRESHOLD_BREACH" | "CONSENSUS_CHECK" | "STOP_LOSS_CHECK" | "RELEASED" | "REJECTED">("IDLE");

  const [forceDemo, setForceDemo] = useState(false);
  const [spoofGps, setSpoofGps] = useState(false);
  const [spoofWeather, setSpoofWeather] = useState(false);
  const [triggerPandemic, setTriggerPandemic] = useState(false);
  const { location, requestLocation } = useGeolocation();

  useEffect(() => {
    const w = loadWorkerData();
    if (!w) { navigate("/"); return; }
    setWorker(w);
  }, [navigate]);

  // Backend sync loop
  useEffect(() => {
    if (!worker?.id) return;
    const fetchDashboard = async () => {
      try {
        const res = await fetch(apiUrl(`/dashboard/${worker.id}`));
        if (!res.ok) return;
        const data = await res.json();
        
        const wState = data.state || {};
        const weather = data.current_weather || {};
        
        // Update UI state with real Python data
        setPayoutState(wState.state || "IDLE");
        setCdi(prev => ({
          ...prev,
          total: wState.final_cdi || wState.raw_cdi || 0,
          triggered: (wState.state && wState.state !== "MONITORING" && wState.state !== "IDLE")
        }));
        
        setInputs(prev => ({
          ...prev,
          rainfall: weather.rainfall || 0
        }));
        
        if (wState.state === "REJECTED" || wState.state === "RELEASED") {
           setShowAlert(true);
        }
        
      } catch (err) {
        console.error("FastAPI Sync Error", err);
      }
    };
    fetchDashboard();
    const inv = setInterval(fetchDashboard, 3000);
    return () => clearInterval(inv);
  }, [worker?.id]);

  const simulate = async () => {
    setSimulating(true);
    setShowAlert(false);
    
    // Inject logic to Python Oracle
    toast.info("Sending Disruption Signal to Cloud Oracle...");
    try {
      await fetch(apiUrl("/simulate/start_rain"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worker_id: worker?.id, intensity: 55.0 })
      });
      // Force a tick immediately to evaluate
      await fetch(apiUrl("/simulate/tick"), { method: "POST" });
    } catch (e) {
      toast.error("Failed to reach Python backend.");
    }
    
    setTimeout(() => {
       setSimulating(false);
    }, 2000);
  };

  if (!worker) return null;
  const fraud = runFraudCheck(0, spoofGps, spoofWeather, triggerPandemic);
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
      <div className="page-content relative">

        {/* Profile Dropdown Overlay — rendered at root level so it floats above everything */}
        {showProfile && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
            <div className="absolute right-0 top-[72px] w-56 bg-[#0B1120] border border-[#233145] rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
              <div className="p-3 border-b border-[#233145] bg-[#1a2536]/30">
                 <p className="text-sm font-bold text-foreground truncate">{worker.name}</p>
                 <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">{worker.partnerId} · {worker.zone}</p>
              </div>
              <div className="p-1.5">
                <button 
                  onClick={() => {
                     localStorage.removeItem("jwt_token");
                     localStorage.removeItem("logged_in_user");
                     sessionStorage.removeItem("shieldmile_worker");
                     navigate("/");
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-triggered hover:bg-triggered/10 transition-colors text-left"
                >
                  <span>Secure Logout</span>
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          </>
        )}

        <div className="animate-slide-up mb-4 pt-4"><ShieldMileLogo size="sm" /></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 animate-slide-up stagger-1">
           <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">Live Shield Monitor</h1>
              <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">Oracle Sync</span>
           </div>
           <div className="flex flex-row items-center gap-4">
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
               <span className="text-xs font-medium text-safe">Active</span>
             </div>
             
             {/* Profile Dropdown Trigger */}
             <Button variant="ghost" size="icon" onClick={() => setShowProfile(!showProfile)} className="w-8 h-8 rounded-full bg-[#1a2536] border border-[#233145] hover:bg-[#233145] transition-colors z-20">
               <User size={15} className="text-muted-foreground" />
             </Button>
           </div>
        </div>
        <div className="flex items-center justify-between mb-4 animate-slide-up stagger-1">
          <p className="text-sm text-muted-foreground">{worker.name} · {worker.zone}</p>
          <Button variant="outline" size="sm" onClick={requestLocation} disabled={location.loaded} className="h-7 text-[10px] gap-1.5 border-primary/20 text-primary hover:bg-primary/10 transition-colors">
            <MapPin size={12} /> {location.loaded ? location.locationName || "Location Synced" : "Use Live Location"}
          </Button>
        </div>

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

          <div className="space-y-1.5 mb-4 p-3 bg-background border border-border/50 rounded-lg">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Disaster Simulation Deck</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="forceDemo" checked={forceDemo} onChange={e => setForceDemo(e.target.checked)} className="rounded text-warning w-3.5 h-3.5 ml-1" />
              <label htmlFor="forceDemo" className="text-[10px] font-semibold text-warning">Force Disaster Payout</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="spoofGps" checked={spoofGps} onChange={e => setSpoofGps(e.target.checked)} className="rounded text-indigo-400 w-3.5 h-3.5 ml-1" />
              <label htmlFor="spoofGps" className="text-[10px] font-semibold text-indigo-400">Trigger GPS Spoof Rejection</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="spoofWeather" checked={spoofWeather} onChange={e => setSpoofWeather(e.target.checked)} className="rounded text-indigo-400 w-3.5 h-3.5 ml-1" />
              <label htmlFor="spoofWeather" className="text-[10px] font-semibold text-indigo-400">Trigger Historical Weather Mismatch Rejection</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="triggerPandemic" checked={triggerPandemic} onChange={e => setTriggerPandemic(e.target.checked)} className="rounded text-triggered w-3.5 h-3.5 ml-1" />
              <label htmlFor="triggerPandemic" className="text-[10px] font-semibold text-triggered">Trigger Pandemic Lockdown (Exclusion)</label>
            </div>
          </div>

        {/* Fraud Check */}
        <div className={`card-surface p-4 mb-4 animate-slide-up stagger-5 ${!fraud.overallClean ? 'border-triggered' : ''}`}>
          <p className="text-xs font-semibold text-card-foreground mb-3 flex items-center justify-between">
            Fraud Verification System
            {!fraud.overallClean && <span className="text-[10px] text-triggered bg-triggered/10 px-2 py-0.5 rounded">FAILED</span>}
          </p>
          <div className="space-y-2 text-xs">
            {[
              { icon: MapPin, label: `Historical Velocity Check: Continuous`, ok: fraud.gpsValid },
              { icon: CloudRain, label: `Open-Meteo Historical Archive Match`, ok: fraud.weatherHistoryMatchOk },
              { icon: Activity, label: "Platform Activity: Clean", ok: fraud.activityClean },
              { icon: FileText, label: "Frequency: Under weekly limit", ok: fraud.claimHistoryOk },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2 text-muted-foreground">
                <f.icon size={14} className={!f.ok ? "text-triggered" : "text-card-foreground"} />
                <span className={`flex-1 ${!f.ok && "text-triggered font-medium"}`}>{f.label}</span>
                {f.ok ? <CheckCircle size={14} className="text-safe" /> : <AlertTriangle size={14} className="text-triggered" />}
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2 mt-2 border-t border-border text-card-foreground font-medium">
              <span>Overall Integrity Integrity: </span>
              {fraud.overallClean ? (
                 <span className="text-safe flex items-center gap-1 ml-auto">Clean <CheckCircle size={14} /></span>
              ) : (
                 <span className="text-triggered flex items-center gap-1 ml-auto">Malicious Activity <AlertTriangle size={14} /></span>
              )}
            </div>
          </div>
        </div>

        {/* NCB Warning */}
        {cdi.triggered && fraud.overallClean && (
          <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 mb-4 animate-fade-in-up">
            <div className="flex gap-2">
              <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-warning">
                ⚠️ This disruption will trigger a claim and reset your {worker.ncbStreak}-week no-claim streak. Discount resets to 0% next week.
              </p>
            </div>
          </div>
        )}

        {/* Proactive Nudge - Suppressed during simulation to avoid flicker */}
        {isMidRange && !cdi.triggered && !simulating && (
          <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 mb-4 animate-fade-in-up">
            <p className="text-xs text-primary">
              CDI at {cdi.total} — disruption possible but not triggered yet. Your {worker.ncbStreak}-week streak is safe today! 🎯
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Tip: Consider shifting to indoor tasks if rain worsens.</p>
          </div>
        )}

        {/* Alert Banner */}
        {showAlert && cdi.triggered && fraud.overallClean && (
          <div className="rounded-lg bg-triggered/10 border border-triggered/30 p-3 mb-4 animate-fade-in-up">
            <p className="text-xs text-triggered font-semibold">
              🚨 CDI Score {cdi.total} — Heavy Rain triggered in {worker.zone}. Auto-claim initiated. Fraud check: Passed.
            </p>
          </div>
        )}

        {/* State Machine UI */}
        {payoutState !== "IDLE" && (
           <div className="card-surface p-4 mb-4 animate-fade-in-up border border-[#233145]">
             <p className="text-xs font-semibold text-card-foreground mb-3 uppercase tracking-widest text-center">Oracle State Machine</p>
             <div className="flex flex-col gap-2">
                {[
                  { state: "MONITORING", label: "Monitoring Feeds" },
                  { state: "EXCLUSION_CHECK", label: "Evaluating Exclusions & Fraud" },
                  { state: "THRESHOLD_BREACH", label: "CDI Breach Confirmed" },
                  { state: "CONSENSUS_CHECK", label: "Verifying Zone Consensus" },
                  { state: "STOP_LOSS_CHECK", label: "Checking City Stop-Loss Caps" },
                  { state: "RELEASED", label: "Claim Minted & Disbursed" }
                ].map((s, idx) => {
                   const orderList = ["MONITORING", "EXCLUSION_CHECK", "THRESHOLD_BREACH", "CONSENSUS_CHECK", "STOP_LOSS_CHECK", "RELEASED", "REJECTED"];
                   const currentIndex = orderList.indexOf(payoutState);
                   const thisIndex = orderList.indexOf(s.state);
                   
                   let statusClass = "text-muted-foreground opacity-50";
                   let icon = <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;
                   
                   if (payoutState === "REJECTED" && thisIndex >= orderList.indexOf("THRESHOLD_BREACH")) {
                      return null; // Don't show further states if rejected
                   }
                   if (payoutState === "REJECTED" && s.state === "EXCLUSION_CHECK") {
                      statusClass = "text-triggered font-bold bg-triggered/10 px-2 py-1 rounded";
                      icon = <AlertTriangle size={16} className="text-triggered animate-pulse" />;
                   } else if (currentIndex > thisIndex) {
                      statusClass = "text-safe font-medium";
                      icon = <CheckCircle size={16} className="text-safe" />;
                   } else if (currentIndex === thisIndex) {
                      statusClass = "text-primary font-bold animate-pulse";
                      icon = <Activity size={16} className="text-primary" />;
                   }
                   
                   return (
                     <div key={s.state} className="flex items-center gap-3 text-xs mb-1">
                        <div className="w-5 flex justify-center">{icon}</div>
                        <span className={statusClass}>{s.label}</span>
                     </div>
                   );
                })}
             </div>
           </div>
        )}

        <div className="flex gap-3 mb-4">
          <Button onClick={simulate} disabled={simulating} variant="outline" className="flex-1 h-11 border-primary/30 text-primary hover:bg-primary/10 active:scale-[0.98] transition-transform gap-1.5">
            <Zap size={16} /> {simulating ? "Simulating..." : "Simulate Disruption"}
          </Button>
          <Button onClick={() => navigate("/payout")} disabled={!cdi.triggered || !fraud.overallClean} className="flex-1 h-11 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-transform">
            View Payout
          </Button>
        </div>
      </div>
    </div>
  );
}
