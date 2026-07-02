"use client";

import { useState, useEffect } from "react";
import {
  Car,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  ChevronRight,
  ShieldAlert,
  X,
  User,
  MapPin,
  Maximize2,
  Plus,
  Database,
  ShieldX,
  Eye,
  Check,
} from "lucide-react";

type AuthStatus = "authorized" | "unauthorized" | "flagged";

const VEHICLE_ENTRIES = [
  { id: 1, driver: "Asif Malik", plate: "ICT-AA-102", type: "Toyota Corolla (White Sedan)", entryTime: "06:15", purpose: "Staff", status: "authorized" as AuthStatus },
  { id: 2, driver: "Zainab Bibi", plate: "ICT-BB-992", type: "Honda Civic (Black Sedan)", entryTime: "06:30", purpose: "Staff", status: "authorized" as AuthStatus },
  { id: 3, driver: "Muhammad Ali", plate: "ICT-CK-551", type: "Suzuki Carry (White Van)", entryTime: "07:15", purpose: "Delivery", status: "authorized" as AuthStatus },
  { id: 4, driver: "Ayesha Khan", plate: "ICT-DA-449", type: "Suzuki Swift (Red Hatchback)", entryTime: "07:30", purpose: "Visitor", status: "authorized" as AuthStatus },
  { id: 5, driver: "Kamran Shah", plate: "ICT-EN-112", type: "Hyundai Shehzore (Blue Truck)", entryTime: "07:45", purpose: "Contractor", status: "authorized" as AuthStatus },
  { id: 6, driver: "Fahad Mustafa", plate: "ICT-FM-773", type: "Toyota Coaster (Red Bus)", entryTime: "08:15", purpose: "Staff Transport", status: "authorized" as AuthStatus },
  { id: 7, driver: "Maryam Nawaz", plate: "LEA-3021", type: "Honda Accord (Black Sedan)", entryTime: "08:30", purpose: "VIP", status: "authorized" as AuthStatus },
  { id: 8, driver: "Tariq Mahmood", plate: "LEA-4601", type: "Toyota Grande (White Sedan)", entryTime: "09:40", purpose: "Visitor", status: "flagged" as AuthStatus },
  { id: 9, driver: "Unknown", plate: "ICT-GA-112", type: "Toyota Hiace (White Van)", entryTime: "09:12", purpose: "Unknown", status: "unauthorized" as AuthStatus },
  { id: 10, driver: "Unknown", plate: "LEA-5551", type: "Honda 125cc (Red Motorcycle)", entryTime: "09:25", purpose: "Unknown", status: "unauthorized" as AuthStatus },
  { id: 11, driver: "Zahid Khan", plate: "LEB-17-4490", type: "Toyota Hilux (Dark Gray SUV)", entryTime: "10:15", purpose: "Visitor", status: "flagged" as AuthStatus },
  { id: 12, driver: "Unknown", plate: "ICT-FC-299", type: "Suzuki Mehran (Silver Hatchback)", entryTime: "10:05", purpose: "Unknown", status: "unauthorized" as AuthStatus },
  { id: 13, driver: "Yasir Hameed", plate: "ICT-CH-900", type: "Yamaha YBR (Black Motorcycle)", entryTime: "10:30", purpose: "Unknown", status: "unauthorized" as AuthStatus },
];

const METRICS = {
  total: 138,
  authorized: 96,
  unauthorized: 28,
  flagged: 14,
};

const ALERTS = [
  { id: 1, title: "Critical Watchlist Hit", details: "LEA-4601 • Tariq Mahmood • Toyota Grande", type: "flagged" },
  { id: 2, title: "Prior Incident Flagged", details: "LEB-17-4490 • Zahid Khan • Toyota Hilux", type: "flagged" },
  { id: 3, title: "Unauthorized Vehicle", details: "ICT-GA-112 • Unknown • Toyota Hiace", type: "unauthorized" },
  { id: 4, title: "Unauthorized Vehicle", details: "LEA-5551 • Unknown • Honda Motorcycle", type: "unauthorized" },
  { id: 5, title: "Unauthorized Vehicle", details: "ICT-FC-299 • Unknown • Suzuki Mehran", type: "unauthorized" },
];

type VehicleEntry = (typeof VEHICLE_ENTRIES)[number];
type AccessAlert = (typeof ALERTS)[number];

interface WatchlistVehicle {
  id: number;
  plate: string;
  model: string;
  owner: string;
  source: string;
  reason: string;
  matchLevel: "Critical" | "High" | "Medium" | "Low";
  status: "Active" | "Under Review" | "Banned";
}

type SelectedTarget = VehicleEntry | AccessAlert | WatchlistVehicle;

function isVehicleEntry(t: SelectedTarget): t is VehicleEntry {
  return "driver" in t;
}

function isWatchlistVehicle(t: SelectedTarget): t is WatchlistVehicle {
  return "matchLevel" in t;
}

export default function VehicleAccessPage() {
  const [activeSubTab, setActiveSubTab] = useState<"logs" | "watchlist">("logs");
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [watchlistSearch, setWatchlistSearch] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget | null>(null);
  const [cameraExpanded, setCameraExpanded] = useState(false);

  // Stateful Flagged Vehicles Database
  const [watchlistVehicles, setWatchlistVehicles] = useState<WatchlistVehicle[]>([
    {
      id: 1,
      plate: "LEA-4601",
      model: "Toyota Grande (White Sedan)",
      owner: "Tariq Mahmood",
      source: "ASF Watchlist Register",
      reason: "ANPR match hit. Suspected driver associated with prior airport lounge incident.",
      matchLevel: "Critical",
      status: "Active",
    },
    {
      id: 2,
      plate: "LEB-17-4490",
      model: "Toyota Hilux (Dark Gray SUV)",
      owner: "Zahid Khan",
      source: "ASF Watchlist Register",
      reason: "Prior incident vehicle associated with perimeter cordon checkpoint breach.",
      matchLevel: "Critical",
      status: "Active",
    },
    {
      id: 3,
      plate: "ICT-CD-998",
      model: "Toyota Land Cruiser (Black SUV)",
      owner: "Hamza Al-Mansoori",
      source: "Intelligence Watchlist",
      reason: "Registered intelligence agency alert. Prior smuggling profile under observation.",
      matchLevel: "High",
      status: "Under Review",
    },
    {
      id: 4,
      plate: "ICT-AB-512",
      model: "Nissan Caravan (White Van)",
      owner: "Ali Raza",
      source: "Entry-Permit Register",
      reason: "Expired airport security clearance permit. Banned from secure cargo zone.",
      matchLevel: "Medium",
      status: "Banned",
    },
  ]);

  // Watchlist registry form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlate, setNewPlate] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newSource, setNewSource] = useState("ASF Watchlist Register");
  const [newMatchLevel, setNewMatchLevel] = useState<"Critical" | "High" | "Medium" | "Low">("High");
  const [successToast, setSuccessToast] = useState("");

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newModel) return;

    const newEntry: WatchlistVehicle = {
      id: Date.now(),
      plate: newPlate.toUpperCase(),
      model: newModel,
      owner: newOwner || "Unknown Suspect",
      source: newSource,
      reason: newReason || "Manual operator flag.",
      matchLevel: newMatchLevel,
      status: "Active",
    };

    setWatchlistVehicles((prev) => [newEntry, ...prev]);
    setSuccessToast(`Plate ${newPlate.toUpperCase()} registered successfully!`);
    
    // Clear fields
    setNewPlate("");
    setNewModel("");
    setNewOwner("");
    setNewReason("");
    setShowAddForm(false);
  };

  useEffect(() => {
    if (successToast) {
      const id = setTimeout(() => setSuccessToast(""), 3000);
      return () => clearTimeout(id);
    }
  }, [successToast]);

  const filteredEntries = VEHICLE_ENTRIES.filter((entry) => {
    const matchesFilter = filter === "all" || entry.status === filter;
    const normalizedSearch = search.toLowerCase();
    const matchesSearch =
      entry.driver.toLowerCase().includes(normalizedSearch) ||
      entry.purpose.toLowerCase().includes(normalizedSearch) ||
      entry.plate.toLowerCase().includes(normalizedSearch);
    return matchesFilter && matchesSearch;
  });

  const filteredWatchlist = watchlistVehicles.filter((v) => {
    const normalizedSearch = watchlistSearch.toLowerCase();
    return (
      v.plate.toLowerCase().includes(normalizedSearch) ||
      v.model.toLowerCase().includes(normalizedSearch) ||
      v.owner.toLowerCase().includes(normalizedSearch) ||
      v.source.toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-4 -m-4 bg-background">
      {/* ── MAIN CONTENT (LEFT) ── */}
      <div className="flex-1 flex flex-col min-w-0 p-6 overflow-y-auto">
        
        {/* Top Region: Header/Metrics + Camera Feed */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="flex-1 flex flex-col justify-between">
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-xl font-bold tracking-tight mb-1">Access Monitoring &amp; Registry</h1>
              <p className="text-xs text-muted-foreground font-mono">
                Security Compound ANPR verification logs and suspect vehicle tracking
              </p>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Entries Card */}
              <div className="bg-card/40 border border-border/40 rounded-lg p-4 flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-mono font-bold tracking-[0.15em] mb-1">TOTAL SCANS</span>
                  <span className="text-2xl font-bold">{METRICS.total}</span>
                </div>
              </div>

              {/* Authorized Card */}
              <div className="bg-card/40 border border-border/40 rounded-lg p-4 flex items-center gap-4 shadow-sm">
                <div className="h-10 w-10 shrink-0 rounded-full bg-tactical-green/10 border border-tactical-green/30 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-tactical-green" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold">{METRICS.authorized}</span>
                  <span className="text-[10px] text-muted-foreground font-mono font-bold tracking-[0.15em]">AUTHORIZED</span>
                </div>
              </div>

              {/* Unauthorized Card */}
              <div className="bg-card/40 border border-border/40 rounded-lg p-4 flex items-center gap-4 shadow-sm">
                <div className="h-10 w-10 shrink-0 rounded-full bg-tactical-red/10 border border-tactical-red/30 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-tactical-red" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold">{METRICS.unauthorized}</span>
                  <span className="text-[10px] text-muted-foreground font-mono font-bold tracking-[0.15em]">UNAUTHORIZED</span>
                </div>
              </div>

              {/* Flagged Card */}
              <div className="bg-card/40 border border-border/40 rounded-lg p-4 flex items-center gap-4 shadow-sm">
                <div className="h-10 w-10 shrink-0 rounded-full bg-tactical-amber/10 border border-tactical-amber/30 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-tactical-amber" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold">{watchlistVehicles.length}</span>
                  <span className="text-[10px] text-muted-foreground font-mono font-bold tracking-[0.15em]">WATCHLIST ITEMS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live ANPR Camera Feed */}
          <div
            onClick={() => setCameraExpanded(true)}
            className="w-full lg:w-[45%] lg:min-w-[400px] min-h-[220px] bg-card rounded-lg border border-border/40 overflow-hidden relative shadow-sm flex flex-col group cursor-pointer"
          >
            <video
              src="/videos/plate_recognition_output_parking_area.mp4"
              autoPlay loop muted playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000"
            />
            <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-1.5 rounded backdrop-blur border border-white/10">
              <Maximize2 className="h-4 w-4 text-white" />
            </div>
            <div className="relative z-10 p-3 bg-gradient-to-b from-black/80 to-transparent flex items-start justify-between pointer-events-none">
              <span className="font-mono text-xs font-bold text-white tracking-widest">GATE-01 ANPR FEED</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-tactical-red text-white text-[9px] font-mono font-bold tracking-widest blink">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                LIVE
              </div>
            </div>
            <div className="relative z-10 mt-auto p-3 bg-gradient-to-t from-black/80 to-transparent">
              <span className="font-mono text-[10px] text-white/70 tracking-widest flex items-center gap-2">
                <div className="h-1 w-1 bg-tactical-green rounded-full blink" />
                SCANNING VEHICLES...
              </span>
            </div>
            {/* Grid Overlay Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,255,157,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.1)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
          </div>
        </div>

        {/* Dynamic Sub-Tab Content Switcher Layout Card */}
        <div className="flex-1 flex flex-col bg-card/20 rounded-lg border border-border/40 overflow-hidden shadow-sm">
          
          {/* Sub-Tab Navigation Bar */}
          <div className="flex border-b border-border/40 bg-secondary/15 px-4 items-center justify-between">
            <div className="flex">
              <button
                onClick={() => setActiveSubTab("logs")}
                className={`flex items-center gap-2 px-5 py-3.5 font-mono text-[11px] font-bold tracking-widest uppercase transition-colors border-b-2 cursor-pointer ${
                  activeSubTab === "logs"
                    ? "border-b-tactical-cyan text-tactical-cyan"
                    : "border-b-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Car className="h-4 w-4" />
                Access Log Feed
              </button>
              <button
                onClick={() => setActiveSubTab("watchlist")}
                className={`flex items-center gap-2 px-5 py-3.5 font-mono text-[11px] font-bold tracking-widest uppercase transition-colors border-b-2 cursor-pointer ${
                  activeSubTab === "watchlist"
                    ? "border-b-tactical-red text-tactical-red"
                    : "border-b-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Database className="h-4 w-4" />
                Flagged Watchlist DB
              </button>
            </div>
            
            {/* Action buttons or stats in bar */}
            <div>
              {activeSubTab === "watchlist" && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-tactical-red hover:bg-tactical-red/90 text-white font-mono text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded border border-tactical-red/30 shadow-[0_0_12px_rgba(239,83,80,0.15)] flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Register Flagged Vehicle
                </button>
              )}
            </div>
          </div>

          {/* Sub-Tab Content: Access Logs */}
          {activeSubTab === "logs" && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Toolbar */}
              <div className="px-4 py-3 flex items-center gap-4 border-b border-border/40">
                {/* Search Input */}
                <div className="relative flex-1 max-w-[280px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search Plate No or Driver"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-background/50 border border-border/60 rounded-md pl-9 pr-3 py-1.5 text-xs font-mono focus:outline-none focus:border-tactical-cyan/50 transition-colors"
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  {[
                    { id: "all", label: "All" },
                    { id: "authorized", label: "Authorized" },
                    { id: "unauthorized", label: "Unauthorized" },
                    { id: "flagged", label: "Flagged" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono tracking-wide transition-colors ${
                        filter === f.id
                          ? "border border-tactical-cyan text-tactical-cyan bg-tactical-cyan/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-secondary/40 backdrop-blur z-10 border-b border-border/40">
                    <tr>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-bold">Driver</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-bold">Plate No</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-bold">Vehicle Model</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-bold">Entry Time</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-bold">Purpose</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-bold text-center">Auth Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedTarget(row)}
                        className="border-b border-border/20 hover:bg-accent/10 transition-colors group cursor-pointer"
                      >
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs">{row.driver}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs font-bold tracking-widest">{row.plate}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs text-muted-foreground">{row.type}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-[11px] text-tactical-cyan font-bold tabular-nums tracking-wider">{row.entryTime}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs text-muted-foreground">{row.purpose}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`font-mono text-[10px] font-bold tracking-widest uppercase ${
                              row.status === "authorized"
                                ? "text-tactical-green"
                                : row.status === "unauthorized"
                                ? "text-tactical-red"
                                : "text-tactical-amber"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {filteredEntries.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center">
                          <p className="text-muted-foreground font-mono text-xs">No vehicle records found.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-Tab Content: Watchlist Database */}
          {activeSubTab === "watchlist" && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Toolbar */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-border/40">
                <div className="relative flex-1 max-w-[280px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search Watchlist Register..."
                    value={watchlistSearch}
                    onChange={(e) => setWatchlistSearch(e.target.value)}
                    className="w-full bg-background/50 border border-border/60 rounded-md pl-9 pr-3 py-1.5 text-xs font-mono focus:outline-none focus:border-tactical-red/50 transition-colors"
                  />
                </div>
                
                <span className="font-mono text-[10px] text-muted-foreground">
                  Registry Entries: <span className="font-bold text-tactical-red">{filteredWatchlist.length} Listed</span>
                </span>
              </div>

              {/* Watchlist Table */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="sticky top-0 bg-secondary/40 backdrop-blur z-10 border-b border-border/40">
                    <tr>
                      <th className="px-5 py-3 text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-bold">Plate No</th>
                      <th className="px-5 py-3 text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-bold">Vehicle Model</th>
                      <th className="px-5 py-3 text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-bold">Suspect / Owner</th>
                      <th className="px-5 py-3 text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-bold">Source Register</th>
                      <th className="px-5 py-3 text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-bold text-center">Threat Level</th>
                      <th className="px-5 py-3 text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-bold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWatchlist.map((v) => (
                      <tr
                        key={v.id}
                        onClick={() => setSelectedTarget(v)}
                        className="border-b border-border/20 hover:bg-accent/10 transition-colors group cursor-pointer"
                      >
                        <td className="px-5 py-3 font-bold tracking-widest text-tactical-red">
                          {v.plate}
                        </td>
                        <td className="px-5 py-3 text-foreground">
                          {v.model}
                        </td>
                        <td className="px-5 py-3">
                          {v.owner}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-[11px]">
                          {v.source}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            v.matchLevel === "Critical" ? "bg-tactical-red/25 border-tactical-red text-tactical-red font-extrabold animate-pulse" :
                            v.matchLevel === "High" ? "bg-tactical-amber/20 border-tactical-amber/40 text-tactical-amber" :
                            "bg-secondary/40 border-border text-muted-foreground"
                          }`}>
                            {v.matchLevel}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center font-bold">
                          <span className={
                            v.status === "Active" ? "text-tactical-red" :
                            v.status === "Under Review" ? "text-tactical-amber" : "text-muted-foreground"
                          }>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {filteredWatchlist.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                          No watchlisted vehicle records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ALERTS SIDEBAR (RIGHT) ── */}
      <div className="w-80 border-l border-border bg-card/30 flex flex-col shrink-0">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-tactical-red" />
            <h2 className="font-mono text-[13px] font-bold tracking-wide">Access Alerts</h2>
          </div>
          <span className="text-[10px] font-mono font-bold text-muted-foreground">{ALERTS.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {ALERTS.map((alert) => (
            <div
              key={alert.id}
              onClick={() => setSelectedTarget(alert)}
              className="bg-secondary/30 hover:bg-secondary/50 border border-border/40 rounded-md p-3 flex flex-col gap-1 cursor-pointer transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${alert.type === "unauthorized" ? "bg-tactical-red blink" : "bg-tactical-amber"}`} />
                  <span className={`font-semibold text-xs tracking-wide ${alert.type === "unauthorized" ? "text-tactical-red/90" : "text-tactical-amber/90"}`}>
                    {alert.title}
                  </span>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground ml-3.5 tracking-wide">
                {alert.details}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── DETAILED INFO CARD OVERLAY ── */}
      {selectedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm shadow-2xl"
            onClick={() => setSelectedTarget(null)}
          />
          <div className="relative w-full max-w-md bg-card border border-border/60 rounded-xl shadow-2xl flex flex-col mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {(() => {
              const t = selectedTarget;
              
              if (isWatchlistVehicle(t)) {
                // Render Watchlist Detail Overlay
                return (
                  <>
                    <div className="p-4 border-b border-border/50 flex items-center justify-between bg-tactical-red/10 text-tactical-red">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        <span className="font-mono text-sm font-bold tracking-wide">Watchlist Suspect File</span>
                      </div>
                      <button
                        onClick={() => setSelectedTarget(null)}
                        className="p-1 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="p-6 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
                          <User className="h-8 w-8 text-tactical-red" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold tracking-tight">{t.owner}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[9px] bg-tactical-red/10 border border-tactical-red/30 px-2 py-0.5 rounded font-bold tracking-wider text-tactical-red uppercase">
                              {t.matchLevel} Threat
                            </span>
                            <span className="font-mono text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                              {t.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Watchlist Info Grid */}
                      <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                        <div className="bg-secondary/20 border border-border/40 p-3 rounded-lg">
                          <span className="block text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Plate Number</span>
                          <span className="font-bold tracking-widest text-tactical-red">{t.plate}</span>
                        </div>
                        <div className="bg-secondary/20 border border-border/40 p-3 rounded-lg">
                          <span className="block text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Vehicle Model</span>
                          <span className="font-bold text-foreground">{t.model}</span>
                        </div>
                        <div className="bg-secondary/20 border border-border/40 p-3 rounded-lg col-span-2">
                          <span className="block text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Watchlist Source Register</span>
                          <span className="font-bold text-tactical-cyan">{t.source}</span>
                        </div>
                        <div className="bg-secondary/20 border border-border/40 p-3 rounded-lg col-span-2">
                          <span className="block text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Match Reason</span>
                          <p className="text-foreground/95 text-[11px] leading-relaxed pt-0.5">{t.reason}</p>
                        </div>
                      </div>

                      {/* Verification Status */}
                      <div className="bg-tactical-red/5 border border-tactical-red/20 p-3.5 rounded-lg space-y-2 font-mono text-xs">
                        <span className="text-[10px] text-tactical-red font-bold uppercase tracking-widest block">ALARM PROTOCOL RULES</span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-tactical-red animate-ping" />
                          <span className="font-semibold text-foreground">AUTOMATIC CORDON ALERT TRIGGER ENABLED</span>
                        </div>
                        <p className="text-muted-foreground text-[10px]">
                          Any camera matching this license plate triggers instant gate lock down protocols and dispatches nearest ASF Quick Response Group.
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            setSelectedTarget(null);
                            setSuccessToast("Observational trace active on surveillance.");
                          }}
                          className="flex-1 bg-secondary hover:bg-secondary/70 border border-border/60 text-foreground font-mono text-[10px] font-bold py-2.5 rounded transition-all uppercase cursor-pointer text-center"
                        >
                          Observe Status
                        </button>
                        <button 
                          onClick={() => {
                            setWatchlistVehicles((prev) => prev.filter((item) => item.id !== t.id));
                            setSelectedTarget(null);
                            setSuccessToast(`Plate ${t.plate} deregistered from Watchlist.`);
                          }}
                          className="flex-1 bg-tactical-red hover:bg-tactical-red/90 text-white font-mono text-[10px] font-bold py-2.5 rounded transition-all uppercase cursor-pointer text-center"
                        >
                          Deregister Plate
                        </button>
                      </div>
                    </div>
                  </>
                );
              } else {
                // Render Access Log Details Overlay
                const isUnauthorized = isVehicleEntry(t) ? t.status === "unauthorized" : t.type === "unauthorized";
                const isFlagged = isVehicleEntry(t) ? t.status === "flagged" : t.type === "flagged";

                return (
                  <>
                    {/* Modal Header */}
                    <div className={`p-4 border-b border-border/50 flex items-center justify-between ${
                      isUnauthorized ? "bg-tactical-red/10" :
                      isFlagged ? "bg-tactical-amber/10" : "bg-tactical-green/10"
                    }`}>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-foreground/80" />
                        <span className="font-mono text-sm font-bold tracking-wide">
                          {isVehicleEntry(t) ? "Vehicle Stop Details" : t.title}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedTarget(null)}
                        className="p-1 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-6">
                      {/* Identity Row */}
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-secondary border border-border/80 flex items-center justify-center shrink-0">
                          <User className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold tracking-tight">
                            {isVehicleEntry(t) ? t.driver : t.details.split("•")[1]?.trim() || "Unknown Driver"}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[10px] bg-secondary px-2 py-0.5 rounded tracking-wider text-muted-foreground">
                              {isVehicleEntry(t) ? t.purpose : t.title}
                            </span>
                            <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              isUnauthorized ? "bg-tactical-red/20 text-tactical-red border border-tactical-red/30" :
                              isFlagged ? "bg-tactical-amber/20 text-tactical-amber border border-tactical-amber/30" :
                              "bg-tactical-green/20 text-tactical-green border border-tactical-green/30"
                            }`}>
                              {isVehicleEntry(t) ? t.status : t.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Data Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-secondary/20 border border-border/40 p-3 rounded-lg">
                          <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Time</span>
                          <span className="font-mono text-sm font-bold">
                            {isVehicleEntry(t) ? t.entryTime : "12:00 PM"}
                          </span>
                        </div>
                        <div className="bg-secondary/20 border border-border/40 p-3 rounded-lg">
                          <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Vehicle Type</span>
                          <span className="font-mono text-sm font-bold">
                            {t.type}
                          </span>
                        </div>
                        <div className="bg-secondary/20 border border-border/40 p-3 rounded-lg col-span-2">
                          <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1">License Plate</span>
                          <span className="font-mono text-sm font-bold tracking-widest text-tactical-cyan">
                            {isVehicleEntry(t) ? t.plate : t.details.split("•")[0]?.trim() || "—"}
                          </span>
                        </div>
                      </div>

                      {/* Tracking Timeline */}
                      <div>
                        <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Live Tracking</span>
                        <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                          <div className="relative flex items-center justify-between md:justify-normal group is-active">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-secondary text-muted-foreground shadow shrink-0 z-10">
                              <div className="h-2 w-2 rounded-full bg-tactical-green blink" />
                            </div>
                            <div className="w-[calc(100%-2rem)] bg-card border border-border p-2 rounded shadow-sm ml-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <MapPin className="h-3 w-3 text-tactical-cyan" />
                                <span className="font-mono text-[9px] font-bold">Main Gate P1 (ANPR Resolved)</span>
                              </div>
                              <span className="font-mono text-[9px] text-muted-foreground block text-right tabular-nums">- 2 mins ago</span>
                            </div>
                          </div>

                          <div className="relative flex items-center justify-between md:justify-normal group">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full border border-border bg-secondary text-muted-foreground shadow shrink-0 z-10">
                              <Clock className="h-3 w-3" />
                            </div>
                            <div className="w-[calc(100%-2rem)] bg-card border border-border p-2 rounded shadow-sm opacity-60 ml-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="font-mono text-[9px] font-bold">Perimeter Cordon Outer Cam 4</span>
                              </div>
                              <span className="font-mono text-[9px] text-muted-foreground block text-right tabular-nums">- 15 mins ago</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              }
            })()}
          </div>
        </div>
      )}

      {/* ── REGISTER FLAGGED VEHICLE FORM OVERLAY ── */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
            onClick={() => setShowAddForm(false)}
          />
          <div className="relative w-full max-w-md bg-black border border-tactical-red/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(239,83,80,0.15)] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200 font-mono text-xs">
            {/* Header */}
            <div className="p-4 border-b border-tactical-red/20 flex items-center justify-between bg-tactical-red/10 text-tactical-red">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="font-bold tracking-wider uppercase text-sm">Register Watchlist Plate</span>
              </div>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-md hover:bg-tactical-red/20 text-muted-foreground hover:text-tactical-red transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddVehicle} className="p-5 space-y-4 text-foreground">
              <div className="space-y-1.5">
                <label className="block text-[10px] text-muted-foreground uppercase tracking-wider font-bold">License Plate Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LEB-17-4490"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  className="w-full bg-secondary/40 border border-border/60 rounded px-3 py-2 text-foreground focus:outline-none focus:border-tactical-red/50 uppercase tracking-widest font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Vehicle Model *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota Hilux (Dark Gray SUV)"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-secondary/40 border border-border/60 rounded px-3 py-2 text-foreground focus:outline-none focus:border-tactical-red/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Suspect / Owner Name</label>
                <input
                  type="text"
                  placeholder="e.g. Zahid Khan"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="w-full bg-secondary/40 border border-border/60 rounded px-3 py-2 text-foreground focus:outline-none focus:border-tactical-red/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Source Register Database</label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-border/60 rounded px-3 py-2 text-foreground focus:outline-none focus:border-tactical-red/50 cursor-pointer"
                >
                  <option value="ASF Watchlist Register">ASF Watchlist Register</option>
                  <option value="Entry-Permit Register">Entry-Permit Register</option>
                  <option value="Intelligence Watchlist">Intelligence Watchlist</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Threat Severity Rank</label>
                <select
                  value={newMatchLevel}
                  onChange={(e) => setNewMatchLevel(e.target.value as any)}
                  className="w-full bg-[#0a0a0a] border border-border/60 rounded px-3 py-2 text-foreground focus:outline-none focus:border-tactical-red/50 cursor-pointer font-bold"
                >
                  <option value="Critical">CRITICAL THREAT</option>
                  <option value="High">HIGH THREAT</option>
                  <option value="Medium">MEDIUM THREAT</option>
                  <option value="Low">LOW THREAT</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Match Trigger Reason</label>
                <textarea
                  placeholder="Describe trigger reason..."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  rows={2}
                  className="w-full bg-secondary/40 border border-border/60 rounded px-3 py-2 text-foreground focus:outline-none focus:border-tactical-red/50 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground font-bold py-2.5 rounded transition-all uppercase cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-tactical-red hover:bg-tactical-red/90 text-white font-bold py-2.5 rounded transition-all uppercase cursor-pointer text-center shadow-[0_0_12px_rgba(239,83,80,0.3)]"
                >
                  Register Suspect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ── */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-tactical-green text-white font-mono text-xs font-bold px-4 py-3 rounded-lg border border-tactical-green/40 shadow-[0_0_20px_rgba(0,255,157,0.3)] flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <Check className="h-4 w-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ── CAMERA EXPANDED OVERLAY ── */}
      {cameraExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            onClick={() => setCameraExpanded(false)}
          />
          <div className="relative w-full max-w-6xl bg-card border border-tactical-cyan/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,255,157,0.1)] flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Overlay */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded bg-black/60 border border-white/10 backdrop-blur-md pointer-events-none">
              <div className="h-2 w-2 rounded-full bg-tactical-red blink" />
              <span className="font-mono text-[10px] md:text-xs font-bold text-white tracking-widest">GATE-01 LIVE STREAM</span>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setCameraExpanded(false)}
              className="absolute top-4 right-4 z-20 p-2 rounded bg-black/60 border border-white/10 backdrop-blur-md hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* The Huge Video */}
            <video
              src="/videos/plate_recognition_output_parking_area.mp4"
              autoPlay loop muted playsInline
              className="w-full h-auto max-h-[85vh] object-cover pointer-events-none"
            />

            {/* Bottom Info Overlays */}
            <div className="absolute bottom-6 left-6 z-20 flex flex-wrap items-center gap-2 md:gap-4 pointer-events-none font-mono text-[10px]">
              <div className="px-3 py-2 bg-black/60 border border-tactical-green/30 backdrop-blur-md rounded">
                <span className="text-tactical-green block mb-0.5">STATUS</span>
                <span className="text-white font-bold tracking-widest">RECORDING</span>
              </div>
              <div className="px-3 py-2 bg-black/60 border border-white/10 backdrop-blur-md rounded">
                <span className="text-white/50 block mb-0.5">ANPR MODULE</span>
                <span className="text-tactical-cyan font-bold tracking-widest blink">ACTIVE</span>
              </div>
              <div className="px-3 py-2 bg-black/60 border border-white/10 backdrop-blur-md rounded hidden sm:block">
                <span className="text-white/50 block mb-0.5">RESOLUTION</span>
                <span className="text-white font-bold tracking-widest">1080P/60FPS</span>
              </div>
            </div>

            {/* Grid Mask */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,255,157,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
          </div>
        </div>
      )}
    </div>
  );
}
