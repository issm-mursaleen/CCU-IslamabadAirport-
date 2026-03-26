"use client";

import { useEffect, useState } from "react";
import {
  Users,
  MapPin,
  Clock,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Shield,
  Navigation,
} from "lucide-react";

const activeDeployments = [
  { id: "DEP-001", guard: "Ali Hassan", guardId: "G-001", post: "Main Gate", site: "Site Alpha (Blue Area)", shift: "06:00 — 14:00", status: "active", compliance: "verified", training: "complete" },
  { id: "DEP-002", guard: "Imran Malik", guardId: "G-005", post: "Perimeter Patrol", site: "Site Alpha (Blue Area)", shift: "06:00 — 14:00", status: "active", compliance: "verified", training: "complete" },
  { id: "DEP-003", guard: "Tariq Mehmood", guardId: "G-006", post: "Reception Desk", site: "Site Bravo (F-6 Markaz)", shift: "08:00 — 16:00", status: "active", compliance: "verified", training: "complete" },
  { id: "DEP-004", guard: "Naveed Shah", guardId: "G-007", post: "CCTV Room", site: "Site Bravo (F-6 Markaz)", shift: "08:00 — 16:00", status: "active", compliance: "verified", training: "complete" },
  { id: "DEP-005", guard: "Kamran Yousuf", guardId: "G-009", post: "VIP Gate", site: "Site Delta (I-8 Industrial)", shift: "06:00 — 18:00", status: "active", compliance: "verified", training: "complete" },
  { id: "DEP-006", guard: "Bilal Khan", guardId: "G-002", post: "Back Gate", site: "Site Charlie (DHA Phase 2)", shift: "14:00 — 22:00", status: "warning", compliance: "expiring_soon", training: "complete" },
];

const reservePool = [
  { id: "G-010", name: "Zafar Iqbal", capabilities: ["AR", "FS"], distance: "2.3 km", available: true, compliance: "expiring_soon" },
  { id: "G-011", name: "Hassan Raza", capabilities: ["AR", "FA", "AC"], distance: "3.1 km", available: true, compliance: "verified" },
  { id: "G-012", name: "Adnan Sheikh", capabilities: ["AR", "FA", "CCTV"], distance: "4.7 km", available: true, compliance: "verified" },
  { id: "G-013", name: "Waqar Ahmad", capabilities: ["AR", "AC"], distance: "5.2 km", available: true, compliance: "verified" },
  { id: "G-014", name: "Sajid Hussain", capabilities: ["AR", "FA", "FS"], distance: "6.8 km", available: false, compliance: "verified" },
];

const handoverLogs = [
  { time: "13:55", post: "Main Gate", outgoing: "Faraz Ali", incoming: "Ali Hassan", site: "Site Alpha", reason: "Shift change", operator: "OP-01" },
  { time: "13:50", post: "Perimeter Patrol", outgoing: "Junaid Khan", incoming: "Imran Malik", site: "Site Alpha", reason: "Shift change", operator: "OP-01" },
  { time: "07:58", post: "Reception Desk", outgoing: "Shahid Awan", incoming: "Tariq Mehmood", site: "Site Bravo", reason: "Shift change", operator: "OP-02" },
];

export default function DeploymentPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedDep, setSelectedDep] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-[#A78BFA]/10 border border-[#A78BFA]/30">
          <Users className="h-5 w-5 text-[#A78BFA]" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Deployment & Reserve Pool</h1>
          <p className="text-xs text-muted-foreground font-mono">MOD-04 — Real-time Deployment Board & Jump Pool</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Deployments", value: activeDeployments.length, color: "text-[#A78BFA]" },
          { label: "Reserve Pool", value: reservePool.filter((r) => r.available).length, color: "text-tactical-green" },
          { label: "Coverage Gaps", value: "0", color: "text-tactical-green" },
          { label: "Handovers Today", value: handoverLogs.length, color: "text-tactical-cyan" },
        ].map((s, i) => (
          <div key={s.label} className={`glow-border rounded-lg p-4 bg-card noise-texture ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: `${i * 60}ms` }}>
            <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase block">{s.label}</span>
            <p className={`text-2xl font-bold font-mono mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        {/* Active Deployments */}
        <div className={`glow-border rounded-lg bg-card noise-texture overflow-hidden ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "250ms" }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
            <Shield className="h-3.5 w-3.5 text-[#A78BFA]" />
            <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">Active Deployments</span>
          </div>
          <div className="divide-y divide-border/30">
            {activeDeployments.map((dep) => (
              <div
                key={dep.id}
                className={`px-4 py-3 cursor-pointer transition-all ${selectedDep === dep.id ? "bg-[#A78BFA]/5 border-l-2 border-l-[#A78BFA]" : "hover:bg-accent/20 border-l-2 border-l-transparent"}`}
                onClick={() => setSelectedDep(dep.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold">{dep.guard}</span>
                    <span className="font-mono text-[9px] text-muted-foreground">{dep.guardId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {dep.status === "warning" && <AlertTriangle className="h-3 w-3 text-tactical-amber" />}
                    <div className={`h-1.5 w-1.5 rounded-full ${dep.status === "active" ? "bg-tactical-green" : "bg-tactical-amber"}`} />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{dep.post}</span>
                  <span className="text-muted-foreground/40">|</span>
                  <span>{dep.site}</span>
                  <span className="text-muted-foreground/40">|</span>
                  <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{dep.shift}</span>
                </div>
                {dep.compliance !== "verified" && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="h-2.5 w-2.5 text-tactical-amber" />
                    <span className="font-mono text-[9px] text-tactical-amber">Licence expiring soon — consider replacement</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-3">
          {/* Reserve Pool */}
          <div className={`glow-border rounded-lg bg-card noise-texture overflow-hidden ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "350ms" }}>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
              <Navigation className="h-3.5 w-3.5 text-tactical-green" />
              <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">Reserve Pool (by distance)</span>
            </div>
            <div className="divide-y divide-border/30">
              {reservePool.map((guard) => (
                <div key={guard.id} className={`px-4 py-2.5 ${!guard.available ? "opacity-40" : "hover:bg-accent/20"} transition-colors`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[11px] font-medium">{guard.name}</span>
                    <span className="font-mono text-[10px] text-tactical-cyan">{guard.distance}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {guard.capabilities.map((c) => (
                      <span key={c} className="font-mono text-[8px] px-1 py-0.5 rounded bg-accent/50 text-muted-foreground">{c}</span>
                    ))}
                    <span className={`ml-auto font-mono text-[8px] ${guard.available ? "text-tactical-green" : "text-muted-foreground"}`}>
                      {guard.available ? "AVAILABLE" : "DEPLOYED"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Handover Logs */}
          <div className={`glow-border rounded-lg bg-card noise-texture overflow-hidden ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "450ms" }}>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
              <ArrowRightLeft className="h-3.5 w-3.5 text-tactical-amber" />
              <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">Recent Handovers</span>
            </div>
            <div className="divide-y divide-border/30">
              {handoverLogs.map((log, i) => (
                <div key={i} className="px-4 py-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{log.time}</span>
                    <span className="font-mono text-[10px] font-medium">{log.post}</span>
                    <span className="font-mono text-[9px] text-muted-foreground">@ {log.site}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[9px]">
                    <span className="text-tactical-red">{log.outgoing}</span>
                    <ArrowRightLeft className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-tactical-green">{log.incoming}</span>
                    <span className="text-muted-foreground ml-auto">{log.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signal Path */}
          <div className={`glow-border rounded-lg bg-card noise-texture p-4 ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "550ms" }}>
            <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase block mb-3">Signal Path</span>
            <div className="flex items-center gap-1 flex-wrap">
              {["View Deployed", "Select Reserve", "Validate", "Replace", "Update"].map((step, i) => (
                <div key={step} className="flex items-center gap-1">
                  <span className="font-mono text-[9px] px-2 py-1 rounded border border-[#A78BFA]/30 bg-[#A78BFA]/5 text-[#A78BFA]">{step}</span>
                  {i < 4 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
