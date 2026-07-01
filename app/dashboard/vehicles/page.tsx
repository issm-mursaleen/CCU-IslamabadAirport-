"use client";

import { useState } from "react";
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
} from "lucide-react";

type AuthStatus = "authorized" | "unauthorized" | "flagged";

const VEHICLE_ENTRIES = [
  { id: 1, driver: "John Mwangi", plate: "KAC 201M", type: "Sedan", entryTime: "06:15", purpose: "Staff", status: "authorized" as AuthStatus },
  { id: 2, driver: "Alice Moraa", plate: "KDC 092L", type: "SUV", entryTime: "06:30", purpose: "Staff", status: "authorized" as AuthStatus },
  { id: 3, driver: "Peter Ndungu", plate: "KCJ 551X", type: "Truck", entryTime: "07:15", purpose: "Delivery", status: "authorized" as AuthStatus },
  { id: 4, driver: "Mary Wanjiru", plate: "KDB 449A", type: "Sedan", entryTime: "07:30", purpose: "Visitor", status: "authorized" as AuthStatus },
  { id: 5, driver: "Ahmed Said", plate: "KBN 112W", type: "Pickup", entryTime: "07:45", purpose: "Contractor", status: "authorized" as AuthStatus },
  { id: 6, driver: "James Kariuki", plate: "KBQ 773Y", type: "Bus", entryTime: "08:15", purpose: "Staff Transport", status: "authorized" as AuthStatus },
  { id: 7, driver: "Fatima Omar", plate: "KCW 901P", type: "Sedan", entryTime: "08:30", purpose: "VIP", status: "authorized" as AuthStatus },
  { id: 8, driver: "Robert Ouma", plate: "KBB 514L", type: "Truck", entryTime: "09:00", purpose: "Delivery", status: "authorized" as AuthStatus },
  // Adding diverse entries to test filtering
  { id: 9, driver: "Unknown", plate: "KDA 112C", type: "Van", entryTime: "09:12", purpose: "Unknown", status: "unauthorized" as AuthStatus },
  { id: 10, driver: "Unknown", plate: "KAA 555H", type: "Motorcycle", entryTime: "09:25", purpose: "Unknown", status: "unauthorized" as AuthStatus },
  { id: 11, driver: "David Kimani", plate: "KDB 9981", type: "SUV", entryTime: "09:40", purpose: "Visitor", status: "flagged" as AuthStatus },
  { id: 12, driver: "Unknown", plate: "KCF 299Q", type: "Sedan", entryTime: "10:05", purpose: "Unknown", status: "unauthorized" as AuthStatus },
  { id: 13, driver: "Sarah Lee", plate: "KCG 177U", type: "Van", entryTime: "10:15", purpose: "Contractor", status: "flagged" as AuthStatus },
  { id: 14, driver: "Unknown", plate: "KCH 900X", type: "Motorcycle", entryTime: "10:30", purpose: "Unknown", status: "unauthorized" as AuthStatus },
];

const METRICS = {
  total: 124,
  authorized: 71,
  unauthorized: 17,
  flagged: 12,
};

const ALERTS = [
  { id: 1, title: "Unauthorized Vehicle", details: "KDA 112C • Unknown • Van", type: "unauthorized" },
  { id: 2, title: "Unauthorized Vehicle", details: "KAA 555H • Unknown • Motorcycle", type: "unauthorized" },
  { id: 3, title: "Under Review", details: "KDB 9981 • Unknown • SUV", type: "flagged" },
  { id: 4, title: "Unauthorized Vehicle", details: "KCF 299Q • Unknown • Sedan", type: "unauthorized" },
  { id: 5, title: "Under Review", details: "KCG 177U • Unknown • Van", type: "flagged" },
  { id: 6, title: "Unauthorized Vehicle", details: "KCH 900X • Unknown • Motorcycle", type: "unauthorized" },
];

type VehicleEntry = (typeof VEHICLE_ENTRIES)[number];
type AccessAlert = (typeof ALERTS)[number];
type SelectedTarget = VehicleEntry | AccessAlert;

function isVehicleEntry(t: SelectedTarget): t is VehicleEntry {
  return "driver" in t;
}

export default function VehicleAccessPage() {
  const [filter, setFilter] = useState<string>("authorized");
  const [search, setSearch] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget | null>(null);
  const [cameraExpanded, setCameraExpanded] = useState(false);

  const filteredEntries = VEHICLE_ENTRIES.filter((entry) => {
    const matchesFilter = filter === "all" || entry.status === filter;
    const normalizedSearch = search.toLowerCase();
    const matchesSearch =
      entry.driver.toLowerCase().includes(normalizedSearch) ||
      entry.purpose.toLowerCase().includes(normalizedSearch) ||
      entry.plate.toLowerCase().includes(normalizedSearch);
    return matchesFilter && matchesSearch;
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
              <h1 className="text-xl font-bold tracking-tight mb-1">Access Monitoring</h1>
              <p className="text-xs text-muted-foreground font-mono">
                access control, and compound vehicle tracking
              </p>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Entries Card */}
              <div className="bg-card/40 border border-border/40 rounded-lg p-4 flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-mono font-bold tracking-[0.15em] mb-1">LOCAL ENTRIES</span>
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
                  <span className="text-2xl font-bold">{METRICS.flagged}</span>
                  <span className="text-[10px] text-muted-foreground font-mono font-bold tracking-[0.15em]">FLAGGED</span>
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

        {/* Advanced Data Table Region */}
        <div className="flex-1 flex flex-col bg-card/20 rounded-lg border border-border/40 overflow-hidden shadow-sm">
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
                  className={`px-3 py-1.5 rounded-full text-xs font-mono tracking-wide transition-colors ${filter === f.id
                      ? "border border-tactical-cyan text-tactical-cyan bg-tactical-cyan/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-secondary/40 backdrop-blur z-10 border-b border-border/40">
                <tr>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-bold">Driver</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-bold">Plate No</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase font-bold">Type</th>
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
                      <span className="font-mono text-[11px] text-tactical-red font-bold tabular-nums tracking-wider">{row.entryTime}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-muted-foreground">{row.purpose}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`font-mono text-[10px] font-bold tracking-widest uppercase ${row.status === "authorized" ? "text-tactical-green" :
                          row.status === "unauthorized" ? "text-tactical-red" :
                            "text-tactical-amber"
                        }`}>
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
                  <div className={`h-1.5 w-1.5 rounded-full ${alert.type === "unauthorized" ? "bg-tactical-red blink" : "bg-tactical-amber"
                    }`} />
                  <span className={`font-semibold text-xs tracking-wide ${alert.type === "unauthorized" ? "text-tactical-red/90" : "text-tactical-amber/90"
                    }`}>
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedTarget(null)}
          />
          <div className="relative w-full max-w-md bg-card border border-border/60 rounded-xl shadow-2xl flex flex-col mx-4 overflow-hidden fade-in-up">
            {(() => {
              const t = selectedTarget;
              const isUnauthorized =
                isVehicleEntry(t)
                  ? t.status === "unauthorized"
                  : t.type === "unauthorized";
              const isFlagged =
                isVehicleEntry(t)
                  ? t.status === "flagged"
                  : t.type === "flagged";

              return (
                <>
                  {/* Modal Header */}
                  <div className={`p-4 border-b border-border/50 flex items-center justify-between ${isUnauthorized ? "bg-tactical-red/10" :
                      isFlagged ? "bg-tactical-amber/10" :
                        "bg-tactical-green/10"
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
                          {isVehicleEntry(t)
                            ? t.driver
                            : t.details.split("•")[1]?.trim() || "Unknown Driver"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[10px] bg-secondary px-2 py-0.5 rounded tracking-wider text-muted-foreground">
                            {isVehicleEntry(t) ? t.purpose : t.title}
                          </span>
                          <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${isUnauthorized ? "bg-tactical-red/20 text-tactical-red border border-tactical-red/30" :
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
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1">License Plate / Details</span>
                        <span className="font-mono text-sm font-bold tracking-widest">
                          {isVehicleEntry(t) ? t.plate : t.details.split("•")[0]?.trim() || "—"}
                        </span>
                      </div>
                    </div>

                    {/* Tracking Timeline */}
                    <div>
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Live Tracking</span>
                      <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-secondary text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <div className="h-2 w-2 rounded-full bg-tactical-green blink" />
                          </div>
                          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] bg-card border border-border p-2 rounded shadow-sm">
                            <div className="flex items-center gap-1.5 mb-1">
                              <MapPin className="h-3 w-3 text-tactical-cyan" />
                              <span className="font-mono text-[9px] font-bold">Main Gate P1</span>
                            </div>
                            <span className="font-mono text-[9px] text-muted-foreground block text-right tabular-nums">- 2 mins ago</span>
                          </div>
                        </div>

                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border border-border bg-secondary text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <Clock className="h-3 w-3" />
                          </div>
                          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] bg-card border border-border p-2 rounded shadow-sm opacity-60">
                            <div className="flex items-center gap-1.5 mb-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="font-mono text-[9px] font-bold">Perimeter Cam 4</span>
                            </div>
                            <span className="font-mono text-[9px] text-muted-foreground block text-right tabular-nums">- 15 mins ago</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── CAMERA EXPANDED OVERLAY ── */}
      {cameraExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setCameraExpanded(false)}
          />
          <div className="relative w-full max-w-6xl bg-card border border-tactical-cyan/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,255,157,0.1)] fade-in-up flex flex-col relative">

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
            <div className="absolute bottom-6 left-6 z-20 flex flex-wrap items-center gap-2 md:gap-4 pointer-events-none">
              <div className="px-3 py-2 bg-black/60 border border-tactical-green/30 backdrop-blur-md rounded">
                <span className="font-mono text-[9px] md:text-[10px] text-tactical-green block mb-0.5">STATUS</span>
                <span className="font-mono text-[10px] md:text-xs text-white font-bold tracking-widest">RECORDING</span>
              </div>
              <div className="px-3 py-2 bg-black/60 border border-white/10 backdrop-blur-md rounded">
                <span className="font-mono text-[9px] md:text-[10px] text-white/50 block mb-0.5">ANPR MODULE</span>
                <span className="font-mono text-[10px] md:text-xs text-tactical-cyan font-bold tracking-widest blink">ACTIVE</span>
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
