"use client";

import { useEffect, useState, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, ImageOverlay, CircleMarker, Marker } from "react-leaflet";
import { Camera, Shield, AlertTriangle, RefreshCw, Layers, Compass, Lock, X } from "lucide-react";

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
}

const mockMarkers: InteractiveMarker[] = [
  // ── LEVEL 1 MARKERS ──
  {
    id: "CAM-PTB-CONG",
    level: 1,
    type: "camera",
    name: "CAM-112 (L1 Departures Queue Counter)",
    x: 56,
    y: 45,
    status: "alert",
    details: "ANOMALY DETECTED: People in Queue Counter shows high queue density at departures corridor.",
    videoUrl: "/videos/counter_people in que.mp4",
    angle: 45,
  },
  {
    id: "CAM-PTB-LOIT",
    level: 1,
    type: "camera",
    name: "CAM-105 (L1 Immigration Queue Counter)",
    x: 70,
    y: 62,
    status: "alert",
    details: "ANOMALY DETECTED: People Queue Counter shows building congestion near secure checkpoint.",
    videoUrl: "/videos/counter_people_que.mp4",
    angle: 135,
  },
  {
    id: "CAM-PTB-BAG",
    level: 1,
    type: "camera",
    name: "CAM-108 (L1 Arrivals Baggage Claim Carousel 4)",
    x: 44,
    y: 31,
    status: "alert",
    details: "ANOMALY DETECTED: Baggage Count tracker flagged high volume of luggage building up on Carousel 4.",
    videoUrl: "/videos/bag_count_output baggeges.mp4",
    angle: 225,
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
    videoUrl: "/videos/Fia_counter.mp4",
    angle: 45,
  },
  {
    id: "CAM-LVL2-LCONG",
    level: 2,
    type: "camera",
    name: "CAM-205 (L2 Terminal Exit Vehicle Traffic)",
    x: 18,
    y: 76,
    status: "alert",
    details: "ANOMALY DETECTED: Vehicle Traffic Exit shows severe lane congestion at terminal exit point.",
    videoUrl: "/videos/vehicle_traffic_output_exit.mp4",
    angle: 135,
  },
  {
    id: "CAM-LVL2-BCONG",
    level: 2,
    type: "camera",
    name: "CAM-208 (L2 Terminal Parking Area)",
    x: 46,
    y: 28,
    status: "alert",
    details: "ANOMALY DETECTED: Plate Recognition flags suspicious/unregistered vehicle in parking area.",
    videoUrl: "/videos/plate_recognition_output_parking_area.mp4",
    angle: 385,
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
    videoUrl: "/videos/zone_tracker_output_1_counter_area.mp4",
    angle: 315,
  },
  {
    id: "CAM-LVL2-OVER",
    level: 2,
    type: "camera",
    name: "CAM-215 (L2 Counter Zone Tracker 2)",
    x: 52,
    y: 60,
    status: "alert",
    details: "ANOMALY DETECTED: Zone Tracker monitoring crowd movements and securing boundaries near counter area 2.",
    videoUrl: "/videos/zone_tracker_output_counter.mp4",
    angle: 45,
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
    details: "ANOMALY DETECTED: Face Detection active. Tracking passenger flows at airplane exit corridor.",
    videoUrl: "/videos/face+_detection_airplane_Exit.mp4",
    angle: 45,
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

  const handleLevelChange = (level: 1 | 2 | 3) => {
    if (onLevelChange) {
      onLevelChange(level);
    } else {
      setLocalActiveLevel(level);
    }
  };

  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState("Loading PDF library...");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
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
    let matchesOverlay = true;
    if (activeOverlay === "cameras" && m.type !== "camera") matchesOverlay = false;
    if (activeOverlay === "guards" && m.type !== "guard") matchesOverlay = false;
    if (activeOverlay === "gates" && m.type !== "gate") matchesOverlay = false;

    let matchesSearch = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      matchesSearch = m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
    }

    return matchesOverlay && matchesSearch;
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
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#070b10cc] border border-border/60 backdrop-blur-md">
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

          {/* Sub-Layer Filter */}
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#070b10cc] border border-border/60 backdrop-blur-md">
            <Layers className="h-3.5 w-3.5 text-tactical-cyan ml-1" />
            <div className="h-4 w-px bg-border/60 mx-0.5" />
            {[
              { id: "all", label: "ALL" },
              { id: "cameras", label: "CAMS" },
              { id: "gates", label: "GATES" },
              { id: "guards", label: "PATROLS" },
            ].map((layer) => (
              <button
                key={layer.id}
                onClick={() => setActiveOverlay(layer.id as any)}
                className={`font-mono text-[9px] font-bold px-2 py-1 rounded transition-colors uppercase tracking-wider cursor-pointer ${activeOverlay === layer.id
                  ? "bg-tactical-cyan/15 text-tactical-cyan border border-tactical-cyan/30"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
              >
                {layer.label}
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
          {imageUrl && (
            <MapContainer
              crs={L.CRS.Simple}
              bounds={bounds}
              maxBounds={bounds}
              maxBoundsViscosity={0.9}
              minZoom={-1}
              maxZoom={2}
              zoom={0}
              zoomControl={false}
              style={{ height: "100%", width: "100%" }}
            >
              {/* Load custom static blueprint overlay */}
              <ImageOverlay url={imageUrl} bounds={bounds} />

              {/* Render dynamic interactive elements */}
              {filteredMarkers.map((marker) => {
                const coords = getMapCoords(marker.x, marker.y);
                const isSelected = activeTabId === marker.id;

                let color = "#4CC3FF";
                if (marker.status === "alert") color = "#FF3D3D";
                else if (marker.type === "guard") color = "#FFB700";
                else if (marker.type === "gate") color = "#00FF9D";

                // If it is a camera, we render it using our gorgeous custom camera PNG rotated and colored!
                if (marker.type === "camera") {
                  const angle = marker.angle || 0;
                  const iconHtml = `
                    <div class="relative flex items-center justify-center w-14 h-14" style="transform: translate(-14px, -14px);">
                      <!-- Pulse Ring (Alert state only) -->
                      ${marker.status === "alert"
                      ? `<div class="absolute rounded-full animate-ping opacity-35" style="background-color: ${color}; width: 42px; height: 42px;"></div>`
                      : ""
                    }
                      
                      <!-- Inner Background Solid White Circle with Glowing Border -->
                      <div class="absolute rounded-full border transition-all ${isSelected ? "border-white" : ""}" 
                           style="background-color: #ffffff; border-color: ${isSelected ? "#ffffff" : color}; border-width: 2.5px; width: 44px; height: 44px; box-shadow: 0 0 15px ${color}60;">
                      </div>
                      
                      <!-- Camera PNG Mask with Angle Rotation -->
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

                // Render other points as beautiful colored circles
                return (
                  <CircleMarker
                    key={marker.id}
                    center={coords}
                    radius={12}
                    pathOptions={{
                      color: isSelected ? "#FFFFFF" : color,
                      fillColor: marker.status === "alert" ? "#FF3D3D" : "#0D1117",
                      fillOpacity: marker.status === "alert" ? 0.8 : 1,
                      weight: isSelected ? 3 : 2,
                    }}
                    eventHandlers={{
                      click: () => {
                        // Open this element in a new tab!
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
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}

          {/* Compass Rose Grid Aesthetic */}
          <div className="absolute bottom-3 left-3 pointer-events-none z-10 flex items-center gap-2 text-muted-foreground/40 font-mono text-[9px]">
            <Compass className="h-5 w-5 animate-spin" style={{ animationDuration: "30s" }} />
            <span>IIA TERMINAL 1 • SECURITY GRID</span>
          </div>

          <div className="absolute bottom-3 right-3 pointer-events-none z-10 font-mono text-[9px] text-muted-foreground/40 uppercase tracking-widest">
            IIA PTB LEVEL {activeLevel} MODEL
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
              {/* Header info */}
              <div>
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
                    <div className="pt-2.5">
                      <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase block mb-1.5">Details</span>
                      <p className="font-mono text-xs text-foreground/80 leading-relaxed bg-secondary/35 border border-border/40 p-3 rounded">
                        {activeElement.details}
                      </p>
                    </div>
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
