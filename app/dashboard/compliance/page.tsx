"use client";

import { useEffect, useState, useRef } from "react";
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
  X,
  User,
  Fingerprint,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const initialGuards = [
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
  const [guards, setGuards] = useState(initialGuards);
  const [selectedGuard, setSelectedGuard] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => setMounted(true), []);

  const handleRenewAuth = (guardId: string) => {
    setGuards(guards.map(g => {
      if (g.id === guardId) {
        return {
          ...g,
          status: "verified",
          expiry: "2027-04-15",
        };
      }
      return g;
    }));
    // immediately reflect changes in the selected guard panel
    setSelectedGuard((prev: any) => ({
      ...prev,
      status: "verified",
      expiry: "2027-04-15",
    }));
  };

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
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-tactical-cyan hover:bg-tactical-cyan/90 text-black font-mono text-[10px] font-bold tracking-wide transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,255,157,0.2)] cursor-pointer">
              <Upload className="h-4 w-4" />
              BULK UPLOAD
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-black border border-tactical-cyan/30 text-foreground">
            <DialogHeader>
              <DialogTitle className="font-mono text-tactical-cyan uppercase tracking-wider text-sm flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Bulk Guard Upload
              </DialogTitle>
              <DialogDescription className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                Upload CSV or Excel data to synchronize registry.
              </DialogDescription>
            </DialogHeader>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer group my-4 ${selectedFile ? 'border-tactical-cyan bg-tactical-cyan/5' : 'border-border/40 hover:border-tactical-cyan/50 hover:bg-tactical-cyan/5'}`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files && e.target.files.length > 0 && setSelectedFile(e.target.files[0])} 
                className="hidden" 
                accept=".csv, .xlsx, .xls"
              />
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileText className={`h-6 w-6 transition-colors ${selectedFile ? 'text-tactical-cyan' : 'text-muted-foreground group-hover:text-tactical-cyan'}`} />
              </div>
              {selectedFile ? (
                <>
                  <span className="font-mono text-xs font-bold mb-1 text-tactical-cyan">{selectedFile.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">Ready for processing</span>
                </>
              ) : (
                <>
                  <span className="font-mono text-xs font-bold mb-1">DRAG & DROP FILES</span>
                  <span className="font-mono text-[10px] text-muted-foreground">or click to browse systems</span>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button className="px-4 py-2 font-mono text-[10px] bg-secondary hover:bg-secondary/80 rounded transition-colors uppercase tracking-widest border border-border">
                Template
              </button>
              <button 
                onClick={() => {
                  if (selectedFile) {
                    alert('Simulating CSV processing for: ' + selectedFile.name);
                    setSelectedFile(null);
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className={`px-4 py-2 font-mono text-[10px] font-bold rounded transition-colors uppercase tracking-widest shadow-[0_0_10px_rgba(0,255,157,0.3)] ${selectedFile ? 'bg-tactical-cyan hover:bg-tactical-cyan/90 text-black' : 'bg-tactical-cyan/50 text-black/50 cursor-pointer'}`}
              >
                {selectedFile ? "Process CSV" : "Select CSV"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
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

      {/* Data Region: Table + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start pb-6">
        
        {/* Main Table */}
        <div className={`flex-1 w-full min-w-0 glow-border rounded-lg bg-card noise-texture overflow-hidden ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "350ms" }}>
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
                  <tr 
                    key={guard.id} 
                    onClick={() => setSelectedGuard(guard)}
                    className={`border-b border-border/20 transition-colors group cursor-pointer ${selectedGuard?.id === guard.id ? "bg-accent/20 border-l-2 border-l-tactical-cyan" : "hover:bg-accent/10 border-l-2 border-l-transparent"}`}
                  >
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

        {/* Details Panel */}
        {selectedGuard && (
          <div className="w-full lg:w-[350px] shrink-0 space-y-4 fade-in-up animate-in slide-in-from-right-4">
            <div className="glow-border rounded-lg bg-black border border-tactical-cyan/30 overflow-hidden relative shadow-[0_0_20px_rgba(0,255,157,0.05)]">
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-tactical-cyan/20 to-transparent flex items-start justify-between border-b border-tactical-cyan/20">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-tactical-cyan/20 flex items-center justify-center border border-tactical-cyan/40">
                    <User className="h-4 w-4 text-tactical-cyan" />
                  </div>
                  <div>
                    <h3 className="font-mono text-xs font-bold tracking-wider">{selectedGuard.name}</h3>
                    <span className="font-mono text-[9px] text-tactical-cyan tracking-[0.15em]">{selectedGuard.id}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedGuard(null)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-white" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4">
                {/* ID Card Display */}
                <div className="flex items-center gap-4 p-3 bg-secondary/30 rounded border border-border/40">
                  <div className="h-16 w-12 bg-muted/30 rounded border border-border/50 flex flex-col items-center justify-center shrink-0">
                     <User className="h-6 w-6 text-muted-foreground/50 mb-1" />
                     <span className="text-[6px] font-mono text-muted-foreground">PHOTO</span>
                  </div>
                  <div className="flex-1 space-y-2 overflow-hidden">
                    <div>
                      <span className="block font-mono text-[8px] text-muted-foreground uppercase">Authority</span>
                      <span className="font-mono text-[10px] font-bold truncate block">{selectedGuard.authority}</span>
                    </div>
                    <div>
                      <span className="block font-mono text-[8px] text-muted-foreground uppercase">CNIC #</span>
                      <span className="font-mono text-[10px] tabular-nums tracking-widest">{selectedGuard.cnic}</span>
                    </div>
                  </div>
                </div>

                {/* Licence Data */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                    <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Licence No</span>
                    <span className="font-mono text-[10px] text-tactical-cyan font-bold">{selectedGuard.licence}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                    <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Expiry Date</span>
                    <span className={`font-mono text-[10px] tabular-nums font-bold ${
                      selectedGuard.status === 'expired' ? 'text-tactical-red' : 
                      selectedGuard.status === 'expiring_soon' ? 'text-tactical-amber' : 
                      'text-tactical-green'
                    }`}>
                      {selectedGuard.expiry}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                    <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Status</span>
                    <span className={`font-mono text-[10px] font-bold tracking-widest uppercase ${
                      statusConfig[selectedGuard.status]?.color || "text-muted-foreground"
                    }`}>
                      {statusConfig[selectedGuard.status]?.label || selectedGuard.status}
                    </span>
                  </div>
                </div>

                {/* Certifications Matrix */}
                <div>
                  <span className="block font-mono text-[9px] text-muted-foreground tracking-[0.15em] mb-2 uppercase">Certifications Matrix</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedGuard.certifications.map((cert: string) => (
                      <div key={cert} className="flex items-center gap-1.5 p-1.5 rounded bg-tactical-green/10 border border-tactical-green/20">
                        <CheckCircle2 className="h-3 w-3 text-tactical-green shrink-0" />
                        <span className="font-mono text-[9px] text-tactical-green truncate">{cert}</span>
                      </div>
                    ))}
                    {/* Add disabled placeholders */}
                    {Array.from({ length: Math.max(0, 4 - selectedGuard.certifications.length) }).map((_, i) => (
                      <div key={`empty-${i}`} className="flex items-center gap-1.5 p-1.5 rounded bg-muted/20 border border-border/30 opacity-50">
                        <XCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="font-mono text-[9px] text-muted-foreground">Omitted</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tactical Actions */}
                <div className="pt-2 flex gap-2">
                  <button 
                    onClick={() => handleRenewAuth(selectedGuard.id)}
                    className="flex-1 bg-tactical-cyan/10 hover:bg-tactical-cyan/20 border border-tactical-cyan/30 text-tactical-cyan font-mono text-[9px] py-2 rounded transition-colors tracking-widest uppercase text-center"
                  >
                    Renew Auth
                  </button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="flex-1 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-mono text-[9px] py-2 rounded transition-colors tracking-widest uppercase text-center cursor-pointer">
                        Full Dossier
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] bg-black border border-tactical-cyan/40 text-foreground">
                      <DialogHeader>
                        <DialogTitle className="font-mono text-tactical-cyan uppercase tracking-wider text-sm flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Security Operative Dossier
                        </DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-6 mt-4">
                        <div className="border border-border/40 rounded p-4 space-y-4 shadow-[0_0_15px_rgba(0,255,157,0.02)]">
                          <h4 className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase border-b border-border/40 pb-2">Bio Data</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between border-b border-border/20 pb-1">
                              <span className="text-muted-foreground font-mono text-[10px]">Name</span>
                              <span className="font-mono font-bold text-xs">{selectedGuard.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-border/20 pb-1">
                              <span className="text-muted-foreground font-mono text-[10px]">Registry ID</span>
                              <span className="font-mono font-bold text-xs text-tactical-cyan tracking-widest">{selectedGuard.id}</span>
                            </div>
                            <div className="flex justify-between border-b border-border/20 pb-1">
                              <span className="text-muted-foreground font-mono text-[10px]">Origin</span>
                              <span className="font-mono text-xs">Punjab Division</span>
                            </div>
                            <div className="flex justify-between border-b border-border/20 pb-1">
                              <span className="text-muted-foreground font-mono text-[10px]">Blood Group</span>
                              <span className="font-mono font-bold text-xs text-tactical-red">O+</span>
                            </div>
                          </div>
                        </div>
                        <div className="border border-border/40 rounded p-4 space-y-4 shadow-[0_0_15px_rgba(0,255,157,0.02)]">
                          <h4 className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase border-b border-border/40 pb-2">Service History</h4>
                          <div className="space-y-3 font-mono text-[10px]">
                            <div className="flex gap-2">
                              <span className="text-tactical-green shrink-0">2024-01:</span>
                              <span className="text-muted-foreground">Assigned to VIP Detail Sector 4</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-tactical-amber shrink-0">2023-11:</span>
                              <span className="text-muted-foreground">Commendation: Incident Response</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-tactical-cyan shrink-0">2023-01:</span>
                              <span className="text-muted-foreground">Joined Rapid Response Force</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-tactical-amber/10 border border-tactical-amber/30 rounded flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 text-tactical-amber mt-0.5" />
                        <div>
                          <span className="block font-mono text-[10px] font-bold text-tactical-amber uppercase">Watchlist Notes</span>
                          <span className="font-mono text-[10px] text-muted-foreground">No derogatory information found in the last 12 months. Operative is cleared for high-sec assignments.</span>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
