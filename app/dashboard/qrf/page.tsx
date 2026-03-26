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

/* ── Mock QRF teams with GPS coords (Islamabad) ── */
const initialTeams = [
  {
    id: "QRF-A",
    name: "QRF Alpha",
    callsign: "ALPHA-1",
    capabilities: ["armed", "patrol"],
    vehicle: "Toyota Hilux",
    personnel: 4,
    status: "available" as const,
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
    status: "en_route" as const,
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
    status: "available" as const,
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
    status: "available" as const,
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
    status: "on_scene" as const,
    lat: 33.6821,
    lng: 73.0318,
    sector: "G-10 / G-11",
    lastUpdate: 15,
    heading: 90,
  },
];

const activeIncident = {
  id: "INC-047",
  type: "Code Amber",
  description: "Suspicious activity reported near main gate",
  site: "Site Bravo (F-6 Markaz)",
  lat: 33.7245,
  lng: 73.0856,
  reported: "14:28 PKT",
  requiredCap: "armed",
};

/* ── Haversine distance (km) ── */
function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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

export default function QRFPage() {
  const [mounted, setMounted] = useState(false);
  const [teams, setTeams] = useState(initialTeams);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [dispatched, setDispatched] = useState(false);
  const [gpsTick, setGpsTick] = useState(0);

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

  /* rank teams by distance + capability */
  const rankedTeams = [...teams]
    .filter((t) => t.capabilities.includes(activeIncident.requiredCap))
    .map((t) => ({
      ...t,
      distance: haversine(t.lat, t.lng, activeIncident.lat, activeIncident.lng),
      eta: Math.round(
        (haversine(t.lat, t.lng, activeIncident.lat, activeIncident.lng) / 40) *
          60
      ),
    }))
    .sort((a, b) => a.distance - b.distance);

  const handleDispatch = useCallback(() => {
    if (!selectedTeam) return;
    setDispatched(true);
    setTeams((prev) =>
      prev.map((t) =>
        t.id === selectedTeam ? { ...t, status: "en_route" as const } : t
      )
    );
  }, [selectedTeam]);

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
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-tactical-green-dim border border-tactical-green/20">
          <Satellite className="h-3.5 w-3.5 text-tactical-green" />
          <span className="font-mono text-[10px] text-tactical-green tracking-wide">
            GPS FEED ACTIVE
          </span>
          <div className="h-2 w-2 rounded-full bg-tactical-green blink" />
        </div>
      </div>

      {/* Main content: Map + Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
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
          <div className="relative w-full" style={{ height: "480px" }}>
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
                id: activeIncident.id,
                type: activeIncident.type,
                lat: activeIncident.lat,
                lng: activeIncident.lng,
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

        {/* ── CONTROL PANEL ── */}
        <div className="space-y-3">
          {/* Active Incident Card */}
          <div
            className={`glow-border rounded-lg bg-card noise-texture overflow-hidden ${
              mounted ? "fade-in-up" : "opacity-0"
            }`}
            style={{ animationDelay: "200ms" }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-tactical-red/5">
              <AlertTriangle className="h-3.5 w-3.5 text-tactical-red blink" />
              <span className="font-mono text-[10px] tracking-[0.15em] text-tactical-red uppercase font-bold">
                Active Incident
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-tactical-amber">
                  {activeIncident.id}
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-tactical-amber/10 border border-tactical-amber/30 text-tactical-amber">
                  {activeIncident.type}
                </span>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">
                {activeIncident.description}
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="bg-accent/30 rounded px-2 py-1.5">
                  <span className="text-muted-foreground block">SITE</span>
                  <span className="text-foreground">{activeIncident.site}</span>
                </div>
                <div className="bg-accent/30 rounded px-2 py-1.5">
                  <span className="text-muted-foreground block">REPORTED</span>
                  <span className="text-foreground">{activeIncident.reported}</span>
                </div>
                <div className="bg-accent/30 rounded px-2 py-1.5">
                  <span className="text-muted-foreground block">GPS LAT</span>
                  <span className="text-tactical-cyan">
                    {activeIncident.lat.toFixed(4)}°
                  </span>
                </div>
                <div className="bg-accent/30 rounded px-2 py-1.5">
                  <span className="text-muted-foreground block">GPS LNG</span>
                  <span className="text-tactical-cyan">
                    {activeIncident.lng.toFixed(4)}°
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ranked Teams */}
          <div
            className={`glow-border rounded-lg bg-card noise-texture overflow-hidden ${
              mounted ? "fade-in-up" : "opacity-0"
            }`}
            style={{ animationDelay: "300ms" }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
              <Navigation className="h-3.5 w-3.5 text-tactical-green" />
              <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                Ranked by Distance (Haversine)
              </span>
            </div>
            <div className="divide-y divide-border/30">
              {rankedTeams.map((team, i) => (
                <div
                  key={team.id}
                  className={`px-4 py-3 cursor-pointer transition-all ${
                    selectedTeam === team.id
                      ? "bg-tactical-green/5 border-l-2 border-l-tactical-green"
                      : "hover:bg-accent/20 border-l-2 border-l-transparent"
                  }`}
                  onClick={() => setSelectedTeam(team.id)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground w-4">
                        #{i + 1}
                      </span>
                      <span className="font-mono text-xs font-bold">
                        {team.callsign}
                      </span>
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${statusBg[team.status]}`}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-tactical-cyan">
                      {team.distance.toFixed(2)} km
                    </span>
                  </div>
                  <div className="flex items-center gap-3 ml-6 text-[9px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      ETA ~{team.eta} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="h-2.5 w-2.5" />
                      {team.vehicle}
                    </span>
                    <span className={`capitalize ${statusColors[team.status]}`}>
                      {team.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-6 mt-1">
                    {team.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="font-mono text-[8px] px-1 py-0.5 rounded bg-accent/50 text-muted-foreground uppercase tracking-wider"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>

                  {/* GPS readout for selected team */}
                  {selectedTeam === team.id && (
                    <div className="mt-2 ml-6 p-2 rounded bg-card border border-border/50">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-mono">
                        <div>
                          <span className="text-muted-foreground">LAT </span>
                          <span className="text-tactical-green tabular-nums">
                            {team.lat.toFixed(6)}°
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">LNG </span>
                          <span className="text-tactical-green tabular-nums">
                            {team.lng.toFixed(6)}°
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">HDG </span>
                          <span className="text-foreground">
                            {team.heading}°
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">UPD </span>
                          <span
                            className={
                              team.lastUpdate > 100
                                ? "text-tactical-amber"
                                : "text-foreground"
                            }
                          >
                            {team.lastUpdate}s ago
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dispatch Button */}
          <button
            onClick={handleDispatch}
            disabled={!selectedTeam || dispatched}
            className={`w-full py-3 rounded-lg font-mono text-xs tracking-widest uppercase font-bold transition-all flex items-center justify-center gap-2 ${
              dispatched
                ? "bg-tactical-green/20 border border-tactical-green/40 text-tactical-green cursor-default"
                : selectedTeam
                ? "bg-tactical-green text-[#06080D] hover:bg-tactical-green/90 pulse-glow cursor-pointer"
                : "bg-muted text-muted-foreground border border-border cursor-not-allowed"
            }`}
          >
            {dispatched ? (
              <>
                <Radio className="h-4 w-4 blink" />
                Team Dispatched — En Route
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {selectedTeam
                  ? `Dispatch ${
                      teams.find((t) => t.id === selectedTeam)?.callsign
                    }`
                  : "Select a team to dispatch"}
              </>
            )}
          </button>

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
                "Incident Logged",
                "GPS Parsed",
                "Haversine Rank",
                "Capability Filter",
                "Dispatch",
                "Report",
              ].map((step, i) => (
                <div key={step} className="flex items-center gap-1">
                  <span
                    className={`font-mono text-[9px] px-2 py-1 rounded border ${
                      i < (dispatched ? 5 : 4)
                        ? "border-tactical-green/40 bg-tactical-green/10 text-tactical-green"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {step}
                  </span>
                  {i < 5 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
