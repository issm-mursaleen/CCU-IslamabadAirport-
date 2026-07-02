"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useASF, type Zone, type Incident } from "@/components/asf-context";
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
  MapPin,
  Signal,
  Car,
  User,
  Cctv,
  Send,
  ChevronRight,
} from "lucide-react";

/* ── Dynamic import for Leaflet map (needs window) ── */
const TacticalMap = dynamic(() => import("@/components/tactical-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-card">
      <div className="flex items-center gap-2">
        <Signal className="h-4 w-4 text-tactical-green blink" />
        <span className="font-mono text-xs text-muted-foreground tracking-wider">
          LOADING COMMAND MAP...
        </span>
      </div>
    </div>
  ),
});

const zoneMeta: Record<Zone, { color: string; dot: string; label: string }> = {
  "Zone A": { color: "text-[#22c55e]", dot: "bg-[#22c55e]", label: "APPROACH ROAD" },
  "Zone B": { color: "text-[#f59e0b]", dot: "bg-[#f59e0b]", label: "TERMINAL" },
  "Zone C": { color: "text-[#ef4444]", dot: "bg-[#ef4444]", label: "RUNWAY / APRON" },
};

const zoneAlertStatusConfig: Record<string, { color: string; bg: string; border: string; label: string; icon: typeof Clock }> = {
  pending: { color: "text-tactical-amber", bg: "bg-tactical-amber/10", border: "border-tactical-amber/30", label: "PENDING", icon: Clock },
  dispatched: { color: "text-tactical-cyan", bg: "bg-tactical-cyan/10", border: "border-tactical-cyan/30", label: "RESPONDING", icon: Send },
  on_scene: { color: "text-tactical-red", bg: "bg-tactical-red/10", border: "border-tactical-red/30", label: "ON SCENE", icon: Radio },
  resolved: { color: "text-tactical-green", bg: "bg-tactical-green/10", border: "border-tactical-green/30", label: "RESOLVED", icon: CheckCircle2 },
};

const unitStatusDot: Record<string, string> = {
  available: "bg-tactical-green",
  en_route: "bg-tactical-amber",
  on_scene: "bg-tactical-red",
  dispatched: "bg-tactical-amber",
};

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

function IncidentDetailModal({ incident, onClose }: { incident: Incident; onClose: () => void }) {
  const sc = zoneAlertStatusConfig[incident.status];
  const StatusIcon = sc.icon;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-2xl bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-secondary/20">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs bg-tactical-red/10 border border-tactical-red/35 px-2 py-0.5 rounded text-tactical-red font-bold">
              {incident.id}
            </span>
            <h2 className="font-mono font-bold text-foreground text-sm tracking-tight uppercase">
              {incident.type} — Zone Alert
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5 font-mono text-xs">
          {/* Status and Zone */}
          <div className="flex flex-wrap gap-2.5">
            <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-1 rounded-md border ${sc.bg} ${sc.color} ${sc.border} uppercase tracking-wider`}>
              <StatusIcon className="h-3 w-3" />
              {sc.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-1 rounded-md border bg-secondary/40 border-border uppercase tracking-wider ${zoneMeta[incident.zone].color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${zoneMeta[incident.zone].dot}`} />
              {incident.zone}
            </span>
          </div>

          {/* Details Table */}
          <div className="space-y-0 rounded-xl border border-border/40 overflow-hidden bg-secondary/20">
            {[
              { label: "Site Location", value: incident.site },
              { label: "Reporting Cam", value: incident.camera },
              { label: "Report Time", value: incident.reported },
              { label: "Required Capability", value: incident.requiredCap.toUpperCase() },
            ].map(({ label, value }, i, arr) => (
              <div key={label} className={`flex items-center justify-between px-5 py-3 ${i !== arr.length - 1 ? "border-b border-border/20" : ""}`}>
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</span>
                <span className="font-semibold text-foreground text-right">{value}</span>
              </div>
            ))}
          </div>

          {/* Matches Payload Details */}
          {incident.detail && (
            <div className="rounded-xl border border-border/40 bg-secondary/20 p-4 space-y-3.5">
              <span className="block text-[9px] text-muted-foreground tracking-[0.18em] uppercase font-bold">MATCH RETRIEVAL SUMMARY</span>
              <div className="grid grid-cols-2 gap-4">
                {incident.detail.plate && (
                  <div className="bg-card border border-border/40 p-2.5 rounded">
                    <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">LICENSE PLATE</span>
                    <span className="font-bold text-tactical-red text-sm tracking-widest">{incident.detail.plate}</span>
                  </div>
                )}
                {incident.detail.vehicleDesc && (
                  <div className="bg-card border border-border/40 p-2.5 rounded">
                    <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">VEHICLE</span>
                    <span className="font-bold text-foreground">{incident.detail.vehicleDesc}</span>
                  </div>
                )}
                {incident.detail.personName && (
                  <div className="bg-card border border-border/40 p-2.5 rounded">
                    <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">SUSPECT NAME</span>
                    <span className="font-bold text-foreground">{incident.detail.personName}</span>
                  </div>
                )}
                {incident.detail.personId && (
                  <div className="bg-card border border-border/40 p-2.5 rounded">
                    <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">SUSPECT ID</span>
                    <span className="font-bold text-tactical-amber">{incident.detail.personId}</span>
                  </div>
                )}
                {incident.detail.passport && (
                  <div className="bg-card border border-border/40 p-2.5 rounded">
                    <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">PASSPORT</span>
                    <span className="font-bold text-foreground">{incident.detail.passport} ({incident.detail.nationality})</span>
                  </div>
                )}
                {incident.detail.flight && (
                  <div className="bg-card border border-border/40 p-2.5 rounded">
                    <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">FLIGHT</span>
                    <span className="font-bold text-tactical-cyan">{incident.detail.flight}</span>
                  </div>
                )}
                {incident.detail.flagReason && (
                  <div className="bg-card border border-border/40 p-2.5 rounded col-span-2">
                    <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">FLAG REASON</span>
                    <span className="text-foreground/90">{incident.detail.flagReason}</span>
                  </div>
                )}
                {incident.detail.firNo && (
                  <div className="bg-card border border-border/40 p-2.5 rounded">
                    <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">FIR NO</span>
                    <span className="font-bold text-foreground">{incident.detail.firNo}</span>
                  </div>
                )}
                {incident.detail.complainant && (
                  <div className="bg-card border border-border/40 p-2.5 rounded col-span-2">
                    <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">COMPLAINANT INFO</span>
                    <span className="text-foreground">{incident.detail.complainant} (Contact: {incident.detail.contact})</span>
                  </div>
                )}
                {incident.detail.peopleCount && (
                  <div className="bg-card border border-border/40 p-2.5 rounded">
                    <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">PEOPLE COUNT</span>
                    <span className="font-bold text-tactical-amber text-sm">{incident.detail.peopleCount} / Limit {incident.detail.threshold}</span>
                  </div>
                )}
                {incident.detail.waitTime && (
                  <div className="bg-card border border-border/40 p-2.5 rounded">
                    <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">WAIT TIME</span>
                    <span className="font-bold text-foreground">{incident.detail.waitTime}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="rounded-xl border border-border/40 bg-secondary/40 p-4 space-y-1.5">
            <span className="block text-[9px] text-muted-foreground tracking-[0.18em] uppercase font-bold">INCIDENT OVERVIEW</span>
            <p className="text-foreground/90 leading-relaxed">{incident.description}</p>
          </div>

          {/* Live Video Stream */}
          {incident.videoSrc && (
            <div className="space-y-2">
              <span className="block text-[9px] text-muted-foreground tracking-[0.18em] uppercase font-bold">RETRIEVED VIDEO CAPTURE</span>
              <div className="rounded-xl overflow-hidden border border-border/40 relative bg-zinc-900" style={{ aspectRatio: "16/9" }}>
                <video
                  src={incident.videoSrc}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-tactical-red px-2 py-0.5 rounded text-white font-mono text-[8px] font-bold tracking-widest z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  FEED RECORD
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 border border-white/10 px-2 py-1 rounded backdrop-blur z-10 text-[9px]">
                  {incident.camera}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-border/40 bg-secondary/20 flex gap-3">
          <Link
            href="/dashboard/asf"
            className="flex-1 bg-tactical-cyan hover:bg-tactical-cyan/90 text-black font-mono text-[11px] font-bold py-2.5 rounded transition-colors tracking-wider uppercase text-center"
          >
            DISPATCH RESPONDING PATROL
          </Link>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-secondary hover:bg-secondary/70 border border-border/60 text-foreground font-mono text-[11px] font-bold rounded transition-colors uppercase cursor-pointer"
          >
            Close Details
          </button>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { groups, incidents } = useASF();
  const [mounted, setMounted] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<typeof cameras[0] | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState<Incident | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const activeZoneAlerts = incidents.filter((i) => i.status !== "resolved");
  const officers = groups.filter((g) => g.unitType === "officer");
  const vehicles = groups.filter((g) => g.unitType === "vehicle");
  const totalPersonnel = groups.reduce((sum, g) => sum + g.personnel, 0);

  const byZone = useMemo(() => {
    const zones: Zone[] = ["Zone A", "Zone B", "Zone C"];
    return zones.map((zone) => ({
      zone,
      units: groups.filter((g) => g.zone === zone),
      alerts: incidents.filter((i) => i.zone === zone && i.status !== "resolved").length,
    }));
  }, [groups, incidents]);

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-mono text-foreground">Command Centre Overview</h1>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">Real-time airport operational status across all security systems</p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active Alerts", value: "10", icon: AlertTriangle, color: "text-tactical-red", bg: "bg-tactical-red/10", border: "border-tactical-red/20" },
            { label: "Zone Incidents", value: String(activeZoneAlerts.length), icon: Zap, color: "text-tactical-amber", bg: "bg-tactical-amber/10", border: "border-tactical-amber/20" },
            { label: "ASF Deployed", value: `${totalPersonnel}`, icon: Users, color: "text-tactical-cyan", bg: "bg-tactical-cyan/10", border: "border-tactical-cyan/20" },
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

        {/* ── COMMAND & CONTROL: zone map + alerts + deployed forces ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4">
          {/* Command map */}
          <div
            className={`glow-border rounded-xl bg-card noise-texture relative overflow-hidden border border-border/40 ${
              mounted ? "fade-in-up" : "opacity-0"
            }`}
            style={{ animationDelay: "300ms" }}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-tactical-cyan" />
                <span className="font-mono font-bold text-sm text-foreground">Command &amp; Control — Zone Map</span>
              </div>
              <div className="flex items-center gap-3">
                {(Object.keys(zoneMeta) as Zone[]).map((z) => (
                  <span key={z} className={`flex items-center gap-1 font-mono text-[9px] ${zoneMeta[z].color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${zoneMeta[z].dot}`} />
                    {z}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative w-full" style={{ height: "560px" }}>
              <TacticalMap
                groups={groups.map((t) => ({
                  id: t.id,
                  callsign: t.callsign,
                  lat: t.lat,
                  lng: t.lng,
                  status: t.status,
                  heading: t.heading,
                  unitType: t.unitType,
                  rank: t.rank,
                  name: t.name,
                  vehicle: t.vehicle,
                  personnel: t.personnel,
                  driver: t.driver,
                  assignedTo: t.assignedTo,
                  destination: t.destination,
                  eta: t.eta,
                }))}
                incidents={incidents.map((i) => ({
                  id: i.id,
                  type: i.type,
                  typeCode: i.typeCode,
                  status: i.status,
                  lat: i.lat,
                  lng: i.lng,
                }))}
                selectedGroup={selectedGroup}
                selectedIncident={selectedIncident}
                onSelectGroup={setSelectedGroup}
                onSelectIncident={setSelectedIncident}
                fitAllZones
              />
            </div>

            <div className="flex items-center gap-4 px-4 py-2 border-t border-border/40 flex-wrap">
              {[
                { color: "bg-tactical-green", label: "Available" },
                { color: "bg-tactical-amber", label: "En Route" },
                { color: "bg-tactical-red", label: "On Scene" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${l.color}`} />
                  <span className="font-mono text-[9px] text-muted-foreground">{l.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <Car className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-[9px] text-muted-foreground">Vehicle ({vehicles.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-[9px] text-muted-foreground">Officer ({officers.length})</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="w-2 h-2 rounded-sm rotate-45 border border-tactical-red bg-tactical-red/20" />
                <span className="font-mono text-[9px] text-muted-foreground">Alert</span>
              </div>
            </div>
          </div>

          {/* Zone alerts + deployed forces */}
          <div className="flex flex-col gap-4">
            {/* Zone alerts */}
            <div
              className={`glow-border rounded-xl bg-card noise-texture overflow-hidden border border-border/40 ${
                mounted ? "fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: "350ms" }}
            >
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
                <AlertTriangle className="h-3.5 w-3.5 text-tactical-red" />
                <span className="font-mono font-bold text-sm text-foreground">Zone Alerts</span>
                <Link
                  href="/dashboard/asf"
                  className="ml-auto flex items-center gap-1 font-mono text-[9px] text-tactical-cyan hover:underline"
                >
                  OPEN ASF OPS <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y divide-border/30 max-h-[240px] overflow-y-auto">
                {incidents.map((inc) => {
                  const sc = zoneAlertStatusConfig[inc.status];
                  const StatusIcon = sc.icon;
                  const isSelected = selectedIncident === inc.id;
                  return (
                    <div
                      key={inc.id}
                      className={`px-3 py-2.5 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-tactical-green/5 border-l-2 border-l-tactical-green"
                          : "hover:bg-accent/20 border-l-2 border-l-transparent"
                      }`}
                      onClick={() => {
                        setSelectedIncident(inc.id);
                        setSelectedIncidentDetail(inc);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold">{inc.id}</span>
                          <span className={`flex items-center gap-1 font-mono text-[9px] ${zoneMeta[inc.zone].color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${zoneMeta[inc.zone].dot}`} />
                            {inc.zone}
                          </span>
                        </div>
                        <span className={`inline-flex items-center gap-1 font-mono text-[8px] tracking-wider px-1.5 py-0.5 rounded border ${sc.bg} ${sc.color} ${sc.border}`}>
                          <StatusIcon className="h-2.5 w-2.5" />
                          {sc.label}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-foreground mb-0.5">{inc.type}</p>
                      <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Cctv className="h-2.5 w-2.5" />
                          {inc.camera}
                        </span>
                        <span className="text-muted-foreground/40">|</span>
                        <span>{inc.reported}</span>
                      </div>
                      {inc.assignedGroup && (
                        <div className="mt-1 flex items-center gap-1 font-mono text-[9px]">
                          <ShieldCheck className="h-2.5 w-2.5 text-tactical-cyan" />
                          <span className="text-tactical-cyan">
                            {groups.find((g) => g.id === inc.assignedGroup)?.callsign || inc.assignedGroup} responding
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deployed forces by zone */}
            <div
              className={`glow-border rounded-xl bg-card noise-texture overflow-hidden border border-border/40 flex-1 ${
                mounted ? "fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: "400ms" }}
            >
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
                <Users className="h-3.5 w-3.5 text-tactical-green" />
                <span className="font-mono font-bold text-sm text-foreground">Deployed ASF Forces</span>
                <span className="font-mono text-[9px] text-muted-foreground ml-auto">
                  {groups.length} units · {totalPersonnel} personnel
                </span>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {byZone.map(({ zone, units, alerts }) => (
                  <div key={zone}>
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary/40 border-y border-border/30">
                      <span className={`h-2 w-2 rounded-full ${zoneMeta[zone].dot}`} />
                      <span className={`font-mono text-[10px] font-bold tracking-wider ${zoneMeta[zone].color}`}>
                        {zone} — {zoneMeta[zone].label}
                      </span>
                      <span className="ml-auto font-mono text-[9px] text-muted-foreground">
                        {units.filter((u) => u.unitType === "officer").length} officers · {units.filter((u) => u.unitType === "vehicle").length} vehicles
                        {alerts > 0 && <span className="text-tactical-red font-bold"> · {alerts} alert{alerts > 1 ? "s" : ""}</span>}
                      </span>
                    </div>
                    <div className="divide-y divide-border/20">
                      {units.map((unit) => {
                        const isSelected = selectedGroup === unit.id;
                        return (
                          <div
                            key={unit.id}
                            className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-all ${
                              isSelected
                                ? "bg-tactical-green/5 border-l-2 border-l-tactical-green"
                                : "hover:bg-accent/20 border-l-2 border-l-transparent"
                            }`}
                            onClick={() => setSelectedGroup(unit.id)}
                          >
                            <div className={`h-7 w-7 rounded-md border flex items-center justify-center shrink-0 ${
                              unit.unitType === "officer"
                                ? "bg-tactical-cyan/10 border-tactical-cyan/30"
                                : "bg-tactical-green/10 border-tactical-green/30"
                            }`}>
                              {unit.unitType === "officer" ? (
                                <User className="h-3.5 w-3.5 text-tactical-cyan" />
                              ) : (
                                <Car className="h-3.5 w-3.5 text-tactical-green" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1 font-mono">
                              <p className="text-[10px] font-bold truncate">
                                {unit.callsign} <span className="text-muted-foreground font-normal">· {unit.name}</span>
                              </p>
                              <p className="text-[9px] text-muted-foreground truncate">
                                {unit.unitType === "officer" ? `${unit.rank} · ${unit.assignedTo}` : `${unit.vehicle} · ${unit.personnel} crew`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`h-1.5 w-1.5 rounded-full ${unitStatusDot[unit.status] || "bg-muted"}`} />
                              <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-wider">
                                {unit.status.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {units.length === 0 && (
                        <div className="px-4 py-3 text-center">
                          <p className="font-mono text-[9px] text-muted-foreground">No units in this zone.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

      {/* Incident Detail Modal */}
      {selectedIncidentDetail && (
        <IncidentDetailModal incident={selectedIncidentDetail} onClose={() => setSelectedIncidentDetail(null)} />
      )}
    </>
  );
}
