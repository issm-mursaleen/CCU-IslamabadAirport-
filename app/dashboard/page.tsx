"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Crosshair,
  ShieldCheck,
  GraduationCap,
  Users,
  Bell,
  Bot,
  ArrowUpRight,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Radio,
  Camera,
  X,
  Video,
  Wifi,
  Zap,
} from "lucide-react";

type EventLevel = "critical" | "high" | "medium" | "low";

interface SecurityEvent {
  id: string;
  title: string;
  location: string;
  camera: string;
  level: EventLevel;
  confidence: number;
  time: string;
  timestamp: string;
  icon: React.ElementType;
  description: string;
  action: string;
  video: string;
}

const levelConfig: Record<EventLevel, { bg: string; text: string; border: string; badge: string; bar: string }> = {
  critical: { bg: "bg-tactical-red/15", text: "text-tactical-red", border: "border-tactical-red/40", badge: "CRITICAL RISK", bar: "bg-tactical-red" },
  high:     { bg: "bg-tactical-amber/15", text: "text-tactical-amber", border: "border-tactical-amber/40", badge: "HIGH RISK", bar: "bg-tactical-amber" },
  medium:   { bg: "bg-tactical-cyan/15", text: "text-tactical-cyan", border: "border-tactical-cyan/40", badge: "MEDIUM RISK", bar: "bg-tactical-cyan" },
  low:      { bg: "bg-tactical-green/15", text: "text-tactical-green", border: "border-tactical-green/40", badge: "LOW RISK", bar: "bg-tactical-green" },
};

const events: SecurityEvent[] = [
  {
    id: "EVT-001",
    title: "Suspicious Loitering",
    location: "Main Gate Entrance",
    camera: "CAM-001",
    level: "high",
    confidence: 92,
    time: "14:23",
    timestamp: "06/03/2026, 14:23:11",
    icon: Eye,
    description: "Individual detected loitering near access gate for 12 minutes without authorization badge.",
    action: "Dispatch guard team to verify identity and intent.",
    video: "/videos/Events/Suspicious%20Lottering.mp4",
  },
  {
    id: "EVT-002",
    title: "Camera Obstruction",
    location: "Production Facility",
    camera: "CAM-005",
    level: "medium",
    confidence: 87,
    time: "14:18",
    timestamp: "06/03/2026, 14:18:44",
    icon: Camera,
    description: "Camera lens obstruction detected at production facility. Possible deliberate tampering or accidental blockage.",
    action: "Send maintenance team to inspect camera. Deploy roving guard to cover the area.",
    video: "/videos/Events/Camera_obstruction_event_5ab20ea8c9.mp4",
  },
  {
    id: "EVT-003",
    title: "Unauthorized Entry",
    location: "Restricted Compound",
    camera: "CAM-006",
    level: "critical",
    confidence: 96,
    time: "14:11",
    timestamp: "06/03/2026, 14:11:02",
    icon: AlertTriangle,
    description: "Individual breached restricted compound perimeter without valid access credentials. Multiple access control systems triggered.",
    action: "Immediate lockdown of restricted area. Dispatch QRF team. Alert security supervisor.",
    video: "/videos/Person%20Climbing%20Fence.mp4",
  },
  {
    id: "EVT-004",
    title: "Tailgating at Gate",
    location: "Main Gate Entrance",
    camera: "CAM-001",
    level: "high",
    confidence: 89,
    time: "13:58",
    timestamp: "06/03/2026, 13:58:30",
    icon: Users,
    description: "Two individuals detected piggybacking entry through access-controlled gate. Second person did not badge in.",
    action: "Review badge logs. Identify and verify both individuals. Issue security awareness reminder.",
    video: "/videos/Cameras/Gate_surveillance%20video.mp4",
  },
  {
    id: "EVT-005",
    title: "Weapon-Like Object",
    location: "Industrial Warehouse",
    camera: "CAM-003",
    level: "critical",
    confidence: 78,
    time: "13:45",
    timestamp: "06/03/2026, 13:45:19",
    icon: Crosshair,
    description: "AI model detected object consistent with weapon profile in industrial warehouse zone. Individual acting suspiciously.",
    action: "Do not approach. Alert armed response unit. Evacuate surrounding area. Await confirmation.",
    video: "/videos/Cameras/Forklift%20in%20Warehoues.mp4",
  },
  {
    id: "EVT-006",
    title: "Perimeter Breach",
    location: "East Perimeter",
    camera: "CAM-002",
    level: "critical",
    confidence: 94,
    time: "13:32",
    timestamp: "06/03/2026, 13:32:55",
    icon: Radio,
    description: "Motion sensors and AI detection confirm perimeter fence breach on eastern boundary. Possible vehicle-assisted entry.",
    action: "Deploy QRF to eastern perimeter. Activate flood lights. Notify command and site manager.",
    video: "/videos/Person%20Climbing%20Fence.mp4",
  },
  {
    id: "EVT-007",
    title: "Face Not Recognized",
    location: "Server Room Entrance",
    camera: "CAM-007",
    level: "high",
    confidence: 83,
    time: "13:20",
    timestamp: "06/03/2026, 13:20:42",
    icon: Eye,
    description: "Unrecognized face detected attempting access to server room. Biometric scan returned no match in database.",
    action: "Lock server room access. Dispatch security team. Review visitor log for authorized guests.",
    video: "/videos/Cameras/guard2.mp4",
  },
  {
    id: "EVT-008",
    title: "Theft in Parking Lot",
    location: "Car Park Zone B",
    camera: "CAM-009",
    level: "medium",
    confidence: 71,
    time: "13:05",
    timestamp: "06/03/2026, 13:05:18",
    icon: Users,
    description: "Suspicious individual detected in parking lot exhibiting theft behaviour. Vehicle approached without authorization.",
    action: "Send guard to investigate. Review parking lot access logs. Notify vehicle owners if theft confirmed.",
    video: "/videos/Events/theif%20in%20parking%20lot.mp4",
  },
];

const cameras = [
  { id: "CAM-001", name: "Main Gate Entrance",   video: "/videos/Cameras/Gate_surveillance%20video.mp4" },
  { id: "CAM-002", name: "Perimeter Fence Line", video: "/videos/Person%20Climbing%20Fence.mp4" },
  { id: "CAM-003", name: "Industrial Warehouse", video: "/videos/Cameras/Forklift%20in%20Warehoues.mp4" },
  { id: "CAM-004", name: "Parking Area",         video: "/videos/Cameras/car%20inside%20secure%20perimeter.mp4" },
];

const modules = [
  { id: "MOD-01", title: "QRF Response",    subtitle: "Threat Response & GPS Tracking",         icon: Crosshair,     href: "/dashboard/qrf",          accentColor: "text-tactical-green", accentBg: "bg-tactical-green/10", accentBorder: "border-tactical-green/30", status: "LIVE",   stats: { label: "Teams Active",    value: "5"   } },
  { id: "MOD-02", title: "Guard Compliance",subtitle: "License & Certification Tracking",        icon: ShieldCheck,   href: "/dashboard/compliance",   accentColor: "text-tactical-cyan",  accentBg: "bg-tactical-cyan/10",  accentBorder: "border-tactical-cyan/30",  status: "ACTIVE", stats: { label: "Compliance Rate", value: "94%" } },
  { id: "MOD-03", title: "Training Mgmt",   subtitle: "Certification & Eligibility",             icon: GraduationCap, href: "/dashboard/training",     accentColor: "text-tactical-amber", accentBg: "bg-tactical-amber/10", accentBorder: "border-tactical-amber/30", status: "ACTIVE", stats: { label: "Fully Trained",   value: "87%" } },
  { id: "MOD-04", title: "Deployment",      subtitle: "Guard Deployment & Reserve Pool",         icon: Users,         href: "/dashboard/deployment",   accentColor: "text-[#A78BFA]",      accentBg: "bg-[#A78BFA]/10",      accentBorder: "border-[#A78BFA]/30",      status: "ACTIVE", stats: { label: "Guards Deployed", value: "40"  } },
  { id: "MOD-05", title: "Alert System",    subtitle: "WhatsApp Notifications & Escalation",     icon: Bell,          href: "/dashboard/alerts",       accentColor: "text-tactical-red",   accentBg: "bg-tactical-red/10",   accentBorder: "border-tactical-red/30",   status: "ACTIVE", stats: { label: "Alerts Today",    value: "12"  } },
  { id: "MOD-06", title: "AI Assistant",    subtitle: "Natural Language Ops Intelligence",        icon: Bot,           href: "/dashboard/ai-assistant", accentColor: "text-tactical-green", accentBg: "bg-tactical-green/10", accentBorder: "border-tactical-green/30", status: "READY",  stats: { label: "Queries Today",   value: "34"  } },
];

const criticalEvents = events.filter(e => e.level === "critical");

function CameraModal({ cam, onClose }: { cam: typeof cameras[0]; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl bg-zinc-950 border border-border/60 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 bg-secondary/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-tactical-red px-2 py-0.5 rounded font-mono text-[9px] font-bold tracking-widest text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </div>
            <span className="font-mono font-bold text-foreground text-sm">{cam.name}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{cam.id}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-tactical-green tracking-widest">● ONLINE</span>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Video */}
        <div className="relative bg-card" style={{ aspectRatio: "16/9" }}>
          <video
            key={cam.video}
            src={cam.video}
            autoPlay
            muted
            loop
            playsInline
            controls
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 3px)" }} />
        </div>
      </div>
    </div>
  );
}

function EventDetailModal({ event, onClose }: { event: SecurityEvent; onClose: () => void }) {
  const cfg = levelConfig[event.level];
  const Ic = event.icon;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <h2 className="font-mono font-bold text-foreground text-base tracking-tight">
            Event Detail — {event.id}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Level badge */}
          <div>
            <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3 py-1.5 rounded-lg border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              <Ic className="h-3 w-3" />
              {cfg.badge}
            </span>
          </div>

          {/* Detail table */}
          <div className="space-y-0 rounded-xl border border-border/40 overflow-hidden">
            {[
              { label: "Event Type",    value: event.title },
              { label: "Location",      value: event.location },
              { label: "Camera",        value: event.camera },
              { label: "Timestamp",     value: event.timestamp },
            ].map(({ label, value }, i, arr) => (
              <div key={label} className={`flex items-center justify-between px-5 py-3.5 ${i !== arr.length - 1 ? "border-b border-border/30" : ""} bg-secondary/40`}>
                <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
                <span className="font-mono text-[12px] font-semibold text-foreground">{value}</span>
              </div>
            ))}
            {/* Confidence row */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-secondary/40">
              <span className="font-mono text-[11px] text-muted-foreground">AI Confidence</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${event.confidence}%` }} />
                </div>
                <span className={`font-mono text-[12px] font-bold ${cfg.text}`}>{event.confidence}%</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border border-border/40 bg-secondary/40 p-4 space-y-2">
            <p className="font-mono text-[9px] text-muted-foreground tracking-[0.18em] uppercase font-semibold">Description</p>
            <p className="font-mono text-[12px] text-foreground/80 leading-relaxed">{event.description}</p>
          </div>

          {/* Recommended action */}
          <div className={`rounded-xl border p-4 space-y-2 ${cfg.bg} ${cfg.border}`}>
            <p className={`font-mono text-[9px] tracking-[0.18em] uppercase font-semibold ${cfg.text}`}>Recommended Action</p>
            <p className="font-mono text-[12px] text-foreground/80 leading-relaxed">{event.action}</p>
          </div>

          {/* Camera feed */}
          <div className="rounded-xl overflow-hidden border border-border/40 relative bg-zinc-900" style={{ aspectRatio: "16/9" }}>
            <video
              key={event.video}
              src={event.video}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 3px)" }} />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-tactical-red px-2 py-0.5 rounded text-white font-mono text-[9px] font-bold tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </div>
            <div className="absolute top-3 right-3 font-mono text-[9px] text-white/80 tracking-widest bg-black/40 px-1.5 py-0.5 rounded">{event.camera}</div>
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between">
              <span className="font-mono text-[10px] text-white/90">{event.location}</span>
              <span className="font-mono text-[9px] text-tactical-green tracking-widest">● ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<typeof cameras[0] | null>(null);

  useEffect(() => setMounted(true), []);

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-mono text-foreground">Command Centre Overview</h1>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">Real-time operational status across all security systems</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-tactical-green/10 border border-tactical-green/20">
            <Activity className="h-3.5 w-3.5 text-tactical-green" />
            <span className="font-mono text-[11px] text-tactical-green tracking-wide">ALL SYSTEMS NOMINAL</span>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Active Alerts",    value: "20",          icon: AlertTriangle, color: "text-tactical-red",   bg: "bg-tactical-red/10",   border: "border-tactical-red/20"   },
            { label: "Active Incidents", value: "3",           icon: Zap,           color: "text-tactical-amber", bg: "bg-tactical-amber/10", border: "border-tactical-amber/20" },
            { label: "Guards On-Duty",   value: "16",          icon: Users,         color: "text-tactical-cyan",  bg: "bg-tactical-cyan/10",  border: "border-tactical-cyan/20"  },
            { label: "System Status",    value: "OPERATIONAL", icon: Activity,      color: "text-tactical-green", bg: "bg-tactical-green/10", border: "border-tactical-green/20" },
            { label: "Threat Level",     value: "BRAVO",       icon: Shield,        color: "text-[#A78BFA]",      bg: "bg-[#A78BFA]/10",      border: "border-[#A78BFA]/20"      },
          ].map((stat, i) => (
            <div key={stat.label} className={`glow-border rounded-xl p-4 bg-card noise-texture border border-border/50 flex items-center gap-3 ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: `${i * 70}ms` }}>
              <div className={`h-9 w-9 rounded-lg ${stat.bg} border ${stat.border} flex items-center justify-center shrink-0`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-lg font-bold font-mono leading-none ${stat.color}`}>{stat.value}</p>
                <p className="text-[9px] tracking-widest text-muted-foreground uppercase font-mono mt-0.5 truncate">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main 2-col layout */}
        <div className="grid grid-cols-[1fr_520px] gap-4">
          {/* LEFT: Live Event Alert Feed */}
          <div className={`rounded-xl bg-card border border-border/40 overflow-hidden ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "400ms" }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tactical-red animate-pulse" />
                <span className="font-mono font-bold text-sm text-foreground">Live Event Alert Feed</span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">{events.length} events</span>
            </div>

            <div className="divide-y divide-border/30">
              {events.map((evt) => {
                const cfg = levelConfig[evt.level];
                const Ic = evt.icon;
                return (
                  <button
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="w-full text-left px-5 py-3.5 hover:bg-accent/20 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-md ${cfg.bg} shrink-0`}>
                        <Ic className={`h-3.5 w-3.5 ${cfg.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="font-mono font-semibold text-sm text-foreground group-hover:text-tactical-cyan transition-colors truncate">{evt.title}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded tracking-wider ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                              {evt.level.toUpperCase()}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{evt.time}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mb-2">
                          <span>{evt.location}</span>
                          <span className="text-border">•</span>
                          <span>{evt.camera}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
                            <div className={`h-full rounded-full ${cfg.bar} transition-all`} style={{ width: `${evt.confidence}%` }} />
                          </div>
                          <span className={`font-mono text-[10px] font-semibold ${cfg.text} w-8 text-right tabular-nums`}>{evt.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Cameras + Critical Events */}
          <div className="flex flex-col gap-4">
            {/* Priority Feeds */}
            <div className={`rounded-xl bg-card border border-border/40 overflow-hidden ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "450ms" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Video className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-mono font-bold text-sm text-foreground">Priority Feeds</span>
                </div>
                <span className="font-mono text-[10px] text-tactical-green">● {cameras.length} online</span>
              </div>
              <div className="grid grid-cols-2 gap-0.5 p-0.5">
                {cameras.map((cam) => (
                  <div
                    key={cam.id}
                    className="relative bg-zinc-900 overflow-hidden cursor-pointer group"
                    style={{ aspectRatio: "16/9" }}
                    onClick={() => setSelectedCamera(cam)}
                  >
                    <video
                      src={cam.video}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 3px)" }} />
                    {/* Expand hint on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-muted/50 rounded-full p-2">
                        <Video className="h-5 w-5 text-foreground" />
                      </div>
                    </div>
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-tactical-red px-1.5 py-0.5 rounded text-white font-mono text-[8px] font-bold tracking-widest">
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                      LIVE
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="font-mono text-[9px] text-white/90 font-medium truncate">{cam.name}</p>
                      <p className="font-mono text-[8px] text-tactical-green tracking-widest">● ONLINE</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Events */}
            <div className={`rounded-xl bg-card border border-border/40 overflow-hidden flex-1 ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "500ms" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-tactical-red" />
                  <span className="font-mono font-bold text-sm text-foreground">Critical Events</span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">{criticalEvents.length} events</span>
              </div>
              <div className="divide-y divide-border/30">
                {criticalEvents.map((evt) => {
                  const Ic = evt.icon;
                  return (
                    <button
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className="w-full text-left px-4 py-3 hover:bg-tactical-red/5 transition-colors group border-l-2 border-tactical-red/60"
                    >
                      <div className="flex items-start gap-2.5">
                        <Ic className="h-3.5 w-3.5 text-tactical-red shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold text-foreground group-hover:text-tactical-red transition-colors truncate">{evt.title}</p>
                          <p className="font-mono text-[10px] text-muted-foreground truncate">{evt.location} • {evt.camera}</p>
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground tabular-nums shrink-0 ml-auto">{evt.time}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* System Modules */}
        <div>
          <h2 className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-3">System Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {modules.map((mod, i) => (
              <Link key={mod.id} href={mod.href}
                className={`group glow-border corner-accent rounded-lg p-5 bg-card noise-texture block transition-all hover:translate-y-[-2px] ${mounted ? "fade-in-up" : "opacity-0"}`}
                style={{ animationDelay: `${600 + i * 80}ms`, borderColor: "var(--border)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${mod.accentBg} border ${mod.accentBorder}`}>
                      <mod.icon className={`h-4 w-4 ${mod.accentColor}`} />
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-muted-foreground tracking-wider">{mod.id}</p>
                      <h3 className="font-semibold text-sm tracking-tight">{mod.title}</h3>
                    </div>
                  </div>
                  <span className={`font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded border ${mod.status === "LIVE" ? "text-tactical-green bg-tactical-green/10 border-tactical-green/30 blink" : "text-muted-foreground bg-muted/50 border-border"}`}>
                    {mod.status}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div>
                    <p className="font-mono text-[9px] text-muted-foreground tracking-wider uppercase">{mod.stats.label}</p>
                    <p className={`font-mono text-lg font-bold ${mod.accentColor}`}>{mod.stats.value}</p>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground group-hover:text-tactical-green transition-colors">
                    <span className="font-mono text-[10px] tracking-wide">OPEN</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {selectedCamera && (
        <CameraModal cam={selectedCamera} onClose={() => setSelectedCamera(null)} />
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </>
  );
}
