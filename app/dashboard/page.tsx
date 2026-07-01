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
  Lock,
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
  high: { bg: "bg-tactical-amber/15", text: "text-tactical-amber", border: "border-tactical-amber/40", badge: "HIGH RISK", bar: "bg-tactical-amber" },
  medium: { bg: "bg-tactical-cyan/15", text: "text-tactical-cyan", border: "border-tactical-cyan/40", badge: "MEDIUM RISK", bar: "bg-tactical-cyan" },
  low: { bg: "bg-tactical-green/15", text: "text-tactical-green", border: "border-tactical-green/40", badge: "LOW RISK", bar: "bg-tactical-green" },
};

const events: SecurityEvent[] = [
  {
    id: "EVT-001",
    title: "Queue Congestion Alert",
    location: "L1 Intl Departures Corridor",
    camera: "CAM-112",
    level: "high",
    confidence: 94,
    time: "14:23",
    timestamp: "06/03/2026, 14:23:11",
    icon: Users,
    description: "People in Queue Counter flagged high crowd density at departures corridor, with queue lengths exceeding safety limits.",
    action: "Coordinate queue lines. Dispatch marshals to manage crowd flow.",
    video: "/videos/counter_people in que.mp4",
  },
  {
    id: "EVT-002",
    title: "Queue Overcrowding",
    location: "L1 Terminal Entrance Queue",
    camera: "CAM-105",
    level: "medium",
    confidence: 91,
    time: "14:18",
    timestamp: "06/03/2026, 14:18:44",
    icon: Users,
    description: "Immigration Queue Counter flagged crowd congestion buildup near entrance corridor checkpost.",
    action: "Open auxiliary counter to distribute queue load.",
    video: "/videos/counter_people_que.mp4",
  },
  {
    id: "EVT-003",
    title: "Baggage Accumulation Alert",
    location: "L1 Arrivals Hall Carousel 4",
    camera: "CAM-108",
    level: "high",
    confidence: 95,
    time: "14:11",
    timestamp: "06/03/2026, 14:11:02",
    icon: AlertTriangle,
    description: "Baggage Count tracker flagged a high volume of luggage accumulating on Carousel 4.",
    action: "Direct baggage handlers to clear the carousel belt conveyor.",
    video: "/videos/bag_count_output baggeges.mp4",
  },
  {
    id: "EVT-004",
    title: "FIA Counter Overcrowding",
    location: "L2 Passport Control Queue",
    camera: "CAM-201",
    level: "critical",
    confidence: 97,
    time: "13:42",
    timestamp: "06/03/2026, 13:42:15",
    icon: Users,
    description: "Passport Control FIA Counter lines have exceeded 90% capacity, causing substantial bottlenecks.",
    action: "Notify immigration supervisors to activate backup check stations immediately.",
    video: "/videos/Fia_counter.mp4",
  },
  {
    id: "EVT-005",
    title: "Terminal Exit Traffic Alert",
    location: "L2 Terminal Departures Lane",
    camera: "CAM-205",
    level: "medium",
    confidence: 88,
    time: "13:30",
    timestamp: "06/03/2026, 13:30:08",
    icon: Camera,
    description: "Vehicle Traffic Exit tracker flagged congestion buildup at the terminal exit lanes.",
    action: "Deploy traffic wardens to clear and direct vehicle exits.",
    video: "/videos/vehicle_traffic_output_exit.mp4",
  },
  {
    id: "EVT-006",
    title: "Parking Plate Recognition Flag",
    location: "L2 Terminal Parking Area",
    camera: "CAM-208",
    level: "high",
    confidence: 92,
    time: "13:15",
    timestamp: "06/03/2026, 13:15:22",
    icon: Lock,
    description: "Plate Recognition flagged suspicious vehicle or unregistered license plate entering the secure parking zone.",
    action: "Crosscheck license plate in the main security database and alert nearest patrol unit.",
    video: "/videos/plate_recognition_output_parking_area.mp4",
  },
  {
    id: "EVT-007",
    title: "Counter Area Zone Breach",
    location: "L2 Counter Zone Tracker 1",
    camera: "CAM-212",
    level: "medium",
    confidence: 89,
    time: "12:55",
    timestamp: "06/03/2026, 12:55:40",
    icon: AlertTriangle,
    description: "Zone Tracker flagged passenger crossing secure boundary lines near counter area 1.",
    action: "Send terminal security agent to guide the passenger back.",
    video: "/videos/zone_tracker_output_1_counter_area.mp4",
  },
  {
    id: "EVT-008",
    title: "Counter Zone Tracking Alert",
    location: "L2 Counter Zone Tracker 2",
    camera: "CAM-215",
    level: "medium",
    confidence: 86,
    time: "12:40",
    timestamp: "06/03/2026, 12:40:11",
    icon: Eye,
    description: "Zone Tracker monitoring crowd movements and securing boundaries near counter area 2.",
    action: "Ensure queue barriers are properly aligned.",
    video: "/videos/zone_tracker_output_counter.mp4",
  },
  {
    id: "EVT-009",
    title: "Boarding Gate Face Detection",
    location: "L3 Boarding Gate 12 Exit",
    camera: "CAM-301",
    level: "high",
    confidence: 93,
    time: "12:15",
    timestamp: "06/03/2026, 12:15:55",
    icon: Eye,
    description: "Face Detection module active. Analyzing passenger flows and profiling at the airplane exit corridor.",
    action: "Verify boarding records and monitor exit flow.",
    video: "/videos/face+_detection_airplane_Exit.mp4",
  },
];

const cameras = [
  { id: "CAM-112", name: "L1 Departures Queue Counter",   video: "/videos/counter_people in que.mp4" },
  { id: "CAM-201", name: "L2 Passport Control FIA Counter", video: "/videos/Fia_counter.mp4" },
  { id: "CAM-205", name: "L2 Terminal Exit Vehicle Traffic",video: "/videos/vehicle_traffic_output_exit.mp4" },
  { id: "CAM-301", name: "L3 Boarding Gate 12 Exit",     video: "/videos/face+_detection_airplane_Exit.mp4" },
];

const modules = [
  { id: "MOD-01", title: "QRF Response", subtitle: "Threat Response & GPS Tracking", icon: Crosshair, href: "/dashboard/qrf", accentColor: "text-tactical-green", accentBg: "bg-tactical-green/10", accentBorder: "border-tactical-green/30", status: "LIVE", stats: { label: "Teams Active", value: "5" } },
  { id: "MOD-02", title: "Guard Compliance", subtitle: "License & Certification Tracking", icon: ShieldCheck, href: "/dashboard/compliance", accentColor: "text-tactical-cyan", accentBg: "bg-tactical-cyan/10", accentBorder: "border-tactical-cyan/30", status: "ACTIVE", stats: { label: "Compliance Rate", value: "94%" } },
  { id: "MOD-03", title: "Training Mgmt", subtitle: "Certification & Eligibility", icon: GraduationCap, href: "/dashboard/training", accentColor: "text-tactical-amber", accentBg: "bg-tactical-amber/10", accentBorder: "border-tactical-amber/30", status: "ACTIVE", stats: { label: "Fully Trained", value: "87%" } },
  { id: "MOD-04", title: "Deployment", subtitle: "Guard Deployment & Reserve Pool", icon: Users, href: "/dashboard/deployment", accentColor: "text-[#A78BFA]", accentBg: "bg-[#A78BFA]/10", accentBorder: "border-[#A78BFA]/30", status: "ACTIVE", stats: { label: "Guards Deployed", value: "40" } },
  { id: "MOD-05", title: "Alert System", subtitle: "WhatsApp Notifications & Escalation", icon: Bell, href: "/dashboard/alerts", accentColor: "text-tactical-red", accentBg: "bg-tactical-red/10", accentBorder: "border-tactical-red/30", status: "ACTIVE", stats: { label: "Alerts Today", value: "12" } },
  { id: "MOD-06", title: "AI Assistant", subtitle: "Natural Language Ops Intelligence", icon: Bot, href: "/dashboard/ai-assistant", accentColor: "text-tactical-green", accentBg: "bg-tactical-green/10", accentBorder: "border-tactical-green/30", status: "READY", stats: { label: "Queries Today", value: "34" } },
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
              { label: "Event Type", value: event.title },
              { label: "Location", value: event.location },
              { label: "Camera", value: event.camera },
              { label: "Timestamp", value: event.timestamp },
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
            <p className="text-sm text-muted-foreground font-mono mt-0.5">Real-time airport operational status across all security systems</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-tactical-green/10 border border-tactical-green/20">
            <Activity className="h-3.5 w-3.5 text-tactical-green" />
            <span className="font-mono text-[11px] text-tactical-green tracking-wide">ALL SYSTEMS NOMINAL</span>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Active Alerts", value: "10", icon: AlertTriangle, color: "text-tactical-red", bg: "bg-tactical-red/10", border: "border-tactical-red/20" },
            { label: "Active Incidents", value: "3", icon: Zap, color: "text-tactical-amber", bg: "bg-tactical-amber/10", border: "border-tactical-amber/20" },
            { label: "Guards On-Duty", value: "16", icon: Users, color: "text-tactical-cyan", bg: "bg-tactical-cyan/10", border: "border-tactical-cyan/20" },
            { label: "System Status", value: "OPERATIONAL", icon: Activity, color: "text-tactical-green", bg: "bg-tactical-green/10", border: "border-tactical-green/20" },
            { label: "Threat Level", value: "BRAVO", icon: Shield, color: "text-[#A78BFA]", bg: "bg-[#A78BFA]/10", border: "border-[#A78BFA]/20" },
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
