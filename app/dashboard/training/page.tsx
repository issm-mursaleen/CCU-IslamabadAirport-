"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Award,
  Filter,
} from "lucide-react";

const trainingTypes = [
  { code: "AR", name: "Armed Response", validity: "12 months", color: "text-tactical-red" },
  { code: "FA", name: "First Aid", validity: "24 months", color: "text-tactical-green" },
  { code: "FS", name: "Fire Safety", validity: "12 months", color: "text-tactical-amber" },
  { code: "CCTV", name: "CCTV Operation", validity: "24 months", color: "text-tactical-cyan" },
  { code: "AC", name: "Access Control", validity: "12 months", color: "text-[#A78BFA]" },
  { code: "K9", name: "K9 Handling", validity: "12 months", color: "text-tactical-amber" },
  { code: "VIP", name: "VIP Protection", validity: "6 months", color: "text-tactical-red" },
  { code: "BA", name: "Bomb Awareness", validity: "12 months", color: "text-tactical-red" },
];

const trainingRecords = [
  { id: "TR-001", guardId: "G-001", guardName: "Ali Hassan", type: "AR", certNo: "AR-2025-0412", provider: "PSF Academy", completed: "2025-06-15", expiry: "2026-06-15", status: "valid" },
  { id: "TR-002", guardId: "G-001", guardName: "Ali Hassan", type: "FA", certNo: "FA-2025-0413", provider: "Red Crescent", completed: "2025-06-15", expiry: "2027-06-15", status: "valid" },
  { id: "TR-003", guardId: "G-002", guardName: "Bilal Khan", type: "AR", certNo: "AR-2025-0287", provider: "PSF Academy", completed: "2025-03-10", expiry: "2026-03-10", status: "expired" },
  { id: "TR-004", guardId: "G-002", guardName: "Bilal Khan", type: "CCTV", certNo: "CCTV-2025-0101", provider: "TechSec Institute", completed: "2025-08-20", expiry: "2027-08-20", status: "valid" },
  { id: "TR-005", guardId: "G-003", guardName: "Usman Raza", type: "AR", certNo: "AR-2025-0891", provider: "PSF Academy", completed: "2025-05-01", expiry: "2026-05-01", status: "expiring" },
  { id: "TR-006", guardId: "G-003", guardName: "Usman Raza", type: "FA", certNo: "FA-2025-0892", provider: "Red Crescent", completed: "2025-05-01", expiry: "2027-05-01", status: "valid" },
  { id: "TR-007", guardId: "G-003", guardName: "Usman Raza", type: "FS", certNo: "FS-2025-0344", provider: "Civil Defense", completed: "2025-05-01", expiry: "2026-05-01", status: "expiring" },
  { id: "TR-008", guardId: "G-005", guardName: "Imran Malik", type: "AR", certNo: "AR-2025-0634", provider: "PSF Academy", completed: "2025-09-12", expiry: "2026-09-12", status: "valid" },
  { id: "TR-009", guardId: "G-005", guardName: "Imran Malik", type: "K9", certNo: "K9-2025-0077", provider: "K9 Unit Rawalpindi", completed: "2025-09-12", expiry: "2026-09-12", status: "valid" },
  { id: "TR-010", guardId: "G-005", guardName: "Imran Malik", type: "FA", certNo: "FA-2025-0635", provider: "Red Crescent", completed: "2025-09-12", expiry: "2027-09-12", status: "valid" },
  { id: "TR-011", guardId: "G-009", guardName: "Kamran Yousuf", type: "VIP", certNo: "VIP-2025-0099", provider: "Elite Protection Academy", completed: "2025-10-01", expiry: "2026-04-01", status: "expiring" },
  { id: "TR-012", guardId: "G-009", guardName: "Kamran Yousuf", type: "AR", certNo: "AR-2025-0512", provider: "PSF Academy", completed: "2025-08-15", expiry: "2026-08-15", status: "valid" },
];

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  valid: { color: "text-tactical-green", bg: "bg-tactical-green/10", border: "border-tactical-green/30", label: "VALID" },
  expiring: { color: "text-tactical-amber", bg: "bg-tactical-amber/10", border: "border-tactical-amber/30", label: "EXPIRING" },
  expired: { color: "text-tactical-red", bg: "bg-tactical-red/10", border: "border-tactical-red/30", label: "EXPIRED" },
};

export default function TrainingPage() {
  const [mounted, setMounted] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  useEffect(() => setMounted(true), []);

  const filtered = trainingRecords.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const counts = {
    valid: trainingRecords.filter((r) => r.status === "valid").length,
    expiring: trainingRecords.filter((r) => r.status === "expiring").length,
    expired: trainingRecords.filter((r) => r.status === "expired").length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-tactical-amber/10 border border-tactical-amber/30">
          <GraduationCap className="h-5 w-5 text-tactical-amber" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Training Management</h1>
          <p className="text-xs text-muted-foreground font-mono">MOD-03 — Certification Tracking & Eligibility</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Valid Certs", value: counts.valid, color: "text-tactical-green", bg: "bg-tactical-green-dim" },
          { label: "Expiring (45d)", value: counts.expiring, color: "text-tactical-amber", bg: "bg-tactical-amber-dim" },
          { label: "Expired", value: counts.expired, color: "text-tactical-red", bg: "bg-tactical-red-dim" },
        ].map((s, i) => (
          <div key={s.label} className={`glow-border rounded-lg p-4 bg-card noise-texture ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: `${i * 60}ms` }}>
            <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase block">{s.label}</span>
            <p className={`text-2xl font-bold font-mono mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Training Types Grid */}
      <div className={`${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "200ms" }}>
        <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase block mb-2">Training Types</span>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setTypeFilter("all")} className={`font-mono text-[9px] tracking-wider px-2.5 py-1.5 rounded transition-colors ${typeFilter === "all" ? "bg-tactical-amber/15 text-tactical-amber border border-tactical-amber/30" : "text-muted-foreground hover:text-foreground border border-border/50"}`}>ALL</button>
          {trainingTypes.map((t) => (
            <button key={t.code} onClick={() => setTypeFilter(t.code)} className={`font-mono text-[9px] tracking-wider px-2.5 py-1.5 rounded transition-colors ${typeFilter === t.code ? "bg-tactical-amber/15 text-tactical-amber border border-tactical-amber/30" : "text-muted-foreground hover:text-foreground border border-border/50"}`}>
              {t.code}
            </button>
          ))}
        </div>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {["all", "valid", "expiring", "expired"].map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)} className={`font-mono text-[9px] tracking-wider px-2.5 py-1.5 rounded transition-colors uppercase ${statusFilter === f ? "bg-accent text-foreground border border-border" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>{f}</button>
        ))}
      </div>

      {/* Records Table */}
      <div className={`glow-border rounded-lg bg-card noise-texture overflow-hidden ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "300ms" }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/60">
              {["Record", "Guard", "Type", "Certificate", "Provider", "Completed", "Expiry", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] tracking-[0.15em] text-muted-foreground uppercase font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((record) => {
              const sc = statusConfig[record.status];
              const typeInfo = trainingTypes.find((t) => t.code === record.type);
              return (
                <tr key={record.id} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{record.id}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[11px] font-medium block">{record.guardName}</span>
                    <span className="font-mono text-[9px] text-muted-foreground">{record.guardId}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[10px] font-bold ${typeInfo?.color || "text-foreground"}`}>{record.type}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-tactical-cyan">{record.certNo}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{record.provider}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground tabular-nums">{record.completed}</td>
                  <td className={`px-4 py-3 font-mono text-[10px] tabular-nums ${sc.color}`}>{record.expiry}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 font-mono text-[9px] tracking-wider px-2 py-0.5 rounded ${sc.bg} ${sc.color} border ${sc.border}`}>
                      {record.status === "valid" ? <CheckCircle2 className="h-2.5 w-2.5" /> : record.status === "expiring" ? <Clock className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
                      {sc.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="font-mono text-xs text-muted-foreground">No training records match the current filter.</p>
          </div>
        )}
      </div>

      {/* Signal Path */}
      <div className={`glow-border rounded-lg bg-card noise-texture p-4 ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "400ms" }}>
        <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase block mb-3">Signal Path</span>
        <div className="flex items-center gap-1 flex-wrap">
          {["Training Recorded", "Store", "Expiry Tracked", "Eligibility Filter", "Deploy / Block"].map((step, i) => (
            <div key={step} className="flex items-center gap-1">
              <span className="font-mono text-[9px] px-2 py-1 rounded border border-tactical-amber/30 bg-tactical-amber/5 text-tactical-amber">{step}</span>
              {i < 4 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
