"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  FileText,
  ChevronRight,
} from "lucide-react";

const guards = [
  { id: "G-001", name: "Ali Hassan", cnic: "3520212345678", licence: "SEC-ISB-2024-0412", authority: "Punjab Security", expiry: "2026-04-15", status: "verified", certifications: ["Armed Response", "First Aid"] },
  { id: "G-002", name: "Bilal Khan", cnic: "3520298765432", licence: "SEC-ISB-2024-0287", authority: "Punjab Security", expiry: "2026-04-07", status: "expiring_soon", certifications: ["Armed Response", "CCTV"] },
  { id: "G-003", name: "Usman Raza", cnic: "3520245678901", licence: "SEC-ISB-2023-0891", authority: "Punjab Security", expiry: "2026-03-28", status: "expiring_soon", certifications: ["Armed Response", "First Aid", "Fire Safety"] },
  { id: "G-004", name: "Farhan Ahmed", cnic: "3520267890123", licence: "SEC-ISB-2023-0156", authority: "Punjab Security", expiry: "2025-12-01", status: "expired", certifications: ["Armed Response"] },
  { id: "G-005", name: "Imran Malik", cnic: "3520223456789", licence: "SEC-ISB-2024-0634", authority: "Punjab Security", expiry: "2026-09-20", status: "verified", certifications: ["Armed Response", "K9 Handling", "First Aid"] },
  { id: "G-006", name: "Tariq Mehmood", cnic: "3520234567890", licence: "SEC-ISB-2024-0445", authority: "Punjab Security", expiry: "2026-07-12", status: "verified", certifications: ["Armed Response", "Access Control"] },
  { id: "G-007", name: "Naveed Shah", cnic: "3520256789012", licence: "SEC-ISB-2024-0778", authority: "Punjab Security", expiry: "2026-08-30", status: "verified", certifications: ["CCTV", "Access Control"] },
  { id: "G-008", name: "Rizwan Abbas", cnic: "3520278901234", licence: "SEC-ISB-2023-0923", authority: "Punjab Security", expiry: "2026-01-15", status: "expired", certifications: ["Armed Response", "First Aid"] },
  { id: "G-009", name: "Kamran Yousuf", cnic: "3520201234567", licence: "SEC-ISB-2024-0512", authority: "Punjab Security", expiry: "2026-06-05", status: "verified", certifications: ["Armed Response", "VIP Protection"] },
  { id: "G-010", name: "Zafar Iqbal", cnic: "3520289012345", licence: "SEC-ISB-2024-0199", authority: "Punjab Security", expiry: "2026-04-02", status: "expiring_soon", certifications: ["Armed Response", "Fire Safety"] },
];

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: typeof CheckCircle2; label: string }> = {
  verified: { color: "text-tactical-green", bg: "bg-tactical-green/10", border: "border-tactical-green/30", icon: CheckCircle2, label: "VERIFIED" },
  expiring_soon: { color: "text-tactical-amber", bg: "bg-tactical-amber/10", border: "border-tactical-amber/30", icon: Clock, label: "EXPIRING" },
  expired: { color: "text-tactical-red", bg: "bg-tactical-red/10", border: "border-tactical-red/30", icon: XCircle, label: "EXPIRED" },
};

export default function CompliancePage() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  useEffect(() => setMounted(true), []);

  const filtered = guards.filter((g) => {
    if (filter !== "all" && g.status !== filter) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !g.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    total: guards.length,
    verified: guards.filter((g) => g.status === "verified").length,
    expiring: guards.filter((g) => g.status === "expiring_soon").length,
    expired: guards.filter((g) => g.status === "expired").length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-tactical-cyan/10 border border-tactical-cyan/30">
            <ShieldCheck className="h-5 w-5 text-tactical-cyan" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Guard Compliance</h1>
            <p className="text-xs text-muted-foreground font-mono">MOD-02 — Licence & Certification Monitoring</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-tactical-cyan/10 border border-tactical-cyan/30 text-tactical-cyan font-mono text-[10px] tracking-wide hover:bg-tactical-cyan/20 transition-colors">
          <Upload className="h-3.5 w-3.5" />
          BULK UPLOAD
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Guards", value: counts.total, color: "text-foreground", bg: "bg-muted/50" },
          { label: "Verified", value: counts.verified, color: "text-tactical-green", bg: "bg-tactical-green-dim" },
          { label: "Expiring Soon", value: counts.expiring, color: "text-tactical-amber", bg: "bg-tactical-amber-dim" },
          { label: "Expired", value: counts.expired, color: "text-tactical-red", bg: "bg-tactical-red-dim" },
        ].map((s, i) => (
          <div
            key={s.label}
            className={`glow-border rounded-lg p-4 bg-card noise-texture cursor-pointer transition-all hover:translate-y-[-1px] ${mounted ? "fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: `${i * 60}ms` }}
            onClick={() => setFilter(i === 0 ? "all" : i === 1 ? "verified" : i === 2 ? "expiring_soon" : "expired")}
          >
            <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase block">{s.label}</span>
            <p className={`text-2xl font-bold font-mono mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className={`flex items-center gap-3 ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "250ms" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md bg-card border border-border text-xs font-mono placeholder:text-muted-foreground/50 focus:border-tactical-cyan/50 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-1">
          {["all", "verified", "expiring_soon", "expired"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-mono text-[9px] tracking-wider px-2.5 py-1.5 rounded transition-colors uppercase ${
                filter === f
                  ? "bg-tactical-cyan/15 text-tactical-cyan border border-tactical-cyan/30"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Guard Table */}
      <div className={`glow-border rounded-lg bg-card noise-texture overflow-hidden ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "350ms" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60">
                {["ID", "Name", "CNIC", "Licence", "Authority", "Expiry", "Status", "Certifications"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] tracking-[0.15em] text-muted-foreground uppercase font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((guard) => {
                const sc = statusConfig[guard.status];
                const StatusIcon = sc.icon;
                return (
                  <tr key={guard.id} className="border-b border-border/20 hover:bg-accent/20 transition-colors group">
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{guard.id}</td>
                    <td className="px-4 py-3 font-mono text-[11px] font-medium">{guard.name}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground tabular-nums">{guard.cnic}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-tactical-cyan">{guard.licence}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{guard.authority}</td>
                    <td className={`px-4 py-3 font-mono text-[10px] tabular-nums ${guard.status === "expired" ? "text-tactical-red" : guard.status === "expiring_soon" ? "text-tactical-amber" : "text-muted-foreground"}`}>{guard.expiry}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 font-mono text-[9px] tracking-wider px-2 py-0.5 rounded ${sc.bg} ${sc.color} border ${sc.border}`}>
                        <StatusIcon className="h-2.5 w-2.5" />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {guard.certifications.map((c) => (
                          <span key={c} className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-accent/50 text-muted-foreground">{c}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="font-mono text-xs text-muted-foreground">No guards match the current filter.</p>
          </div>
        )}
      </div>

      {/* Signal Path */}
      <div className={`glow-border rounded-lg bg-card noise-texture p-4 ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "450ms" }}>
        <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase block mb-3">Signal Path</span>
        <div className="flex items-center gap-1 flex-wrap">
          {["Admin Uploads", "Validate", "Store", "Expiry Check", "Allow / Block"].map((step, i) => (
            <div key={step} className="flex items-center gap-1">
              <span className="font-mono text-[9px] px-2 py-1 rounded border border-tactical-cyan/30 bg-tactical-cyan/5 text-tactical-cyan">{step}</span>
              {i < 4 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
