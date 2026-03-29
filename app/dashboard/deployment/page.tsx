"use client";

import { useEffect, useState } from "react";
import {
  Users,
  MapPin,
  Clock,
  ArrowRightLeft,
  AlertTriangle,
  Shield,
  Navigation,
  Upload,
  FileText,
  X,
  User,
  UserCircle,
  Briefcase,
  ClipboardList,
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

type GuardStatus = "on_duty" | "off_duty" | "alert";

interface PersonnelEntry {
  id: string;
  name: string;
  guardId: string;
  post: string;
  site: string;
  shift: string;
  status: GuardStatus;
  lastActivity: string;
  risk: number;
  compliance: string;
  training: string;
}

const initialRoster: PersonnelEntry[] = [
  { id: "DEP-001", name: "Ali Hassan",      guardId: "G-001", post: "Main Gate",        site: "Site Alpha (Blue Area)",    shift: "06:00 — 14:00", status: "on_duty",  lastActivity: "14:05", risk: 12, compliance: "verified",       training: "complete" },
  { id: "DEP-002", name: "Imran Malik",     guardId: "G-005", post: "Perimeter Patrol", site: "Site Alpha (Blue Area)",    shift: "06:00 — 14:00", status: "on_duty",  lastActivity: "13:58", risk: 18, compliance: "verified",       training: "complete" },
  { id: "DEP-003", name: "Tariq Mehmood",   guardId: "G-006", post: "Reception Desk",   site: "Site Bravo (F-6 Markaz)",   shift: "08:00 — 16:00", status: "on_duty",  lastActivity: "14:00", risk: 9,  compliance: "verified",       training: "complete" },
  { id: "DEP-004", name: "Naveed Shah",     guardId: "G-007", post: "CCTV Room",        site: "Site Bravo (F-6 Markaz)",   shift: "08:00 — 16:00", status: "off_duty", lastActivity: "08:00", risk: 15, compliance: "verified",       training: "complete" },
  { id: "DEP-005", name: "Kamran Yousuf",   guardId: "G-009", post: "VIP Gate",         site: "Site Delta (I-8 Industrial)",shift: "06:00 — 18:00", status: "on_duty",  lastActivity: "13:45", risk: 22, compliance: "verified",       training: "complete" },
  { id: "DEP-006", name: "Bilal Khan",      guardId: "G-002", post: "Back Gate",        site: "Site Charlie (DHA Phase 2)",shift: "14:00 — 22:00", status: "alert",    lastActivity: "13:30", risk: 41, compliance: "expiring_soon",  training: "complete" },
  { id: "DEP-007", name: "Faraz Ali",       guardId: "G-003", post: "Parking Area",     site: "Site Alpha (Blue Area)",    shift: "22:00 — 06:00", status: "off_duty", lastActivity: "08:00", risk: 6,  compliance: "verified",       training: "complete" },
  { id: "DEP-008", name: "Junaid Khan",     guardId: "G-004", post: "East Perimeter",   site: "Site Alpha (Blue Area)",    shift: "22:00 — 06:00", status: "off_duty", lastActivity: "06:00", risk: 11, compliance: "verified",       training: "complete" },
  { id: "DEP-009", name: "Shahid Awan",     guardId: "G-010", post: "Control Room",     site: "Site Bravo (F-6 Markaz)",   shift: "06:00 — 14:00", status: "off_duty", lastActivity: "07:00", risk: 5,  compliance: "verified",       training: "complete" },
  { id: "DEP-010", name: "Asif Raza",       guardId: "G-011", post: "Emergency Exit",   site: "Site Charlie (DHA Phase 2)",shift: "06:00 — 14:00", status: "off_duty", lastActivity: "06:00", risk: 16, compliance: "verified",       training: "complete" },
];

const initialReservePool = initialGuards.map((g, i) => {
  const mappedCaps = g.certifications.map(c => {
    if (c === "Armed Response") return "AR";
    if (c === "First Aid") return "FA";
    if (c === "Fire Safety") return "FS";
    if (c === "K9 Handling") return "K9";
    if (c === "VIP Protection") return "VIP";
    if (c === "CCTV") return "CCTV";
    return "AC";
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
  { time: "13:55", post: "Main Gate",        outgoing: "Faraz Ali",    incoming: "Ali Hassan",    site: "Site Alpha", reason: "Shift change" },
  { time: "13:50", post: "Perimeter Patrol", outgoing: "Junaid Khan",  incoming: "Imran Malik",   site: "Site Alpha", reason: "Shift change" },
  { time: "07:58", post: "Reception Desk",   outgoing: "Shahid Awan",  incoming: "Tariq Mehmood", site: "Site Bravo",  reason: "Shift change" },
];

const statusConfig: Record<GuardStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  on_duty:  { label: "ON DUTY",  color: "text-tactical-green",        bg: "bg-tactical-green/10",  border: "border-tactical-green/30",  dot: "bg-tactical-green"  },
  off_duty: { label: "OFF DUTY", color: "text-muted-foreground",      bg: "bg-muted/30",            border: "border-border/50",          dot: "bg-muted-foreground/50" },
  alert:    { label: "ALERT",    color: "text-tactical-amber",        bg: "bg-tactical-amber/10",  border: "border-tactical-amber/30",  dot: "bg-tactical-amber"  },
};

function riskColor(risk: number) {
  if (risk <= 20) return { text: "text-tactical-green", bar: "bg-tactical-green", dot: "bg-tactical-green" };
  if (risk <= 35) return { text: "text-tactical-amber", bar: "bg-tactical-amber", dot: "bg-tactical-amber" };
  return { text: "text-tactical-red", bar: "bg-tactical-red", dot: "bg-tactical-red" };
}

type FilterTab = "all" | "on_duty" | "off_duty" | "alert";

const guardProfiles: Record<string, { experience: string; incidents: number; certifications: string[]; summary: string }> = {
  "DEP-001": { experience: "5 years",  incidents: 0, certifications: ["Armed Response", "First Aid", "VIP Protection"],    summary: "Highly experienced gate security officer. Zero incident record over 5 years. Trusted for high-traffic entry management." },
  "DEP-002": { experience: "3 years",  incidents: 1, certifications: ["First Aid", "Fire Safety"],                          summary: "Reliable perimeter patrol officer. One minor incident logged last quarter, resolved without escalation." },
  "DEP-003": { experience: "2 years",  incidents: 0, certifications: ["Basic Security Training", "CCTV"],                   summary: "Reception-focused officer with strong communication skills. No disciplinary history." },
  "DEP-004": { experience: "4 years",  incidents: 0, certifications: ["CCTV", "Fire Safety", "First Aid"],                  summary: "Surveillance specialist. Proficient with CCTV analytics and incident logging systems." },
  "DEP-005": { experience: "6 years",  incidents: 0, certifications: ["VIP Protection", "Armed Response", "First Aid"],     summary: "Senior VIP protection officer with diplomatic site experience. Vetted for high-profile assignments." },
  "DEP-006": { experience: "1 year",   incidents: 3, certifications: ["Basic Security Training"],                           summary: "Probationary officer with elevated incident count. Licence expiring soon — pending review for reassignment." },
  "DEP-007": { experience: "3 years",  incidents: 1, certifications: ["First Aid", "Fire Safety"],                          summary: "Night-shift parking area officer. One access control incident on record, handled appropriately." },
  "DEP-008": { experience: "2 years",  incidents: 0, certifications: ["Basic Security Training", "First Aid"],              summary: "Perimeter patrol officer currently off-duty. Consistent performance on eastern boundary watch." },
  "DEP-009": { experience: "7 years",  incidents: 0, certifications: ["CCTV", "Armed Response", "VIP Protection"],         summary: "Senior control room operator. Extensive surveillance and command coordination experience." },
  "DEP-010": { experience: "2 years",  incidents: 2, certifications: ["Basic Security Training", "Fire Safety"],            summary: "Emergency exit monitor with two documented patrol deviations this quarter. Under observation." },
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

const avatarColors = [
  "bg-tactical-cyan/80", "bg-[#A78BFA]/80", "bg-tactical-green/80",
  "bg-tactical-amber/80", "bg-tactical-red/80", "bg-blue-500/80",
];

function GuardProfileModal({ guard, onClose }: { guard: PersonnelEntry; onClose: () => void }) {
  const profile   = guardProfiles[guard.id] ?? { experience: "N/A", incidents: 0, certifications: [], summary: "No profile available." };
  const sc        = statusConfig[guard.status];
  const rc        = riskColor(guard.risk);
  const colorIdx  = parseInt(guard.guardId.replace(/\D/g, ""), 10) % avatarColors.length;
  const avatarBg  = avatarColors[colorIdx];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 h-full w-full max-w-md bg-card border-l border-border/60 shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 shrink-0">
          <h2 className="font-bold text-foreground text-lg tracking-tight">Guard Profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Avatar + identity */}
          <div className="flex items-center gap-4">
            <div className={`h-16 w-16 rounded-full ${avatarBg} flex items-center justify-center shrink-0`}>
              <span className="font-bold text-foreground text-xl tracking-wide">{getInitials(guard.name)}</span>
            </div>
            <div>
              <h3 className="font-bold text-foreground text-xl">{guard.name}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${sc.bg} ${sc.color} ${sc.border}`}>
                  {guard.status === "alert" && <AlertTriangle className="h-2.5 w-2.5" />}
                  {sc.label}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded border border-border/40">{guard.guardId}</span>
              </div>
            </div>
          </div>

          {/* Assignment Details */}
          <div>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase font-semibold mb-3">Assignment Details</p>
            <div className="rounded-xl border border-border/40 overflow-hidden divide-y divide-border/30">
              {[
                { icon: MapPin,       label: "Assigned Post",   value: guard.post },
                { icon: Clock,        label: "Last Activity",   value: `06/03/2026, ${guard.lastActivity}:00` },
                { icon: UserCircle,   label: "Experience",      value: profile.experience },
                { icon: ClipboardList,label: "Recent Incidents",value: profile.incidents, highlight: profile.incidents > 0 },
              ].map(({ icon: Icon, label, value, highlight }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3 bg-secondary/60">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
                    <span className="font-mono text-[12px] text-muted-foreground">{label}</span>
                  </div>
                  <span className={`font-mono text-[12px] font-bold ${highlight ? "text-tactical-amber" : "text-foreground"}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Risk Assessment */}
          <div>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase font-semibold mb-3">AI Risk Assessment</p>
            <div className="rounded-xl border border-border/40 bg-secondary/80 p-5 space-y-3">
              <div className="flex flex-col items-center gap-1">
                <span className={`font-mono font-bold text-6xl leading-none ${rc.text}`}>{guard.risk}</span>
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Risk Score</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted/40 overflow-hidden mt-2">
                <div className={`h-full rounded-full ${rc.bar} transition-all`} style={{ width: `${Math.min(guard.risk * 1.5, 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Training & Certifications */}
          <div>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase font-semibold mb-3">Training & Certifications</p>
            <div className="flex flex-wrap gap-2">
              {profile.certifications.map(cert => (
                <span key={cert} className="font-mono text-[11px] px-3 py-1.5 rounded-lg bg-[#A78BFA]/15 border border-[#A78BFA]/30 text-[#A78BFA]">{cert}</span>
              ))}
              {profile.certifications.length === 0 && (
                <span className="font-mono text-[11px] text-muted-foreground">No certifications on record.</span>
              )}
            </div>
          </div>

          {/* Profile Summary */}
          <div>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase font-semibold mb-3">Profile Summary</p>
            <p className="font-mono text-[12px] text-foreground/80 leading-relaxed">{profile.summary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeploymentPage() {
  const [mounted, setMounted]         = useState(false);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [profileGuard, setProfileGuard] = useState<PersonnelEntry | null>(null);
  const [roster, setRoster]           = useState(initialRoster);
  const [reserves, setReserves]       = useState(initialReservePool);
  const [logs, setLogs]               = useState(initialHandoverLogs);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const filtered = roster.filter(g => activeFilter === "all" || g.status === activeFilter);
  const selectedGuard = roster.find(g => g.id === selectedId) ?? null;

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all",      label: `All` },
    { key: "on_duty",  label: `On Duty` },
    { key: "off_duty", label: `Off Duty` },
    { key: "alert",    label: `Alert` },
  ];

  const handleDeployStaff = (guard: typeof reserves[0], post: string, site: string, shift: string) => {
    setReserves(reserves.map(r => r.id === guard.id ? { ...r, available: false } : r));
    const newEntry: PersonnelEntry = {
      id: `DEP-NEW-${Math.floor(Math.random() * 1000)}`,
      name: guard.name,
      guardId: guard.id,
      post,
      site,
      shift,
      status: "on_duty",
      lastActivity: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
      risk: 10,
      compliance: guard.compliance,
      training: "complete",
    };
    setRoster([newEntry, ...roster]);
    const time = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
    setLogs([{ time, post, outgoing: "RESERVE", incoming: guard.name, site, reason: "Deployed" }, ...logs]);
  };

  const handleEndShift = (id: string) => {
    const g = roster.find(d => d.id === id);
    if (g) {
      setRoster(roster.map(d => d.id === id ? { ...d, status: "off_duty" as GuardStatus } : d));
      setSelectedId(null);
      const time = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
      setLogs([{ time, post: g.post, outgoing: g.name, incoming: "UNASSIGNED", site: g.site, reason: "Shift Ended" }, ...logs]);
    }
  };

  const handleRedeploy = (id: string, post: string, site: string, shift: string) => {
    const g = roster.find(d => d.id === id);
    if (g && (g.post !== post || g.site !== site)) {
      const time = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
      setLogs([{ time, post, outgoing: g.post, incoming: "RELOCATED", site, reason: "Re-Deployed" }, ...logs]);
    }
    setRoster(roster.map(d => d.id === id ? { ...d, post, site, shift } : d));
  };

  const getPillStyle = (active: boolean) =>
    active
      ? "px-4 py-1.5 rounded-full border border-tactical-cyan bg-tactical-cyan/10 text-tactical-cyan font-mono text-[11px] font-medium cursor-pointer transition-colors"
      : "px-4 py-1.5 rounded-full border border-border/50 bg-secondary/30 hover:bg-secondary/60 text-muted-foreground font-mono text-[11px] cursor-pointer transition-colors";

  return (
    <>
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-[#A78BFA]/10 border border-[#A78BFA]/30">
            <Users className="h-5 w-5 text-[#A78BFA]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Deployment & Reserve Pool</h1>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#A78BFA] hover:bg-[#A78BFA]/90 text-black font-mono text-[10px] font-bold tracking-wide transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(167,139,250,0.2)] cursor-pointer">
              <Upload className="h-4 w-4" />
              BULK DEPLOY
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border border-[#A78BFA]/30 text-foreground">
            <DialogHeader>
              <DialogTitle className="font-mono text-[#A78BFA] uppercase tracking-wider text-sm flex items-center gap-2">
                <Upload className="h-4 w-4" /> Bulk Deployment Upload
              </DialogTitle>
              <DialogDescription className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                Upload CSV or Excel data to synchronize deployments.
              </DialogDescription>
            </DialogHeader>
            <div onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer group my-4 ${selectedFile ? "border-[#A78BFA] bg-[#A78BFA]/5" : "border-border/40 hover:border-[#A78BFA]/50 hover:bg-[#A78BFA]/5"}`}>
              <input type="file" ref={fileInputRef} onChange={e => e.target.files?.[0] && setSelectedFile(e.target.files[0])} className="hidden" accept=".csv,.xlsx,.xls" />
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileText className={`h-6 w-6 transition-colors ${selectedFile ? "text-[#A78BFA]" : "text-muted-foreground group-hover:text-[#A78BFA]"}`} />
              </div>
              {selectedFile ? (
                <><span className="font-mono text-xs font-bold mb-1 text-[#A78BFA]">{selectedFile.name}</span><span className="font-mono text-[10px] text-muted-foreground">Ready for processing</span></>
              ) : (
                <><span className="font-mono text-xs font-bold mb-1">DRAG & DROP FILES</span><span className="font-mono text-[10px] text-muted-foreground">or click to browse</span></>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button className="px-4 py-2 font-mono text-[10px] bg-secondary hover:bg-secondary/80 rounded transition-colors uppercase tracking-widest border border-border cursor-pointer">Template</button>
              <button onClick={() => { if (selectedFile) { alert("Simulating CSV deployment for: " + selectedFile.name); setSelectedFile(null); } else { fileInputRef.current?.click(); } }}
                className={`px-4 py-2 font-mono text-[10px] font-bold rounded transition-colors uppercase tracking-widest shadow-[0_0_10px_rgba(167,139,250,0.3)] ${selectedFile ? "bg-[#A78BFA] hover:bg-[#A78BFA]/90 text-black" : "bg-[#A78BFA]/50 text-black/50 cursor-pointer"}`}>
                {selectedFile ? "Process CSV" : "Select CSV"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Deployments", value: roster.filter(g => g.status === "on_duty").length,  color: "text-[#A78BFA]"        },
          { label: "Reserve Pool",       value: reserves.filter(r => r.available).length,            color: "text-tactical-green"  },
          { label: "On Alert",           value: roster.filter(g => g.status === "alert").length,     color: "text-tactical-amber"  },
          { label: "Handovers Today",    value: logs.length,                                          color: "text-tactical-cyan"   },
        ].map((s, i) => (
          <div key={s.label} className={`glow-border rounded-lg p-4 bg-card noise-texture ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: `${i * 60}ms` }}>
            <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase block">{s.label}</span>
            <p className={`text-2xl font-bold font-mono mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">

        {/* Personnel Roster Table */}
        <div className={`glow-border rounded-xl bg-card noise-texture overflow-hidden ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "250ms" }}>
          {/* Roster header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <h2 className="font-bold text-foreground text-base tracking-tight">Personnel Roster</h2>
            <span className="font-mono text-[11px] text-muted-foreground">{roster.length} guards</span>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border/30">
            {filterTabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveFilter(tab.key)} className={getPillStyle(activeFilter === tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  {["NAME", "POST", "STATUS", "LAST ACTIVITY", "RISK"].map(col => (
                    <th key={col} className="px-5 py-3 text-left font-mono text-[10px] tracking-widest text-muted-foreground/60 font-semibold">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filtered.map(guard => {
                  const sc = statusConfig[guard.status];
                  const rc = riskColor(guard.risk);
                  const isSelected = selectedId === guard.id;
                  return (
                    <tr
                      key={guard.id}
                      onClick={() => setSelectedId(isSelected ? null : guard.id)}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-[#A78BFA]/5 border-l-2 border-[#A78BFA]" : "hover:bg-accent/20 border-l-2 border-transparent"}`}
                    >
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <span className={`font-mono font-bold text-sm ${isSelected ? "text-[#A78BFA]" : "text-foreground"} transition-colors`}>{guard.name}</span>
                      </td>
                      {/* Post */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[12px] text-muted-foreground">{guard.post}</span>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-1 rounded-md border tracking-wider ${sc.bg} ${sc.color} ${sc.border}`}>
                          {guard.status === "alert" && <AlertTriangle className="h-2.5 w-2.5" />}
                          {sc.label}
                        </span>
                      </td>
                      {/* Last Activity */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[12px] text-muted-foreground tabular-nums">{guard.lastActivity}</span>
                      </td>
                      {/* Risk */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${rc.dot}`} />
                          <div className="w-20 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                            <div className={`h-full rounded-full ${rc.bar}`} style={{ width: `${Math.min(guard.risk * 2, 100)}%` }} />
                          </div>
                          <span className={`font-mono text-sm font-bold tabular-nums ${rc.text}`}>{guard.risk}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-3">
          {selectedGuard ? (
            <div className="glow-border rounded-lg bg-card border border-[#A78BFA]/30 overflow-hidden relative shadow-[0_0_20px_rgba(167,139,250,0.05)] fade-in-up animate-in slide-in-from-right-4">
              <div className="px-4 py-3 bg-gradient-to-r from-[#A78BFA]/20 to-transparent flex items-start justify-between border-b border-[#A78BFA]/20">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#A78BFA]/20 flex items-center justify-center border border-[#A78BFA]/40">
                    <User className="h-4 w-4 text-[#A78BFA]" />
                  </div>
                  <div>
                    <h3 className="font-mono text-xs font-bold tracking-wider">{selectedGuard.name}</h3>
                    <span className="font-mono text-[9px] text-[#A78BFA] tracking-[0.15em]">{selectedGuard.guardId}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="p-1 hover:bg-accent/50 rounded transition-colors cursor-pointer">
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  {[
                    { label: "Post Assignment", value: selectedGuard.post,  className: "text-[#A78BFA] font-bold" },
                    { label: "Site Sector",     value: selectedGuard.site,  className: "" },
                    { label: "Shift Timing",    value: selectedGuard.shift, className: "font-bold tracking-widest" },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-border/20">
                      <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">{row.label}</span>
                      <span className={`font-mono text-[10px] text-right truncate pl-2 ${row.className}`}>{row.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                    <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Clearances</span>
                    <div className="flex gap-2">
                      {selectedGuard.compliance === "verified" && <span className="text-[9px] font-mono font-bold text-tactical-green bg-tactical-green/10 px-1 py-0.5 rounded border border-tactical-green/30">LIC</span>}
                      {selectedGuard.training === "complete"   && <span className="text-[9px] font-mono font-bold text-tactical-green bg-tactical-green/10 px-1 py-0.5 rounded border border-tactical-green/30">TRN</span>}
                    </div>
                  </div>
                  {selectedGuard.compliance !== "verified" && (
                    <div className="flex items-center gap-1.5 mt-2 p-2 rounded bg-tactical-amber/5 border border-tactical-amber/20">
                      <AlertTriangle className="h-3 w-3 text-tactical-amber shrink-0" />
                      <span className="font-mono text-[9px] text-tactical-amber">Licence expiring soon — consider replacement</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => setProfileGuard(selectedGuard)}
                    className="w-full flex items-center justify-center gap-2 bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 border border-[#A78BFA]/30 text-[#A78BFA] font-mono text-[9px] py-2 rounded transition-colors tracking-widest uppercase cursor-pointer"
                  >
                    <UserCircle className="h-3.5 w-3.5" />
                    View Profile
                  </button>
                  <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="flex-1 bg-tactical-amber/10 hover:bg-tactical-amber/20 border border-tactical-amber/30 text-tactical-amber font-mono text-[9px] py-2 rounded transition-colors tracking-widest uppercase text-center cursor-pointer">
                        Re-Deploy
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-card border border-[#A78BFA]/30 text-foreground">
                      <DialogHeader>
                        <DialogTitle className="font-mono text-[#A78BFA] uppercase tracking-wider text-sm flex items-center gap-2">
                          <ArrowRightLeft className="h-4 w-4" /> Update Deployment
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {[
                          { id: "redeploy-post", label: "Post Assignment", options: ["Main Gate","Reception Desk","Perimeter Patrol","CCTV Room","VIP Gate","Back Gate"], def: selectedGuard.post },
                          { id: "redeploy-site", label: "Site Sector",     options: ["Site Alpha (Blue Area)","Site Bravo (F-6 Markaz)","Site Charlie (DHA Phase 2)","Site Delta (I-8 Industrial)"], def: selectedGuard.site },
                          { id: "redeploy-shift",label: "Shift Timing",    options: ["06:00 — 14:00 (Morning)","08:00 — 16:00 (Day)","14:00 — 22:00 (Swing)","22:00 — 06:00 (Night)","06:00 — 18:00 (Extended)"], def: selectedGuard.shift },
                        ].map(field => (
                          <div key={field.id} className="space-y-2">
                            <label className="font-mono text-[10px] uppercase text-muted-foreground">{field.label}</label>
                            <select id={field.id} defaultValue={field.def} className="w-full bg-secondary/50 border border-border/40 rounded px-3 py-2 text-xs font-mono focus:border-[#A78BFA]/50 outline-none">
                              {field.options.map(o => <option key={o}>{o}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2">
                        <DialogClose asChild>
                          <button id="close-redeploy-modal" className="px-4 py-2 font-mono text-[10px] bg-secondary hover:bg-secondary/80 rounded transition-colors uppercase tracking-widest border border-border cursor-pointer">Cancel</button>
                        </DialogClose>
                        <button onClick={() => {
                          const post  = (document.getElementById("redeploy-post")  as HTMLSelectElement).value;
                          const site  = (document.getElementById("redeploy-site")  as HTMLSelectElement).value;
                          const shift = (document.getElementById("redeploy-shift") as HTMLSelectElement).value;
                          handleRedeploy(selectedGuard.id, post, site, shift);
                          document.getElementById("close-redeploy-modal")?.click();
                        }} className="px-4 py-2 font-mono text-[10px] font-bold rounded uppercase tracking-widest bg-[#A78BFA] hover:bg-[#A78BFA]/90 text-black cursor-pointer">
                          Update Deployment
                        </button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <button onClick={() => handleEndShift(selectedGuard.id)}
                    className="flex-1 bg-tactical-red/10 hover:bg-tactical-red/20 border border-tactical-red/30 text-tactical-red font-mono text-[9px] py-2 rounded transition-colors tracking-widest uppercase text-center cursor-pointer">
                    End Shift
                  </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Reserve Pool */}
              <div className={`glow-border rounded-lg bg-card noise-texture overflow-hidden ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "350ms" }}>
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
                  <Navigation className="h-3.5 w-3.5 text-tactical-green" />
                  <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">Reserve Pool (by distance)</span>
                </div>
                <div className="divide-y divide-border/30">
                  {reserves.map(guard => (
                    <Dialog key={guard.id}>
                      <DialogTrigger asChild>
                        <div className={`px-4 py-2.5 ${!guard.available ? "opacity-40 pointer-events-none" : "hover:bg-accent/20 cursor-pointer"} transition-colors group`}>
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
                        <DialogContent className="sm:max-w-md bg-card border border-[#A78BFA]/30 text-foreground">
                          <DialogHeader>
                            <DialogTitle className="font-mono text-[#A78BFA] uppercase tracking-wider text-sm flex items-center gap-2">
                              <Shield className="h-4 w-4" /> Instantiate New Deployment
                            </DialogTitle>
                            <DialogDescription className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                              Deploying: <span className="text-foreground font-bold">{guard.name}</span> ({guard.id})
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            {[
                              { id: `post-${guard.id}`,  label: "Post Assignment", options: ["Main Gate","Reception Desk","Perimeter Patrol","CCTV Room"] },
                              { id: `site-${guard.id}`,  label: "Site Sector",     options: ["Site Alpha (Blue Area)","Site Bravo (F-6 Markaz)","Site Charlie (DHA Phase 2)","Site Delta (I-8 Industrial)"] },
                              { id: `shift-${guard.id}`, label: "Shift Timing",    options: ["06:00 — 14:00 (Morning)","14:00 — 22:00 (Swing)","22:00 — 06:00 (Night)"] },
                            ].map(field => (
                              <div key={field.id} className="space-y-2">
                                <label className="font-mono text-[10px] uppercase text-muted-foreground">{field.label}</label>
                                <select id={field.id} className="w-full bg-secondary/50 border border-border/40 rounded px-3 py-2 text-xs font-mono focus:border-[#A78BFA]/50 outline-none">
                                  {field.options.map(o => <option key={o}>{o}</option>)}
                                </select>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end gap-2">
                            <DialogClose asChild>
                              <button id={`close-${guard.id}`} className="px-4 py-2 font-mono text-[10px] bg-secondary hover:bg-secondary/80 rounded transition-colors uppercase tracking-widest border border-border cursor-pointer">Cancel</button>
                            </DialogClose>
                            <button onClick={() => {
                              const post  = (document.getElementById(`post-${guard.id}`)  as HTMLSelectElement).value;
                              const site  = (document.getElementById(`site-${guard.id}`)  as HTMLSelectElement).value;
                              const shift = (document.getElementById(`shift-${guard.id}`) as HTMLSelectElement).value;
                              handleDeployStaff(guard, post, site, shift);
                              document.getElementById(`close-${guard.id}`)?.click();
                            }} className="px-4 py-2 font-mono text-[10px] font-bold rounded uppercase tracking-widest bg-[#A78BFA] hover:bg-[#A78BFA]/90 text-black cursor-pointer">
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

    {profileGuard && (
      <GuardProfileModal guard={profileGuard} onClose={() => setProfileGuard(null)} />
    )}
    </>
  );
}
