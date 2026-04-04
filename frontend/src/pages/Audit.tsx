import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShieldMileLogo } from "@/components/ShieldMileLogo";
import { Button } from "@/components/ui/button";
import { loadWorkerData } from "@/lib/shieldmile";
import { History, ShieldAlert, CheckCircle, Activity, ChevronLeft } from "lucide-react";

export default function Audit() {
  const navigate = useNavigate();
  const [worker, setWorker] = useState(loadWorkerData());

  useEffect(() => {
    const w = loadWorkerData();
    if (!w) { navigate("/"); return; }
    setWorker(w);
  }, [navigate]);

  if (!worker) return null;

  // Mock interval data based on 1.5 backend audit trail
  const intervals = [
    {
      time: "15:45", state: "RELEASED", rawCdi: 76.5, finalCdi: 76.5, 
      peerInfo: "18 other riders in your zone confirmed this disruption (90% trust)",
      exclusionLog: "Checked war: false, pandemic: false, GPS spoofing: false",
      payoutIncrement: 320.0
    },
    {
      time: "15:30", state: "STOP_LOSS_CHECK", rawCdi: 76.5, finalCdi: 76.5, 
      peerInfo: "18 other riders in your zone confirmed this disruption (90% trust)",
      exclusionLog: "Checked war: false, pandemic: false, GPS spoofing: false",
      payoutIncrement: 0
    },
    {
      time: "15:15", state: "CONSENSUS_CHECK", rawCdi: 76.5, finalCdi: 76.5, 
      peerInfo: "Waiting for zone consensus...",
      exclusionLog: "Checked war: false, pandemic: false, GPS spoofing: false",
      payoutIncrement: 0
    },
    {
      time: "15:00", state: "THRESHOLD_BREACH", rawCdi: 68.2, finalCdi: 68.2, 
      peerInfo: "Pending checks...",
      exclusionLog: "Checked war: false, pandemic: false, GPS spoofing: false",
      payoutIncrement: 0
    },
    {
      time: "14:45", state: "MONITORING", rawCdi: 42.1, finalCdi: 42.1, 
      peerInfo: "-",
      exclusionLog: "All safe",
      payoutIncrement: 0
    }
  ];

  return (
    <div className="page-container">
      <div className="page-content min-h-screen pb-12">
        <div className="animate-slide-up mb-4 pt-4"><ShieldMileLogo size="sm" /></div>

        <div className="flex items-center gap-3 mb-6 animate-slide-up stagger-1">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-muted-foreground p-0 hover:bg-transparent hover:text-foreground">
            <ChevronLeft size={20} />
          </Button>
          <div>
             <h1 className="text-lg font-bold text-foreground">Claim Audit Trail</h1>
             <p className="text-xs text-muted-foreground">Immutable Timeline Logs</p>
          </div>
        </div>

        <div className="space-y-4">
          {intervals.map((iv, idx) => {
            const stateClass = iv.state === "RELEASED" ? "text-safe" : iv.state === "REJECTED" ? "text-triggered" : iv.state === "FLAGGED" ? "text-warning" : "text-primary";
            const bgClass = iv.state === "RELEASED" ? "bg-safe/10 border-safe/30" : iv.state === "REJECTED" ? "bg-triggered/10 border-triggered/30" : "bg-surface/50 border-border/50";
            
            return (
              <div key={idx} className={`card-surface p-4 rounded-xl border animate-slide-up stagger-${Math.min(idx + 2, 6)} ${bgClass} relative overflow-hidden`}>
                {idx !== intervals.length - 1 && (
                   <div className="absolute left-6 top-12 bottom-[-24px] w-0.5 bg-border/50"></div>
                )}
                
                <div className="flex justify-between items-start mb-3 relative z-10">
                   <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${iv.state === "RELEASED" ? "bg-safe shadow-[0_0_8px_rgba(16,185,129,0.5)]" : iv.state === "REJECTED" ? "bg-triggered" : "bg-primary"}`} />
                      <strong className="text-sm text-card-foreground">Int. {intervals.length - idx} ({iv.time})</strong>
                   </div>
                   <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${stateClass} bg-background/50`}>{iv.state}</span>
                </div>
                
                <div className="ml-5 space-y-2 text-xs relative z-10">
                  <div className="flex justify-between text-muted-foreground">
                     <span>CDI Engine:</span>
                     <span className="text-card-foreground font-medium">{iv.rawCdi.toFixed(1)} → {iv.finalCdi.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                     <span>Peer Consensus:</span>
                     <span className="text-warning font-medium text-right max-w-[60%]">{iv.peerInfo}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                     <span>Exclusion Engine:</span>
                     <span className="text-safe font-medium test-right max-w-[60%]">{iv.exclusionLog}</span>
                  </div>
                  {iv.payoutIncrement > 0 && (
                     <div className="flex justify-between text-card-foreground font-bold pt-2 border-t border-border/30">
                        <span>Payout Minted:</span>
                        <span className="text-safe">+₹{iv.payoutIncrement.toFixed(2)}</span>
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
