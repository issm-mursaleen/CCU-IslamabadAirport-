"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useASF, seedIncidents, type Zone, type Incident, type ASFGroup } from "@/components/asf-context";
import { DigitalTwin3D } from "@/components/digital-twin";
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
  FileText,
  Plane,
  Luggage,
  Box,
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
  icon: typeof Users;
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
    video: "/videos/counter_people_que.mp4",
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
    video: "/videos/zone_tracker_output_counter.mp4",
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
    video: "/videos/Fia_counter.mp4",
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
  },
  {
    id: "EVT-010",
    title: "Unattended Baggage Alert",
    location: "L1 Arrivals Hall Carousel 4",
    camera: "CAM-108",
    level: "critical",
    confidence: 95,
    time: "14:15",
    timestamp: "06/03/2026, 14:15:22",
    icon: Luggage,
    description: "CCTV object analytics flagged unclaimed luggage left unattended near Carousel 4. Subject custody lost for over 8 minutes.",
    action: "Isolate immediate zone. Dispatch terminal security unit for manual check.",
    video: "/videos/bag_count_output baggeges.mp4",
  },
];

const cameras = [
  { id: "CAM-112", name: "L1 Departures Queue Counter",   video: "/videos/counter_people_que.mp4" },
  { id: "CAM-201", name: "L2 Passport Control FIA Counter", video: "/videos/zone_tracker_output_counter.mp4" },
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
  const [showFirDetail, setShowFirDetail] = useState(false);
  const [showFlightBoard, setShowFlightBoard] = useState(false);
  const [activeFlightTab, setActiveFlightTab] = useState<"arrivals" | "departures">("arrivals");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // States for Event 203 custom tripwire positioning and counting
  const [evt203Count, setEvt203Count] = useState(46);
  const [evt203LastCrossed, setEvt203LastCrossed] = useState(false);

  // States for Unattended Baggage dynamic timer
  const [unattendedBagTime, setUnattendedBagTime] = useState(492); // starts at 8 min 12 sec (492s)

  useEffect(() => {
    if (incident.id !== "EVT-203") return;
    setEvt203Count(46); // Reset to 46 when modal opens
    const id = setInterval(() => {
      setEvt203Count((prev) => prev + 1);
      setEvt203LastCrossed(true);
      setTimeout(() => setEvt203LastCrossed(false), 700);
    }, 5000);
    return () => clearInterval(id);
  }, [incident.id]);

  useEffect(() => {
    if (incident.id === "EVT-208" || incident.id === "EVT-010") {
      setUnattendedBagTime(492); // 8 min 12 sec
    } else if (incident.id === "EVT-207") {
      setUnattendedBagTime(342); // 5 min 42 sec
    } else {
      return;
    }
    const id = setInterval(() => {
      setUnattendedBagTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [incident.id]);

  const formatUnattendedTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m} min ${s} sec`;
  };

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
          {incident.kind === "stolen_vehicle" || incident.id === "EVT-205" || incident.id === "EVT-206" || incident.kind === "unattended_baggage" ? (
            <>
              {/* Top Row: Split 50/50 */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_150px] gap-5">
                {/* Left Side: Basic Info */}
                <div className="space-y-4">
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
                      <div key={label} className={`flex items-center justify-between px-4 py-2.5 ${i !== arr.length - 1 ? "border-b border-border/20" : ""}`}>
                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</span>
                        <span className="font-semibold text-foreground text-right">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Suspect Meta or Plate/Vehicle specs */}
                  {incident.kind === "flagged_person" ? (
                    <div className="grid grid-cols-2 gap-3 font-mono">
                      <div className="bg-card border border-border/40 p-2.5 rounded">
                        <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">SUSPECT NAME</span>
                        <span className="font-bold text-foreground text-xs">{incident.detail?.personName}</span>
                      </div>
                      <div className="bg-card border border-border/40 p-2.5 rounded">
                        <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">CNIC ID NUMBER</span>
                        <span className="font-bold text-tactical-red text-xs tracking-widest">{incident.id === "EVT-206" ? "34462-7850701-1" : "61101-9876543-1"}</span>
                      </div>
                      <div className="bg-card border border-border/40 p-2.5 rounded">
                        <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">NATIONALITY</span>
                        <span className="font-bold text-foreground text-xs">{incident.detail?.nationality}</span>
                      </div>
                      <div className="bg-card border border-border/40 p-2.5 rounded">
                        <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">PASSPORT</span>
                        <span className="font-bold text-tactical-cyan text-xs">{incident.detail?.passport}</span>
                      </div>
                      <div className="bg-card border border-border/40 p-2.5 rounded col-span-2">
                        <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">MATCH DETAILS & THREAT</span>
                        <div className="flex justify-between items-center mt-0.5">
                          <span className="text-tactical-red font-bold text-[10px]">{incident.detail?.threatLevel} THREAT</span>
                          <span className="text-tactical-amber font-bold text-[10px]">{incident.detail?.confidence}% MATCH</span>
                        </div>
                        <span className="text-muted-foreground text-[10px] block mt-1">{incident.detail?.flagReason}</span>
                      </div>
                    </div>
                  ) : incident.kind === "unattended_baggage" ? (
                    <div className="grid grid-cols-2 gap-3 font-mono">
                      <div className="bg-card border border-border/40 p-2.5 rounded">
                        <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">BAGGAGE DESCRIPTION</span>
                        <span className="font-bold text-foreground text-xs">{incident.detail?.bagDesc}</span>
                      </div>
                      <div className="bg-card border border-border/40 p-2.5 rounded">
                        <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">ABANDONED TIME</span>
                        <span className="font-bold text-tactical-red text-xs tracking-widest">{formatUnattendedTime(unattendedBagTime)}</span>
                      </div>
                      <div className="bg-card border border-border/40 p-2.5 rounded">
                        <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">LAST KNOWN LOCATION</span>
                        <span className="font-bold text-foreground text-xs">{incident.detail?.lastLocation}</span>
                      </div>
                      <div className="bg-card border border-border/40 p-2.5 rounded">
                        <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">THERMAL HEAT SIGNATURE</span>
                        <span className="font-bold text-tactical-cyan text-xs">{incident.detail?.thermalSignature}</span>
                      </div>
                      <div className="bg-card border border-border/40 p-2.5 rounded col-span-2">
                        <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">AI ALERT ANALYSIS</span>
                        <div className="flex justify-between items-center mt-0.5">
                          <span className="text-tactical-red font-bold text-[10px]">{incident.detail?.threatLevel} THREAT RISK</span>
                          <span className="text-tactical-amber font-bold text-[10px]">{incident.detail?.confidence}% CONFIDENCE</span>
                        </div>
                        <span className="text-muted-foreground text-[10px] block mt-1">{incident.detail?.alertTrigger}</span>
                      </div>
                    </div>
                  ) : (
                    /* stolen vehicle specs */
                    incident.detail && (
                      <div className="grid grid-cols-2 gap-3">
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
                      </div>
                    )
                  )}
                </div>

                {/* Right Side: Images */}
                <div className="flex flex-col gap-3 self-start">
                  {incident.kind === "flagged_person" ? (
                    <>
                      {/* Face Image */}
                      <div 
                        onClick={() => setZoomedImage(incident.detail?.faceImage || "/suspect_face.jpg")}
                        className="relative aspect-[4/3] rounded-lg overflow-hidden border border-tactical-red/35 bg-black group shadow-md cursor-zoom-in hover:border-tactical-red/60 transition-all duration-300"
                      >
                        <img 
                          src={incident.detail?.faceImage || "/suspect_face.jpg"} 
                          alt="Face Capture" 
                          className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-tactical-red text-white text-[7px] font-bold font-mono tracking-widest animate-pulse">
                          CCTV FACE
                        </div>
                      </div>
                      {/* CNIC Image */}
                      <div 
                        onClick={() => setZoomedImage(incident.detail?.cnicImage || "/suspect_cnic.jpg")}
                        className="relative aspect-[4/3] rounded-lg overflow-hidden border border-tactical-red/35 bg-black group shadow-md cursor-zoom-in hover:border-tactical-red/60 transition-all duration-300"
                      >
                        <img 
                          src={incident.detail?.cnicImage || "/suspect_cnic.jpg"} 
                          alt="CNIC Database" 
                          className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-tactical-green text-white text-[7px] font-bold font-mono tracking-widest">
                          CNIC COPY
                        </div>
                      </div>
                    </>
                  ) : incident.kind === "unattended_baggage" ? (
                    <div 
                      onClick={() => setZoomedImage(incident.detail?.bagImage || "/unattended_blue_bag.png")}
                      className="relative aspect-[4/3] rounded-lg overflow-hidden border border-tactical-red/35 bg-black group shadow-md cursor-zoom-in hover:border-tactical-red/60 transition-all duration-300"
                    >
                      <img 
                        src={incident.detail?.bagImage || "/unattended_blue_bag.png"} 
                        alt="Unattended Baggage" 
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-tactical-red text-white text-[7px] font-bold font-mono tracking-widest animate-pulse">
                        FLAGGED: {incident.id === "EVT-207" ? "5 MINS" : "8 MINS"}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Vehicle Image */}
                      <div 
                        onClick={() => setZoomedImage("/flagged_vehicle.png")}
                        className="relative aspect-[4/3] rounded-lg overflow-hidden border border-tactical-red/35 bg-black group shadow-md cursor-zoom-in hover:border-tactical-red/60 transition-all duration-300"
                      >
                        <img 
                          src="/flagged_vehicle.png" 
                          alt="Flagged Stolen Vehicle" 
                          className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-tactical-red text-white text-[7px] font-bold font-mono tracking-widest animate-pulse">
                          FLAGGED VEHICLE
                        </div>
                      </div>
                      {/* Plate close-up image */}
                      <div 
                        onClick={() => setZoomedImage("/flagged_plate.png")}
                        className="relative aspect-[4/3] rounded-lg overflow-hidden border border-tactical-red/35 bg-black group shadow-md cursor-zoom-in hover:border-tactical-red/60 transition-all duration-300"
                      >
                        <img 
                          src="/flagged_plate.png" 
                          alt="Flagged Vehicle Plate" 
                          className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-tactical-green text-white text-[7px] font-bold font-mono tracking-widest">
                          ANPR CAPTURE
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ECL Watchlist Info Section */}
              {incident.kind === "flagged_person" && incident.detail ? (
                <div
                  onClick={() => setShowFirDetail(true)}
                  className="flex gap-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors group w-full"
                >
                  {/* White Document Preview Thumbnail */}
                  <div className="relative h-16 w-12 rounded overflow-hidden border border-zinc-300 bg-white p-1.5 flex flex-col justify-between shrink-0 select-none shadow-sm">
                    <div className="flex flex-col items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600 mb-0.5" />
                      <span className="text-[3px] text-zinc-950 scale-90 font-bold block leading-[1.1] uppercase text-center font-sans">ECL</span>
                      <div className="w-6 h-px bg-zinc-300 my-0.5" />
                      <div className="space-y-[1px]">
                        <div className="w-6 h-[1.5px] bg-zinc-400" />
                        <div className="w-6 h-[1.5px] bg-zinc-400" />
                        <div className="w-6 h-[1.5px] bg-red-500" />
                      </div>
                    </div>
                    <span className="text-[3px] text-zinc-950 scale-75 font-sans font-bold leading-none block text-center tracking-[0.1em] uppercase">GOVT</span>
                  </div>

                  <div className="flex-1 min-w-0 font-mono">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText className="h-3.5 w-3.5 text-tactical-red" />
                      <span className="text-[10px] font-bold text-tactical-red tracking-wider uppercase">
                        ECL WATCHLIST MATCH DETECTED
                      </span>
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-relaxed font-mono">
                      ECL Entry No: <span className="text-foreground font-bold">{incident.detail.firNo}</span> · Ministry of Interior
                      <br />Name: <span className="text-foreground font-bold">{incident.detail.personName}</span> · CNIC: <span className="text-tactical-red font-bold">{incident.id === "EVT-206" ? "34462-7850701-1" : "61101-9876543-1"}</span>
                    </p>
                    <span className="text-[8px] text-tactical-cyan tracking-widest uppercase group-hover:underline block mt-0.5">
                      Click to view scanned Exit Control List (ECL) →
                    </span>
                  </div>
                </div>
              ) : (
                incident.detail?.firImage && (
                  <div
                    onClick={() => setShowFirDetail(true)}
                    className="flex gap-3 p-3 rounded-lg bg-tactical-red/5 border border-tactical-red/25 cursor-pointer hover:border-tactical-red/50 transition-colors group"
                  >
                    <div className="relative h-16 w-12 rounded overflow-hidden border border-border shrink-0 bg-black">
                      <img src={incident.detail.firImage} alt="Scanned Document" className="h-full w-full object-cover opacity-90" />
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-tactical-green/80 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0 font-mono">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FileText className="h-3.5 w-3.5 text-tactical-red" />
                        <span className="text-[10px] font-bold text-tactical-red tracking-wider">
                          FIR MATCH — SCANNED DOCUMENT
                        </span>
                      </div>
                      <p className="text-[9px] text-muted-foreground leading-relaxed font-mono">
                        FIR No. <span className="text-foreground font-bold">{incident.detail.firNo}</span> · PS Airport, Rawalpindi
                        <br />Dated {incident.detail.firDate} · Plate <span className="text-tactical-red font-bold">{incident.detail.plate}</span>
                      </p>
                      <span className="text-[8px] text-tactical-cyan tracking-widest uppercase group-hover:underline block mt-0.5">
                        Click to view scanned FIR →
                      </span>
                    </div>
                  </div>
                )
              )}

              {/* Live Video Feed Section */}
              {incident.videoSrc && (
                <div className="space-y-2">
                  <span className="block text-[9px] text-muted-foreground tracking-[0.18em] uppercase font-bold">RETRIEVED VIDEO CAPTURE</span>
                  <div className="rounded-xl overflow-hidden border border-border/40 relative bg-zinc-900" style={{ aspectRatio: "16/9" }}>
                    <video
                      key={incident.videoSrc}
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

              {/* Description */}
              <div className="rounded-xl border border-border/40 bg-secondary/40 p-4 space-y-1.5">
                <span className="block text-[9px] text-muted-foreground tracking-[0.18em] uppercase font-bold">INCIDENT OVERVIEW</span>
                <p className="text-foreground/90 leading-relaxed">{incident.description}</p>
              </div>
            </>
          ) : (
            <>
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
                    <>
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
                    </>
                    {incident.detail.peopleCount && (
                      <>
                        <div className="bg-card border border-border/40 p-2.5 rounded">
                          <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">PEOPLE COUNT</span>
                          <span className="font-bold text-tactical-amber text-sm">{incident.id === "EVT-203" ? evt203Count : incident.detail.peopleCount} / Limit {incident.detail.threshold}</span>
                        </div>
                        <div className="bg-card border border-border/40 p-2.5 rounded">
                          <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">CONGESTION TARGET</span>
                          <span className="font-bold text-tactical-amber text-xs">Istanbul Flight (TK-711)</span>
                        </div>
                      </>
                    )}
                    {incident.detail.waitTime && (
                      <div className="bg-card border border-border/40 p-2.5 rounded">
                        <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">WAIT TIME</span>
                        <span className="font-bold text-foreground">{incident.detail.waitTime}</span>
                      </div>
                    )}
                    {incident.detail.bagDesc && (
                      <>
                        <div className="bg-card border border-border/40 p-2.5 rounded">
                          <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">BAGGAGE DESCRIPTION</span>
                          <span className="font-bold text-tactical-red text-xs">{incident.detail.bagDesc}</span>
                        </div>
                        <div className="bg-card border border-border/40 p-2.5 rounded">
                          <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">ABANDONED TIME</span>
                          <span className="font-bold text-tactical-amber text-xs">{formatUnattendedTime(unattendedBagTime)}</span>
                        </div>
                        <div className="bg-card border border-border/40 p-2.5 rounded">
                          <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">THERMAL SIGNATURE</span>
                          <span className="font-bold text-foreground text-xs">{incident.detail.thermalSignature}</span>
                        </div>
                        <div className="bg-card border border-border/40 p-2.5 rounded col-span-2">
                          <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">REMEDIAL ACTION</span>
                          <span className="font-bold text-tactical-cyan text-[10px] leading-relaxed">{incident.detail.remedialAction}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="rounded-xl border border-border/40 bg-secondary/40 p-4 space-y-2.5">
                <span className="block text-[9px] text-muted-foreground tracking-[0.18em] uppercase font-bold">INCIDENT OVERVIEW</span>
                {incident.kind === "queue_congestion" && incident.detail ? (
                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <span className="block text-[9px] text-muted-foreground tracking-wider uppercase mb-1">Queue Diagnostics</span>
                      <ul className="list-disc pl-4 space-y-1 text-foreground/90">
                        <li>Counted People: <span className="text-tactical-amber font-bold">{incident.id === "EVT-203" ? evt203Count : incident.detail.peopleCount} pax</span> (Above safety limit of {incident.detail.threshold})</li>
                        <li>Current Wait Time: <span className="text-tactical-cyan font-bold">{incident.detail.waitTime}</span></li>
                        <li>Affected Counter Area: <span className="text-foreground font-bold">{incident.detail.counter}</span></li>
                      </ul>
                    </div>
                    <div>
                      <span className="block text-[9px] text-muted-foreground tracking-wider uppercase mb-1">Congestion Cause</span>
                      <p className="text-muted-foreground leading-relaxed">
                        {incident.id === "EVT-203" 
                          ? "Boarding backlog for Turkish Airlines flight TK-711 to Istanbul (IST). Departure processing is delayed due to high passenger volume, causing crowd buildup at checkpoints."
                          : "Processing bottleneck for Turkish Airlines flight TK-711 to Istanbul (IST). Security clearance delays at immigration counters are backing up into the main concourse area, requiring additional lane activation."
                        }
                      </p>
                    </div>
                  </div>
                ) : incident.kind === "unattended_baggage" && incident.detail ? (
                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <span className="block text-[9px] text-muted-foreground tracking-wider uppercase mb-1">Baggage Diagnostics</span>
                      <ul className="list-disc pl-4 space-y-1 text-foreground/90">
                        <li>Description: <span className="text-tactical-red font-bold">{incident.detail.bagDesc}</span></li>
                        <li>Abandoned Duration: <span className="text-tactical-amber font-bold">{formatUnattendedTime(unattendedBagTime)}</span></li>
                        <li>Alert Trigger: <span className="text-foreground/95">{incident.detail.alertTrigger}</span></li>
                        <li>Threat Level: <span className="text-tactical-red font-bold">{incident.detail.threatLevel}</span></li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground/90 leading-relaxed">{incident.description}</p>
                )}
              </div>

              {/* Flight schedule correlation trigger widget */}
              {incident.kind === "queue_congestion" && incident.detail && (
                <div
                  onClick={() => {
                    setActiveFlightTab(incident.id === "EVT-204" ? "arrivals" : "departures");
                    setShowFlightBoard(true);
                  }}
                  className="flex gap-3 p-3 rounded-lg bg-zinc-950 border border-zinc-850 cursor-pointer hover:border-zinc-700 transition-colors group w-full"
                >
                  {/* Tiny styled departures board icon with a blue header */}
                  <div className="relative h-16 w-12 rounded overflow-hidden border border-zinc-700 bg-zinc-950 p-1 flex flex-col justify-between shrink-0 select-none shadow-sm">
                    <div className="bg-[#0B4F6C]/30 px-1 py-0.5 rounded-[2px] text-center border border-[#0B4F6C]/40">
                      <span className="text-[3px] text-[#0B4F6C] font-bold block scale-90 font-sans uppercase">{incident.id === "EVT-204" ? "ARR" : "DEP"}</span>
                    </div>
                    <div className="space-y-[1px] flex-1 mt-1">
                      <div className="h-1.5 bg-zinc-800 rounded-[1px] flex justify-between px-0.5 items-center">
                        <div className="w-4 h-[2px] bg-zinc-600" />
                        <div className="w-2 h-[2px] bg-tactical-green" />
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-[1px] flex justify-between px-0.5 items-center">
                        <div className="w-4 h-[2px] bg-zinc-600" />
                        <div className="w-2 h-[2px] bg-tactical-green" />
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-[1px] flex justify-between px-0.5 items-center animate-pulse">
                        <div className="w-4 h-[2px] bg-tactical-cyan" />
                        <div className="w-2 h-[2px] bg-tactical-amber" />
                      </div>
                    </div>
                    <span className="text-[3px] text-zinc-500 scale-75 font-sans font-bold leading-none block text-center uppercase">LIVE</span>
                  </div>

                  <div className="flex-1 min-w-0 font-mono">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Plane className="h-3.5 w-3.5 text-tactical-cyan animate-bounce" />
                      <span className="text-[10px] font-bold text-tactical-cyan tracking-wider uppercase">
                        FLIGHT CORRELATION DIAGNOSTICS
                      </span>
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-relaxed font-mono">
                      Active Flight: <span className="text-foreground font-bold">{incident.id === "EVT-204" ? "Multiple Incoming Flights Landed" : "TK-711 to Istanbul (IST)"}</span>
                      <br />Correlation: <span className="text-tactical-amber font-bold">{incident.id === "EVT-204" ? "3 Arrivals De-boarding Concurrently" : "4 Flights Concurrently Boarding"}</span>
                    </p>
                    <span className="text-[8px] text-tactical-cyan tracking-widest uppercase group-hover:underline block mt-0.5">
                      Click to open Arrivals/Departures Board & Congestion Analysis →
                    </span>
                  </div>
                </div>
              )}

              {/* Live Video Stream */}
              {incident.videoSrc && (
                <div className="space-y-3">
                  <span className="block text-[9px] text-muted-foreground tracking-[0.18em] uppercase font-bold text-left">RETRIEVED VIDEO CAPTURE</span>
                  <div className="rounded-xl overflow-hidden border border-border/40 relative bg-zinc-900" style={{ aspectRatio: "16/9" }}>
                    <video
                      key={incident.videoSrc}
                      src={incident.videoSrc}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    {/* Tripwire line overlay for Event 203 */}
                    {incident.id === "EVT-203" && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <line
                          x1="60" y1="38"
                          x2="67" y2="45"
                          stroke="#00FF9D"
                          strokeWidth="1.2"
                          strokeDasharray={evt203LastCrossed ? "none" : "3 1.5"}
                          strokeOpacity={evt203LastCrossed ? "1" : "0.85"}
                        />
                        {evt203LastCrossed && (
                          <line
                            x1="60" y1="38"
                            x2="67" y2="45"
                            stroke="#00FF9D" strokeWidth="2.5" strokeOpacity="0.65"
                          />
                        )}
                        <text x="60" y="35" fill="#00FF9D" fontSize="3.5" fontFamily="monospace" fontWeight="bold">TRIPWIRE LINE</text>
                      </svg>
                    )}

                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-tactical-red px-2 py-0.5 rounded text-white font-mono text-[8px] font-bold tracking-widest z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      FEED RECORD
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/60 border border-white/10 px-2 py-1 rounded backdrop-blur z-10 text-[9px]">
                      {incident.camera}
                    </div>

                    {/* Live counter overlay for EVT-203 */}
                    {incident.id === "EVT-203" && (
                      <div className={`absolute top-3 right-3 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition-all ${
                        evt203LastCrossed ? "bg-tactical-green text-black scale-105" : "bg-black/60 border border-tactical-green/40 text-tactical-green"
                      }`}>
                        <Users className="h-2.5 w-2.5" />
                        COUNT: {evt203Count}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
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

      {/* ── FIR/WARRANT SCAN MODAL ── */}
      {showFirDetail && (incident.kind === "stolen_vehicle" || incident.id === "EVT-205" || incident.id === "EVT-206") && incident.detail && (incident.detail.firImage || incident.kind === "flagged_person") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowFirDetail(false)}
          />
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-card border border-border/60 rounded-xl overflow-hidden shadow-2xl flex flex-col z-55 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between bg-secondary/60 text-foreground shrink-0 font-mono">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-tactical-cyan" />
                <span className="text-sm font-bold tracking-wide">
                  {incident.kind === "flagged_person" 
                    ? `OFFICIAL WATCHLIST RECORD — ENTRY: ${incident.detail.firNo}` 
                    : `SCANNED FIR — No. ${incident.detail.firNo} · STOLEN VEHICLE ${incident.detail.plate}`
                  }
                </span>
              </div>
              <button
                onClick={() => setShowFirDetail(false)}
                className="p-1 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-0 overflow-y-auto">
              {/* Document */}
              {incident.kind === "flagged_person" ? (
                <div className="bg-zinc-100 p-8 flex items-start justify-center overflow-y-auto max-h-[70vh]">
                  {/* Official White Document Sheet */}
                  <div className="w-full max-w-2xl bg-white text-zinc-950 p-6 rounded-md border border-zinc-300 shadow-md font-sans select-none relative">
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                      <FileText className="w-60 h-60 text-black" />
                    </div>

                    {/* Document Header */}
                    <div className="text-center space-y-1 mb-5 pb-3 border-b border-zinc-300 relative">
                      <div className="flex justify-center mb-1.5">
                        <div className="w-8 h-8 border border-zinc-400 rounded-full flex items-center justify-center font-bold text-zinc-800 text-[8px] tracking-tighter bg-zinc-50">
                          GOVT
                        </div>
                      </div>
                      <h2 className="text-[10px] font-extrabold tracking-widest text-zinc-900 uppercase">GOVERNMENT OF PAKISTAN</h2>
                      <h3 className="text-[9px] font-bold text-zinc-700 tracking-wider uppercase">MINISTRY OF INTERIOR</h3>
                      <h4 className="text-[8px] font-semibold text-zinc-500 tracking-wide uppercase">EXIT CONTROL LIST (ECL) WATCHLIST REGISTRY</h4>
                      <div className="absolute top-1 right-1 border border-red-500 text-red-600 font-extrabold text-[7px] px-1.5 py-0.5 rounded tracking-widest uppercase rotate-12">
                        RESTRICTED
                      </div>
                    </div>

                    {/* Document Meta Info Table */}
                    <div className="grid grid-cols-2 gap-3 text-[8px] text-zinc-700 border border-zinc-200 p-2 rounded mb-4 bg-zinc-50/50">
                      <div>
                        <span className="font-bold text-zinc-900 block">REGISTRY REFERENCE:</span>
                        <span>MINT-ECL/SEC-99/2026-REG</span>
                      </div>
                      <div>
                        <span className="font-bold text-zinc-900 block">STATUS DATE:</span>
                        <span>04/07/2026</span>
                      </div>
                      <div>
                        <span className="font-bold text-zinc-900 block">ENFORCING AGENCY:</span>
                        <span>Federal Investigation Agency (FIA) / ASF</span>
                      </div>
                      <div>
                        <span className="font-bold text-zinc-900 block">LEGAL AUTHORITY:</span>
                        <span>Section 2, Exit Groups Control Ordinance, 1981</span>
                      </div>
                    </div>

                    {/* ECL List Table */}
                    <div className="space-y-2">
                      <span className="text-[8px] font-extrabold text-zinc-800 uppercase block tracking-wider">ECL ACTIVE TRAVEL RESTRICTIONS:</span>
                      <div className="overflow-x-auto rounded border border-zinc-200">
                        <table className="min-w-full divide-y divide-zinc-200 text-left text-[8px] font-sans">
                          <thead className="bg-zinc-50 text-zinc-600 uppercase font-bold">
                            <tr>
                              <th className="px-2 py-1 border-b border-zinc-200">Sr.</th>
                              <th className="px-2 py-1 border-b border-zinc-200">Full Name</th>
                              <th className="px-2 py-1 border-b border-zinc-200">CNIC Number</th>
                              <th className="px-2 py-1 border-b border-zinc-200">Passport</th>
                              <th className="px-2 py-1 border-b border-zinc-200">Category</th>
                              <th className="px-2 py-1 border-b border-zinc-200 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 bg-white text-zinc-700">
                            {[
                              { sr: "01", name: "Muhammad Haroon", cnic: "61101-9876543-1", passport: "PK77651", cat: "A-Security", matchId: "EVT-205" },
                              { sr: "02", name: "Muhammad Ali Khan", cnic: "34462-7850701-1", passport: "CV1103382", cat: "B-Fraud", matchId: "EVT-206" },
                              { sr: "03", name: "Tariq Mehmood", cnic: "42201-1234567-3", passport: "AB1029384", cat: "C-Admin" },
                              { sr: "04", name: "Shahida Parveen", cnic: "35202-9876543-2", passport: "CD2039485", cat: "B-Fraud" },
                              { sr: "05", name: "Zarrar Shah", cnic: "61101-1122334-5", passport: "EF3049586", cat: "A-Security" }
                            ].map((row) => {
                              const isMatch = incident.id === row.matchId;
                              return (
                                <tr 
                                  key={row.sr}
                                  className={isMatch 
                                    ? "bg-red-50 text-red-950 font-bold border-l-2 border-l-red-600 transition-all duration-300" 
                                    : "text-zinc-600 hover:bg-zinc-50"
                                  }
                                >
                                  <td className="px-2 py-1.5 border-b border-zinc-200">{row.sr}</td>
                                  <td className="px-2 py-1.5 border-b border-zinc-200">
                                    <div className="flex items-center gap-1.5">
                                      <span>{row.name}</span>
                                      {isMatch && (
                                        <span className="bg-red-200 text-red-900 text-[6px] font-extrabold px-1 py-[0.5px] rounded tracking-wider uppercase animate-pulse">
                                          MATCH
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-2 py-1.5 border-b border-zinc-200 tracking-wide">{row.cnic}</td>
                                  <td className="px-2 py-1.5 border-b border-zinc-200 tracking-wider">{row.passport}</td>
                                  <td className="px-2 py-1.5 border-b border-zinc-200">{row.cat}</td>
                                  <td className="px-2 py-1.5 border-b border-zinc-200 text-center">
                                    <span className={`px-1 py-[0.5px] rounded text-[6px] font-bold ${
                                      isMatch ? "bg-red-200 text-red-900" : "bg-zinc-150 text-zinc-700"
                                    }`}>
                                      BANNED
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Official Signatures */}
                    <div className="flex justify-between items-center mt-6 pt-3 border-t border-dashed border-zinc-300">
                      <div className="font-mono text-[6px] text-zinc-400">
                        VERIFIED SECURE DATABASE LINK
                        <br />FINGERPRINT MD5: 9F8A882C71B...
                      </div>
                      <div className="text-right font-sans">
                        <div className="text-[7px] font-bold text-zinc-800">Deputy Secretary (ECL)</div>
                        <div className="text-[6px] text-zinc-500 uppercase">Ministry of Interior, Pakistan</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative bg-black/60 p-4 flex items-start justify-center">
                  <img
                    src={incident.detail.firImage}
                    alt="Scanned Document"
                    className="max-h-[70vh] w-auto rounded border border-border/60 shadow-lg"
                  />
                  <div className="absolute top-6 left-6 px-2 py-0.5 rounded bg-black/70 border border-tactical-green/40 text-[8px] font-mono font-bold tracking-widest text-tactical-green flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-tactical-green blink" />
                    OCR SCAN COMPLETE
                  </div>
                </div>
              )}
              {/* Extracted fields */}
              <div className="p-4 space-y-2 border-l border-border/40 font-mono text-[10px]">
                <p className="text-[9px] tracking-[0.15em] text-muted-foreground uppercase mb-1">
                  {incident.kind === "flagged_person" ? "Exit Control List Registry Details" : "Extracted FIR Data"}
                </p>
                {(incident.kind === "flagged_person" ? [
                  ["Suspect Name", incident.detail?.personName || ""],
                  ["CNIC Number", incident.id === "EVT-206" ? "34462-7850701-1" : "61101-9876543-1"],
                  ["Passport No.", incident.detail?.passport || ""],
                  ["ECL Reference", incident.detail?.firNo || ""],
                  ["ECL Entry Date", incident.detail?.firDate || ""],
                  ["Issuing Ministry", "Ministry of Interior, Govt of Pakistan"],
                  ["Initiating Agency", incident.detail?.policeStation || ""],
                  ["Restriction Code", "CAT-B (No Outbound Travel)"],
                  ["Match Confidence", `${incident.detail?.confidence}% (Biometric/ANPR)`],
                  ["Restriction Status", "ACTIVE BANNED"],
                ] : [
                  ["FIR No.", incident.detail?.firNo || ""],
                  ["Date Lodged", incident.detail?.firDate || ""],
                  ["Police Station", incident.detail?.policeStation || ""],
                  ["Complainant", incident.detail?.complainant || ""],
                  ["Contact", incident.detail?.contact || ""],
                  ["Vehicle", incident.detail?.vehicleDesc || ""],
                  ["Registration", incident.detail?.plate || ""],
                ]).map(([k, v]) => (
                  <div key={k} className="bg-accent/30 rounded px-2.5 py-1.5">
                    <span className="text-muted-foreground block text-[8px] uppercase tracking-wider">{k}</span>
                    <span className={k === "Registration" || k === "CNIC Number" || k === "Restriction Status" ? "text-tactical-red font-bold tracking-widest" : "text-foreground"}>{v}</span>
                  </div>
                ))}
                <div className="bg-tactical-red/10 border border-tactical-red/30 rounded px-2.5 py-2 font-mono text-[9px] text-tactical-red leading-relaxed">
                  {incident.kind === "flagged_person" 
                    ? `ECL Watchlist Match detected for suspect ${incident.detail?.personName}. Outbound border passport control clearance is denied. Secure suspect immediately.`
                    : `ANPR plate hit matches this FIR at ${incident.detail?.confidence}% confidence. Vehicle reported stolen — intercept and verify chassis number.`
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FLIGHT DEPARTURES BOARD MODAL ── */}
      {showFlightBoard && incident.kind === "queue_congestion" && incident.detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowFlightBoard(false)}
          />
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-card border border-border/60 rounded-xl overflow-hidden shadow-2xl flex flex-col z-10 fade-in-up">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between bg-secondary/60 text-foreground shrink-0 font-mono">
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4 text-tactical-cyan animate-pulse" />
                <span className="text-sm font-bold tracking-wide">
                  FLIGHT SCHEDULE & CONGESTION DIAGNOSTICS — {incident.id}
                </span>
              </div>
              <button
                onClick={() => setShowFlightBoard(false)}
                className="p-1 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-0 overflow-y-auto font-sans">
              {/* Left Column: Departures/Arrivals Board */}
              <div className="bg-zinc-950 p-6 flex flex-col items-center justify-start overflow-y-auto max-h-[70vh] border-r border-border/40">
                {/* Departures Board Outer Container */}
                <div className="w-full max-w-xl bg-white text-zinc-950 rounded-lg border-2 border-[#0B4F6C] shadow-lg overflow-hidden font-sans select-none">
                  {/* Blue Header Section */}
                  <div className="bg-[#0B4F6C] px-4 py-3 flex items-center justify-between text-white border-b border-[#004f71]">
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4 rotate-45 text-white" />
                      <span className="font-extrabold text-xs tracking-wider uppercase font-sans">
                        FLIGHT STATUS INFORMATION BOARD
                      </span>
                    </div>
                    {/* Small tag */}
                    <div className="text-[7px] bg-[#00E5FF]/20 text-[#00E5FF] font-bold px-1.5 py-0.5 rounded border border-[#00E5FF]/30 tracking-widest uppercase">
                      LIVE RADAR LINKED
                    </div>
                  </div>

                  {/* Tabs Bar */}
                  <div className="flex border-b border-zinc-200 bg-zinc-50 font-sans text-xs">
                    <button
                      onClick={() => setActiveFlightTab("arrivals")}
                      className={`flex-1 py-2 text-center font-bold border-b-2 transition-colors ${
                        activeFlightTab === "arrivals"
                          ? "border-[#00628b] text-[#00628b] bg-white"
                          : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                      }`}
                    >
                      🛬 ARRIVALS (Coming Flights)
                    </button>
                    <button
                      onClick={() => setActiveFlightTab("departures")}
                      className={`flex-1 py-2 text-center font-bold border-b-2 transition-colors ${
                        activeFlightTab === "departures"
                          ? "border-[#00628b] text-[#00628b] bg-white"
                          : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                      }`}
                    >
                      🛫 DEPARTURES (Outgoing Flights)
                    </button>
                  </div>

                  {/* Flight Status Table */}
                  <div className="overflow-x-auto">
                    {activeFlightTab === "arrivals" ? (
                      <table className="min-w-full divide-y divide-zinc-200 text-left text-[10px] font-sans">
                        <thead className="bg-[#00628b] text-white uppercase font-bold text-[9px]">
                          <tr>
                            <th className="px-4 py-2.5">Airline</th>
                            <th className="px-4 py-2.5">Flight No.</th>
                            <th className="px-4 py-2.5">From</th>
                            <th className="px-4 py-2.5">Time</th>
                            <th className="px-4 py-2.5">Gate</th>
                            <th className="px-4 py-2.5">Baggage</th>
                            <th className="px-4 py-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-150 bg-white text-zinc-800">
                          {[
                            { airline: "TURKISH AIRLINES", logo: "TK", flight: "TK 710", from: "Istanbul (IST)", time: "14:15", gate: "Gate 15", carousel: "Carousel 4", status: "Landed", activeMatch: incident?.id === "EVT-204" },
                            { airline: "PAKISTAN International Airlines", logo: "PK", flight: "PK 212", from: "Dubai (DXB)", time: "14:20", gate: "Gate 12", carousel: "Carousel 2", status: "Landed", activeMatch: incident?.id === "EVT-204" },
                            { airline: "AIRSIAL", logo: "PF", flight: "PF 718", from: "Abu Dhabi (AUH)", time: "14:25", gate: "Gate 14", carousel: "Carousel 1", status: "Landed", activeMatch: incident?.id === "EVT-204" },
                            { airline: "EMIRATES", logo: "EK", flight: "EK 612", from: "Dubai (DXB)", time: "14:35", gate: "Gate 18", carousel: "Carousel 3", status: "Delayed" },
                            { airline: "QATAR AIRWAYS", logo: "QR", flight: "QR 632", from: "Doha (DOH)", time: "14:45", gate: "Gate 16", carousel: "Carousel 4", status: "Scheduled" },
                            { airline: "OMAN AIR", logo: "WY", flight: "WY 344", from: "Muscat (MCT)", time: "15:00", gate: "Gate 9", carousel: "Scheduled", status: "Scheduled" }
                          ].map((row, idx) => {
                            const isHighlighted = row.activeMatch;
                            return (
                              <tr 
                                key={idx}
                                className={isHighlighted 
                                  ? "bg-red-50 text-red-955 font-bold border-l-4 border-l-tactical-red transition-all duration-300" 
                                  : "hover:bg-zinc-50"
                                }
                              >
                                <td className="px-4 py-2 whitespace-nowrap font-bold text-zinc-900 flex items-center gap-1.5 font-sans">
                                  <span className="px-1 py-0.5 rounded border border-[#0B4F6C]/20 bg-slate-50 text-[#0B4F6C] text-[8px] font-bold uppercase tracking-tight leading-none">{row.logo}</span>
                                  <span className="text-[8px] leading-tight tracking-tighter uppercase">{row.airline}</span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap tracking-wide">{row.flight}</td>
                                <td className="px-4 py-2 whitespace-nowrap font-semibold text-zinc-955">{row.from}</td>
                                <td className="px-4 py-2 whitespace-nowrap tracking-wider">{row.time}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{row.gate}</td>
                                <td className="px-4 py-2 whitespace-nowrap font-mono">{row.carousel}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                  <span className={`inline-block w-20 py-0.5 rounded text-[8px] font-bold text-white uppercase text-center ${
                                    row.status === "Landed" 
                                      ? (isHighlighted ? "bg-red-600 animate-pulse" : "bg-green-700") 
                                      : row.status === "Delayed" 
                                        ? "bg-amber-600" 
                                        : "bg-zinc-500"
                                  }`}>
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <table className="min-w-full divide-y divide-zinc-200 text-left text-[10px] font-sans">
                        <thead className="bg-[#00628b] text-white uppercase font-bold text-[9px]">
                          <tr>
                            <th className="px-4 py-2.5">Airline</th>
                            <th className="px-4 py-2.5">Flight No.</th>
                            <th className="px-4 py-2.5">To</th>
                            <th className="px-4 py-2.5">Time</th>
                            <th className="px-4 py-2.5">Gate</th>
                            <th className="px-4 py-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-150 bg-white text-zinc-800">
                          {[
                            { airline: "TURKISH AIRLINES", logo: "TK", flight: "TK 711", to: "Istanbul (IST)", time: "14:30", gate: "Gate 15", status: "Boarding", activeMatch: incident?.id === "EVT-203" },
                            { airline: "PAKISTAN International Airlines", logo: "PK", flight: "PK 233", to: "Dubai (DXB)", time: "14:35", gate: "Gate 12", status: "Boarding", activeMatch: incident?.id === "EVT-203" },
                            { airline: "AIRBLUE", logo: "IVC", flight: "IVC7602", to: "Abu Dhabi (AUH)", time: "14:40", gate: "Gate 10", status: "Boarding", activeMatch: incident?.id === "EVT-203" },
                            { airline: "AIRSIAL", logo: "PF", flight: "PF 798", to: "Abu Dhabi (AUH)", time: "14:45", gate: "Gate 14", status: "Boarding", activeMatch: incident?.id === "EVT-203" },
                            { airline: "SAUDIA", logo: "SV", flight: "SV 727", to: "Jeddah (JED)", time: "15:00", gate: "Gate 18", status: "Delayed" },
                            { airline: "FLYJINNAH", logo: "9P", flight: "9P 744", to: "Sharjah (SHJ)", time: "15:10", gate: "Gate 8", status: "Cancelled" }
                          ].map((row, idx) => {
                            const isHighlighted = row.activeMatch;
                            return (
                              <tr 
                                key={idx}
                                className={isHighlighted 
                                  ? "bg-amber-50 text-amber-955 font-bold border-l-4 border-l-tactical-amber transition-colors" 
                                  : "hover:bg-zinc-50"
                                }
                              >
                                <td className="px-4 py-2 whitespace-nowrap font-bold text-zinc-900 flex items-center gap-1.5 font-sans">
                                  <span className="px-1 py-0.5 rounded border border-[#0B4F6C]/20 bg-slate-50 text-[#0B4F6C] text-[8px] font-bold uppercase tracking-tight leading-none">{row.logo}</span>
                                  <span className="text-[8px] leading-tight tracking-tighter uppercase">{row.airline}</span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap tracking-wide">{row.flight}</td>
                                <td className="px-4 py-2 whitespace-nowrap font-semibold text-zinc-955">{row.to}</td>
                                <td className="px-4 py-2 whitespace-nowrap tracking-wider">{row.time}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{row.gate}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                  <span className={`inline-block w-20 py-0.5 rounded text-[8px] font-bold text-white uppercase text-center ${
                                    row.status === "Boarding" 
                                      ? (isHighlighted ? "bg-[#d97706] animate-pulse" : "bg-green-700") 
                                      : row.status === "Cancelled" 
                                        ? "bg-[#d90000]" 
                                        : "bg-[#d97706]"
                                  }`}>
                                    {row.status === "Boarding" && !isHighlighted ? "Departed" : row.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* View All Flights Button */}
                  <div className="p-3 bg-white border-t border-zinc-200 flex justify-center">
                    <button className="w-full py-1.5 rounded border border-[#0B4F6C] text-[#0B4F6C] font-bold text-[9px] hover:bg-slate-50 uppercase tracking-wider transition-colors cursor-pointer text-center font-sans">
                      View All {activeFlightTab === "arrivals" ? "Coming" : "Outgoing"} Flights
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Congestion Diagnostics Info */}
              <div className="p-4 space-y-3 font-mono text-[10px] bg-secondary/15 flex flex-col justify-between">
                <div className="space-y-3">
                  <p className="text-[9px] tracking-[0.15em] text-muted-foreground uppercase mb-1 font-mono">
                    Congestion Diagnostics
                  </p>
                  
                  <div className="bg-accent/30 rounded px-2.5 py-1.5">
                    <span className="text-muted-foreground block text-[8px] uppercase tracking-wider">PRIMARY CAUSE</span>
                    <span className="text-tactical-amber font-bold">{incident.id === "EVT-204" ? "INCOMING PASSENGER INFLUX" : "FLIGHT CLUSTERING DETECTED"}</span>
                  </div>

                  <div className="bg-accent/30 rounded px-2.5 py-1.5">
                    <span className="text-muted-foreground block text-[8px] uppercase tracking-wider">AFFECTED GATE AREA</span>
                    <span className="text-foreground">{incident.id === "EVT-204" ? "FIA immigration counters 4-7" : "Gate 15 (Concourse Concurrency)"}</span>
                  </div>

                  <div className="bg-accent/30 rounded px-2.5 py-1.5">
                    <span className="text-muted-foreground block text-[8px] uppercase tracking-wider">SCHEDULING ANOMALY</span>
                    <span className="text-foreground leading-normal block mt-0.5">
                      {incident.id === "EVT-204" 
                        ? "Three international flights landed within 10 minutes (14:15 - 14:25), releasing a massive influx of 700+ incoming passengers simultaneously into the FIA Immigration hall."
                        : "4 international flights scheduled to board concurrently within 15 minutes (14:30 - 14:45), causing check-in counters 12-18 and immigration lines to exceed safety capacity."
                      }
                    </span>
                  </div>

                  <div className="bg-accent/30 rounded px-2.5 py-1.5">
                    <span className="text-muted-foreground block text-[8px] uppercase tracking-wider">PASSENGER VOLUMES</span>
                    <span className="text-tactical-red font-bold block">{incident.detail.peopleCount} pax (Safety limit {incident.detail.threshold})</span>
                  </div>

                  <div className="bg-accent/30 rounded px-2.5 py-1.5">
                    <span className="text-muted-foreground block text-[8px] uppercase tracking-wider">ESTIMATED WAIT TIME</span>
                    <span className="text-tactical-cyan font-bold block">{incident.detail.waitTime}</span>
                  </div>
                </div>

                <div className="bg-tactical-cyan/10 border border-tactical-cyan/30 rounded px-2.5 py-2 font-mono text-[9px] text-tactical-cyan leading-relaxed mt-4">
                  {incident.id === "EVT-204" 
                    ? "REMEDIAL ACTION RECOMMENDED: Request FIA duty manager to open additional passport desks 8-10 immediately and marshal concourse flow."
                    : "REMEDIAL ACTION RECOMMENDED: Activate additional check-in counters 19-20 and request FIA to open three auxiliary passport control counters."
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGE ZOOM MODAL ── */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-zoom-out"
            onClick={() => setZoomedImage(null)}
          />
          <div className="relative max-w-4xl max-h-[85vh] z-[110] animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center justify-center">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/85 transition-colors cursor-pointer z-[120]"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed View"
              className="max-h-[80vh] max-w-full rounded-lg border border-border shadow-2xl object-contain bg-[#0a0f1d]"
            />
          </div>
        </div>
      )}
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

function ASFGroupDetailModal({ group, onClose }: { group: ASFGroup; onClose: () => void }) {
  const isOfficer = group.unitType === "officer";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`px-5 py-4 border-b border-border/40 flex items-center justify-between bg-secondary/20`}>
          <div className="flex items-center gap-2.5 font-mono">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${
              isOfficer ? "bg-tactical-cyan/10 border-tactical-cyan/35 text-tactical-cyan" : "bg-tactical-green/10 border-tactical-green/35 text-tactical-green"
            }`}>
              {isOfficer ? <User className="h-4 w-4" /> : <Car className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="font-bold text-foreground text-sm tracking-tight">
                Unit Detail — {group.callsign}
              </h2>
              <span className="text-[9px] text-muted-foreground block mt-0.5">
                Database ID: {group.id}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 font-mono text-xs">
          {/* Status badge and zone */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">CURRENT STATUS</span>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${
                group.status === "available" ? "bg-tactical-green animate-pulse" : "bg-tactical-amber animate-pulse"
              }`} />
              <span className={`font-bold ${
                group.status === "available" ? "text-tactical-green" : "text-tactical-amber"
              } uppercase`}>
                {group.status.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Details list */}
          <div className="rounded-xl border border-border/40 overflow-hidden bg-secondary/40">
            {[
              { label: "Unit Callsign", value: group.callsign, highlight: true },
              { label: "Assigned Name", value: group.name },
              { label: isOfficer ? "Officer Rank" : "Patrol Vehicle", value: isOfficer ? group.rank || "Constable" : group.vehicle },
              { label: "Deployed Sector", value: group.assignedTo },
              { label: "Active Post", value: group.destination },
              { label: "Deployed Zone", value: group.zone, color: group.zone === "Zone A" ? "text-tactical-green" : group.zone === "Zone B" ? "text-tactical-amber" : "text-tactical-red" },
              { label: isOfficer ? "Personnel Count" : "Responding Crew", value: `${group.personnel} Personnel` },
              { label: "Current Destination", value: group.destination },
              { label: "Current ETA", value: group.eta || "Patrolling", color: "text-tactical-green" },
              { label: "GPS Coordinates", value: `${group.lat.toFixed(5)}°, ${group.lng.toFixed(5)}°`, color: "text-tactical-cyan" }
            ].map(({ label, value, color, highlight }, i, arr) => (
              <div key={label} className={`flex items-center justify-between px-4 py-2.5 ${i !== arr.length - 1 ? "border-b border-border/20" : ""}`}>
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</span>
                <span className={`font-bold text-right ${color || "text-foreground"} ${highlight ? "text-tactical-cyan" : ""}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Capabilities */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Unit Capabilities</span>
            <div className="flex flex-wrap gap-1.5">
              {group.capabilities.map((cap) => (
                <span key={cap} className="px-2 py-1 rounded bg-secondary border border-border font-mono text-[9px] font-bold text-foreground/80 uppercase">
                  {cap.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/40 bg-secondary/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-secondary hover:bg-secondary/70 border border-border/60 text-foreground font-mono text-[10px] font-bold rounded transition-colors uppercase cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { groups, incidents, setIncidents } = useASF();
  useEffect(() => {
    setIncidents(seedIncidents);
  }, [setIncidents]);
  const [mounted, setMounted] = useState(false);
  const [show3DView, setShow3DView] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<typeof cameras[0] | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState<Incident | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedGroupDetail, setSelectedGroupDetail] = useState<ASFGroup | null>(null);

  useEffect(() => {
    if (selectedIncident) {
      const inc = incidents.find((i) => i.id === selectedIncident);
      if (inc) setSelectedIncidentDetail(inc);
    } else {
      setSelectedIncidentDetail(null);
    }
  }, [selectedIncident, incidents]);

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
                <button
                  onClick={() => setShow3DView(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-tactical-cyan/40 bg-tactical-cyan/10 hover:bg-tactical-cyan/20 font-mono text-[10px] font-bold tracking-wider uppercase text-tactical-cyan transition-colors cursor-pointer"
                >
                  <Box className="h-3 w-3" />
                  3D View
                </button>
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
                onSelectGroup={(id) => {
                  setSelectedGroup(id);
                  const g = groups.find((group) => group.id === id);
                  if (g) setSelectedGroupDetail(g);
                }}
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
                            onClick={() => {
                              setSelectedGroup(unit.id);
                              setSelectedGroupDetail(unit);
                            }}
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
        <IncidentDetailModal 
          incident={selectedIncidentDetail} 
          onClose={() => {
            setSelectedIncidentDetail(null);
            setSelectedIncident(null);
          }} 
        />
      )}

      {/* ASF Unit Detail Modal */}
      {selectedGroupDetail && (
        <ASFGroupDetailModal group={selectedGroupDetail} onClose={() => setSelectedGroupDetail(null)} />
      )}

      {/* PTB 3D Digital Twin Modal */}
      {show3DView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={() => setShow3DView(false)} />
          <div className="relative z-10 w-full h-full max-w-[1600px] bg-card border border-border/60 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-secondary/60 shrink-0">
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-tactical-cyan" />
                <span className="font-mono font-bold text-foreground text-sm">PTB — 3D Digital Twin</span>
              </div>
              <button
                onClick={() => setShow3DView(false)}
                className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative flex-1 min-h-0">
              <DigitalTwin3D />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
