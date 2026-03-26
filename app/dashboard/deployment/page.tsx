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
  Upload,
  FileText,
  X,
  User,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useRef } from "react";
import { initialGuards } from "../compliance/page";

const initialActiveDeployments = [
  { id: "DEP-001", guard: "Ali Hassan", guardId: "G-001", post: "Main Gate", site: "Site Alpha (Blue Area)", shift: "06:00 — 14:00", status: "active", compliance: "verified", training: "complete" },
  { id: "DEP-002", guard: "Imran Malik", guardId: "G-005", post: "Perimeter Patrol", site: "Site Alpha (Blue Area)", shift: "06:00 — 14:00", status: "active", compliance: "verified", training: "complete" },
  { id: "DEP-003", guard: "Tariq Mehmood", guardId: "G-006", post: "Reception Desk", site: "Site Bravo (F-6 Markaz)", shift: "08:00 — 16:00", status: "active", compliance: "verified", training: "complete" },
  { id: "DEP-004", guard: "Naveed Shah", guardId: "G-007", post: "CCTV Room", site: "Site Bravo (F-6 Markaz)", shift: "08:00 — 16:00", status: "active", compliance: "verified", training: "complete" },
  { id: "DEP-005", guard: "Kamran Yousuf", guardId: "G-009", post: "VIP Gate", site: "Site Delta (I-8 Industrial)", shift: "06:00 — 18:00", status: "active", compliance: "verified", training: "complete" },
  { id: "DEP-006", guard: "Bilal Khan", guardId: "G-002", post: "Back Gate", site: "Site Charlie (DHA Phase 2)", shift: "14:00 — 22:00", status: "warning", compliance: "expiring_soon", training: "complete" },
];

const initialReservePool = initialGuards.map((g, i) => {
  const mappedCaps = g.certifications.map(c => {
    if (c === "Armed Response") return "AR";
    if (c === "First Aid") return "FA";
    if (c === "Fire Safety") return "FS";
    if (c === "K9 Handling") return "K9";
    if (c === "VIP Protection") return "VIP";
    if (c === "CCTV") return "CCTV";
    return "AC"; // generic fallback
  });

  return {
    id: g.id,
    name: g.name,
    capabilities: Array.from(new Set(mappedCaps)),
    distance: (2.3 + (i * 0.7)).toFixed(1) + " km",
    available: g.status !== "expired",
    compliance: g.status,
  };
});

const initialHandoverLogs = [
  { time: "13:55", post: "Main Gate", outgoing: "Faraz Ali", incoming: "Ali Hassan", site: "Site Alpha", reason: "Shift change", operator: "OP-01" },
  { time: "13:50", post: "Perimeter Patrol", outgoing: "Junaid Khan", incoming: "Imran Malik", site: "Site Alpha", reason: "Shift change", operator: "OP-01" },
  { time: "07:58", post: "Reception Desk", outgoing: "Shahid Awan", incoming: "Tariq Mehmood", site: "Site Bravo", reason: "Shift change", operator: "OP-02" },
];

export default function DeploymentPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedDep, setSelectedDep] = useState<string | null>(null);
  const [deployments, setDeployments] = useState(initialActiveDeployments);
  const [reserves, setReserves] = useState(initialReservePool);
  const [logs, setLogs] = useState(initialHandoverLogs);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => setMounted(true), []);

  const handleDeployStaff = (guard: any, post: string, site: string, shift: string) => {
    // Mark reserve as not available
    setReserves(reserves.map(r => r.id === guard.id ? { ...r, available: false } : r));

    // Add to active deployments
    const newDeployment = {
      id: `DEP-NEW-${Math.floor(Math.random() * 1000)}`,
      guard: guard.name,
      guardId: guard.id,
      post,
      site,
      shift,
      status: "active",
      compliance: guard.compliance,
      training: "complete",
    };
    setDeployments([newDeployment, ...deployments]);

    // Log the Handover
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit" });
    setLogs([{ time, post, outgoing: "RESERVE", incoming: guard.name, site, reason: "Deployed", operator: "SYSTEM" }, ...logs]);
  };

  const handleEndShift = (depId: string) => {
    const dep = deployments.find(d => d.id === depId);
    if (dep) {
      setReserves(reserves.map(r => r.id === dep.guardId ? { ...r, available: true } : r));
      setDeployments(deployments.filter(d => d.id !== depId));
      setSelectedDep(null);

      const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit" });
      setLogs([{ time, post: dep.post, outgoing: dep.guard, incoming: "UNASSIGNED", site: dep.site, reason: "Shift Ended", operator: "SYSTEM" }, ...logs]);
    }
  };

  const handleRedeploy = (depId: string, post: string, site: string, shift: string) => {
    const dep = deployments.find(d => d.id === depId);
    if (dep && (dep.post !== post || dep.site !== site)) {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit" });
      setLogs([{ time, post: post, outgoing: dep.post, incoming: "RELOCATED", site: site, reason: "Re-Deployed", operator: "SYSTEM" }, ...logs]);
    }
    setDeployments(deployments.map(d => {
      if (d.id === depId) {
        return { ...d, post, site, shift };
      }
      return d;
    }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-[#A78BFA]/10 border border-[#A78BFA]/30">
            <Users className="h-5 w-5 text-[#A78BFA]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Deployment & Reserve Pool</h1>
            <p className="text-xs text-muted-foreground font-mono">MOD-04 — Real-time Deployment Board & Jump Pool</p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#A78BFA] hover:bg-[#A78BFA]/90 text-black font-mono text-[10px] font-bold tracking-wide transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(167,139,250,0.2)] cursor-pointer">
              <Upload className="h-4 w-4" />
              BULK DEPLOY
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-black border border-[#A78BFA]/30 text-foreground">
            <DialogHeader>
              <DialogTitle className="font-mono text-[#A78BFA] uppercase tracking-wider text-sm flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Bulk Deployment Upload
              </DialogTitle>
              <DialogDescription className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                Upload CSV or Excel data to synchronize deployments.
              </DialogDescription>
            </DialogHeader>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer group my-4 ${
                selectedFile ? 'border-[#A78BFA] bg-[#A78BFA]/5' : 'border-border/40 hover:border-[#A78BFA]/50 hover:bg-[#A78BFA]/5'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files && e.target.files.length > 0 && setSelectedFile(e.target.files[0])} 
                className="hidden" 
                accept=".csv, .xlsx, .xls"
              />
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileText className={`h-6 w-6 transition-colors ${selectedFile ? 'text-[#A78BFA]' : 'text-muted-foreground group-hover:text-[#A78BFA]'}`} />
              </div>
              {selectedFile ? (
                <>
                  <span className="font-mono text-xs font-bold mb-1 text-[#A78BFA]">{selectedFile.name}</span>
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
              <button className="px-4 py-2 font-mono text-[10px] bg-secondary hover:bg-secondary/80 rounded transition-colors uppercase tracking-widest border border-border cursor-pointer">
                Template
              </button>
              <button 
                onClick={() => {
                  if (selectedFile) {
                    alert('Simulating CSV deployment for: ' + selectedFile.name);
                    setSelectedFile(null);
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className={`px-4 py-2 font-mono text-[10px] font-bold rounded transition-colors uppercase tracking-widest shadow-[0_0_10px_rgba(167,139,250,0.3)] ${
                  selectedFile 
                    ? 'bg-[#A78BFA] hover:bg-[#A78BFA]/90 text-black' 
                    : 'bg-[#A78BFA]/50 text-black/50 cursor-pointer'
                }`}
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
          { label: "Active Deployments", value: deployments.length, color: "text-[#A78BFA]" },
          { label: "Reserve Pool", value: reserves.filter((r) => r.available).length, color: "text-tactical-green" },
          { label: "Coverage Gaps", value: "0", color: "text-tactical-green" },
          { label: "Handovers Today", value: logs.length, color: "text-tactical-cyan" },
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
            {deployments.map((dep) => (
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
          {selectedDep ? (() => {
            const depDetails = deployments.find((d) => d.id === selectedDep);
            if (!depDetails) return null;
            return (
              <div className="glow-border rounded-lg bg-black border border-[#A78BFA]/30 overflow-hidden relative shadow-[0_0_20px_rgba(167,139,250,0.05)] fade-in-up animate-in slide-in-from-right-4">
                {/* Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-[#A78BFA]/20 to-transparent flex items-start justify-between border-b border-[#A78BFA]/20">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-[#A78BFA]/20 flex items-center justify-center border border-[#A78BFA]/40">
                      <User className="h-4 w-4 text-[#A78BFA]" />
                    </div>
                    <div>
                      <h3 className="font-mono text-xs font-bold tracking-wider">{depDetails.guard}</h3>
                      <span className="font-mono text-[9px] text-[#A78BFA] tracking-[0.15em]">{depDetails.guardId}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedDep(null)}
                    className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-white" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                  {/* Deployment Data */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                      <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Post Assignment</span>
                      <span className="font-mono text-[10px] text-[#A78BFA] font-bold text-right truncate pl-2">{depDetails.post}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                      <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Site Sector</span>
                      <span className="font-mono text-[10px] text-right truncate pl-2">{depDetails.site}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                      <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Shift Timing</span>
                      <span className="font-mono text-[10px] tabular-nums font-bold tracking-widest">{depDetails.shift}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                      <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Clearances</span>
                      <div className="flex gap-2">
                        {depDetails.compliance === 'verified' && <span className="text-[9px] font-mono font-bold text-tactical-green bg-tactical-green/10 px-1 py-0.5 rounded border border-tactical-green/30">LIC</span>}
                        {depDetails.training === 'complete' && <span className="text-[9px] font-mono font-bold text-tactical-green bg-tactical-green/10 px-1 py-0.5 rounded border border-tactical-green/30">TRN</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="flex-1 bg-tactical-amber/10 hover:bg-tactical-amber/20 border border-tactical-amber/30 text-tactical-amber font-mono text-[9px] py-2 rounded transition-colors tracking-widest uppercase text-center cursor-pointer">
                          Re-Deploy
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md bg-black border border-[#A78BFA]/30 text-foreground">
                        <DialogHeader>
                          <DialogTitle className="font-mono text-[#A78BFA] uppercase tracking-wider text-sm flex items-center gap-2">
                            <ArrowRightLeft className="h-4 w-4" />
                            Update Deployment parameters
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="font-mono text-[10px] uppercase text-muted-foreground">Post Assignment</label>
                            <select id="redeploy-post" defaultValue={depDetails.post} className="w-full bg-secondary/50 border border-border/40 rounded px-3 py-2 text-xs font-mono focus:border-[#A78BFA]/50 outline-none">
                              <option>Main Gate</option>
                              <option>Reception Desk</option>
                              <option>Perimeter Patrol</option>
                              <option>CCTV Room</option>
                              <option>VIP Gate</option>
                              <option>Back Gate</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="font-mono text-[10px] uppercase text-muted-foreground">Site Sector</label>
                            <select id="redeploy-site" defaultValue={depDetails.site} className="w-full bg-secondary/50 border border-border/40 rounded px-3 py-2 text-xs font-mono focus:border-[#A78BFA]/50 outline-none">
                              <option>Site Alpha (Blue Area)</option>
                              <option>Site Bravo (F-6 Markaz)</option>
                              <option>Site Charlie (DHA Phase 2)</option>
                              <option>Site Delta (I-8 Industrial)</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="font-mono text-[10px] uppercase text-muted-foreground">Shift Timing</label>
                            <select id="redeploy-shift" defaultValue={depDetails.shift} className="w-full bg-secondary/50 border border-border/40 rounded px-3 py-2 text-xs font-mono focus:border-[#A78BFA]/50 outline-none">
                              <option>14:00 — 22:00 (Swing)</option>
                              <option>22:00 — 06:00 (Night)</option>
                              <option>06:00 — 14:00 (Morning)</option>
                              <option>06:00 — 18:00 (Extended)</option>
                              <option>08:00 — 16:00 (Day)</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <DialogClose asChild>
                            <button id="close-redeploy-modal" className="px-4 py-2 font-mono text-[10px] bg-secondary hover:bg-secondary/80 rounded transition-colors uppercase tracking-widest border border-border cursor-pointer">
                              Cancel
                            </button>
                          </DialogClose>
                          <button 
                            onClick={() => {
                              const post = (document.getElementById('redeploy-post') as HTMLSelectElement).value;
                              const site = (document.getElementById('redeploy-site') as HTMLSelectElement).value;
                              const shift = (document.getElementById('redeploy-shift') as HTMLSelectElement).value;
                              handleRedeploy(depDetails.id, post, site, shift);
                              document.getElementById('close-redeploy-modal')?.click();
                            }}
                            className="px-4 py-2 font-mono text-[10px] font-bold rounded transition-colors uppercase tracking-widest shadow-[0_0_10px_rgba(167,139,250,0.3)] bg-[#A78BFA] hover:bg-[#A78BFA]/90 text-black cursor-pointer"
                          >
                            Update Deployment
                          </button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <button 
                      onClick={() => handleEndShift(depDetails.id)}
                      className="flex-1 bg-tactical-red/10 hover:bg-tactical-red/20 border border-tactical-red/30 text-tactical-red font-mono text-[9px] py-2 rounded transition-colors tracking-widest uppercase text-center cursor-pointer"
                    >
                      End Shift
                    </button>
                  </div>
                </div>
              </div>
            );
          })() : (
            <>
              {/* Reserve Pool */}
              <div className={`glow-border rounded-lg bg-card noise-texture overflow-hidden ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "350ms" }}>
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
                  <Navigation className="h-3.5 w-3.5 text-tactical-green" />
                  <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">Reserve Pool (by distance)</span>
                </div>
                <div className="divide-y divide-border/30">
                  {reserves.map((guard) => (
                    <Dialog key={guard.id}>
                      <DialogTrigger asChild>
                        <div className={`px-4 py-2.5 ${!guard.available ? "opacity-40 pointer-events-none" : "hover:bg-accent/20 cursor-pointer"} transition-colors relative group`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[11px] font-medium group-hover:text-[#A78BFA] transition-colors">{guard.name}</span>
                            <span className="font-mono text-[10px] text-tactical-cyan">{guard.distance}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {guard.capabilities.map((c, idx) => (
                              <span key={`${c}-${idx}`} className="font-mono text-[8px] px-1 py-0.5 rounded bg-accent/50 text-muted-foreground">{c}</span>
                            ))}
                            <span className={`ml-auto font-mono text-[8px] tracking-widest ${guard.available ? "text-[#A78BFA] font-bold" : "text-muted-foreground"}`}>
                              {guard.available ? "DEPLOY NOW" : "DEPLOYED"}
                            </span>
                          </div>
                        </div>
                      </DialogTrigger>
                      {guard.available && (
                        <DialogContent className="sm:max-w-md bg-black border border-[#A78BFA]/30 text-foreground">
                          <DialogHeader>
                            <DialogTitle className="font-mono text-[#A78BFA] uppercase tracking-wider text-sm flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Instantiate New Deployment
                            </DialogTitle>
                            <DialogDescription className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                              Deploying reserve operator: <span className="text-foreground font-bold">{guard.name}</span> ({guard.id})
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="font-mono text-[10px] uppercase text-muted-foreground">Post Assignment</label>
                              <select id={`post-${guard.id}`} className="w-full bg-secondary/50 border border-border/40 rounded px-3 py-2 text-xs font-mono focus:border-[#A78BFA]/50 outline-none">
                                <option>Main Gate</option>
                                <option>Reception Desk</option>
                                <option>Perimeter Patrol</option>
                                <option>CCTV Room</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="font-mono text-[10px] uppercase text-muted-foreground">Site Sector</label>
                              <select id={`site-${guard.id}`} className="w-full bg-secondary/50 border border-border/40 rounded px-3 py-2 text-xs font-mono focus:border-[#A78BFA]/50 outline-none">
                                <option>Site Alpha (Blue Area)</option>
                                <option>Site Bravo (F-6 Markaz)</option>
                                <option>Site Charlie (DHA Phase 2)</option>
                                <option>Site Delta (I-8 Industrial)</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="font-mono text-[10px] uppercase text-muted-foreground">Shift Timing</label>
                              <select id={`shift-${guard.id}`} className="w-full bg-secondary/50 border border-border/40 rounded px-3 py-2 text-xs font-mono focus:border-[#A78BFA]/50 outline-none">
                                <option>14:00 — 22:00 (Swing)</option>
                                <option>22:00 — 06:00 (Night)</option>
                                <option>06:00 — 14:00 (Morning)</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <DialogClose asChild>
                              <button id={`close-${guard.id}`} className="px-4 py-2 font-mono text-[10px] bg-secondary hover:bg-secondary/80 rounded transition-colors uppercase tracking-widest border border-border cursor-pointer">
                                Cancel
                              </button>
                            </DialogClose>
                            <button 
                              onClick={() => {
                                const post = (document.getElementById(`post-${guard.id}`) as HTMLSelectElement).value;
                                const site = (document.getElementById(`site-${guard.id}`) as HTMLSelectElement).value;
                                const shift = (document.getElementById(`shift-${guard.id}`) as HTMLSelectElement).value;
                                handleDeployStaff(guard, post, site, shift);
                                document.getElementById(`close-${guard.id}`)?.click();
                              }}
                              className="px-4 py-2 font-mono text-[10px] font-bold rounded transition-colors uppercase tracking-widest shadow-[0_0_10px_rgba(167,139,250,0.3)] bg-[#A78BFA] hover:bg-[#A78BFA]/90 text-black cursor-pointer"
                            >
                              Dispatch Operator
                            </button>
                          </div>
                        </DialogContent>
                      )}
                    </Dialog>
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
                  {logs.map((log, i) => (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
