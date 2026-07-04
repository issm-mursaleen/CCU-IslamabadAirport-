"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Cctv,
  Search,
  ChevronRight,
  AlertTriangle,
  Radio,
  Video,
  Users,
} from "lucide-react";

// Load PTBMapCanvas dynamically to support Leaflet client-side rendering
const PTBMapCanvas = dynamic(() => import("@/components/ptb-map-canvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#070b10] border border-border/40 rounded-xl p-8 min-h-[500px]">
      <span className="font-mono text-sm text-foreground font-bold tracking-wider uppercase mb-1">
        TACTICAL RASTERIZER ACTIVE
      </span>
      <span className="font-mono text-xs text-muted-foreground tracking-wide animate-pulse">
        BOOTING TERMINAL SECURITY WORKSPACE...
      </span>
    </div>
  ),
});

const CAMERA_FEEDS = [
  { id: "CAM-311", name: "ZONE B — CHECK-IN HALL", zone: "Zone B", src: "/videos/counter_people_que.mp4", status: "live" },
  { id: "CAM-317", name: "ZONE B — FIA IMMIGRATION COUNTERS", zone: "Zone B", src: "/videos/zone_tracker_output_counter.mp4", status: "live" },
  { id: "CAM-322", name: "ZONE B — DEPARTURE STAND A SEATING", zone: "Zone B", src: "/videos/forgotten-trolley-case-stand-a.mp4", status: "live" },
  { id: "CAM-305", name: "ZONE B — TERMINAL PARKING AREA", zone: "Zone B", src: "/videos/plate_recognition_output_parking_area.mp4", status: "live" },
  { id: "CAM-308", name: "ZONE B — ARRIVALS BAGGAGE CLAIM", zone: "Zone B", src: "/videos/bag_count_output baggeges.mp4", status: "live" },
  { id: "CAM-314", name: "ZONE B — DEPARTURES QUEUE COUNTER", zone: "Zone B", src: "/videos/counter_people_que.mp4", status: "live" },
  { id: "CAM-319", name: "ZONE B — INTERNATIONAL WING EXIT", zone: "Zone B", src: "/videos/vehicle_traffic_output_exit.mp4", status: "live" },
  { id: "CAM-323", name: "ZONE B — FIA ZONE TRACKER 1", zone: "Zone B", src: "/videos/Fia_counter.mp4", status: "live" },
  { id: "CAM-326", name: "ZONE B — FIA ZONE TRACKER 2", zone: "Zone B", src: "/videos/zone_tracker_output_counter.mp4", status: "live" },
  { id: "CAM-330", name: "ZONE B — GATE 12 BOARDING EXIT", zone: "Zone B", src: "/videos/face+_detection_airplane_Exit.mp4", status: "live" },
];

const CAMERA_GROUPS = [
  { id: "all", name: "All Cameras", zones: [] as string[] },
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
    id: 1,
    title: "Queue Congestion — Check-in Hall",
    camId: "CAM-311",
    location: "Zone B — Check-in Hall",
    cam: "CAM-311 • Check-in Hall",
    time: "14:23",
    timestamp: "06/03/2026, 14:23:11",
    color: "text-tactical-amber",
    level: "high",
    confidence: 94,
    icon: Users,
    description: "People in Queue Counter flagged high crowd density at departures corridor due to boarding queue for flight TK-711 to Istanbul (IST).",
    action: "Coordinate queue lines. Dispatch marshals to manage crowd flow.",
    video: "/videos/counter_people_que.mp4",
  },
  {
    id: 2,
    title: "FIA Counter Overcrowding",
    camId: "CAM-317",
    location: "Zone B — FIA Immigration Counters",
    cam: "CAM-317 • FIA Counters",
    time: "13:42",
    timestamp: "06/03/2026, 13:42:15",
    color: "text-tactical-amber",
    level: "high",
    confidence: 97,
    icon: Users,
    description: "Passport Control FIA Counter lines have exceeded 90% capacity due to flight TK-711 boarding to Istanbul (IST), causing bottlenecks.",
    action: "Notify immigration supervisors to activate backup check stations immediately.",
    video: "/videos/zone_tracker_output_counter.mp4",
  },
  {
    id: 3,
    title: "Unattended Baggage Detected",
    camId: "CAM-322",
    location: "Zone B — Departure Stand A Seating",
    cam: "CAM-322 • Stand A Seating",
    time: "15:20",
    timestamp: "06/03/2026, 15:20:01",
    color: "text-tactical-red",
    level: "critical",
    confidence: 96,
    icon: AlertTriangle,
    description: "AI object abandonment algorithm flagged a grey trolley suitcase left unattended for over 5 minutes at Stand A seating area.",
    action: "Isolate 10m radius. Deploy BRAVO-1 with K9 for immediate manual inspection.",
    video: "/videos/forgotten-trolley-case-stand-a.mp4",
  },
  {
    id: 4,
    title: "Baggage Accumulation Alert",
    camId: "CAM-308",
    location: "Zone B — Arrivals Baggage Claim",
    cam: "CAM-308 • Baggage Count",
    time: "14:11",
    timestamp: "06/03/2026, 14:11:02",
    color: "text-tactical-red",
    level: "critical",
    confidence: 95,
    icon: AlertTriangle,
    description: "Baggage Count tracker flagged a high volume of luggage accumulating on Carousel 4 with no handlers clearing the belt.",
    action: "Direct baggage handlers to clear the carousel belt conveyor immediately.",
    video: "/videos/bag_count_output baggeges.mp4",
  },
];

const mapEventCamIdToMarkerId = (camId: string): string => {
  switch (camId) {
    case "CAM-311": return "CAM-PTB-CONG";
    case "CAM-317": return "CAM-LVL2-CROWD";
    case "CAM-322": return "CAM-PTB-BAG";
    case "CAM-305": return "CAM-LVL2-BCONG";
    case "CAM-308": return "CAM-PTB-BAG";
    case "CAM-314": return "CAM-PTB-CONG";
    case "CAM-319": return "CAM-LVL2-LCONG";
    case "CAM-323": return "CAM-LVL2-DROP";
    case "CAM-326": return "CAM-LVL2-OVER";
    case "CAM-330": return "CAM-LVL3-FAULT";
    default: return camId;
  }
};

const getCameraLevel = (camId: string): 1 | 2 | 3 => {
  // All Zone B cameras map to their nearest floor plan level
  return 2;
};

function timeNow() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function SurveillancePage() {
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [sysTime, setSysTime] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setSysTime(timeNow()), 1000);
    setSysTime(timeNow());
    return () => clearInterval(id);
  }, []);

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded pl-8 pr-3 py-1.5 text-xs font-mono focus:outline-none focus:border-tactical-cyan/50"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="p-2 border-b border-border/50">
          {groupsWithCount.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                setSelectedGroup(g.id);
                setActiveLevel(2);
              }}
              className={`w-full flex items-center justify-between px-2 py-2 text-xs font-mono rounded transition-colors group ${selectedGroup === g.id
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
                  onClick={() => {
                    setActiveLevel(2);
                    setSelectedGroup("zone-b");
                    setSelectedCameraId(mapEventCamIdToMarkerId(ev.camId));
                  }}
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

      {/* ── MAIN CONTENT (MAP CANVAS) ── */}
      <div className="flex-1 flex flex-col bg-background min-w-0">

        {/* Top Header */}
        <div className="h-14 shrink-0 px-4 md:px-6 flex items-center justify-between border-b border-border/50 bg-card/40 backdrop-blur">
          <div className="flex items-center gap-3">
            <Video className="h-5 w-5 text-tactical-cyan" />
            <h1 className="text-lg md:text-xl font-bold tracking-tight">AI Surveillance &amp; Floor Maps</h1>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-tactical-red/10 border border-tactical-red/30 text-tactical-red">
              <AlertTriangle className="h-3.5 w-3.5 blink" />
              <span className="font-mono text-[10px] font-bold tracking-wider">4 ALARMS</span>
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
            <span className="font-mono text-[10px] text-muted-foreground tracking-wider">Tactical Blueprint Grid View</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px]">
            <span className="text-muted-foreground tabular-nums">Session: {sysTime}</span>
          </div>
        </div>

        {/* Floor Level Map Canvas */}
        <div className="flex-1 p-3 overflow-hidden w-full relative">
          <PTBMapCanvas
            searchQuery={searchQuery}
            activeLevel={activeLevel}
            onLevelChange={(lvl) => {
              setActiveLevel(lvl);
              if (lvl === 1) setSelectedGroup("terminal-l1");
              else if (lvl === 2) setSelectedGroup("terminal-l2");
              else if (lvl === 3) setSelectedGroup("terminal-l3");
            }}
            selectedCameraId={selectedCameraId}
            onSelectCamera={(id) => setSelectedCameraId(id)}
          />
        </div>
      </div>
    </div>
  );
}
