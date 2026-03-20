import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldMileLogo } from "@/components/ShieldMileLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ZONES, PLATFORMS, validatePartnerId, saveWorkerData, type Zone, type Platform } from "@/lib/shieldmile";
import { Zap } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", phone: "", partnerId: "", platform: "" as string,
    zone: "" as string, weeklyEarnings: "", upiId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fillDemo = () => {
    setForm({
      name: "Karthik Kumar", phone: "9876543210", partnerId: "ZPT-48291",
      platform: "Zepto", zone: "Velachery", weeklyEarnings: "3200", upiId: "karthik@upi",
    });
    setErrors({});
  };

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!/^\d{10}$/.test(form.phone)) e.phone = "Enter valid 10-digit phone";
    if (!form.platform) e.platform = "Select platform";
    if (!form.zone) e.zone = "Select zone";
    if (!form.weeklyEarnings || Number(form.weeklyEarnings) <= 0) e.weeklyEarnings = "Enter valid earnings";
    if (!form.upiId.trim()) e.upiId = "UPI ID is required";
    if (!form.partnerId.trim()) {
      e.partnerId = "Partner ID is required";
    } else if (form.platform && !validatePartnerId(form.partnerId, form.platform as Platform)) {
      const prefix = form.platform === "Zepto" ? "ZPT-XXXXX" : form.platform === "Blinkit" ? "BLK-XXXXX" : "any";
      e.partnerId = `Invalid format. Expected: ${prefix}`;
    }

    setErrors(e);
    if (Object.keys(e).length > 0) return;

    saveWorkerData({
      name: form.name, phone: form.phone, partnerId: form.partnerId,
      platform: form.platform as Platform, zone: form.zone as Zone,
      weeklyEarnings: Number(form.weeklyEarnings), upiId: form.upiId, ncbStreak: 3,
    });
    navigate("/policy");
  };

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="animate-slide-up mb-8 pt-4">
          <ShieldMileLogo size="lg" />
        </div>

        <div className="card-surface p-6 animate-slide-up stagger-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-card-foreground">Worker Registration</h2>
            <Button variant="outline" size="sm" onClick={fillDemo} className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10">
              <Zap size={14} /> Try Demo
            </Button>
          </div>

          <div className="space-y-4">
            <Field label="Full Name" error={errors.name}>
              <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Enter your full name" className="bg-surface text-surface-foreground border-0" />
            </Field>

            <Field label="Phone Number" error={errors.phone}>
              <Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="10-digit mobile number" maxLength={10} className="bg-surface text-surface-foreground border-0" />
            </Field>

            <Field label="Platform" error={errors.platform}>
              <Select value={form.platform} onValueChange={v => update("platform", v)}>
                <SelectTrigger className="bg-surface text-surface-foreground border-0"><SelectValue placeholder="Select platform" /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Partner ID" error={errors.partnerId}>
              <Input value={form.partnerId} onChange={e => update("partnerId", e.target.value)} placeholder={form.platform === "Zepto" ? "ZPT-XXXXX" : form.platform === "Blinkit" ? "BLK-XXXXX" : "Enter ID"} className="bg-surface text-surface-foreground border-0" />
            </Field>

            <Field label="Zone" error={errors.zone}>
              <Select value={form.zone} onValueChange={v => update("zone", v)}>
                <SelectTrigger className="bg-surface text-surface-foreground border-0"><SelectValue placeholder="Select zone" /></SelectTrigger>
                <SelectContent>
                  {ZONES.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Average Weekly Earnings (₹)" error={errors.weeklyEarnings}>
              <Input type="number" value={form.weeklyEarnings} onChange={e => update("weeklyEarnings", e.target.value)} placeholder="e.g. 3200" className="bg-surface text-surface-foreground border-0" />
            </Field>

            <Field label="UPI ID" error={errors.upiId}>
              <Input value={form.upiId} onChange={e => update("upiId", e.target.value)} placeholder="yourname@upi" className="bg-surface text-surface-foreground border-0" />
            </Field>
          </div>

          <Button onClick={handleSubmit} className="w-full mt-6 h-12 text-base font-semibold bg-primary hover:bg-primary/90 active:scale-[0.98] transition-transform">
            Calculate My Shield Score
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-card-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-triggered">{error}</p>}
    </div>
  );
}
