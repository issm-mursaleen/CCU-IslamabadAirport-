"use client";

import { useState, useEffect } from "react";
import {
  Cctv,
  Search,
  ChevronRight,
  AlertTriangle,
  Maximize2,
  Grid,
  Radio,
  Video,
  X,
  Eye,
  Camera,
  Users,
} from "lucide-react";

// The mapped mock videos from the V2 folder
const CAMERA_FEEDS = [
  { id: "CAM-001", name: "MAIN GATE ENTRY", zone: "Entry Zone A", src: "/videos/Cameras/Gate_surveillance video.mp4", status: "live" },
  { id: "CAM-002", name: "PERIMETER FENCE W", zone: "Perimeter Zone B", src: "/videos/Person Climbing Fence.mp4", status: "live" },
  { id: "CAM-003", name: "INDUSTRIAL WAREHOUSE", zone: "Industrial Zone", src: "/videos/Cameras/Warehouse Cam 2.mp4", status: "live" },
  { id: "CAM-004", name: "PARKING AREA", zone: "Vehicle Zone", src: "/videos/Cameras/car inside secure perimeter.mp4", status: "live" },
  { id: "CAM-005", name: "PRODUCTION FACILITY", zone: "Production Zone", src: "/videos/Cameras/Forklift in Warehoues.mp4", status: "live" },
  { id: "CAM-006", name: "RESTRICTED COMPOUND", zone: "Restricted Zone", src: "/videos/Normal Baggage Scanner With no alerts.mp4", status: "live" },
  { id: "CAM-007", name: "LOADING DOCK", zone: "Logistics", src: "/videos/Baggage Scanner Screen View with alerts.mp4", status: "offline" },
  { id: "CAM-008", name: "ADMIN BUILDING", zone: "Admin Zone", src: "/videos/Cameras/Guard1.mp4", status: "live" },
  { id: "CAM-009", name: "VIP ACCESS LANE", zone: "VIP Zone", src: "/videos/VIP Convoy movement Video.mp4", status: "live" },
  { id: "CAM-010", name: "EMERGENCY EXIT", zone: "Emergency Zone", src: "/videos/Cameras/guard2.mp4", status: "offline" },
  { id: "CAM-011", name: "DRONE AERIAL F-6", zone: "Airspace", src: "/videos/Drone aerial facility view.mp4", status: "live" },
  { id: "CAM-012", name: "DRONE CROWD MON", zone: "Airspace", src: "/videos/Drone surveillance vdeo for crowd.mp4", status: "live" },
  { id: "CAM-013", name: "PARKING THEFT", zone: "Vehicle Zone", src: "/videos/Events/theif in parking lot.mp4", status: "live" },
  { id: "CAM-014", name: "PATROL SECTOR 7", zone: "Perimeter", src: "/videos/Guards/Security Guard Patrolling.mp4", status: "live" }
];

const CAMERA_GROUPS = [
  { id: "all", name: "All Cameras", zones: [] },
  { id: "entry", name: "Entry & Access", zones: ["Entry Zone A", "Admin Zone", "VIP Zone"] },
  { id: "perimeter", name: "Perimeter", zones: ["Perimeter Zone B", "Perimeter", "Vehicle Zone"] },
  { id: "industrial", name: "Industrial", zones: ["Industrial Zone", "Production Zone", "Logistics"] },
  { id: "compound", name: "Compound", zones: ["Restricted Zone", "Emergency Zone"] },
  { id: "airspace", name: "Airspace (Drones)", zones: ["Airspace"] },
];

type EventLevel = "critical" | "high" | "medium" | "low";

interface LiveEvent {
  id: number;
  title: string;
  camId: string;
  location: string;
  cam: string;
  time: string;
  timestamp: string;
  color: string;
  level: EventLevel;
  confidence: number;
  icon: React.ElementType;
  description: string;
  action: string;
  video: string;
}

const eventLevelConfig: Record<EventLevel, { bg: string; text: string; border: string; badge: string; bar: string }> = {
  critical: { bg: "bg-tactical-red/15",   text: "text-tactical-red",   border: "border-tactical-red/40",   badge: "CRITICAL RISK", bar: "bg-tactical-red"   },
  high:     { bg: "bg-tactical-amber/15", text: "text-tactical-amber", border: "border-tactical-amber/40", badge: "HIGH RISK",     bar: "bg-tactical-amber" },
  medium:   { bg: "bg-tactical-cyan/15",  text: "text-tactical-cyan",  border: "border-tactical-cyan/40",  badge: "MEDIUM RISK",   bar: "bg-tactical-cyan"  },
  low:      { bg: "bg-tactical-green/15", text: "text-tactical-green", border: "border-tactical-green/40", badge: "LOW RISK",      bar: "bg-tactical-green" },
};

const LIVE_EVENTS: LiveEvent[] = [
  {
    id: 1, title: "Suspicious Loitering", camId: "CAM-001", location: "Main Gate Entry",
    cam: "CAM-001 • Main Gate Entry", time: "14:23", timestamp: "06/03/2026, 14:23:11",
    color: "text-tactical-amber", level: "high", confidence: 92, icon: Eye,
    description: "Individual detected loitering near access gate for 12 minutes without authorization badge.",
    action: "Dispatch guard team to verify identity and intent.",
    video: "/videos/Events/Suspicious%20Lottering.mp4",
  },
  {
    id: 2, title: "Camera Obstruction", camId: "CAM-005", location: "Production Facility",
    cam: "CAM-005 • Production Facility", time: "14:18", timestamp: "06/03/2026, 14:18:44",
    color: "text-tactical-cyan", level: "medium", confidence: 87, icon: Camera,
    description: "Camera lens obstruction detected at production facility. Possible deliberate tampering or accidental blockage.",
    action: "Send maintenance team to inspect camera. Deploy roving guard to cover the area.",
    video: "/videos/Events/Camera_obstruction_event_5ab20ea8c9.mp4",
  },
  {
    id: 3, title: "Unauthorized Entry", camId: "CAM-006", location: "Restricted Compound",
    cam: "CAM-006 • Restricted Compound", time: "14:11", timestamp: "06/03/2026, 14:11:02",
    color: "text-tactical-red", level: "critical", confidence: 96, icon: AlertTriangle,
    description: "Individual breached restricted compound perimeter without valid access credentials. Multiple access control systems triggered.",
    action: "Immediate lockdown of restricted area. Dispatch QRF team. Alert security supervisor.",
    video: "/videos/Person%20Climbing%20Fence.mp4",
  },
  {
    id: 4, title: "Tailgating at Gate", camId: "CAM-001", location: "Main Gate Entry",
    cam: "CAM-001 • Main Gate Entry", time: "13:58", timestamp: "06/03/2026, 13:58:30",
    color: "text-tactical-amber", level: "high", confidence: 89, icon: Users,
    description: "Two individuals detected piggybacking entry through access-controlled gate. Second person did not badge in.",
    action: "Review badge logs. Identify and verify both individuals. Issue security awareness reminder.",
    video: "/videos/Cameras/Gate_surveillance%20video.mp4",
  },
];

function EventDetailModal({ event, onClose }: { event: LiveEvent; onClose: () => void }) {
  const cfg = eventLevelConfig[event.level];
  const Ic = event.icon;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0">
          <h2 className="font-mono font-bold text-foreground text-base tracking-tight">
            Event Detail — {event.camId}-EVT-{String(event.id).padStart(3, "0")}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Level badge */}
          <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3 py-1.5 rounded-lg border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <Ic className="h-3 w-3" />
            {cfg.badge}
          </span>

          {/* Detail table */}
          <div className="rounded-xl border border-border/40 overflow-hidden">
            {[
              { label: "Event Type", value: event.title },
              { label: "Location",   value: event.location },
              { label: "Camera",     value: event.camId },
              { label: "Timestamp",  value: event.timestamp },
            ].map(({ label, value }, i, arr) => (
              <div key={label} className={`flex items-center justify-between px-5 py-3.5 bg-secondary/40 ${i !== arr.length - 1 ? "border-b border-border/30" : ""}`}>
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
            <video key={event.video} src={event.video} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 3px)" }} />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-tactical-red px-2 py-0.5 rounded text-white font-mono text-[9px] font-bold tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </div>
            <div className="absolute top-3 right-3 font-mono text-[9px] text-white/60 tracking-widest bg-black/40 px-1.5 py-0.5 rounded">{event.camId}</div>
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between">
              <span className="font-mono text-[10px] text-white/80">{event.location}</span>
              <span className="font-mono text-[9px] text-tactical-green tracking-widest">● ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function timeNow() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function SurveillancePage() {
  const [mounted, setMounted] = useState(false);
  const [layout, setLayout] = useState<"1x1" | "2x2" | "3x3">("3x3");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [sysTime, setSysTime] = useState("");
  const [expandedCamera, setExpandedCamera] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<LiveEvent | null>(null);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setSysTime(timeNow()), 1000);
    setSysTime(timeNow());
    return () => clearInterval(id);
  }, []);

  const displayedCams = layout === "1x1" ? 1 : layout === "2x2" ? 4 : 9;
  
  const filteredFeeds = selectedGroup === "all" 
    ? CAMERA_FEEDS 
    : CAMERA_FEEDS.filter(cam => CAMERA_GROUPS.find(g => g.id === selectedGroup)?.zones.includes(cam.zone));
    
  // Automatically adjust grid if there are fewer cameras in a category than layout slots
  const activeGrid = filteredFeeds.slice(0, displayedCams);

  const groupsWithCount = CAMERA_GROUPS.map(g => ({
    ...g,
    count: g.id === "all" ? CAMERA_FEEDS.length : CAMERA_FEEDS.filter(cam => g.zones.includes(cam.zone)).length
  }));

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-4">
      {/* ── LEFT SIDEBAR ── */}
      <div className="w-64 bg-card/60 border-r border-border flex flex-col shrink-0 overflow-y-auto hidden md:flex">
        
        {/* Camera List Search */}
        <div className="p-4 border-b border-border/50">
          <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase block mb-3">Camera List</span>
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search cameras..."
              className="w-full bg-secondary/50 border border-border rounded pl-8 pr-3 py-1.5 text-xs font-mono focus:outline-none focus:border-tactical-cyan/50"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="p-2 border-b border-border/50">
          {groupsWithCount.map((g) => (
            <button 
              key={g.id} 
              onClick={() => setSelectedGroup(g.id)}
              className={`w-full flex items-center justify-between px-2 py-2 text-xs font-mono rounded transition-colors group ${
                selectedGroup === g.id 
                  ? "bg-tactical-cyan/10 text-tactical-cyan" 
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <ChevronRight className={`h-3 w-3 transition-colors ${selectedGroup === g.id ? "text-tactical-cyan" : "group-hover:text-tactical-cyan"}`} />
                <span>{g.name}</span>
              </div>
              <span>{g.count}</span>
            </button>
          ))}
        </div>

        {/* Live Events log */}
        <div className="p-4 flex-1 overflow-y-auto">
          <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase block mb-4">Live Events</span>
          <div className="space-y-2">
            {LIVE_EVENTS.map(ev => {
              const cfg = eventLevelConfig[ev.level];
              return (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="w-full text-left rounded-lg border border-border/30 hover:border-border/60 bg-secondary/30 hover:bg-secondary/60 transition-colors p-3 group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`flex items-center gap-1.5 ${ev.color}`}>
                      <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                      <span className="font-mono text-xs font-bold group-hover:underline">{ev.title}</span>
                    </div>
                    <span className="font-mono text-[9px] text-muted-foreground tabular-nums">{ev.time}</span>
                  </div>
                  <p className="font-mono text-[9px] text-muted-foreground">{ev.cam}</p>
                  <div className="mt-2">
                    <div className="w-full h-1 rounded-full bg-muted/30 overflow-hidden">
                      <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${ev.confidence}%` }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT (GRID) ── */}
      <div className="flex-1 flex flex-col bg-background min-w-0">
        
        {/* Top Header */}
        <div className="h-14 shrink-0 px-4 md:px-6 flex items-center justify-between border-b border-border/50 bg-card/40 backdrop-blur">
          <div className="flex items-center gap-3">
            <Video className="h-5 w-5 text-tactical-cyan" />
            <h1 className="text-lg md:text-xl font-bold tracking-tight">AI Surveillance Monitoring</h1>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-tactical-red/10 border border-tactical-red/30 text-tactical-red">
              <AlertTriangle className="h-3.5 w-3.5 blink" />
              <span className="font-mono text-[10px] font-bold tracking-wider">6 ALARMS</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-tactical-red/15 border border-tactical-red/40 text-tactical-red">
              <div className="h-2 w-2 rounded-full bg-tactical-red blink" />
              <span className="font-mono text-[10px] font-bold tracking-widest leading-none">THREATCON: BRAVO</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="h-12 shrink-0 px-4 md:px-6 flex items-center justify-between border-b border-border/30 bg-secondary/20">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-muted-foreground tracking-wider">{CAMERA_FEEDS.length} Cameras</span>
            <div className="flex items-center gap-1 bg-background border border-border/50 rounded-md p-1">
              {(["1x1", "2x2", "3x3"] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLayout(l)}
                  className={`px-2.5 py-1 rounded font-mono text-[10px] transition-colors flex items-center gap-1.5 ${layout === l ? "bg-tactical-cyan/15 text-tactical-cyan" : "text-muted-foreground hover:bg-accent"}`}
                >
                  <Grid className="h-3 w-3" />
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-tactical-green">
              <Radio className="h-3.5 w-3.5" />
              <span className="tracking-wider">ONLINE</span>
            </div>
            <span className="text-muted-foreground tabular-nums">Session: {sysTime}</span>
          </div>
        </div>

        {/* Camera Grid Layout */}
        <div className="flex-1 p-2 md:p-3 overflow-y-auto w-full">
          <div 
            className={`grid gap-2 w-full h-full min-h-[500px] ${
              layout === "1x1" ? "grid-cols-1 grid-rows-1" 
              : layout === "2x2" ? "grid-cols-2 grid-rows-2" 
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-rows-3"
            }`}
          >
            {activeGrid.map((cam, i) => (
              <div 
                key={cam.id} 
                onClick={() => cam.status === "live" && setExpandedCamera(cam)}
                className={`relative bg-card rounded-lg border border-border/40 overflow-hidden flex flex-col group ${cam.status === "live" ? "cursor-pointer" : ""} ${mounted ? "fade-in-up" : "opacity-0"}`} 
                style={{ animationDelay: `${i * 50}ms` }}
              >
                
                {/* Video Player */}
                <div className="absolute inset-0 z-0 bg-muted/50 flex items-center justify-center">
                  {cam.status === "live" ? (
                    <>
                      <video 
                        src={cam.src} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                      />
                      <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-background/70 p-1.5 rounded backdrop-blur border border-border/30 hidden md:flex items-center justify-center pointer-events-none">
                        <Maximize2 className="h-3 w-3 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground/30">
                      <Cctv className="h-10 w-10 mb-2" />
                      <span className="font-mono text-[10px] tracking-[0.2em] font-bold">NO SIGNAL</span>
                    </div>
                  )}
                </div>

                {/* Overlays */}
                <div className="relative z-10 p-2 md:p-3 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                  <span className="font-mono text-[9px] md:text-[11px] font-bold text-white/90 tracking-wider">
                    {cam.name}
                  </span>
                  {cam.status === "live" ? (
                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-tactical-red text-white text-[8px] md:text-[9px] font-mono font-bold tracking-widest blink">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      LIVE
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground text-[8px] md:text-[9px] font-mono font-bold tracking-widest">
                      OFFLINE
                    </div>
                  )}
                </div>

                <div className="relative z-10 mt-auto p-2 md:p-3 flex justify-between items-end bg-gradient-to-t from-black/80 to-transparent">
                  <span className="font-mono text-[9px] text-white/60 tracking-wider tabular-nums">
                    Time: {sysTime}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[8px] md:text-[9px] text-white/50">{cam.zone}</span>
                    <span className={`font-mono text-[8px] md:text-[9px] px-1 md:px-1.5 py-0.5 rounded border ${cam.status === "live" ? "border-tactical-green/40 bg-tactical-green/20 text-tactical-green" : "border-tactical-red/40 bg-tactical-red/20 text-tactical-red"}`}>
                      • {cam.status === "live" ? "CONN" : "DISC"}
                    </span>
                  </div>
                </div>

                {/* Grid Overlay Effects */}
                {cam.status === "live" && (
                  <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,255,157,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.1)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── EVENT DETAIL MODAL ── */}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

      {/* ── CAMERA EXPANDED OVERLAY ── */}
      {expandedCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setExpandedCamera(null)}
          />
          <div className="relative w-full max-w-6xl bg-black border border-tactical-cyan/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,255,157,0.1)] fade-in-up flex flex-col relative">
            
            {/* Header Overlay */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded bg-black/60 border border-white/10 backdrop-blur-md pointer-events-none">
              <div className="h-2 w-2 rounded-full bg-tactical-red blink" />
              <span className="font-mono text-[10px] md:text-xs font-bold text-white tracking-widest">{expandedCamera.id} • {expandedCamera.name}</span>
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setExpandedCamera(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded bg-black/60 border border-white/10 backdrop-blur-md hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* The Huge Video */}
            <video 
              src={expandedCamera.src} 
              autoPlay loop muted playsInline
              className="w-full h-auto max-h-[85vh] object-cover pointer-events-none"
            />
            
            {/* Bottom Info Overlays */}
            <div className="absolute bottom-6 left-6 z-20 flex flex-wrap items-center gap-2 md:gap-4 pointer-events-none">
              <div className="px-3 py-2 bg-black/60 border border-tactical-green/30 backdrop-blur-md rounded">
                <span className="font-mono text-[9px] md:text-[10px] text-tactical-green block mb-0.5">STATUS</span>
                <span className="font-mono text-[10px] md:text-xs text-white font-bold tracking-widest">RECORDING</span>
              </div>
              <div className="px-3 py-2 bg-black/60 border border-white/10 backdrop-blur-md rounded hidden sm:block">
                <span className="font-mono text-[9px] md:text-[10px] text-white/50 block mb-0.5">ZONE</span>
                <span className="font-mono text-[10px] md:text-xs text-white font-bold tracking-widest uppercase">{expandedCamera.zone}</span>
              </div>
              <div className="px-3 py-2 bg-black/60 border border-white/10 backdrop-blur-md rounded hidden sm:block">
                <span className="font-mono text-[9px] md:text-[10px] text-white/50 block mb-0.5">RESOLUTION</span>
                <span className="font-mono text-[10px] md:text-xs text-white font-bold tracking-widest">1080P/60FPS</span>
              </div>
            </div>
            
            {/* Grid Mask */}
            <div className="absolute inset-0 z-10 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,255,157,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
          </div>
        </div>
      )}

    </div>
  );
}
