"use client";

import { useEffect, useState, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Marker, Polygon, Tooltip } from "react-leaflet";
import { Camera, Shield, AlertTriangle, RefreshCw, Layers, Compass, Lock, X, User, ShieldAlert } from "lucide-react";
import { useASF } from "@/components/asf-context";

const statusColorMap: Record<string, string> = {
  available: "#00FF9D",
  en_route: "#FFB700",
  on_scene: "#FF3D3D",
  dispatched: "#FFB700",
};

const incidentColorMap: Record<string, string> = {
  red: "#FF3D3D",
  amber: "#FFB700",
  blue: "#26C6DA",
  green: "#00FF9D",
  black: "#e6edf3",
};

const ZONE_A: [number, number][] = [
  [33.5547045, 72.8605484],
  [33.5560993, 72.8611492],
  [33.5586027, 72.8469871],
  [33.5611775, 72.8473733],
  [33.5630729, 72.8350566],
  [33.5602477, 72.8338979],
  [33.5586027, 72.8332113],
  [33.5554556, 72.8353571],
  [33.5549191, 72.8381036],
  [33.5580663, 72.8393053],
];

const ZONE_B: [number, number][] = [
  [33.5612491, 72.8310226],
  [33.5602120, 72.8293918],
  [33.5612133, 72.8241132],
  [33.5530236, 72.8220104],
  [33.5505558, 72.8380178],
  [33.5543111, 72.8390049],
  [33.5550622, 72.8351854],
  [33.5585669, 72.8326963],
  [33.5607484, 72.8336404],
];

const ZONE_C: [number, number][] = [
  [33.5557790, 72.8033028],
  [33.5564942, 72.8003846],
  [33.5460508, 72.7971230],
  [33.5389685, 72.8464757],
  [33.5436901, 72.8478489],
  [33.5500566, 72.8493081],
  [33.5517019, 72.8392659],
  [33.5505558, 72.8380178],
];

const getVehicleIcon = (groupColor: string, statusColor: string, heading: number, selected: boolean) => {
  const w = selected ? 20 : 16;
  const h = selected ? 34 : 28;
  const scale = selected ? 1.06 : 1;
  return L.divIcon({
    className: "qrf-vehicle-marker",
    html: `
      <div class="qrf-vehicle-wrap" style="width:${w}px;height:${h}px;transform:rotate(${heading}deg) scale(${scale});filter:drop-shadow(0 4px 10px rgba(0,0,0,0.5));">
        <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 32 52" style="display:block;overflow:visible;">
          <ellipse cx="17" cy="28" rx="13" ry="22" fill="rgba(0,0,0,0.22)" transform="translate(1,2)"/>
          <ellipse cx="4.5" cy="13" rx="4"  ry="5.5" fill="#1a1a1a"/>
          <ellipse cx="27.5" cy="13" rx="4" ry="5.5" fill="#1a1a1a"/>
          <ellipse cx="4.5" cy="39" rx="4"  ry="5.5" fill="#1a1a1a"/>
          <ellipse cx="27.5" cy="39" rx="4" ry="5.5" fill="#1a1a1a"/>
          <ellipse cx="4.5" cy="13" rx="3"  ry="4.5" fill="#2a2a2a"/>
          <ellipse cx="27.5" cy="13" rx="3" ry="4.5" fill="#2a2a2a"/>
          <ellipse cx="4.5" cy="39" rx="3"  ry="4.5" fill="#2a2a2a"/>
          <ellipse cx="27.5" cy="39" rx="3" ry="4.5" fill="#2a2a2a"/>
          <ellipse cx="4.5" cy="13" rx="1.2" ry="1.8" fill="#555"/>
          <ellipse cx="27.5" cy="13" rx="1.2" ry="1.8" fill="#555"/>
          <ellipse cx="4.5" cy="39" rx="1.2" ry="1.8" fill="#555"/>
          <ellipse cx="27.5" cy="39" rx="1.2" ry="1.8" fill="#555"/>
          <path d="M16 2 C 22 2, 27 5, 28 9 L 28.5 13 L 28.5 16 L 28 17 L 28 35 L 28.5 36 L 28.5 39 L 28 43 C 27 47, 22 50, 16 50 C 10 50, 5 47, 4 43 L 3.5 39 L 3.5 36 L 4 35 L 4 17 L 3.5 16 L 3.5 13 L 4 9 C 5 5, 10 2, 16 2 Z" fill="${groupColor}" stroke="rgba(0,0,0,0.3)" stroke-width="0.8"/>
          <path d="M10 3.5 C13 2.5, 19 2.5, 22 3.5 L 24 9 C 21 8, 11 8, 8 9 Z" fill="rgba(255,255,255,0.2)"/>
          <path d="M8.5 15 C9 13.5, 11 12.5, 16 12.5 C21 12.5, 23 13.5, 23.5 15 L 23.5 22 C23 23, 21 23.5, 16 23.5 C11 23.5, 9 23, 8.5 22 Z" fill="#1a2330" opacity="0.9"/>
          <rect x="7" y="24" width="18" height="8" rx="1.5" fill="rgba(255,255,255,0.18)"/>
          <path d="M8.5 33 C9 32, 11 31.5, 16 31.5 C21 31.5, 23 32, 23.5 33 L 23.5 40 C23 41, 21 41.5, 16 41.5 C11 41.5, 9 41, 8.5 40 Z" fill="#1a2330" opacity="0.85"/>
          <path d="M10 43 C13 44, 19 44, 22 43 L 24 47 C 21 49, 11 49, 8 47 Z" fill="rgba(255,255,255,0.12)"/>
          <path d="M4 17.5 C2.5 17.5, 1 18.5, 1 20 C1 21.5, 2.5 22.5, 4 22.5" fill="${groupColor}" stroke="rgba(0,0,0,0.3)" stroke-width="0.6"/>
          <path d="M28 17.5 C29.5 17.5, 31 18.5, 31 20 C31 21.5, 29.5 22.5, 28 22.5" fill="${groupColor}" stroke="rgba(0,0,0,0.3)" stroke-width="0.6"/>
          <path d="M9 4.5 C11 3.5, 14 3, 16 3 L 16 5 C14 5, 11 5.5, 9.5 6.5 Z" fill="rgba(255,255,200,0.95)"/>
          <path d="M23 4.5 C21 3.5, 18 3, 16 3 L 16 5 C18 5, 21 5.5, 22.5 6.5 Z" fill="rgba(255,255,200,0.95)"/>
          <path d="M9 47.5 C11 48.5, 14 49, 16 49 L 16 47 C14 47, 11 46.5, 9.5 45.5 Z" fill="rgba(255,50,50,0.95)"/>
          <path d="M23 47.5 C21 48.5, 18 49, 16 49 L 16 47 C18 47, 21 46.5, 22.5 45.5 Z" fill="rgba(255,50,50,0.95)"/>
          <circle cx="16" cy="7.5" r="2.2" fill="${statusColor}" stroke="rgba(0,0,0,0.4)" stroke-width="0.5"/>
        </svg>
      </div>
    `,
    iconSize: [w, h],
    iconAnchor: [w / 2, h / 2],
  });
};

const getOfficerIcon = (statusColor: string, selected: boolean) => {
  const s = selected ? 30 : 24;
  return L.divIcon({
    className: "asf-officer-marker",
    html: `
      <div style="width:${s}px;height:${s}px;filter:drop-shadow(0 3px 8px rgba(0,0,0,0.5));">
        <svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 32 32" style="display:block;">
          <circle cx="16" cy="16" r="14" fill="#0d1a2b" stroke="${statusColor}" stroke-width="2.2"/>
          <path d="M9.5 11.5 C9.5 8.5, 12 6.5, 16 6.5 C20 6.5, 22.5 8.5, 22.5 11.5 L 22.5 12.2 L 9.5 12.2 Z" fill="${statusColor}"/>
          <rect x="8.6" y="12" width="14.8" height="1.8" rx="0.9" fill="#1f2d3d" stroke="${statusColor}" stroke-width="0.5"/>
          <circle cx="16" cy="9.6" r="1.1" fill="#0d1a2b"/>
          <circle cx="16" cy="17" r="3.4" fill="#e8c39e"/>
          <path d="M8.5 27.5 C8.5 23, 11.5 21, 16 21 C20.5 21, 23.5 23, 23.5 27.5 Z" fill="${statusColor}"/>
          <path d="M14.4 21.2 L 16 24.4 L 17.6 21.2 Z" fill="#0d1a2b" opacity="0.85"/>
        </svg>
      </div>
    `,
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
  });
};

// Load PDF.js from cdnjs dynamically
const PDFJS_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

interface InteractiveMarker {
  id: string;
  level: 1 | 2 | 3; // Floor level identifier
  type: "camera" | "gate" | "guard" | "alert";
  name: string;
  x: number; // Percentage coordinate (0-100)
  y: number; // Percentage coordinate (0-100)
  status: "nominal" | "active" | "alert";
  details: string;
  videoUrl?: string;
  angle?: number; // Camera viewing angle
  lat?: number;
  lng?: number;
}

const mockMarkers: InteractiveMarker[] = [
  // ── LEVEL 1 MARKERS ──
  {
    id: "CAM-PTB-GATE-ANPR",
    level: 1,
    type: "camera",
    name: "CAM-101 (L1 Main Gate ANPR)",
    x: 20,
    y: 75,
    status: "active",
    details: "Nominal gate entrance license plate reader active.",
    videoUrl: "/videos/vehicle_traffic_output_exit.mp4",
    angle: 90,
    lat: 33.5570,
    lng: 72.8495,
  },
  {
    id: "CAM-PTB-CONG",
    level: 1,
    type: "camera",
    name: "CAM-112 (L1 Departures Queue Counter)",
    x: 56,
    y: 45,
    status: "alert",
    details: "ANOMALY DETECTED: People in Queue Counter shows high queue density at departures corridor.",
    videoUrl: "/videos/counter_people_que.mp4",
    angle: 45,
    lat: 33.5562,
    lng: 72.8290,
  },
  {
    id: "CAM-PTB-LOIT",
    level: 1,
    type: "camera",
    name: "CAM-105 (L1 Immigration Queue Counter)",
    x: 70,
    y: 62,
    status: "active",
    details: "Immigration Queue Counter operating normally. Monitoring passenger throughput.",
    videoUrl: "/videos/counter_people_que.mp4",
    angle: 135,
    lat: 33.5552,
    lng: 72.8310,
  },
  {
    id: "CAM-PTB-BAG",
    level: 1,
    type: "camera",
    name: "CAM-108 (L1 Arrivals Baggage Claim Carousel 4)",
    x: 44,
    y: 31,
    status: "active",
    details: "Baggage Count tracker operational. Monitoring carousel throughput.",
    videoUrl: "/videos/bag_count_output baggeges.mp4",
    angle: 225,
    lat: 33.5546,
    lng: 72.8315,
  },
  {
    id: "GATE-PTB-01",
    level: 1,
    type: "gate",
    name: "Checkpoint Alpha (Main Gate)",
    x: 18,
    y: 72,
    status: "nominal",
    details: "Primary walk-through metal detectors and explosive sniffers.",
    lat: 33.5568,
    lng: 72.8490,
  },
  {
    id: "GUARD-PTB-01",
    level: 1,
    type: "guard",
    name: "Guard Usman (Patrol 1)",
    x: 52,
    y: 65,
    status: "nominal",
    details: "On-duty mobile patrol in Central Atrium.",
    lat: 33.5555,
    lng: 72.8300,
  },
  {
    id: "GUARD-PTB-02",
    level: 1,
    type: "guard",
    name: "Guard Naveed (Patrol 3)",
    x: 44,
    y: 18,
    status: "nominal",
    details: "Stationary guard post at Baggage Claim staff exit.",
    lat: 33.5540,
    lng: 72.8325,
  },

  // ── LEVEL 2 MARKERS ──
  {
    id: "CAM-LVL2-CROWD",
    level: 2,
    type: "camera",
    name: "CAM-201 (L2 Passport Control FIA Counter)",
    x: 35,
    y: 48,
    status: "alert",
    details: "ANOMALY DETECTED: FIA Counter capacity Warning. Crowd build-up and queuing congestion.",
    videoUrl: "/videos/zone_tracker_output_counter.mp4",
    angle: 45,
    lat: 33.5550,
    lng: 72.8305,
  },
  {
    id: "CAM-LVL2-LCONG",
    level: 2,
    type: "camera",
    name: "CAM-205 (L2 Terminal Exit Vehicle Traffic)",
    x: 18,
    y: 76,
    status: "active",
    details: "Vehicle Traffic Exit monitoring lane flow. No anomalies detected.",
    videoUrl: "/videos/vehicle_traffic_output_exit.mp4",
    angle: 135,
    lat: 33.5535,
    lng: 72.8385,
  },
  {
    id: "CAM-LVL2-BCONG",
    level: 2,
    type: "camera",
    name: "CAM-208 (L2 Terminal Parking Area)",
    x: 46,
    y: 28,
    status: "active",
    details: "Plate Recognition system active. Monitoring parking area entries and exits.",
    videoUrl: "/videos/plate_recognition_output_parking_area.mp4",
    angle: 385,
    lat: 33.5525,
    lng: 72.8270,
  },
  {
    id: "CAM-LVL2-DROP",
    level: 2,
    type: "camera",
    name: "CAM-212 (L2 Counter Zone Tracker 1)",
    x: 78,
    y: 64,
    status: "alert",
    details: "ANOMALY DETECTED: Zone Tracker flags passenger crossing secure boundary lines near counter area 1.",
    videoUrl: "/videos/Fia_counter.mp4",
    angle: 315,
    lat: 33.5558,
    lng: 72.8298,
  },
  {
    id: "CAM-LVL2-OVER",
    level: 2,
    type: "camera",
    name: "CAM-215 (L2 Counter Zone Tracker 2)",
    x: 52,
    y: 60,
    status: "active",
    details: "Zone Tracker monitoring crowd movements near counter area 2. No boundary violations.",
    videoUrl: "/videos/zone_tracker_output_counter.mp4",
    angle: 45,
    lat: 33.5560,
    lng: 72.8295,
  },
  {
    id: "GATE-LVL2-01",
    level: 2,
    type: "gate",
    name: "Checkpoint Bravo (T2 Departures)",
    x: 24,
    y: 42,
    status: "nominal",
    details: "Level 2 secondary security terminal and body scanner scanners.",
    lat: 33.5554,
    lng: 72.8308,
  },
  {
    id: "GUARD-LVL2-01",
    level: 2,
    type: "guard",
    name: "Guard Faisal (Patrol Level 2)",
    x: 48,
    y: 35,
    status: "nominal",
    details: "Mobile rapid response guard patrolling Level 2 departures concourse.",
    lat: 33.5551,
    lng: 72.8320,
  },
  {
    id: "GUARD-LVL2-02",
    level: 2,
    type: "guard",
    name: "Guard Tariq (Stationary Post)",
    x: 82,
    y: 22,
    status: "nominal",
    details: "Stationary security post monitoring restricted gate access corridors.",
    lat: 33.5559,
    lng: 72.8285,
  },

  // ── LEVEL 3 MARKERS ──
  {
    id: "CAM-LVL3-FAULT",
    level: 3,
    type: "camera",
    name: "CAM-301 (L3 Boarding Gate 12 Exit)",
    x: 42,
    y: 55,
    status: "alert",
    details: "ANOMALY DETECTED: NADRA watchlist match CNIC: 37405-*******-1 (masked). Proactive re-identification tracking loop locked.",
    videoUrl: "/videos/face+_detection_airplane_Exit.mp4",
    angle: 45,
    lat: 33.5568,
    lng: 72.8262,
  },
  {
    id: "GATE-LVL3-01",
    level: 3,
    type: "gate",
    name: "Departure Jet Bridge Control Room",
    x: 26,
    y: 72,
    status: "nominal",
    details: "Primary operations console and terminal jet bridge dispatch.",
    lat: 33.5566,
    lng: 72.8260,
  },
  {
    id: "GUARD-LVL3-01",
    level: 3,
    type: "guard",
    name: "Guard Jahangir (Boarding Patrol)",
    x: 55,
    y: 48,
    status: "nominal",
    details: "Mobile patrol patrolling high-security gate corridors on Level 3.",
    lat: 33.5564,
    lng: 72.8265,
  },
];

interface PTBMapCanvasProps {
  searchQuery?: string;
  activeLevel?: 1 | 2 | 3;
  onLevelChange?: (level: 1 | 2 | 3) => void;
  selectedCameraId?: string | null;
  onSelectCamera?: (id: string | null) => void;
}

export default function PTBMapCanvas({
  searchQuery = "",
  activeLevel: externalActiveLevel,
  onLevelChange,
  selectedCameraId,
  onSelectCamera,
}: PTBMapCanvasProps = {}) {
  const [localActiveLevel, setLocalActiveLevel] = useState<1 | 2 | 3>(1);
  const activeLevel = externalActiveLevel !== undefined ? externalActiveLevel : localActiveLevel;

  const { incidents, setIncidents, groups } = useASF();
  const [anprStage, setAnprStage] = useState<"capture" | "enriching" | "enriched" | "alert" | "respond">("capture");
  const [pushedToGate, setPushedToGate] = useState(false);
  const [unattendedSeconds, setUnattendedSeconds] = useState(0);

  // Unattended timer for RESPOND stage
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (anprStage === "respond") {
      timer = setInterval(() => {
        setUnattendedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setUnattendedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [anprStage]);

  const handleLevelChange = (level: 1 | 2 | 3) => {
    if (onLevelChange) {
      onLevelChange(level);
    } else {
      setLocalActiveLevel(level);
    }
  };

  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>("active");
  const [dimensions, setDimensions] = useState({ width: 1000, height: 1000 });
  const [activeOverlay, setActiveOverlay] = useState<"all" | "cameras" | "guards" | "gates">("all");

  // Track resolved alerts by marker ID globally
  const [resolvedAlerts, setResolvedAlerts] = useState<string[]>([]);

  const [openTabs, setOpenTabs] = useState<InteractiveMarker[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isPlayingFeed, setIsPlayingFeed] = useState(true);
  const [expandedCamera, setExpandedCamera] = useState<InteractiveMarker | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Synchronize external camera selection from props
  useEffect(() => {
    if (selectedCameraId) {
      const marker = mockMarkers.find((m) => m.id === selectedCameraId);
      if (marker) {
        setOpenTabs((prev) => {
          if (prev.some((t) => t.id === marker.id)) return prev;
          return [...prev, marker];
        });
        setActiveTabId(marker.id);
        setIsPlayingFeed(true);
      }
    }
  }, [selectedCameraId]);

  // Get currently active tab element
  const activeElement = openTabs.find((t) => t.id === activeTabId) || null;

  // 1. Dynamically load PDF.js script
  useEffect(() => {
    if ((window as any).pdfjsLib) {
      setPdfjsLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = PDFJS_SRC;
    script.onload = () => {
      // Set the worker src
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
      setPdfjsLoaded(true);
    };
    script.onerror = () => {
      setLoadingProgress("Failed to load PDF engine from CDN. Retrying...");
    };
    document.head.appendChild(script);
  }, []);

  // 2. Render PDF to Canvas and extract Image (handles Level 1, 2, & 3)
  useEffect(() => {
    if (!pdfjsLoaded) return;

    const renderPdf = async () => {
      try {
        setLoading(true);
        setLoadingProgress(`Fetching PTB Level ${activeLevel} blueprint...`);
        const pdfjsLib = (window as any).pdfjsLib;

        // Choose PDF depending on active level selector
        let pdfFile = "/PTB LEVEL 1-Model(New).pdf";
        if (activeLevel === 2) pdfFile = "/PTB LEVEL 2-Model (New).pdf";
        else if (activeLevel === 3) pdfFile = "/PTB LEVEL 3-Model (New).pdf";

        const loadingTask = pdfjsLib.getDocument(pdfFile);
        const pdf = await loadingTask.promise;

        setLoadingProgress(`Rendering high-res terminal Level ${activeLevel} model...`);
        // Get the first page
        const page = await pdf.getPage(1);

        // Render at high scale for excellent blueprint clarity
        const scale = 2.5;
        const viewport = page.getViewport({ scale });

        // Setup hidden canvas
        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        setDimensions({ width: viewport.width, height: viewport.height });

        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not get 2D canvas context");

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Extract high-quality PNG
        setLoadingProgress("Generating interactive overlay...");
        const dataUrl = canvas.toDataURL("image/png");
        setImageUrl(dataUrl);
        setLoading(false);
      } catch (err) {
        console.error("PDF Render Error:", err);
        setLoadingProgress(`Failed to render Level ${activeLevel} model. Check public directory.`);
      }
    };

    renderPdf();
  }, [pdfjsLoaded, activeLevel]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#070b10] border border-border/40 rounded-xl p-8 min-h-[500px]">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-tactical-cyan/10 border-t-2 border-t-tactical-cyan animate-spin" />
          <RefreshCw className="h-6 w-6 text-tactical-cyan absolute inset-0 m-auto animate-pulse" />
        </div>
        <span className="font-mono text-sm text-foreground font-bold tracking-wider uppercase mb-1">
          TACTICAL RASTERIZER ACTIVE
        </span>
        <span className="font-mono text-xs text-muted-foreground tracking-wide animate-pulse">
          {loadingProgress}
        </span>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // Simple Coordinate Reference System bounds
  const bounds: L.LatLngBoundsExpression = [
    [0, 0],
    [dimensions.height, dimensions.width],
  ];

  // Helper to convert percentage coordinates into map coordinate points
  const getMapCoords = (pctX: number, pctY: number): [number, number] => {
    const x = (pctX / 100) * dimensions.width;
    const y = ((100 - pctY) / 100) * dimensions.height;
    return [y, x];
  };

  // Compile active markers based on floor level and resolved alerts
  const currentMarkers = mockMarkers
    .filter((m) => m.level === activeLevel)
    .map((m) => {
      const isResolved = resolvedAlerts.includes(m.id);
      return {
        ...m,
        status: isResolved ? ("nominal" as const) : m.status,
      };
    });

  const filteredMarkers = currentMarkers.filter((m) => {
    if (m.type !== "camera") return false;

    let matchesSearch = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      matchesSearch = m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
    }

    return matchesSearch;
  });

  const alertCount = currentMarkers.filter((m) => m.status === "alert").length;

  const handleResolveAlert = (id: string) => {
    setResolvedAlerts((prev) => [...prev, id]);

    // Update element inside openTabs state
    setOpenTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "nominal" as const } : t))
    );
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-4 min-h-[500px] relative">
      {/* MAP GRID CANVAS */}
      <div className="relative glow-border rounded-xl bg-card noise-texture overflow-hidden border border-border/50 flex flex-col h-[520px]">

        {/* Map Header Controls Wrapper (Level Switcher & Layers Filter) */}
        <div className="absolute top-3 left-3 z-[1000] flex items-center gap-3">

          {/* Floor Level Switcher */}
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-card/95 border border-border/80 backdrop-blur-md shadow-md">
            <span className="font-mono text-[9px] font-bold text-muted-foreground ml-1 uppercase tracking-wider">FLOOR:</span>
            {[
              { id: 1, label: "L1" },
              { id: 2, label: "L2" },
              { id: 3, label: "L3" },
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => {
                  setLoading(true);
                  handleLevelChange(lvl.id as 1 | 2 | 3);
                  // Keep tabs but reset active tab selection to keep coordinates consistent
                  setActiveTabId(null);
                }}
                className={`font-mono text-[9px] font-bold px-2 py-1 rounded transition-all uppercase tracking-wider cursor-pointer ${activeLevel === lvl.id
                  ? "bg-tactical-cyan/20 text-tactical-cyan border border-tactical-cyan/40"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Warning Indicator */}
        {alertCount > 0 && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-tactical-red/10 border border-tactical-red/30 backdrop-blur-md animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5 text-tactical-red" />
            <span className="font-mono text-[9px] text-tactical-red font-bold uppercase tracking-widest">
              {alertCount} SECTOR ALERTS ACTIVE
            </span>
          </div>
        )}

        {/* LEAFLET WORKSPACE */}
        <div className="flex-1 w-full h-full relative bg-black">
          <MapContainer
            center={[33.5505, 72.8280]}
            zoom={14}
            zoomControl={false}
            style={{ height: "100%", width: "100%" }}
          >
            {/* Real geographical tiles */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            {/* Zone Polygons */}
            <Polygon positions={ZONE_A} pathOptions={{ color: '#22c55e', weight: 2, fillColor: '#22c55e', fillOpacity: 0.08, interactive: false }}>
              <Tooltip permanent direction="center" className="zone-label">ZONE A</Tooltip>
            </Polygon>
            <Polygon positions={ZONE_B} pathOptions={{ color: '#f59e0b', weight: 2, fillColor: '#f59e0b', fillOpacity: 0.08, interactive: false }}>
              <Tooltip permanent direction="center" className="zone-label">ZONE B</Tooltip>
            </Polygon>
            <Polygon positions={ZONE_C} pathOptions={{ color: '#ef4444', weight: 2, fillColor: '#ef4444', fillOpacity: 0.08, interactive: false }}>
              <Tooltip permanent direction="center" className="zone-label">ZONE C</Tooltip>
            </Polygon>


            {/* Incidents are shown in Command Center / ASF Patrols, not on surveillance map */}


            {/* Render dynamic interactive elements (Cameras, Gates, stationary guards) */}
            {filteredMarkers.map((marker) => {
              const coords: [number, number] = [marker.lat || 33.5505, marker.lng || 72.8280];
              const isSelected = activeTabId === marker.id;

              let color = "#4CC3FF";
              if (marker.type === "guard") color = "#FFB700";
              else if (marker.type === "gate") color = "#00FF9D";

              if (marker.type === "camera") {
                const angle = marker.angle || 0;
                const iconHtml = `
                  <div class="relative flex items-center justify-center w-14 h-14" style="transform: translate(-14px, -14px);">
                    <div class="absolute rounded-full border transition-all ${isSelected ? "border-white" : ""}" 
                         style="background-color: #ffffff; border-color: ${isSelected ? "#ffffff" : color}; border-width: 2.5px; width: 44px; height: 44px; box-shadow: 0 0 15px ${color}60;">
                    </div>
                    
                    <div class="absolute transition-transform duration-300" style="transform: rotate(${angle}deg); width: 28px; height: 28px;">
                      <div style="
                        width: 100%;
                        height: 100%;
                        background-color: ${color};
                        -webkit-mask-image: url('/camera-icon.png');
                        mask-image: url('/camera-icon.png');
                        -webkit-mask-size: contain;
                        mask-size: contain;
                        -webkit-mask-repeat: no-repeat;
                        mask-repeat: no-repeat;
                        -webkit-mask-position: center;
                        mask-position: center;
                      "></div>
                    </div>
                  </div>
                `;

                const customIcon = L.divIcon({
                  html: iconHtml,
                  className: "custom-leaflet-camera",
                  iconSize: [28, 28],
                  iconAnchor: [14, 14],
                });

                return (
                  <Marker
                    key={marker.id}
                    position={coords}
                    icon={customIcon}
                    eventHandlers={{
                      click: () => {
                        setOpenTabs((prev) => {
                          if (prev.some((t) => t.id === marker.id)) return prev;
                          return [...prev, marker];
                        });
                        setActiveTabId(marker.id);
                        setIsPlayingFeed(true);
                        if (onSelectCamera) {
                          onSelectCamera(marker.id);
                        }
                      },
                    }}
                  >
                  </Marker>
                );
              }

              return null;
            })}
          </MapContainer>

          {/* Compass Rose Grid Aesthetic */}
          <div className="absolute bottom-3 left-3 pointer-events-none z-10 flex items-center gap-2 text-muted-foreground/40 font-mono text-[9px]">
            <Compass className="h-5 w-5 animate-spin" style={{ animationDuration: "30s" }} />
            <span>ISLAMABAD INTERNATIONAL AIRPORT • INTEGRATED TACTICAL VIEW</span>
          </div>

          <div className="absolute bottom-3 right-3 pointer-events-none z-10 font-mono text-[9px] text-muted-foreground/40 uppercase tracking-widest">
            IIA GEOGRAPHIC LEVEL {activeLevel} VIEW
          </div>
        </div>
      </div>

      {/* DETAILED INFORMATION OVERLAY */}
      <div className="flex flex-col h-[520px]">
        {openTabs.length > 0 && activeElement ? (
          <div className="glow-border rounded-xl bg-card border border-border/50 overflow-hidden relative flex-1 flex flex-col justify-between h-full">
            {/* Dynamic Folder Tabs Bar */}
            <div className="flex bg-secondary/20 border-b border-border/40 overflow-x-auto shrink-0 scrollbar-none items-center justify-between">
              <div className="flex overflow-x-auto">
                {openTabs.map((tab) => {
                  const isActive = tab.id === activeTabId;
                  let tabColor = "border-b-tactical-cyan text-tactical-cyan";
                  if (tab.status === "alert") tabColor = "border-b-tactical-red text-tactical-red";
                  else if (tab.type === "guard") tabColor = "border-b-tactical-amber text-tactical-amber";
                  else if (tab.type === "gate") tabColor = "border-b-tactical-green text-tactical-green";

                  return (
                    <div
                      key={tab.id}
                      onClick={() => {
                        setActiveTabId(tab.id);
                        setIsPlayingFeed(true);
                        if (onSelectCamera) {
                          onSelectCamera(tab.id);
                        }
                      }}
                      className={`flex items-center gap-3 px-6 py-4 border-r border-border/40 text-[12px] font-mono font-bold cursor-pointer transition-all ${isActive
                        ? `bg-card border-b-2 ${tabColor}`
                        : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                        }`}
                    >
                      {/* Displays floor context inside tab header */}
                      <span className="truncate max-w-[150px]">L{tab.level} • {tab.id.split("-")[2] || tab.id}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenTabs((prev) => {
                            const updated = prev.filter((t) => t.id !== tab.id);
                            if (activeTabId === tab.id) {
                              if (updated.length > 0) {
                                const nextActiveId = updated[updated.length - 1].id;
                                setActiveTabId(nextActiveId);
                                if (onSelectCamera) onSelectCamera(nextActiveId);
                              } else {
                                setActiveTabId(null);
                                if (onSelectCamera) onSelectCamera(null);
                              }
                            }
                            return updated;
                          });
                        }}
                        className="hover:text-tactical-red p-0.5 rounded transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => {
                  setOpenTabs([]);
                  setActiveTabId(null);
                  if (onSelectCamera) {
                    onSelectCamera(null);
                  }
                }}
                className="font-mono text-[11px] font-bold text-muted-foreground hover:text-foreground px-5 py-4 cursor-pointer border-l border-border/40"
              >
                CLOSE ALL
              </button>
            </div>

            {/* Selected Tab content body */}
            <div className="flex-1 overflow-y-auto">
              {activeElement.id === "CAM-PTB-GATE-ANPR" || activeElement.id === "CAM-LVL2-BCONG" ? (
                <div className="flex flex-col h-full justify-between">
                  <div>
                    {/* Title and Header */}
                    <div className={`px-5 py-4 flex items-start justify-between border-b border-border/20 ${
                      ["enriched", "alert", "respond"].includes(anprStage) 
                        ? "bg-gradient-to-r from-tactical-red/10 to-transparent" 
                        : "bg-gradient-to-r from-tactical-cyan/10 to-transparent"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${
                          ["enriched", "alert", "respond"].includes(anprStage)
                            ? "bg-tactical-red/20 border-tactical-red/40"
                            : "bg-tactical-cyan/20 border-tactical-cyan/40"
                        }`}>
                          <Camera className={`h-5 w-5 ${["enriched", "alert", "respond"].includes(anprStage) ? "text-tactical-red" : "text-tactical-cyan"}`} />
                        </div>
                        <div>
                          <h3 className="font-mono text-sm font-bold tracking-wider">VEHICLE ANPR PIPELINE</h3>
                          <span className="font-mono text-[10px] text-muted-foreground tracking-[0.15em] uppercase">
                            {anprStage === "capture" && "STAGE 1: CAPTURING PLATE"}
                            {anprStage === "enriching" && "STAGE 2: WATCHLIST LOOKUP..."}
                            {anprStage === "enriched" && "STAGE 2: WATCHLIST MATCHED"}
                            {anprStage === "alert" && "STAGE 3: HALT ADVISORY"}
                            {anprStage === "respond" && "STAGE 4: RESPONDING & TRACKING"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stage Progress Selector */}
                    <div className="px-5 py-2.5 bg-secondary/15 border-b border-border/20 flex items-center justify-between font-mono text-[9px] font-bold tracking-wider">
                      {[
                        { key: "capture", label: "1. CAPTURE" },
                        { key: "enriched", label: "2. ENRICH" },
                        { key: "alert", label: "3. ALERT" },
                        { key: "respond", label: "4. RESPOND" },
                      ].map((stage, idx) => {
                        const isActive = anprStage === stage.key || (stage.key === "enriched" && anprStage === "enriching");
                        const isCompleted = 
                          (stage.key === "capture" && anprStage !== "capture") ||
                          (stage.key === "enriched" && ["alert", "respond"].includes(anprStage)) ||
                          (stage.key === "alert" && anprStage === "respond");
                        
                        return (
                          <button
                            key={stage.key}
                            onClick={() => {
                              if (stage.key === "enriched") {
                                setAnprStage("enriching");
                                setTimeout(() => setAnprStage("enriched"), 1200);
                              } else {
                                setAnprStage(stage.key as any);
                                if (stage.key === "capture") setPushedToGate(false);
                              }
                            }}
                            className={`px-2 py-1 rounded transition-all uppercase tracking-wider cursor-pointer border ${
                              isActive ? "bg-tactical-cyan/20 text-tactical-cyan border-tactical-cyan/40" :
                              isCompleted ? "bg-tactical-green/10 text-tactical-green border-tactical-green/20" : "text-muted-foreground border-transparent hover:text-foreground"
                            }`}
                          >
                            {stage.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Body Content */}
                    <div className="p-5 space-y-5">
                      {/* Event Status Severity Card */}
                      <div className={`p-4 rounded-lg border font-mono text-xs ${
                        anprStage === "capture" ? "bg-tactical-cyan/5 border-tactical-cyan/35 text-tactical-cyan" :
                        anprStage === "enriching" ? "bg-tactical-amber/5 border-tactical-amber/35 text-tactical-amber" :
                        "bg-tactical-red/5 border-tactical-red/35 text-tactical-red"
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">ALARM LEVEL</span>
                          <span className="font-bold tracking-widest">
                            {anprStage === "capture" ? "NEUTRAL (CAPTURE EVENT)" :
                             anprStage === "enriching" ? "LOOKUP IN PROGRESS" : "CRITICAL RISK (WATCHLIST MATCH)"}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-foreground">
                          {anprStage === "capture" && "Plate Captured — Outer Cordon"}
                          {anprStage === "enriching" && "Watchlist Verification active..."}
                          {["enriched", "alert", "respond"].includes(anprStage) && "Watchlist Plate Match Detected"}
                        </h4>
                      </div>

                      {/* Metadata list */}
                      <div className="space-y-2.5 font-mono text-xs">
                        {/* Labeled Plate Data Point */}
                        <div className="flex justify-between items-center py-2 border-b border-border/20">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">OCR PLATE NO</span>
                          <span className="font-bold text-foreground text-sm tracking-widest bg-secondary/80 px-2 py-0.5 rounded border border-border">
                            LEB-17-4490
                          </span>
                        </div>

                        {/* Watchlist verification source */}
                        {["enriched", "alert", "respond"].includes(anprStage) && (
                          <div className="flex justify-between items-center py-2 border-b border-border/20">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">WATCHLIST LOOKUP</span>
                            <span className="font-bold text-tactical-red">
                              FLAGGED — Prior-Incident (ASF Watchlist Register)
                            </span>
                          </div>
                        )}

                        {/* Advisory & Actionable instructions */}
                        {anprStage === "alert" && (
                          <div className="border border-tactical-red/40 bg-tactical-red/5 p-3.5 rounded-lg space-y-2">
                            <span className="text-[10px] text-tactical-red font-bold uppercase tracking-widest block">OPERATOR DIRECTIVE</span>
                            <p className="font-bold text-tactical-red text-sm">ACTION REQUIRED: Halt & Verify</p>
                            <div className="flex items-center justify-between pt-1">
                              <button
                                onClick={() => setPushedToGate(true)}
                                className="px-3 py-1.5 rounded bg-tactical-red text-white text-[10px] font-bold hover:bg-tactical-red/80 transition-colors cursor-pointer"
                              >
                                Push to Gate Post
                              </button>
                              {pushedToGate && (
                                <span className="px-2 py-1 rounded bg-tactical-green/15 text-tactical-green text-[9px] border border-tactical-green/40 font-bold uppercase flex items-center gap-1 animate-pulse">
                                  ✓ Pushed to Gate Post
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Handoff, Map Twin link, and live unattended timer */}
                        {anprStage === "respond" && (
                          <div className="space-y-4">
                            {/* Camera Handoff indicator */}
                            <div className="bg-secondary/35 border border-border/40 p-3 rounded-lg space-y-2">
                              <span className="text-[10px] text-muted-foreground uppercase tracking-widest block">CAMERA HANDOFF TRACK</span>
                              <div className="flex items-center gap-2 font-bold text-xs text-tactical-cyan">
                                <span>CAM-101 (Gate Cam)</span>
                                <span>➔</span>
                                <span>CAM-208 (Parking Cam)</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground block">
                                Handoff complete. Suspect vehicle parked, driver exited cabin.
                              </span>
                            </div>

                            {/* Live countdown timer */}
                            <div className="flex justify-between items-center py-2 border-b border-border/20 bg-tactical-red/5 px-2 rounded border border-tactical-red/20 animate-pulse">
                              <span className="text-[10px] text-tactical-red font-bold uppercase tracking-widest flex items-center gap-1.5">
                                ⏱ UNATTENDED VEHICLE TIMER
                              </span>
                              <span className="font-bold text-tactical-red text-sm tabular-nums">
                                {String(Math.floor(unattendedSeconds / 60)).padStart(2, "0")}:{String(unattendedSeconds % 60).padStart(2, "0")}
                              </span>
                            </div>

                            {/* Twin Map Link to Shared Store */}
                            <div className="bg-tactical-cyan/5 border border-tactical-cyan/30 p-3 rounded-lg space-y-1">
                              <span className="text-[10px] text-tactical-cyan font-bold uppercase tracking-widest block">SHARED STORE LINK</span>
                              <p className="text-foreground">Incident Twin ID: <span className="font-bold text-tactical-cyan">INC-101</span></p>
                              <span className="text-[10px] text-muted-foreground block">
                                Mappable incident synced. Renders as a suspicious vehicle occupant incident on the ASF Tactical Map.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Live Surveillance stream player */}
                      <div className="space-y-2.5 pt-2.5">
                        <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase block">
                          Live Surveillance Stream ({anprStage === "respond" ? "CAM-208" : "CAM-101"})
                        </span>
                        <div
                          className="relative rounded-lg overflow-hidden border border-border/60 bg-zinc-950"
                          style={{ aspectRatio: "16/9" }}
                        >
                          {anprStage === "enriching" ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950">
                              <div className="w-10 h-10 rounded-full border-2 border-tactical-amber/20 border-t-2 border-t-tactical-amber animate-spin" />
                              <span className="font-mono text-[9px] text-tactical-amber tracking-widest uppercase font-bold blink">
                                CHECKING WATCHLIST REGISTERS...
                              </span>
                            </div>
                          ) : (
                            <video 
                              key={anprStage === "respond" ? "CAM-208" : "CAM-101"}
                              src={anprStage === "respond" ? "/videos/plate_recognition_output_parking_area.mp4" : "/videos/vehicle_traffic_output_exit.mp4"} 
                              autoPlay muted loop playsInline 
                              className="absolute inset-0 w-full h-full object-cover" 
                            />
                          )}
                          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-tactical-red px-2 py-0.5 rounded text-white font-mono text-[9px] font-bold tracking-widest pointer-events-none z-10">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            LIVEFEED
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Header info */}
                  <div className={`px-5 py-4 flex items-start justify-between border-b border-border/20 ${activeElement.status === "alert"
                    ? "bg-gradient-to-r from-tactical-red/10 to-transparent"
                    : activeElement.type === "camera"
                      ? "bg-gradient-to-r from-tactical-cyan/10 to-transparent"
                      : activeElement.type === "guard"
                        ? "bg-gradient-to-r from-tactical-amber/10 to-transparent"
                        : "bg-gradient-to-r from-tactical-green/10 to-transparent"
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${activeElement.status === "alert"
                        ? "bg-tactical-red/20 border-tactical-red/40"
                        : activeElement.type === "camera"
                          ? "bg-tactical-cyan/20 border-tactical-cyan/40"
                          : activeElement.type === "guard"
                            ? "bg-tactical-amber/20 border-tactical-amber/40"
                            : "bg-tactical-green/20 border-tactical-green/40"
                        }`}>
                        {activeElement.type === "camera" ? (
                          <Camera className="h-5 w-5 text-tactical-cyan" />
                        ) : activeElement.type === "gate" ? (
                          <Lock className="h-5 w-5 text-tactical-green" />
                        ) : activeElement.type === "guard" ? (
                          <Shield className="h-5 w-5 text-tactical-amber" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-tactical-red" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-mono text-sm font-bold tracking-wider">{activeElement.name}</h3>
                        <span className="font-mono text-[10px] text-muted-foreground tracking-[0.15em]">L{activeElement.level} • {activeElement.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Information body */}
                  <div className="p-5 space-y-5">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center py-2 border-b border-border/20">
                        <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Floor Location</span>
                        <span className="font-mono text-xs font-bold text-tactical-cyan">LEVEL {activeElement.level}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/20">
                        <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Grid Coordinates</span>
                        <span className="font-mono text-xs font-bold">X: {activeElement.x}%, Y: {activeElement.y}%</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/20">
                        <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Status Code</span>
                        <span
                          className={`font-mono text-xs font-bold tracking-wider uppercase ${activeElement.status === "alert" ? "text-tactical-red" : "text-tactical-green"
                            }`}
                        >
                          {activeElement.status}
                        </span>
                      </div>
                      {activeElement.type === "camera" && activeElement.angle !== undefined && (
                        <div className="flex justify-between items-center py-2 border-b border-border/20">
                          <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Viewing Angle</span>
                          <span className="font-mono text-xs font-bold text-tactical-cyan">{activeElement.angle}°</span>
                        </div>
                      )}
                      {activeElement.id === "CAM-LVL3-FAULT" ? (
                        <div className="pt-2.5 space-y-4">
                          <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase block mb-1.5">NADRA FACIAL + TRACKING STATUS</span>
                          <div className="bg-secondary/35 border border-border/40 p-3 rounded-lg space-y-2 font-mono text-xs">
                            <div className="flex justify-between items-center pb-1.5 border-b border-border/20">
                              <span className="text-muted-foreground">ENGINE:</span>
                              <span className="text-tactical-cyan font-bold">NADRA Matcher v4</span>
                            </div>
                            <div className="flex justify-between items-center pb-1.5 border-b border-border/20">
                              <span className="text-muted-foreground">MATCHED CNIC:</span>
                              <span className="text-foreground">37405-*******-1 (Masked per RBAC)</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">CONFIDENCE:</span>
                              <span className="text-tactical-red font-bold">93% Match</span>
                            </div>
                          </div>

                          {/* Stage Timeline */}
                          <div className="space-y-3 pt-2 font-mono text-xs">
                            <span className="text-[10px] text-muted-foreground tracking-widest uppercase block mb-1">DETECTION SIGNAL PATH</span>
                            {[
                              { stage: "CAPTURE", desc: "Passengers deplane & head to terminal", detail: "flow count P2", done: true, color: "text-tactical-green" },
                              { stage: "ENRICH", desc: "Immigration hall face match matched 1:few vs enrolled watchlist", detail: "NADRA: match CNIC masked", done: true, color: "text-tactical-green" },
                              { stage: "TRACK", desc: "Locking subject & re-identification across cameras", detail: "live thread on twin", done: true, color: "text-tactical-cyan" },
                              { stage: "ALERT", desc: "Subject reaches exit corridor, RBAC alert triggered", detail: "intercept team notified", done: true, color: "text-tactical-red" },
                            ].map((step, idx) => (
                              <div key={idx} className="flex gap-3 items-start border-l border-border/40 pl-3 relative pb-2 last:pb-0">
                                <div className="absolute -left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-[#080d12] border border-tactical-cyan flex items-center justify-center">
                                  <div className="h-1.5 w-1.5 rounded-full bg-tactical-cyan animate-pulse" />
                                </div>
                                <div>
                                  <span className={`font-bold block tracking-wider ${step.color}`}>{step.stage}</span>
                                  <p className="text-muted-foreground text-[10px] leading-relaxed">{step.desc}</p>
                                  <span className="text-[9px] tracking-wide text-tactical-cyan bg-tactical-cyan/15 px-1.5 py-0.5 rounded block w-fit mt-1">{step.detail}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2.5">
                          <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase block mb-1.5">Details</span>
                          <p className="font-mono text-xs text-foreground/80 leading-relaxed bg-secondary/35 border border-border/40 p-3 rounded">
                            {activeElement.details}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Video feed rendering directly in this tab */}
                    {activeElement.type === "camera" && activeElement.videoUrl && (
                      <div className="space-y-2.5 pt-2.5">
                        <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase block">Live Surveillance Stream</span>
                        <div
                          onClick={() => setExpandedCamera(activeElement)}
                          className="relative rounded-lg overflow-hidden border border-border/60 bg-zinc-950 cursor-pointer hover:border-tactical-cyan/60 group transition-all"
                          style={{ aspectRatio: "16/9" }}
                        >
                          {isPlayingFeed ? (
                            <>
                              <video src={activeElement.videoUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <span className="font-mono text-[10px] text-tactical-cyan font-bold tracking-widest uppercase bg-black/60 px-2.5 py-1 rounded border border-tactical-cyan/40">
                                  CLICK TO ENLARGE VIDEO FEED
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-900 transition-colors">
                              <div className="w-12 h-12 rounded-full bg-tactical-cyan/10 border border-tactical-cyan/40 flex items-center justify-center text-tactical-cyan hover:scale-105 transition-transform">
                                <Camera className="h-6 w-6" />
                              </div>
                              <span className="font-mono text-[10px] text-tactical-cyan tracking-widest uppercase font-bold">CONNECT STREAM</span>
                            </div>
                          )}
                          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-tactical-red px-2 py-0.5 rounded text-white font-mono text-[9px] font-bold tracking-widest pointer-events-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            LIVEFEED
                          </div>
                        </div>
                        <span className="font-mono text-[9px] text-muted-foreground block text-right mt-1.5">
                          *Click camera feed box to expand surveillance stream to fullscreen
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Resolve alert actions */}
            {activeElement.status === "alert" && (
              <div className="p-5 border-t border-border/40 bg-tactical-red/5">
                <button
                  onClick={() => handleResolveAlert(activeElement.id)}
                  className="w-full bg-tactical-red hover:bg-tactical-red/90 text-white font-mono text-[11px] font-bold py-3 rounded transition-colors tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_0_12px_rgba(239,83,80,0.3)]"
                >
                  <AlertTriangle className="h-5 w-5" />
                  Acknowledge &amp; Resolve Alert
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="glow-border rounded-xl bg-card noise-texture border border-border/50 p-6 flex flex-col items-center justify-center text-center flex-1 h-full">
            <Compass className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-mono text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
              NO ACTIVE TABS
            </h3>
            <p className="font-mono text-xs text-muted-foreground/60 leading-relaxed max-w-[260px]">
              Click any camera, gate, or guard post on the PTB level {activeLevel} map to open its dedicated live feed tab right here.
            </p>
          </div>
        )}
      </div>

      {/* ── TACTICAL CAMERA EXPANDED OVERLAY MODAL ── */}
      {expandedCamera && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            onClick={() => setExpandedCamera(null)}
          />
          <div className="relative w-full max-w-5xl bg-black border border-tactical-cyan/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,255,157,0.15)] flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">

            {/* Header Overlay */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded bg-black/60 border border-white/10 backdrop-blur-md pointer-events-none">
              <div className="h-2 w-2 rounded-full bg-tactical-red blink" />
              <span className="font-mono text-[10px] md:text-xs font-bold text-white tracking-widest">
                L{expandedCamera.level} • {expandedCamera.id} • {expandedCamera.name}
              </span>
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
              src={expandedCamera.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto max-h-[80vh] object-contain pointer-events-none"
            />

            {/* Bottom Info Overlays */}
            <div className="absolute bottom-6 left-6 z-20 flex flex-wrap items-center gap-2 md:gap-4 pointer-events-none">
              <div className="px-3 py-2 bg-black/60 border border-tactical-green/30 backdrop-blur-md rounded">
                <span className="font-mono text-[9px] md:text-[10px] text-tactical-green block mb-0.5">STATUS</span>
                <span className="font-mono text-[10px] md:text-xs text-white font-bold tracking-widest uppercase">{expandedCamera.status}</span>
              </div>
              <div className="px-3 py-2 bg-black/60 border border-white/10 backdrop-blur-md rounded">
                <span className="font-mono text-[9px] md:text-[10px] text-white/50 block mb-0.5">COORDINATES</span>
                <span className="font-mono text-[10px] md:text-xs text-white font-bold tracking-widest">X: {expandedCamera.x}%, Y: {expandedCamera.y}%</span>
              </div>
              {expandedCamera.angle !== undefined && (
                <div className="px-3 py-2 bg-black/60 border border-white/10 backdrop-blur-md rounded">
                  <span className="font-mono text-[9px] md:text-[10px] text-white/50 block mb-0.5">VIEWING ANGLE</span>
                  <span className="font-mono text-[10px] md:text-xs text-white font-bold tracking-widest">{expandedCamera.angle}°</span>
                </div>
              )}
              <div className="px-3 py-2 bg-black/60 border border-white/10 backdrop-blur-md rounded hidden sm:block">
                <span className="font-mono text-[9px] md:text-[10px] text-white/50 block mb-0.5">RESOLUTION</span>
                <span className="font-mono text-[10px] md:text-xs text-white font-bold tracking-widest">1080P/60FPS</span>
              </div>
            </div>

            {/* Grid Mask */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-15 bg-[linear-gradient(rgba(0,255,157,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
          </div>
        </div>
      )}
    </div>
  );
}
