import { useNavigate } from "react-router-dom";
import { ShieldMileLogo } from "@/components/ShieldMileLogo";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ShieldAlert, FileWarning, Scale } from "lucide-react";

export default function Exclusions() {
  const navigate = useNavigate();

  const standard = [
    { code: "WAR_CIVIL_UNREST", desc: "War or civil unrest as declared by government advisory." },
    { code: "PANDEMIC_LOCKDOWN", desc: "Active pandemic lockdown order in your area." },
    { code: "NUCLEAR_CHEMICAL", desc: "Nuclear or chemical hazard alert in your zone." }
  ];

  const productSpecific = [
    { code: "INTENTIONAL_ACT", desc: "Remaining stationary at home during a weather event (>30 min)." },
    { code: "OUTSIDE_ZONE", desc: "GPS location entirely outside your registered operating zone." },
    { code: "UNREGISTERED_DEVICE", desc: "Logging in from a device not registered at onboarding." },
    { code: "GPS_SPOOFING", desc: "Impossible location jump or mocked location detected." },
    { code: "CONCURRENT_COVERAGE", desc: "Same hour already claimed via another insurer." }
  ];

  const regulatory = [
    "All PII encrypted at rest (DPDP Act compliance).",
    "Worker consent logged for weather, GPS, and order data.",
    "Right to Explanation: Premium breakdowns are public."
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
             <h1 className="text-lg font-bold text-foreground">Smart Contract Exclusions</h1>
             <p className="text-xs text-muted-foreground">Transparent Claim Rules</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-surface p-4 animate-slide-up stagger-2">
             <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                <ShieldAlert size={16} className="text-warning" />
                <h2 className="text-sm font-bold text-card-foreground">Standard Industry Exclusions</h2>
             </div>
             <div className="space-y-3">
               {standard.map(s => (
                 <div key={s.code} className="flex flex-col gap-1">
                   <span className="text-[10px] uppercase font-bold text-warning tracking-wider">{s.code}</span>
                   <span className="text-xs text-muted-foreground">{s.desc}</span>
                 </div>
               ))}
             </div>
          </div>

          <div className="card-surface p-4 animate-slide-up stagger-3 border-triggered/30 bg-triggered/5">
             <div className="flex items-center gap-2 mb-3 pb-2 border-b border-triggered/20">
                <FileWarning size={16} className="text-triggered" />
                <h2 className="text-sm font-bold text-card-foreground">Product-Specific & Fraud Exclusions</h2>
             </div>
             <div className="space-y-3">
               {productSpecific.map(s => (
                 <div key={s.code} className="flex flex-col gap-1">
                   <span className="text-[10px] uppercase font-bold text-triggered tracking-wider">{s.code}</span>
                   <span className="text-xs text-muted-foreground">{s.desc}</span>
                 </div>
               ))}
             </div>
          </div>

          <div className="card-surface p-4 animate-slide-up stagger-4">
             <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                <Scale size={16} className="text-safe" />
                <h2 className="text-sm font-bold text-card-foreground">Regulatory & Rights</h2>
             </div>
             <ul className="space-y-2 list-disc list-inside text-xs text-muted-foreground">
                {regulatory.map((r, i) => <li key={i}>{r}</li>)}
             </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
