import { useNavigate } from "react-router-dom";
import { ShieldMileLogo } from "@/components/ShieldMileLogo";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CloudRain, Wind, Thermometer, CloudFog, ShieldAlert } from "lucide-react";
import { loadWorkerData } from "@/lib/shieldmile";
import { useState, useEffect } from "react";

export default function History() {
  const navigate = useNavigate();
  const [worker, setWorker] = useState(loadWorkerData());

  useEffect(() => {
    const w = loadWorkerData();
    if (!w) { navigate("/"); return; }
    setWorker(w);
  }, [navigate]);

  if (!worker) return null;

  // Mocking past events mirroring 1.5 logic mock
  const history = [
    {
      id: "EVT001", date: "3 Days Ago", name: "Heavy Rainfall",
      icon: CloudRain, cdiFinal: 80.1, payout: 320,
      breakdown: "Rainfall: 40.0 | Wind: 20.0 | Order Drop: 10.2",
      status: "Minted"
    },
    {
      id: "EVT002", date: "10 Days Ago", name: "Flooding (Velachery)",
      icon: CloudRain, cdiFinal: 92.5, payout: 400,
      breakdown: "Flood Index: 35.0 | Road Block: 27.5",
      status: "Minted"
    },
    {
      id: "EVT003", date: "15 Days Ago", name: "GPS Spoof Rejected",
      icon: ShieldAlert, cdiFinal: 10.0, payout: 0,
      breakdown: "Impossible Velocity. Claim Denied.",
      status: "Rejected"
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
             <h1 className="text-lg font-bold text-foreground">Payout History</h1>
             <p className="text-xs text-muted-foreground">Your Past Smart Contract Claims</p>
          </div>
        </div>

        <div className="space-y-4">
          {history.map((h, i) => (
            <div key={h.id} className="card-surface p-4 animate-slide-up" style={{ animationDelay: `${(i+2)*50}ms`}}>
               <div className="flex justify-between items-start mb-3 pb-3 border-b border-border/50">
                  <div>
                    <h2 className="text-sm font-bold text-card-foreground flex items-center gap-2">
                       <h.icon size={16} className={h.status === "Minted" ? "text-primary" : "text-triggered"} /> 
                       {h.name}
                    </h2>
                    <span className="text-xs text-muted-foreground">{h.date} · {h.id}</span>
                  </div>
                  <div className="text-right">
                    <span className={`block text-lg font-extrabold ${h.status === "Minted" ? "text-safe" : "text-triggered"}`}>
                       ₹{h.payout.toFixed(2)}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${h.status === "Minted" ? "bg-safe/20 text-safe" : "bg-triggered/20 text-triggered"}`}>
                       {h.status}
                    </span>
                  </div>
               </div>
               
               <div className="text-xs space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                     <span>Final CDI Score:</span>
                     <span className={h.status === "Minted" ? "text-safe font-bold" : "text-triggered font-bold"}>{h.cdiFinal.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                     <span>Breakdown:</span>
                     <span className="text-card-foreground text-right max-w-[60%]">{h.breakdown}</span>
                  </div>
               </div>
               
               <Button onClick={() => navigate("/audit")} variant="ghost" className="w-full mt-3 h-8 text-xs text-primary border border-primary/20 hover:bg-primary/10">
                  View Interval Timeline
               </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
