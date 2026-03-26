"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Crosshair,
  Navigation,
  AlertTriangle,
  Radio,
  Clock,
  MapPin,
  Truck,
  Send,
  ChevronRight,
  Satellite,
  Signal,
  CheckCircle2,
  ShieldCheck,
  XCircle,
  FileText,
  Plus,
  X,
  Users,
  Trash2,
} from "lucide-react";

/* ── Dynamic import for Leaflet map (needs window) ── */
const TacticalMap = dynamic(() => import("@/components/tactical-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-card">
      <div className="flex items-center gap-2">
        <Signal className="h-4 w-4 text-tactical-green blink" />
        <span className="font-mono text-xs text-muted-foreground tracking-wider">
          LOADING TACTICAL MAP...
        </span>
      </div>
    </div>
  ),
});

/* ── Types ── */
type IncidentStatus = "pending" | "dispatched" | "on_scene" | "resolved";

type Incident = {
  id: string;
  type: string;
  typeCode: string;
  description: string;
  site: string;
  lat: number;
  lng: number;
  reported: string;
  requiredCap: string;
  status: IncidentStatus;
  assignedTeam: string | null;
};

/* ── Mock QRF teams with GPS coords (Islamabad) ── */
const initialTeams = [
  {
    id: "QRF-A",
    name: "QRF Alpha",
    callsign: "ALPHA-1",
    capabilities: ["armed", "patrol"],
    vehicle: "Toyota Hilux",
    personnel: 4,
    status: "available" as string,
    lat: 33.7294,
    lng: 73.0931,
    sector: "F-6 / F-7",
    lastUpdate: 45,
    heading: 135,
  },
  {
    id: "QRF-B",
    name: "QRF Bravo",
    callsign: "BRAVO-1",
    capabilities: ["armed", "k9"],
    vehicle: "Land Cruiser",
    personnel: 5,
    status: "available" as string,
    lat: 33.6932,
    lng: 73.0478,
    sector: "G-8 / G-9",
    lastUpdate: 120,
    heading: 45,
  },
  {
    id: "QRF-C",
    name: "QRF Charlie",
    callsign: "CHARLIE-1",
    capabilities: ["armed", "medical"],
    vehicle: "Hilux (Medical)",
    personnel: 4,
    status: "available" as string,
    lat: 33.6678,
    lng: 73.0712,
    sector: "I-8 / I-9",
    lastUpdate: 30,
    heading: 270,
  },
  {
    id: "QRF-D",
    name: "QRF Delta",
    callsign: "DELTA-1",
    capabilities: ["armed", "bomb_disposal"],
    vehicle: "Armoured APC",
    personnel: 6,
    status: "available" as string,
    lat: 33.7156,
    lng: 73.0623,
    sector: "E-7 / Blue Area",
    lastUpdate: 90,
    heading: 0,
  },
  {
    id: "QRF-E",
    name: "QRF Echo",
    callsign: "ECHO-1",
    capabilities: ["patrol"],
    vehicle: "Motorcycle Unit",
    personnel: 3,
    status: "available" as string,
    lat: 33.6821,
    lng: 73.0318,
    sector: "G-10 / G-11",
    lastUpdate: 15,
    heading: 90,
  },
];

/* ── Mock Incidents ── */
const initialIncidents: Incident[] = [
  {
    id: "INC-047",
    type: "Code Amber",
    typeCode: "amber",
    description: "Suspicious activity reported near main gate",
    site: "Site Bravo (F-6 Markaz)",
    lat: 33.7245,
    lng: 73.0856,
    reported: "14:28 PKT",
    requiredCap: "armed",
    status: "pending",
    assignedTeam: null,
  },
  {
    id: "INC-046",
    type: "Code Red",
    typeCode: "red",
    description: "Confirmed intrusion at warehouse perimeter fence — armed response required",
    site: "Site Delta (I-8 Industrial)",
    lat: 33.6695,
    lng: 73.0780,
    reported: "13:58 PKT",
    requiredCap: "armed",
    status: "pending",
    assignedTeam: null,
  },
  {
    id: "INC-045",
    type: "Code Blue",
    typeCode: "blue",
    description: "Guard medical emergency — collapse at post, requires medical QRF",
    site: "Site Alpha (Blue Area)",
    lat: 33.7180,
    lng: 73.0590,
    reported: "13:15 PKT",
    requiredCap: "medical",
    status: "dispatched",
    assignedTeam: "QRF-C",
  },
  {
    id: "INC-044",
    type: "Code Green",
    typeCode: "green",
    description: "False alarm verification — motion sensor triggered in empty wing",
    site: "Site Echo (G-9 Markaz)",
    lat: 33.6900,
    lng: 73.0400,
    reported: "12:40 PKT",
    requiredCap: "patrol",
    status: "resolved",
    assignedTeam: "QRF-E",
  },
  {
    id: "INC-043",
    type: "Code Amber",
    typeCode: "amber",
    description: "Unknown vehicle parked near compound wall for 30+ min",
    site: "Site Charlie (DHA Phase 2)",
    lat: 33.7050,
    lng: 73.0650,
    reported: "11:22 PKT",
    requiredCap: "armed",
    status: "resolved",
    assignedTeam: "QRF-A",
  },
  {
    id: "INC-042",
    type: "Code Black",
    typeCode: "black",
    description: "Unattended bag found near reception — bomb disposal standby",
    site: "Site Bravo (F-6 Markaz)",
    lat: 33.7260,
    lng: 73.0870,
    reported: "10:05 PKT",
    requiredCap: "bomb_disposal",
    status: "resolved",
    assignedTeam: "QRF-D",
  },
];

/* ── Haversine distance (km) ── */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const statusColors: Record<string, string> = {
  available: "text-tactical-green",
  en_route: "text-tactical-amber",
  on_scene: "text-tactical-red",
  dispatched: "text-tactical-amber",
};

const statusBg: Record<string, string> = {
  available: "bg-tactical-green",
  en_route: "bg-tactical-amber",
  on_scene: "bg-tactical-red",
  dispatched: "bg-tactical-amber",
};

const incidentStatusConfig: Record<IncidentStatus, { color: string; bg: string; border: string; label: string; icon: typeof CheckCircle2 }> = {
  pending: { color: "text-tactical-amber", bg: "bg-tactical-amber/10", border: "border-tactical-amber/30", label: "PENDING", icon: Clock },
  dispatched: { color: "text-tactical-cyan", bg: "bg-tactical-cyan/10", border: "border-tactical-cyan/30", label: "DISPATCHED", icon: Send },
  on_scene: { color: "text-tactical-red", bg: "bg-tactical-red/10", border: "border-tactical-red/30", label: "ON SCENE", icon: Radio },
  resolved: { color: "text-tactical-green", bg: "bg-tactical-green/10", border: "border-tactical-green/30", label: "RESOLVED", icon: CheckCircle2 },
};

const typeCodeColors: Record<string, { color: string; bg: string; border: string }> = {
  red: { color: "text-tactical-red", bg: "bg-tactical-red/10", border: "border-tactical-red/30" },
  amber: { color: "text-tactical-amber", bg: "bg-tactical-amber/10", border: "border-tactical-amber/30" },
  blue: { color: "text-tactical-cyan", bg: "bg-tactical-cyan/10", border: "border-tactical-cyan/30" },
  green: { color: "text-tactical-green", bg: "bg-tactical-green/10", border: "border-tactical-green/30" },
  black: { color: "text-foreground", bg: "bg-muted/50", border: "border-border" },
};

export default function QRFPage() {
  const [mounted, setMounted] = useState(false);
  const [teams, setTeams] = useState(initialTeams);
  const [incidents, setIncidents] = useState(initialIncidents);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [incidentFilter, setIncidentFilter] = useState<string>("all");
  const [gpsTick, setGpsTick] = useState(0);
  const [showManageTeams, setShowManageTeams] = useState(false);
  const [addingTeam, setAddingTeam] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: "",
    callsign: "",
    vehicle: "",
    personnel: "4",
    sector: "",
    capabilities: [] as string[],
    lat: "33.70",
    lng: "73.06",
  });

  useEffect(() => setMounted(true), []);

  /* simulate GPS coordinate drift */
  useEffect(() => {
    const id = setInterval(() => {
      setGpsTick((t) => t + 1);
      setTeams((prev) =>
        prev.map((t) => ({
          ...t,
          lat: t.lat + (Math.random() - 0.5) * 0.0008,
          lng: t.lng + (Math.random() - 0.5) * 0.0008,
          lastUpdate: Math.max(0, t.lastUpdate - 2 + Math.floor(Math.random() * 5)),
        }))
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const activeIncident = incidents.find((inc) => inc.id === selectedIncident) || null;

  /* rank teams by distance + capability for selected incident */
  const rankedTeams = activeIncident
    ? [...teams]
        .filter((t) => t.capabilities.includes(activeIncident.requiredCap))
        .map((t) => ({
          ...t,
          distance: haversine(t.lat, t.lng, activeIncident.lat, activeIncident.lng),
          eta: Math.round(
            (haversine(t.lat, t.lng, activeIncident.lat, activeIncident.lng) / 40) * 60
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
    : [];

  const handleDispatch = useCallback(() => {
    if (!selectedTeam || !selectedIncident) return;
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === selectedIncident
          ? { ...inc, status: "dispatched" as IncidentStatus, assignedTeam: selectedTeam }
          : inc
      )
    );
    setTeams((prev) =>
      prev.map((t) =>
        t.id === selectedTeam ? { ...t, status: "en_route" } : t
      )
    );
  }, [selectedTeam, selectedIncident]);

  const handleResolve = useCallback(() => {
    if (!selectedIncident) return;
    const inc = incidents.find((i) => i.id === selectedIncident);
    if (!inc) return;
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === selectedIncident
          ? { ...i, status: "resolved" as IncidentStatus }
          : i
      )
    );
    // Free the assigned team
    if (inc.assignedTeam) {
      setTeams((prev) =>
        prev.map((t) =>
          t.id === inc.assignedTeam ? { ...t, status: "available" } : t
        )
      );
    }
    setSelectedTeam(null);
  }, [selectedIncident, incidents]);

  const handleAddTeam = useCallback(() => {
    if (!newTeam.name || !newTeam.callsign) return;
    const id = `QRF-${String.fromCharCode(65 + teams.length)}`;
    setTeams((prev) => [
      ...prev,
      {
        id,
        name: newTeam.name,
        callsign: newTeam.callsign,
        capabilities: newTeam.capabilities.length > 0 ? newTeam.capabilities : ["patrol"],
        vehicle: newTeam.vehicle || "Vehicle TBD",
        personnel: parseInt(newTeam.personnel) || 4,
        status: "available",
        lat: parseFloat(newTeam.lat) || 33.7 + (Math.random() - 0.5) * 0.06,
        lng: parseFloat(newTeam.lng) || 73.06 + (Math.random() - 0.5) * 0.06,
        sector: newTeam.sector || "Unassigned",
        lastUpdate: 0,
        heading: Math.floor(Math.random() * 360),
      },
    ]);
    setNewTeam({ name: "", callsign: "", vehicle: "", personnel: "4", sector: "", capabilities: [], lat: "33.70", lng: "73.06" });
    setAddingTeam(false);
  }, [newTeam, teams.length]);

  const handleRemoveTeam = useCallback((teamId: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    if (selectedTeam === teamId) setSelectedTeam(null);
  }, [selectedTeam]);

  const toggleCapability = (cap: string) => {
    setNewTeam((prev) => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter((c) => c !== cap)
        : [...prev.capabilities, cap],
    }));
  };

  /* filtered incidents */
  const filteredIncidents = incidents.filter((inc) => {
    if (incidentFilter === "all") return true;
    return inc.status === incidentFilter;
  });

  const incidentCounts = {
    all: incidents.length,
    pending: incidents.filter((i) => i.status === "pending").length,
    dispatched: incidents.filter((i) => i.status === "dispatched").length,
    resolved: incidents.filter((i) => i.status === "resolved").length,
  };

  /* which incident to show on map */
  const mapIncident = activeIncident || incidents.find((i) => i.status === "pending") || incidents[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-tactical-green/10 border border-tactical-green/30">
            <Crosshair className="h-5 w-5 text-tactical-green" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">QRF Threat Response</h1>
            <p className="text-xs text-muted-foreground font-mono">
              MOD-01 — Real-time GPS Tracking & Capability-based Dispatch
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManageTeams(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-tactical-cyan/10 border border-tactical-cyan/30 text-tactical-cyan font-mono text-[10px] tracking-wide hover:bg-tactical-cyan/20 transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            MANAGE TEAMS ({teams.length})
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-tactical-green-dim border border-tactical-green/20">
            <Satellite className="h-3.5 w-3.5 text-tactical-green" />
            <span className="font-mono text-[10px] text-tactical-green tracking-wide">
              GPS FEED ACTIVE
            </span>
            <div className="h-2 w-2 rounded-full bg-tactical-green blink" />
          </div>
        </div>
      </div>

      {/* Main 3-column layout: Incidents | Map | Team Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_360px] gap-4">

        {/* ── INCIDENT LIST ── */}
        <div className="space-y-3">
          {/* Incident counts */}
          <div className="grid grid-cols-2 gap-2">
            {(["all", "pending", "dispatched", "resolved"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setIncidentFilter(key)}
                className={`glow-border rounded-lg p-2.5 bg-card noise-texture text-left transition-all ${
                  incidentFilter === key ? "ring-1 ring-tactical-green/40" : ""
                } ${mounted ? "fade-in-up" : "opacity-0"}`}
                style={{ animationDelay: "50ms" }}
              >
                <span className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase block">
                  {key}
                </span>
                <p className={`text-lg font-bold font-mono ${
                  key === "pending" ? "text-tactical-amber" : key === "dispatched" ? "text-tactical-cyan" : key === "resolved" ? "text-tactical-green" : "text-foreground"
                }`}>
                  {incidentCounts[key]}
                </p>
              </button>
            ))}
          </div>

          {/* Incident list */}
          <div
            className={`glow-border rounded-lg bg-card noise-texture overflow-hidden ${
              mounted ? "fade-in-up" : "opacity-0"
            }`}
            style={{ animationDelay: "150ms" }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
              <AlertTriangle className="h-3.5 w-3.5 text-tactical-red" />
              <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                Incidents
              </span>
              <span className="font-mono text-[9px] text-muted-foreground ml-auto">
                {filteredIncidents.length} shown
              </span>
            </div>
            <div className="divide-y divide-border/30 max-h-[520px] overflow-y-auto">
              {filteredIncidents.map((inc) => {
                const sc = incidentStatusConfig[inc.status];
                const tc = typeCodeColors[inc.typeCode];
                const StatusIcon = sc.icon;
                const isSelected = selectedIncident === inc.id;
                return (
                  <div
                    key={inc.id}
                    className={`px-3 py-3 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-tactical-green/5 border-l-2 border-l-tactical-green"
                        : "hover:bg-accent/20 border-l-2 border-l-transparent"
                    }`}
                    onClick={() => {
                      setSelectedIncident(inc.id);
                      setSelectedTeam(null);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold">{inc.id}</span>
                        <span className={`font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded border ${tc.bg} ${tc.color} ${tc.border}`}>
                          {inc.type}
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-1 font-mono text-[8px] tracking-wider px-1.5 py-0.5 rounded border ${sc.bg} ${sc.color} ${sc.border}`}>
                        <StatusIcon className="h-2.5 w-2.5" />
                        {sc.label}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground leading-relaxed mb-1.5 line-clamp-2">
                      {inc.description}
                    </p>
                    <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />
                        {inc.site}
                      </span>
                      <span className="text-muted-foreground/40">|</span>
                      <span>{inc.reported}</span>
                    </div>
                    {inc.assignedTeam && (
                      <div className="mt-1.5 flex items-center gap-1 font-mono text-[9px]">
                        <ShieldCheck className="h-2.5 w-2.5 text-tactical-cyan" />
                        <span className="text-tactical-cyan">
                          Assigned: {teams.find((t) => t.id === inc.assignedTeam)?.callsign || inc.assignedTeam}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredIncidents.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="font-mono text-[11px] text-muted-foreground">No incidents match this filter.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── TACTICAL MAP ── */}
        <div
          className={`glow-border rounded-lg bg-card noise-texture relative overflow-hidden ${
            mounted ? "fade-in-up" : "opacity-0"
          }`}
          style={{ animationDelay: "100ms" }}
        >
          {/* Map header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-tactical-cyan" />
              <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                Tactical Map — Islamabad Sector
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] text-muted-foreground">
                GPS TICK #{gpsTick}
              </span>
              <Signal className="h-3 w-3 text-tactical-green blink" />
            </div>
          </div>

          {/* Leaflet Map area */}
          <div className="relative w-full" style={{ height: "520px" }}>
            <TacticalMap
              teams={teams.map((t) => ({
                id: t.id,
                callsign: t.callsign,
                lat: t.lat,
                lng: t.lng,
                status: t.status,
                heading: t.heading,
              }))}
              incident={{
                id: mapIncident.id,
                type: mapIncident.type,
                lat: mapIncident.lat,
                lng: mapIncident.lng,
              }}
              selectedTeam={selectedTeam}
              onSelectTeam={setSelectedTeam}
            />
          </div>

          {/* Map legend */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-border/40">
            {[
              { color: "bg-tactical-green", label: "Available" },
              { color: "bg-tactical-amber", label: "En Route" },
              { color: "bg-tactical-red", label: "On Scene" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${l.color}`} />
                <span className="font-mono text-[9px] text-muted-foreground">
                  {l.label}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="w-2 h-2 rounded-sm rotate-45 border border-tactical-red bg-tactical-red/20" />
              <span className="font-mono text-[9px] text-muted-foreground">
                Incident
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Incident Detail + Team Dispatch ── */}
        <div className="space-y-3">
          {/* Selected incident detail or placeholder */}
          {activeIncident ? (
            <>
              {/* Incident Detail Card */}
              <div
                className={`glow-border rounded-lg bg-card noise-texture overflow-hidden ${
                  mounted ? "fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: "200ms" }}
              >
                <div className={`flex items-center justify-between px-4 py-2.5 border-b border-border/40 ${
                  activeIncident.status === "resolved" ? "bg-tactical-green/5" : "bg-tactical-red/5"
                }`}>
                  <div className="flex items-center gap-2">
                    {activeIncident.status === "resolved" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-tactical-green" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-tactical-red blink" />
                    )}
                    <span className={`font-mono text-[10px] tracking-[0.15em] uppercase font-bold ${
                      activeIncident.status === "resolved" ? "text-tactical-green" : "text-tactical-red"
                    }`}>
                      {activeIncident.id}
                    </span>
                  </div>
                  <span className={`font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded border ${
                    incidentStatusConfig[activeIncident.status].bg
                  } ${incidentStatusConfig[activeIncident.status].color} ${
                    incidentStatusConfig[activeIncident.status].border
                  }`}>
                    {incidentStatusConfig[activeIncident.status].label}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                      typeCodeColors[activeIncident.typeCode].bg
                    } ${typeCodeColors[activeIncident.typeCode].color} ${
                      typeCodeColors[activeIncident.typeCode].border
                    }`}>
                      {activeIncident.type}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{activeIncident.reported}</span>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                    {activeIncident.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="bg-accent/30 rounded px-2 py-1.5">
                      <span className="text-muted-foreground block">SITE</span>
                      <span className="text-foreground">{activeIncident.site}</span>
                    </div>
                    <div className="bg-accent/30 rounded px-2 py-1.5">
                      <span className="text-muted-foreground block">REQUIRED</span>
                      <span className="text-foreground uppercase">{activeIncident.requiredCap}</span>
                    </div>
                    <div className="bg-accent/30 rounded px-2 py-1.5">
                      <span className="text-muted-foreground block">GPS LAT</span>
                      <span className="text-tactical-cyan">{activeIncident.lat.toFixed(4)}°</span>
                    </div>
                    <div className="bg-accent/30 rounded px-2 py-1.5">
                      <span className="text-muted-foreground block">GPS LNG</span>
                      <span className="text-tactical-cyan">{activeIncident.lng.toFixed(4)}°</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team selection — only show if incident is not resolved */}
              {activeIncident.status !== "resolved" && (
                <div
                  className={`glow-border rounded-lg bg-card noise-texture overflow-hidden ${
                    mounted ? "fade-in-up" : "opacity-0"
                  }`}
                  style={{ animationDelay: "300ms" }}
                >
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
                    <Navigation className="h-3.5 w-3.5 text-tactical-green" />
                    <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                      {activeIncident.status === "pending" ? "Select Team (by distance)" : "Assigned Team"}
                    </span>
                  </div>
                  <div className="divide-y divide-border/30 max-h-[220px] overflow-y-auto">
                    {rankedTeams.length > 0 ? rankedTeams.map((team, i) => (
                      <div
                        key={team.id}
                        className={`px-4 py-2.5 cursor-pointer transition-all ${
                          selectedTeam === team.id
                            ? "bg-tactical-green/5 border-l-2 border-l-tactical-green"
                            : "hover:bg-accent/20 border-l-2 border-l-transparent"
                        } ${activeIncident.status !== "pending" && team.id !== activeIncident.assignedTeam ? "opacity-30 pointer-events-none" : ""}`}
                        onClick={() => {
                          if (activeIncident.status === "pending") setSelectedTeam(team.id);
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-muted-foreground w-4">#{i + 1}</span>
                            <span className="font-mono text-xs font-bold">{team.callsign}</span>
                            <div className={`h-1.5 w-1.5 rounded-full ${statusBg[team.status] || "bg-muted"}`} />
                          </div>
                          <span className="font-mono text-[10px] text-tactical-cyan">{team.distance.toFixed(2)} km</span>
                        </div>
                        <div className="flex items-center gap-3 ml-6 text-[9px] font-mono text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />ETA ~{team.eta} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="h-2.5 w-2.5" />{team.vehicle}
                          </span>
                          <span className={`capitalize ${statusColors[team.status] || ""}`}>
                            {team.status.replace("_", " ")}
                          </span>
                        </div>

                        {/* GPS readout for selected */}
                        {selectedTeam === team.id && (
                          <div className="mt-2 ml-6 p-2 rounded bg-secondary border border-border/50">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-mono">
                              <div>
                                <span className="text-muted-foreground">LAT </span>
                                <span className="text-tactical-green tabular-nums">{team.lat.toFixed(6)}°</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">LNG </span>
                                <span className="text-tactical-green tabular-nums">{team.lng.toFixed(6)}°</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">HDG </span>
                                <span className="text-foreground">{team.heading}°</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">UPD </span>
                                <span className={team.lastUpdate > 100 ? "text-tactical-amber" : "text-foreground"}>
                                  {team.lastUpdate}s ago
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="px-4 py-6 text-center">
                        <XCircle className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                        <p className="font-mono text-[10px] text-muted-foreground">
                          No capable teams available for this incident type.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {/* Dispatch — only for pending incidents with a selected team */}
                {activeIncident.status === "pending" && (
                  <button
                    onClick={handleDispatch}
                    disabled={!selectedTeam}
                    className={`w-full py-3 rounded-lg font-mono text-xs tracking-widest uppercase font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedTeam
                        ? "bg-tactical-green text-[#06080D] hover:bg-tactical-green/90 pulse-glow cursor-pointer"
                        : "bg-muted text-muted-foreground border border-border cursor-not-allowed"
                    }`}
                  >
                    <Send className="h-4 w-4" />
                    {selectedTeam
                      ? `Dispatch ${teams.find((t) => t.id === selectedTeam)?.callsign}`
                      : "Select a team to dispatch"}
                  </button>
                )}

                {/* Resolve — for dispatched or on_scene incidents */}
                {(activeIncident.status === "dispatched" || activeIncident.status === "on_scene") && (
                  <button
                    onClick={handleResolve}
                    className="w-full py-3 rounded-lg font-mono text-xs tracking-widest uppercase font-bold transition-all flex items-center justify-center gap-2 bg-tactical-green text-[#06080D] hover:bg-tactical-green/90 pulse-glow cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark Resolved
                  </button>
                )}

                {/* Already resolved badge */}
                {activeIncident.status === "resolved" && (
                  <div className="w-full py-3 rounded-lg font-mono text-xs tracking-widest uppercase font-bold flex items-center justify-center gap-2 bg-tactical-green/15 border border-tactical-green/30 text-tactical-green">
                    <CheckCircle2 className="h-4 w-4" />
                    Incident Resolved
                  </div>
                )}
              </div>

              {/* Signal Path */}
              <div
                className={`glow-border rounded-lg bg-card noise-texture p-4 ${
                  mounted ? "fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: "400ms" }}
              >
                <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase block mb-3">
                  Signal Path
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { label: "Incident Logged", step: 0 },
                    { label: "GPS Parsed", step: 1 },
                    { label: "Haversine Rank", step: 2 },
                    { label: "Dispatch", step: 3 },
                    { label: "On Scene", step: 4 },
                    { label: "Resolved", step: 5 },
                  ].map((s, i) => {
                    const currentStep =
                      activeIncident.status === "pending" ? 2
                      : activeIncident.status === "dispatched" ? 3
                      : activeIncident.status === "on_scene" ? 4
                      : 5;
                    return (
                      <div key={s.label} className="flex items-center gap-1">
                        <span
                          className={`font-mono text-[9px] px-2 py-1 rounded border ${
                            s.step <= currentStep
                              ? "border-tactical-green/40 bg-tactical-green/10 text-tactical-green"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {s.label}
                        </span>
                        {i < 5 && (
                          <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* No incident selected placeholder */
            <div
              className={`glow-border rounded-lg bg-card noise-texture p-8 text-center ${
                mounted ? "fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: "200ms" }}
            >
              <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-mono text-xs text-muted-foreground mb-1">
                No incident selected
              </p>
              <p className="font-mono text-[10px] text-muted-foreground/60">
                Select an incident from the left panel to view details, dispatch a team, or mark it resolved.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── MANAGE TEAMS OVERLAY ── */}
      {showManageTeams && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowManageTeams(false); setAddingTeam(false); }}
          />

          {/* Panel */}
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-card border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col mx-4">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-tactical-cyan" />
                <span className="font-mono text-sm font-bold tracking-wide">Manage QRF Teams</span>
                <span className="font-mono text-[9px] text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded">
                  {teams.length} teams
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAddingTeam(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-tactical-green text-[#06080D] font-mono text-[10px] font-bold tracking-wider hover:bg-tactical-green/90 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  ADD TEAM
                </button>
                <button
                  onClick={() => { setShowManageTeams(false); setAddingTeam(false); }}
                  className="p-1.5 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Add team form */}
            {addingTeam && (
              <div className="px-5 py-4 border-b border-border/60 bg-secondary/50 shrink-0">
                <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase mb-3">
                  New QRF Team
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      value={newTeam.name}
                      onChange={(e) => setNewTeam((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. QRF Foxtrot"
                      className="w-full px-3 py-2 rounded-md bg-card border border-border text-xs font-mono placeholder:text-muted-foreground/40 focus:border-tactical-green/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                      Callsign *
                    </label>
                    <input
                      type="text"
                      value={newTeam.callsign}
                      onChange={(e) => setNewTeam((p) => ({ ...p, callsign: e.target.value.toUpperCase() }))}
                      placeholder="e.g. FOXTROT-1"
                      className="w-full px-3 py-2 rounded-md bg-card border border-border text-xs font-mono placeholder:text-muted-foreground/40 focus:border-tactical-green/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                      Vehicle
                    </label>
                    <input
                      type="text"
                      value={newTeam.vehicle}
                      onChange={(e) => setNewTeam((p) => ({ ...p, vehicle: e.target.value }))}
                      placeholder="e.g. Toyota Hilux"
                      className="w-full px-3 py-2 rounded-md bg-card border border-border text-xs font-mono placeholder:text-muted-foreground/40 focus:border-tactical-green/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                      Personnel
                    </label>
                    <input
                      type="number"
                      value={newTeam.personnel}
                      onChange={(e) => setNewTeam((p) => ({ ...p, personnel: e.target.value }))}
                      placeholder="4"
                      min="1"
                      max="20"
                      className="w-full px-3 py-2 rounded-md bg-card border border-border text-xs font-mono placeholder:text-muted-foreground/40 focus:border-tactical-green/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                      Sector
                    </label>
                    <input
                      type="text"
                      value={newTeam.sector}
                      onChange={(e) => setNewTeam((p) => ({ ...p, sector: e.target.value }))}
                      placeholder="e.g. F-8 / F-9"
                      className="w-full px-3 py-2 rounded-md bg-card border border-border text-xs font-mono placeholder:text-muted-foreground/40 focus:border-tactical-green/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                      GPS Position
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTeam.lat}
                        onChange={(e) => setNewTeam((p) => ({ ...p, lat: e.target.value }))}
                        placeholder="Lat"
                        className="w-1/2 px-3 py-2 rounded-md bg-card border border-border text-xs font-mono placeholder:text-muted-foreground/40 focus:border-tactical-green/50 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={newTeam.lng}
                        onChange={(e) => setNewTeam((p) => ({ ...p, lng: e.target.value }))}
                        placeholder="Lng"
                        className="w-1/2 px-3 py-2 rounded-md bg-card border border-border text-xs font-mono placeholder:text-muted-foreground/40 focus:border-tactical-green/50 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Capabilities
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {["armed", "patrol", "k9", "medical", "bomb_disposal"].map((cap) => (
                        <button
                          key={cap}
                          onClick={() => toggleCapability(cap)}
                          className={`font-mono text-[9px] tracking-wider px-2.5 py-1.5 rounded border transition-colors uppercase ${
                            newTeam.capabilities.includes(cap)
                              ? "bg-tactical-green/15 text-tactical-green border-tactical-green/40"
                              : "text-muted-foreground border-border hover:border-muted-foreground/40"
                          }`}
                        >
                          {cap.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={handleAddTeam}
                    disabled={!newTeam.name || !newTeam.callsign}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-mono text-[10px] font-bold tracking-wider transition-colors ${
                      newTeam.name && newTeam.callsign
                        ? "bg-tactical-green text-[#06080D] hover:bg-tactical-green/90"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    CREATE TEAM
                  </button>
                  <button
                    onClick={() => setAddingTeam(false)}
                    className="px-4 py-2 rounded-md font-mono text-[10px] tracking-wider text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground/40 transition-colors"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}

            {/* Team list */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border/60">
                    {["ID", "Callsign", "Vehicle", "Crew", "Sector", "Capabilities", "Status", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.id} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">{team.id}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-[11px] font-bold block">{team.callsign}</span>
                        <span className="font-mono text-[9px] text-muted-foreground">{team.name}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">{team.vehicle}</td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground text-center">{team.personnel}</td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">{team.sector}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {team.capabilities.map((cap) => (
                            <span key={cap} className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-accent/50 text-muted-foreground uppercase tracking-wider">
                              {cap.replace("_", " ")}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          {(["available", "en_route", "on_scene"] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() =>
                                setTeams((prev) =>
                                  prev.map((t) =>
                                    t.id === team.id ? { ...t, status: s } : t
                                  )
                                )
                              }
                              className={`font-mono text-[8px] tracking-wider px-1.5 py-1 rounded border transition-colors capitalize ${
                                team.status === s
                                  ? s === "available"
                                    ? "bg-tactical-green/15 text-tactical-green border-tactical-green/40"
                                    : s === "en_route"
                                    ? "bg-tactical-amber/15 text-tactical-amber border-tactical-amber/40"
                                    : "bg-tactical-red/15 text-tactical-red border-tactical-red/40"
                                  : "text-muted-foreground/50 border-border/30 hover:text-muted-foreground hover:border-border"
                              }`}
                              title={`Set ${s.replace("_", " ")}`}
                            >
                              {s === "available" ? "avail" : s === "en_route" ? "route" : "scene"}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => handleRemoveTeam(team.id)}
                          className="p-1 rounded hover:bg-tactical-red/10 text-muted-foreground/40 hover:text-tactical-red transition-colors"
                          title="Remove team"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {teams.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <Users className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="font-mono text-xs text-muted-foreground">No teams registered. Add a team to get started.</p>
                </div>
              )}
            </div>

            {/* Panel footer */}
            <div className="px-5 py-3 border-t border-border/60 bg-secondary/30 shrink-0">
              <p className="font-mono text-[9px] text-muted-foreground/60">
                Teams are stored in-app. Add, remove, and manage QRF teams from this panel.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
