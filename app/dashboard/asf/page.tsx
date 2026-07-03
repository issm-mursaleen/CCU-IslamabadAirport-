"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAlerts } from "@/components/alert-context";
import { useASF, type IncidentStatus, type ASFGroup, type Zone } from "@/components/asf-context";
import {
  Crosshair,
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
  Cctv,
  Plus,
  X,
  Users,
  Trash2,
  User,
  ShieldAlert,
  FileText,
  Car,
  Maximize2,
  UsersRound,
  BadgeAlert,
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

/* Officers move on foot (~5 km/h), vehicles respond at ~40 km/h */
function etaMinutes(distanceKm: number, unitType: string): number {
  const speed = unitType === "officer" ? 5 : 40;
  return Math.max(1, Math.round((distanceKm / speed) * 60));
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
  dispatched: { color: "text-tactical-cyan", bg: "bg-tactical-cyan/10", border: "border-tactical-cyan/30", label: "RESPONDING", icon: Send },
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

const zoneMeta: Record<Zone, { color: string; dot: string; label: string }> = {
  "Zone A": { color: "text-[#22c55e]", dot: "bg-[#22c55e]", label: "APPROACH ROAD" },
  "Zone B": { color: "text-[#f59e0b]", dot: "bg-[#f59e0b]", label: "TERMINAL" },
  "Zone C": { color: "text-[#ef4444]", dot: "bg-[#ef4444]", label: "RUNWAY / APRON" },
};

const kindIcon: Record<string, typeof Car> = {
  stolen_vehicle: Car,
  blacklisted_vehicle: ShieldAlert,
  flagged_person: BadgeAlert,
  queue_congestion: UsersRound,
};

export default function ASFPage() {
  const { addAlert } = useAlerts();
  const { groups, setGroups, incidents, setIncidents } = useASF();
  const [mounted, setMounted] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [zoneFilter, setZoneFilter] = useState<"all" | Zone>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showResolution, setShowResolution] = useState(false);
  const [showFeedDetail, setShowFeedDetail] = useState(false);
  const [showFirDetail, setShowFirDetail] = useState(false);
  const [showMaximizedDetail, setShowMaximizedDetail] = useState(false);
  const [showManageGroups, setShowManageGroups] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    callsign: "",
    unitType: "vehicle" as "vehicle" | "officer",
    vehicle: "",
    personnel: "4",
    zone: "",
    capabilities: [] as string[],
    lat: "33.5510",
    lng: "72.8300",
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !selectedIncident && incidents.length > 0) {
      const firstPending = incidents.find(i => i.status === "pending") || incidents[0];
      if (firstPending) setSelectedIncident(firstPending.id);
    }
  }, [mounted, incidents, selectedIncident]);

  const activeIncident = incidents.find((inc) => inc.id === selectedIncident) || null;

  /* rank units by zone + distance + capability for the selected event */
  const rankedUnits = activeIncident
    ? [...groups]
        .map((t) => {
          const distance = haversine(t.lat, t.lng, activeIncident.lat, activeIncident.lng);
          const hasCap = t.capabilities.includes(activeIncident.requiredCap);
          const isAvailable = t.status === "available";
          return {
            ...t,
            distance,
            etaMin: etaMinutes(distance, t.unitType),
            isSameZone: t.zone === activeIncident.zone,
            hasCap,
            isAvailable,
            canDispatch: isAvailable,
          };
        })
        .sort((a, b) => {
          if (a.isSameZone && !b.isSameZone) return -1;
          if (!a.isSameZone && b.isSameZone) return 1;
          if (a.canDispatch && !b.canDispatch) return -1;
          if (!a.canDispatch && b.canDispatch) return 1;
          return a.distance - b.distance;
        })
    : [];

  const handleDispatch = useCallback((unitId: string) => {
    if (!selectedIncident) return;
    const inc = incidents.find((i) => i.id === selectedIncident);
    const unit = groups.find((t) => t.id === unitId);
    if (!inc || !unit) return;

    setIncidents((prev) =>
      prev.map((i) =>
        i.id === selectedIncident
          ? { ...i, status: "dispatched" as IncidentStatus, assignedGroup: unitId }
          : i
      )
    );
    setGroups((prev) =>
      prev.map((t) =>
        t.id === unitId ? { ...t, status: "en_route", destination: inc.site, eta: `${etaMinutes(haversine(t.lat, t.lng, inc.lat, inc.lng), t.unitType)} min` } : t
      )
    );
    setSelectedGroup(unitId);
    setShowResolution(false);

    addAlert({
      type: "incident",
      priority: inc.typeCode === "red" ? "critical" : "high",
      recipient: "Duty Manager",
      recipientPhone: "+92 300 1234567",
      message: `RESOLUTION: ${inc.id} — ${inc.type} at ${inc.site}. ${unit.callsign} (${unit.name}) responding. ETA ${etaMinutes(haversine(unit.lat, unit.lng, inc.lat, inc.lng), unit.unitType)} min.`,
      triggeredBy: "MOD-01 (ASF Auto)",
    });
    addAlert({
      type: "incident",
      priority: inc.typeCode === "red" ? "critical" : "high",
      recipient: `${unit.callsign}${unit.unitType === "vehicle" ? " Lead" : ""}`,
      recipientPhone: "+92 301 XXXXXXX",
      message: `RESPOND: ${inc.id} at ${inc.site} (${inc.camera}). ${inc.description}`,
      triggeredBy: "MOD-01 (ASF Auto)",
    });
  }, [selectedIncident, incidents, groups, addAlert, setIncidents, setGroups]);

  const handleResolve = useCallback(() => {
    if (!selectedIncident) return;
    const inc = incidents.find((i) => i.id === selectedIncident);
    if (!inc) return;
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === selectedIncident ? { ...i, status: "resolved" as IncidentStatus } : i
      )
    );
    if (inc.assignedGroup) {
      setGroups((prev) =>
        prev.map((t) =>
          t.id === inc.assignedGroup ? { ...t, status: "available", destination: "Resuming Patrol", eta: "—" } : t
        )
      );
    }
    setSelectedGroup(null);

    addAlert({
      type: "incident",
      priority: "normal",
      recipient: "Duty Manager",
      recipientPhone: "+92 300 1234567",
      message: `RESOLVED: ${inc.id} — ${inc.type} at ${inc.site} has been resolved. ${inc.assignedGroup ? `Unit ${groups.find(g => g.id === inc.assignedGroup)?.callsign || inc.assignedGroup} released back to available.` : ""}`,
      triggeredBy: "MOD-01 (ASF Auto)",
    });
  }, [selectedIncident, incidents, groups, addAlert, setIncidents, setGroups]);

  const handleAddGroup = useCallback(() => {
    if (!newGroup.name || !newGroup.callsign) return;
    const id = `ASF-X${groups.length + 1}`;
    setGroups((prev) => [
      ...prev,
      {
        id,
        name: newGroup.name,
        callsign: newGroup.callsign,
        unitType: newGroup.unitType,
        capabilities: newGroup.capabilities.length > 0 ? newGroup.capabilities : ["patrol"],
        vehicle: newGroup.unitType === "officer" ? "On Foot" : newGroup.vehicle || "Vehicle TBD",
        personnel: newGroup.unitType === "officer" ? 1 : parseInt(newGroup.personnel) || 4,
        status: "available",
        lat: parseFloat(newGroup.lat) || 33.551 + (Math.random() - 0.5) * 0.02,
        lng: parseFloat(newGroup.lng) || 72.830 + (Math.random() - 0.5) * 0.02,
        zone: (newGroup.zone as ASFGroup["zone"]) || "Unassigned",
        lastUpdate: 0,
        heading: Math.floor(Math.random() * 360),
        driver: "TBD",
        assignedTo: "Unassigned",
        destination: "Awaiting Orders",
        eta: "—",
      },
    ]);
    setNewGroup({ name: "", callsign: "", unitType: "vehicle", vehicle: "", personnel: "4", zone: "", capabilities: [], lat: "33.5510", lng: "72.8300" });
    setAddingGroup(false);
  }, [newGroup, groups.length, setGroups]);

  const handleRemoveGroup = useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((t) => t.id !== groupId));
    if (selectedGroup === groupId) setSelectedGroup(null);
  }, [selectedGroup, setGroups]);

  const toggleCapability = (cap: string) => {
    setNewGroup((prev) => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter((c) => c !== cap)
        : [...prev.capabilities, cap],
    }));
  };

  /* filtered events */
  const filteredIncidents = incidents.filter((inc) => {
    if (zoneFilter !== "all" && inc.zone !== zoneFilter) return false;
    if (statusFilter !== "all" && inc.status !== statusFilter) return false;
    return true;
  });

  const zoneCounts = {
    all: incidents.filter((i) => i.status !== "resolved").length,
    "Zone A": incidents.filter((i) => i.zone === "Zone A" && i.status !== "resolved").length,
    "Zone B": incidents.filter((i) => i.zone === "Zone B" && i.status !== "resolved").length,
    "Zone C": incidents.filter((i) => i.zone === "Zone C" && i.status !== "resolved").length,
  };

  const statusCounts = {
    all: incidents.length,
    pending: incidents.filter((i) => i.status === "pending").length,
    dispatched: incidents.filter((i) => i.status === "dispatched").length,
    resolved: incidents.filter((i) => i.status === "resolved").length,
  };

  const detail = activeIncident?.detail;
  const assignedUnit = activeIncident?.assignedGroup
    ? groups.find((g) => g.id === activeIncident.assignedGroup)
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] overflow-hidden space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-tactical-green/10 border border-tactical-green/30">
            <Crosshair className="h-5 w-5 text-tactical-green" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">ASF Zone Operations</h1>
            <p className="text-xs text-muted-foreground font-mono">
              Camera events · Zone A Approach Road · Zone B Terminal · Zone C Runway
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManageGroups(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-tactical-cyan/10 border border-tactical-cyan/30 text-tactical-cyan font-mono text-[10px] tracking-wide hover:bg-tactical-cyan/20 transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            MANAGE UNITS ({groups.length})
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

      {/* Main 3-column layout: Events | Map | Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr_380px] gap-4 flex-1 min-h-0">

        {/* ── CAMERA EVENTS ── */}
        <div className="flex flex-col h-full min-h-0 space-y-3">
          {/* Zone filter */}
          <div
            className={`grid grid-cols-4 gap-1.5 shrink-0 ${mounted ? "fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "50ms" }}
          >
            {(["all", "Zone A", "Zone B", "Zone C"] as const).map((z) => (
              <button
                key={z}
                onClick={() => setZoneFilter(z)}
                className={`glow-border rounded-lg px-2 py-2 bg-card noise-texture text-left transition-all ${
                  zoneFilter === z ? "ring-1 ring-tactical-green/40" : ""
                }`}
              >
                <span className="flex items-center gap-1 font-mono text-[8px] tracking-[0.1em] text-muted-foreground uppercase">
                  {z !== "all" && <span className={`h-1.5 w-1.5 rounded-full ${zoneMeta[z].dot}`} />}
                  {z === "all" ? "ALL" : z.replace("Zone ", "Z-")}
                </span>
                <p className="text-base font-bold font-mono">{zoneCounts[z]}</p>
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div
            className={`flex items-center gap-1 shrink-0 ${mounted ? "fade-in-up" : "opacity-0"}`}
            style={{ animationDelay: "80ms" }}
          >
            {(["all", "pending", "dispatched", "resolved"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`flex-1 font-mono text-[8px] tracking-wider uppercase px-1.5 py-1.5 rounded border transition-colors ${
                  statusFilter === key
                    ? key === "pending"
                      ? "bg-tactical-amber/15 text-tactical-amber border-tactical-amber/40"
                      : key === "dispatched"
                      ? "bg-tactical-cyan/15 text-tactical-cyan border-tactical-cyan/40"
                      : key === "resolved"
                      ? "bg-tactical-green/15 text-tactical-green border-tactical-green/40"
                      : "bg-accent/50 text-foreground border-border"
                    : "text-muted-foreground border-border/40 hover:border-border"
                }`}
              >
                {key === "dispatched" ? "responding" : key} ({statusCounts[key]})
              </button>
            ))}
          </div>

          {/* Events list */}
          <div
            className={`glow-border rounded-lg bg-card noise-texture overflow-hidden flex flex-col flex-1 min-h-0 ${
              mounted ? "fade-in-up" : "opacity-0"
            }`}
            style={{ animationDelay: "150ms" }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 shrink-0">
              <Cctv className="h-3.5 w-3.5 text-tactical-red" />
              <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                Camera Events
              </span>
              <span className="font-mono text-[9px] text-muted-foreground ml-auto">
                {filteredIncidents.length} shown
              </span>
            </div>
            <div className="divide-y divide-border/30 overflow-y-auto flex-1">
              {filteredIncidents.map((inc) => {
                const sc = incidentStatusConfig[inc.status];
                const tc = typeCodeColors[inc.typeCode];
                const StatusIcon = sc.icon;
                const KindIcon = kindIcon[inc.kind] || AlertTriangle;
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
                      setSelectedGroup(null);
                      setShowResolution(false);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <KindIcon className={`h-3 w-3 ${tc.color}`} />
                        <span className="font-mono text-[11px] font-bold">{inc.id}</span>
                        <span className={`font-mono text-[8px] tracking-wider px-1.5 py-0.5 rounded border ${tc.bg} ${tc.color} ${tc.border}`}>
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
                    <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground flex-wrap">
                      <span className={`flex items-center gap-1 ${zoneMeta[inc.zone].color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${zoneMeta[inc.zone].dot}`} />
                        {inc.zone}
                      </span>
                      <span className="text-muted-foreground/40">|</span>
                      <span className="flex items-center gap-1">
                        <Cctv className="h-2.5 w-2.5" />
                        {inc.camera}
                      </span>
                      <span className="text-muted-foreground/40">|</span>
                      <span>{inc.reported}</span>
                    </div>
                    {inc.assignedGroup && (
                      <div className="mt-1.5 flex items-center gap-1 font-mono text-[9px]">
                        <ShieldCheck className="h-2.5 w-2.5 text-tactical-cyan" />
                        <span className="text-tactical-cyan">
                          Responding: {groups.find((t) => t.id === inc.assignedGroup)?.callsign || inc.assignedGroup}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredIncidents.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="font-mono text-[11px] text-muted-foreground">No events match this filter.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── TACTICAL MAP ── */}
        <div
          className={`glow-border rounded-lg bg-card noise-texture relative overflow-hidden flex flex-col h-full min-h-0 ${
            mounted ? "fade-in-up" : "opacity-0"
          }`}
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-tactical-cyan" />
              <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                Tactical Map — Islamabad Intl Airport
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] text-muted-foreground">GPS LIVE</span>
              <Signal className="h-3 w-3 text-tactical-green blink" />
            </div>
          </div>

          <div className="relative w-full flex-1 min-h-0">
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
              onSelectIncident={(id) => {
                setSelectedIncident(id);
                setSelectedGroup(null);
                setShowResolution(false);
              }}
              fitAllZones
              activeZone={zoneFilter !== "all" ? zoneFilter : (activeIncident ? activeIncident.zone : "all")}
            />
          </div>

          {/* Map legend */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-border/40 flex-wrap shrink-0">
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
              <span className="font-mono text-[9px] text-muted-foreground">Patrol Vehicle</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-[9px] text-muted-foreground">ASF Officer</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="w-2 h-2 rounded-sm rotate-45 border border-tactical-red bg-tactical-red/20" />
              <span className="font-mono text-[9px] text-muted-foreground">Event</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Event Detail + Resolution ── */}
        <div className="flex flex-col h-full min-h-0 space-y-3">
          {activeIncident ? (
            <>
              {/* Event Detail Card */}
              <div
                className={`glow-border rounded-lg bg-card noise-texture overflow-hidden flex flex-col flex-1 min-h-0 ${
                  mounted ? "fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: "200ms" }}
              >
                <div className={`flex items-center justify-between px-4 py-2.5 border-b border-border/40 shrink-0 ${
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
                      {activeIncident.id} — {activeIncident.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded border ${
                      incidentStatusConfig[activeIncident.status].bg
                    } ${incidentStatusConfig[activeIncident.status].color} ${
                      incidentStatusConfig[activeIncident.status].border
                    }`}>
                      {incidentStatusConfig[activeIncident.status].label}
                    </span>
                    <button
                      onClick={() => setShowMaximizedDetail(true)}
                      className="p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border/40 flex items-center justify-center"
                      title="Maximize Details"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-3.5 overflow-y-auto flex-1 font-mono text-xs">
                  {activeIncident.kind === "stolen_vehicle" || activeIncident.id === "EVT-205" ? (
                    <>
                      {/* Top Row: Split 50/50 */}
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_95px] gap-4">
                        {/* Left Column: Basic Info */}
                        <div className="space-y-3">
                          {/* Status and Zone */}
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center gap-1.5 font-mono text-[9px] font-bold px-2 py-0.5 rounded border ${incidentStatusConfig[activeIncident.status].bg} ${incidentStatusConfig[activeIncident.status].color} ${incidentStatusConfig[activeIncident.status].border} uppercase tracking-wider`}>
                              {(() => {
                                const StatusIcon = incidentStatusConfig[activeIncident.status].icon;
                                return <StatusIcon className="h-3 w-3" />;
                              })()}
                              {incidentStatusConfig[activeIncident.status].label}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 font-mono text-[9px] font-bold px-2 py-0.5 rounded border bg-secondary/40 border-border uppercase tracking-wider ${zoneMeta[activeIncident.zone].color}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${zoneMeta[activeIncident.zone].dot}`} />
                              {activeIncident.zone}
                            </span>
                          </div>

                          {/* Details Table */}
                          <div className="space-y-0 rounded-xl border border-border/40 overflow-hidden bg-secondary/20">
                            {[
                              { label: "Site Location", value: activeIncident.site },
                              { label: "Reporting Cam", value: activeIncident.camera },
                              { label: "Report Time", value: activeIncident.reported },
                              { label: "Required Capability", value: activeIncident.requiredCap.toUpperCase() },
                            ].map(({ label, value }, i, arr) => (
                              <div key={label} className={`flex items-center justify-between px-3 py-1.5 ${i !== arr.length - 1 ? "border-b border-border/20" : ""}`}>
                                <span className="text-muted-foreground text-[8px] uppercase tracking-wider">{label}</span>
                                <span className="font-semibold text-foreground text-[10px] text-right">{value}</span>
                              </div>
                            ))}
                          </div>

                          {/* Suspect Meta or Plate/Vehicle specs */}
                          {activeIncident.kind === "flagged_person" ? (
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                              <div className="bg-card border border-border/40 p-2 rounded">
                                <span className="text-muted-foreground block text-[8px] uppercase">SUSPECT NAME</span>
                                <span className="text-foreground font-bold truncate block">{detail?.personName}</span>
                              </div>
                              <div className="bg-card border border-border/40 p-2 rounded">
                                <span className="text-muted-foreground block text-[8px] uppercase">CNIC ID NUMBER</span>
                                <span className="text-tactical-red font-bold truncate block">61101-9876543-1</span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                              <div className="bg-card border border-border/40 p-2 rounded">
                                <span className="text-muted-foreground block text-[8px] uppercase">LICENSE PLATE</span>
                                <span className="text-tactical-red font-bold tracking-widest">{detail?.plate}</span>
                              </div>
                              <div className="bg-card border border-border/40 p-2 rounded">
                                <span className="text-muted-foreground block text-[8px] uppercase">VEHICLE</span>
                                <span className="text-foreground font-bold truncate block">{detail?.vehicleDesc}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Column: Images */}
                        <div className="flex flex-col gap-2 self-start">
                          {activeIncident.kind === "flagged_person" ? (
                            <>
                              {/* Face Image */}
                              <div 
                                onClick={() => setZoomedImage("/suspect_face.jpg")}
                                className="relative aspect-[4/3] rounded-lg overflow-hidden border border-tactical-red/35 bg-black group shadow-md cursor-zoom-in hover:border-tactical-red/60 transition-all duration-300"
                              >
                                <img 
                                  src="/suspect_face.jpg" 
                                  alt="Face Capture" 
                                  className="w-full h-full object-cover opacity-90" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                <div className="absolute top-1.5 right-1.5 px-1 py-0.5 rounded bg-tactical-red text-white text-[5px] font-bold font-mono tracking-widest animate-pulse">
                                  CCTV FACE
                                </div>
                              </div>
                              {/* CNIC Image */}
                              <div 
                                onClick={() => setZoomedImage("/suspect_cnic.jpg")}
                                className="relative aspect-[4/3] rounded-lg overflow-hidden border border-tactical-red/35 bg-black group shadow-md cursor-zoom-in hover:border-tactical-red/60 transition-all duration-300"
                              >
                                <img 
                                  src="/suspect_cnic.jpg" 
                                  alt="CNIC Database" 
                                  className="w-full h-full object-cover opacity-90" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                <div className="absolute top-1.5 right-1.5 px-1 py-0.5 rounded bg-tactical-green text-white text-[5px] font-bold font-mono tracking-widest">
                                  CNIC COPY
                                </div>
                              </div>
                            </>
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
                                  className="w-full h-full object-cover opacity-90" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                <div className="absolute top-1.5 right-1.5 px-1 py-0.5 rounded bg-tactical-red text-white text-[5px] font-bold font-mono tracking-widest animate-pulse">
                                  FLAGGED
                                </div>
                              </div>
                              {/* Plate Image */}
                              <div 
                                onClick={() => setZoomedImage("/flagged_plate.png")}
                                className="relative aspect-[4/3] rounded-lg overflow-hidden border border-tactical-red/35 bg-black group shadow-md cursor-zoom-in hover:border-tactical-red/60 transition-all duration-300"
                              >
                                <img 
                                  src="/flagged_plate.png" 
                                  alt="Flagged Vehicle Plate" 
                                  className="w-full h-full object-cover opacity-90" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                <div className="absolute top-1.5 right-1.5 px-1 py-0.5 rounded bg-tactical-green text-white text-[5px] font-bold font-mono tracking-widest">
                                  PLATE
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* FIR/Warrant Info Section */}
                      {detail?.firImage && (
                        <div
                          onClick={() => setShowFirDetail(true)}
                          className="flex gap-3 p-2.5 rounded-lg bg-tactical-red/5 border border-tactical-red/25 cursor-pointer hover:border-tactical-red/50 transition-colors group"
                        >
                          <div className="relative h-16 w-12 rounded overflow-hidden border border-border shrink-0 bg-black">
                            <img src={detail.firImage} alt="Scanned Document" className="h-full w-full object-cover opacity-90" />
                            <div className="absolute inset-x-0 top-0 h-0.5 bg-tactical-green/80 animate-pulse" />
                          </div>
                          <div className="flex-1 min-w-0 font-mono">
                            <div className="flex items-center gap-1.5 mb-1">
                              <FileText className="h-3.5 w-3.5 text-tactical-red" />
                              <span className="text-[10px] font-bold text-tactical-red tracking-wider">
                                {activeIncident.kind === "flagged_person" ? "ARREST WARRANT — SCANNED DOCUMENT" : "FIR MATCH — SCANNED DOCUMENT"}
                              </span>
                            </div>
                            <p className="text-[9px] text-muted-foreground leading-normal font-mono">
                              {activeIncident.kind === "flagged_person" ? (
                                <>
                                  Warrant No: <span className="text-foreground font-bold">{detail.firNo}</span> · Issued by PS Bhara Kahu
                                  <br />Suspect: <span className="text-tactical-red font-bold">{detail.personName}</span>
                                </>
                              ) : (
                                <>
                                  FIR No: <span className="text-foreground font-bold">{detail.firNo}</span> · PS Airport, Rawalpindi
                                  <br />Plate: <span className="text-tactical-red font-bold">{detail.plate}</span>
                                </>
                              )}
                            </p>
                            <span className="text-[8px] text-tactical-cyan tracking-widest uppercase group-hover:underline mt-1 block">
                              Click to view scanned {activeIncident.kind === "flagged_person" ? "Warrant" : "FIR"} →
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Live camera feed */}
                      {activeIncident.videoSrc && (
                        <div
                          onClick={() => setShowFeedDetail(true)}
                          className="relative w-full aspect-video rounded-lg overflow-hidden border border-tactical-red/30 bg-black group shadow-[0_0_15px_rgba(239,68,68,0.1)] cursor-pointer hover:border-tactical-red/60 transition-colors"
                        >
                          <video
                            src={activeIncident.videoSrc}
                            autoPlay loop muted playsInline
                            className="w-full h-full object-cover opacity-90 group-hover:scale-102 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(0,255,157,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
                          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/60 border border-white/10 backdrop-blur-md text-[8px] font-mono font-bold tracking-widest text-tactical-red flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-tactical-red blink" />
                            {activeIncident.camera}
                          </div>
                          <div className="absolute top-2 right-2 z-10 p-1 rounded bg-black/60 border border-white/10 text-white/70">
                            <Maximize2 className="h-3 w-3" />
                          </div>
                          <div className="absolute bottom-2 left-2 right-2 z-10 p-2 rounded bg-black/75 border border-tactical-red/30 text-[9px] font-mono text-white flex flex-col gap-0.5">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">DETECTED:</span>
                              <span className="text-tactical-red font-bold tracking-widest">
                                {detail?.plate} (STOLEN)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">CONFIDENCE:</span>
                              <span className="text-tactical-red font-bold">{detail?.confidence}% MATCH</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                        {activeIncident.description}
                      </p>

                      {/* Details Table */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="bg-accent/30 rounded px-2 py-1.5">
                          <span className="text-muted-foreground block">CAMERA</span>
                          <span className="text-foreground">{activeIncident.camera}</span>
                        </div>
                        <div className="bg-accent/30 rounded px-2 py-1.5">
                          <span className="text-muted-foreground block">SITE</span>
                          <span className="text-foreground">{activeIncident.site}</span>
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
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className={`flex items-center gap-1.5 font-mono text-[10px] ${zoneMeta[activeIncident.zone].color}`}>
                          <span className={`h-2 w-2 rounded-full ${zoneMeta[activeIncident.zone].dot}`} />
                          {activeIncident.zone} — {zoneMeta[activeIncident.zone].label}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">{activeIncident.reported}</span>
                      </div>
                      <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                        {activeIncident.description}
                      </p>

                      {/* Live camera feed */}
                      {activeIncident.videoSrc && (
                        <div
                          onClick={() => setShowFeedDetail(true)}
                          className="relative w-full aspect-video rounded-lg overflow-hidden border border-tactical-red/30 bg-black group shadow-[0_0_15px_rgba(239,68,68,0.1)] cursor-pointer hover:border-tactical-red/60 transition-colors"
                        >
                          <video
                            src={activeIncident.videoSrc}
                            autoPlay loop muted playsInline
                            className="w-full h-full object-cover opacity-90 group-hover:scale-102 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(0,255,157,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
                          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/60 border border-white/10 backdrop-blur-md text-[8px] font-mono font-bold tracking-widest text-tactical-red flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-tactical-red blink" />
                            {activeIncident.camera}
                          </div>
                          <div className="absolute top-2 right-2 z-10 p-1 rounded bg-black/60 border border-white/10 text-white/70">
                            <Maximize2 className="h-3 w-3" />
                          </div>
                          <div className="absolute bottom-2 left-2 right-2 z-10 p-2 rounded bg-black/75 border border-tactical-red/30 text-[9px] font-mono text-white flex flex-col gap-0.5">
                            {activeIncident.kind === "blacklisted_vehicle" && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">DETECTED:</span>
                                  <span className="text-tactical-red font-bold tracking-widest">
                                    {detail?.plate} (BLACKLISTED)
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">CONFIDENCE:</span>
                                  <span className="text-tactical-red font-bold">{detail?.confidence}% MATCH</span>
                                </div>
                              </>
                            )}
                            {activeIncident.kind === "flagged_person" && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">FACE MATCH:</span>
                                  <span className="text-tactical-red font-bold tracking-wider">{detail?.personName} ({detail?.personId})</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">CONFIDENCE:</span>
                                  <span className="text-tactical-red font-bold">{detail?.confidence}% MATCH</span>
                                </div>
                              </>
                            )}
                            {activeIncident.kind === "queue_congestion" && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">PAX COUNT:</span>
                                  <span className="text-tactical-amber font-bold tracking-wider">
                                    {detail?.peopleCount} / {detail?.threshold} THRESHOLD
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">EST. WAIT:</span>
                                  <span className="text-tactical-amber font-bold">{detail?.waitTime}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Matches details section */}
                      {detail && (
                        <div className="space-y-3">
                          {/* Blacklisted vehicle — watchlist profile */}
                          {activeIncident.kind === "blacklisted_vehicle" && (
                            <div className="flex gap-3 p-3 rounded-lg bg-tactical-red/5 border border-tactical-red/25">
                              <div className="h-12 w-12 rounded bg-secondary border border-border flex items-center justify-center shrink-0">
                                <User className="h-7 w-7 text-muted-foreground" />
                              </div>
                              <div className="text-[10px] font-mono space-y-0.5 min-w-0">
                                <span className="block font-bold text-tactical-red tracking-wider">OCCUPANT WATCHLIST PROFILE</span>
                                <p className="text-foreground"><span className="text-muted-foreground">Name/Alias:</span> {detail.occupantName} ({detail.occupantId})</p>
                                <p className="text-foreground"><span className="text-muted-foreground">Threat:</span> <span className="text-tactical-red font-bold">{detail.threatLevel}</span></p>
                                <p className="text-muted-foreground">{detail.watchlistRef}</p>
                              </div>
                            </div>
                          )}

                          {/* Flagged person — FIA watchlist profile */}
                          {activeIncident.kind === "flagged_person" && (
                            <div className="rounded-lg bg-tactical-red/5 border border-tactical-red/25 overflow-hidden">
                              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-tactical-red/20 bg-tactical-red/10">
                                <BadgeAlert className="h-3 w-3 text-tactical-red" />
                                <span className="font-mono text-[9px] font-bold text-tactical-red tracking-wider uppercase">FIA Watchlist Profile</span>
                                <span className="ml-auto font-mono text-[8px] text-tactical-red font-bold">{detail.confidence}% MATCH</span>
                              </div>
                              <div className="p-3 flex gap-3">
                                <div className="h-12 w-12 rounded bg-secondary border border-border flex items-center justify-center shrink-0">
                                  <User className="h-7 w-7 text-muted-foreground" />
                                </div>
                                <div className="text-[10px] font-mono space-y-0.5 min-w-0">
                                  <p className="text-foreground font-bold">{detail.personName} <span className="text-muted-foreground font-normal">({detail.personId})</span></p>
                                  <p className="text-tactical-red font-bold">{detail.flagReason}</p>
                                  <p className="text-foreground"><span className="text-muted-foreground">Passport:</span> {detail.passport} · {detail.nationality}</p>
                                  <p className="text-foreground"><span className="text-muted-foreground">Flight:</span> {detail.flight}</p>
                                  <p className="text-foreground"><span className="text-muted-foreground">Threat:</span> <span className="text-tactical-amber font-bold">{detail.threatLevel}</span></p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Queue congestion — metrics */}
                          {activeIncident.kind === "queue_congestion" && (
                            <div className="rounded-lg bg-tactical-amber/5 border border-tactical-amber/25 p-3 space-y-2">
                              <div className="flex items-center gap-1.5">
                                <UsersRound className="h-3 w-3 text-tactical-amber" />
                                <span className="font-mono text-[9px] font-bold text-tactical-amber tracking-wider uppercase">{detail.counter}</span>
                              </div>
                              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                <div
                                  className="h-full bg-tactical-amber transition-all duration-500"
                                  style={{ width: `${((detail.peopleCount || 0) / (detail.threshold || 1)) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="bg-accent/30 rounded px-2 py-1.5">
                          <span className="text-muted-foreground block">CAMERA</span>
                          <span className="text-foreground">{activeIncident.camera}</span>
                        </div>
                        <div className="bg-accent/30 rounded px-2 py-1.5">
                          <span className="text-muted-foreground block">SITE</span>
                          <span className="text-foreground">{activeIncident.site}</span>
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
                    </>
                  )}
                </div>
              </div>

              {/* Action area */}
              <div className="space-y-2 shrink-0">
                {activeIncident.status === "pending" && (
                  <button
                    onClick={() => setShowResolution(true)}
                    className="w-full py-3 rounded-lg font-mono text-xs tracking-widest uppercase font-bold transition-all flex items-center justify-center gap-2 bg-tactical-green text-[#06080D] hover:bg-tactical-green/90 pulse-glow cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Resolution — View Nearby Units
                  </button>
                )}

                {(activeIncident.status === "dispatched" || activeIncident.status === "on_scene") && (
                  <div className="flex flex-col gap-2">
                    {assignedUnit && (
                      <div className="glow-border rounded-lg bg-card noise-texture p-3">
                        <p className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground uppercase mb-2">Responding Unit</p>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-md bg-tactical-cyan/10 border border-tactical-cyan/30 flex items-center justify-center shrink-0">
                            {assignedUnit.unitType === "officer" ? (
                              <User className="h-4.5 w-4.5 text-tactical-cyan" />
                            ) : (
                              <Car className="h-4.5 w-4.5 text-tactical-cyan" />
                            )}
                          </div>
                          <div className="min-w-0 font-mono">
                            <p className="text-[11px] font-bold">{assignedUnit.callsign} <span className="text-muted-foreground font-normal">· {assignedUnit.name}</span></p>
                            <p className="text-[9px] text-muted-foreground">
                              {assignedUnit.unitType === "officer" ? assignedUnit.rank : assignedUnit.vehicle} · {haversine(assignedUnit.lat, assignedUnit.lng, activeIncident.lat, activeIncident.lng).toFixed(2)} km out · ETA ~{etaMinutes(haversine(assignedUnit.lat, assignedUnit.lng, activeIncident.lat, activeIncident.lng), assignedUnit.unitType)} min
                            </p>
                          </div>
                          <span className="ml-auto font-mono text-[8px] tracking-wider px-1.5 py-0.5 rounded bg-tactical-amber/15 text-tactical-amber border border-tactical-amber/40">
                            EN ROUTE
                          </span>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleResolve}
                      className="w-full py-3 rounded-lg font-mono text-xs tracking-widest uppercase font-bold transition-all flex items-center justify-center gap-2 bg-tactical-green text-[#06080D] hover:bg-tactical-green/90 pulse-glow cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Resolved
                    </button>
                  </div>
                )}

                {activeIncident.status === "resolved" && (
                  <div className="w-full py-3 rounded-lg font-mono text-xs tracking-widest uppercase font-bold flex items-center justify-center gap-2 bg-tactical-green/15 border border-tactical-green/30 text-tactical-green">
                    <CheckCircle2 className="h-4 w-4" />
                    Event Resolved{assignedUnit ? ` — ${assignedUnit.callsign} released` : ""}
                  </div>
                )}
              </div>

              {/* Signal Path */}
              <div
                className={`glow-border rounded-lg bg-card noise-texture p-4 shrink-0 ${
                  mounted ? "fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: "400ms" }}
              >
                <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase block mb-3">
                  Event Resolution Flow
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { label: "Capture (CCTV)", step: 0 },
                    { label: "Match (FIR/Watchlist)", step: 1 },
                    { label: "Zone Lookup", step: 2 },
                    { label: "Resolution (Unit)", step: 3 },
                    { label: "Response", step: 4 },
                    { label: "Resolved", step: 5 },
                  ].map((s, i) => {
                    const currentStep =
                      activeIncident.status === "pending" ? 2
                      : activeIncident.status === "dispatched" ? 4
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
                        {i < 5 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div
              className={`glow-border rounded-lg bg-card noise-texture p-8 text-center flex-1 flex flex-col items-center justify-center ${
                mounted ? "fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: "200ms" }}
            >
              <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-mono text-xs text-muted-foreground mb-1">No event selected</p>
              <p className="font-mono text-[10px] text-muted-foreground/60">
                Select a camera event from the left panel to view details and open the resolution panel.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── RESOLUTION MODAL ── */}
      {showResolution && activeIncident && activeIncident.status === "pending" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowResolution(false)}
          />
          <div className="relative w-full max-w-xl max-h-[85vh] bg-card border border-tactical-green/30 rounded-xl overflow-hidden shadow-2xl flex flex-col z-10 fade-in-up">
            <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between bg-tactical-green/5 shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-tactical-green" />
                <div>
                  <span className="font-mono text-sm font-bold tracking-wide block">
                    RESOLUTION — {activeIncident.id}
                  </span>
                  <span className={`font-mono text-[9px] ${zoneMeta[activeIncident.zone].color}`}>
                    {activeIncident.zone} · {zoneMeta[activeIncident.zone].label} · units ranked by proximity
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowResolution(false)}
                className="p-1 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="divide-y divide-border/30 overflow-y-auto flex-1">
              {rankedUnits.map((unit, i) => {
                const isSelected = selectedGroup === unit.id;
                return (
                  <div
                    key={unit.id}
                    className={`px-4 py-3 transition-all ${
                      unit.canDispatch ? "cursor-pointer" : "opacity-40"
                    } ${
                      isSelected
                        ? "bg-tactical-green/5 border-l-2 border-l-tactical-green"
                        : "hover:bg-accent/20 border-l-2 border-l-transparent"
                    }`}
                    onClick={() => {
                      if (unit.canDispatch) setSelectedGroup(unit.id);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                      <div className={`h-9 w-9 rounded-md border flex items-center justify-center shrink-0 ${
                        unit.unitType === "officer"
                          ? "bg-tactical-cyan/10 border-tactical-cyan/30"
                          : "bg-tactical-green/10 border-tactical-green/30"
                      }`}>
                        {unit.unitType === "officer" ? (
                          <User className="h-4 w-4 text-tactical-cyan" />
                        ) : (
                          <Car className="h-4 w-4 text-tactical-green" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold">{unit.callsign}</span>
                          <div className={`h-1.5 w-1.5 rounded-full ${statusBg[unit.status] || "bg-muted"}`} />
                          <span className="font-mono text-[9px] text-muted-foreground truncate">{unit.name}</span>
                          {unit.isSameZone && (
                            <span className="font-mono text-[8px] tracking-wider px-1.5 py-0.5 rounded bg-tactical-cyan/15 text-tactical-cyan border border-tactical-cyan/40">
                              IN ZONE
                            </span>
                          )}
                          {!unit.isAvailable && (
                            <span className="font-mono text-[8px] tracking-wider px-1.5 py-0.5 rounded bg-tactical-amber/15 text-tactical-amber border border-tactical-amber/40">
                              BUSY
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground flex-wrap mt-0.5">
                          <span className="flex items-center gap-1">
                            {unit.unitType === "officer" ? (
                              <>{unit.rank}</>
                            ) : (
                              <><Truck className="h-2.5 w-2.5" />{unit.vehicle} · {unit.personnel} crew</>
                            )}
                          </span>
                          <span className={`capitalize ${statusColors[unit.status] || ""}`}>
                            {unit.status.replace("_", " ")}
                          </span>
                          {unit.capabilities.includes("armed") && (
                            <span className="font-mono text-[8px] tracking-wider px-1.5 py-0.5 rounded bg-tactical-red/15 text-tactical-red border border-tactical-red/40 uppercase">
                              ARMED
                            </span>
                          )}
                          {unit.capabilities.filter((c) => c !== "armed").map((c) => (
                            <span key={c} className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-accent/50 text-muted-foreground uppercase tracking-wider">
                              {c.replace("_", " ")}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <p className="text-[11px] text-tactical-cyan font-bold">{unit.distance.toFixed(2)} km</p>
                        <p className="text-[9px] text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="h-2.5 w-2.5" />ETA ~{unit.etaMin} min
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {rankedUnits.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <XCircle className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                  <p className="font-mono text-[10px] text-muted-foreground">No units registered.</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border/50 bg-secondary/30 shrink-0 space-y-1.5">
              <button
                onClick={() => selectedGroup && handleDispatch(selectedGroup)}
                disabled={!selectedGroup}
                className={`w-full py-3 rounded-lg font-mono text-xs tracking-widest uppercase font-bold transition-all flex items-center justify-center gap-2 ${
                  selectedGroup
                    ? "bg-tactical-green text-[#06080D] hover:bg-tactical-green/90 pulse-glow cursor-pointer"
                    : "bg-muted text-muted-foreground border border-border cursor-not-allowed"
                }`}
              >
                <Send className="h-4 w-4" />
                {selectedGroup
                  ? `Dispatch ${groups.find((t) => t.id === selectedGroup)?.callsign} & Respond`
                  : "Select a unit to dispatch"}
              </button>
              {selectedGroup && (
                <p className="font-mono text-[9px] text-muted-foreground text-center">
                  Secure RBAC link: assignment will be pushed to{" "}
                  <span className="text-tactical-cyan font-bold">{groups.find((t) => t.id === selectedGroup)?.callsign} only</span>.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MAXIMIZED DETAIL CARD MODAL ── */}
      {showMaximizedDetail && activeIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowMaximizedDetail(false)}
          />
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-card border border-border/60 rounded-xl overflow-hidden shadow-2xl flex flex-col z-10 fade-in-up">
            {/* Header */}
            <div className={`px-5 py-3.5 border-b border-border/50 flex items-center justify-between shrink-0 ${
              activeIncident.status === "resolved" ? "bg-tactical-green/5" : "bg-tactical-red/5"
            }`}>
              <div className="flex items-center gap-2">
                {activeIncident.status === "resolved" ? (
                  <CheckCircle2 className="h-4 w-4 text-tactical-green" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-tactical-red blink" />
                )}
                <div>
                  <span className="font-mono text-sm font-bold tracking-wide block">
                    MAXIMIZED CASE FILE — {activeIncident.id}
                  </span>
                  <span className="font-mono text-[9.5px] text-muted-foreground">
                    Incident Type: {activeIncident.type} · Location: {activeIncident.site}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-mono text-[9px] tracking-wider px-2 py-0.5 rounded border ${
                  incidentStatusConfig[activeIncident.status].bg
                } ${incidentStatusConfig[activeIncident.status].color} ${
                  incidentStatusConfig[activeIncident.status].border
                }`}>
                  {incidentStatusConfig[activeIncident.status].label}
                </span>
                <button
                  onClick={() => setShowMaximizedDetail(false)}
                  className="p-1 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            {activeIncident.kind === "stolen_vehicle" || activeIncident.id === "EVT-205" ? (
              /* Stolen Vehicle / Suspect Haroon Maximized Detail Card - Matches Command Center layout */
              <div className="flex-1 overflow-y-auto p-6 space-y-5 font-mono text-xs bg-secondary/15">
                {/* Top Row: Split 50/50 */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_150px] gap-5">
                  {/* Left Side: Basic Info */}
                  <div className="space-y-4">
                    {/* Status and Zone */}
                    <div className="flex flex-wrap gap-2.5">
                      <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-1 rounded-md border ${incidentStatusConfig[activeIncident.status].bg} ${incidentStatusConfig[activeIncident.status].color} ${incidentStatusConfig[activeIncident.status].border} uppercase tracking-wider`}>
                        {(() => {
                          const StatusIcon = incidentStatusConfig[activeIncident.status].icon;
                          return <StatusIcon className="h-3 w-3" />;
                        })()}
                        {incidentStatusConfig[activeIncident.status].label}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-1 rounded-md border bg-secondary/40 border-border uppercase tracking-wider ${zoneMeta[activeIncident.zone].color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${zoneMeta[activeIncident.zone].dot}`} />
                        {activeIncident.zone}
                      </span>
                    </div>

                    {/* Details Table */}
                    <div className="space-y-0 rounded-xl border border-border/40 overflow-hidden bg-card font-mono text-xs">
                      {[
                        { label: "Site Location", value: activeIncident.site },
                        { label: "Reporting Cam", value: activeIncident.camera },
                        { label: "Report Time", value: activeIncident.reported },
                        { label: "Required Capability", value: activeIncident.requiredCap.toUpperCase() },
                      ].map(({ label, value }, i, arr) => (
                        <div key={label} className={`flex items-center justify-between px-4 py-2.5 ${i !== arr.length - 1 ? "border-b border-border/20" : ""}`}>
                          <span className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</span>
                          <span className="font-semibold text-foreground text-right">{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Suspect Meta or Plate/Vehicle specs */}
                    {activeIncident.kind === "flagged_person" ? (
                      <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                        <div className="bg-card border border-border/40 p-2.5 rounded">
                          <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">SUSPECT NAME</span>
                          <span className="font-bold text-foreground text-xs">{detail?.personName}</span>
                        </div>
                        <div className="bg-card border border-border/40 p-2.5 rounded">
                          <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">CNIC ID NUMBER</span>
                          <span className="font-bold text-tactical-red text-xs tracking-widest">61101-9876543-1</span>
                        </div>
                        <div className="bg-card border border-border/40 p-2.5 rounded">
                          <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">NATIONALITY</span>
                          <span className="font-bold text-foreground text-xs">{detail?.nationality}</span>
                        </div>
                        <div className="bg-card border border-border/40 p-2.5 rounded">
                          <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">PASSPORT</span>
                          <span className="font-bold text-tactical-cyan text-xs">{detail?.passport}</span>
                        </div>
                        <div className="bg-card border border-border/40 p-2.5 rounded col-span-2">
                          <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">MATCH DETAILS & THREAT</span>
                          <div className="flex justify-between items-center mt-0.5">
                            <span className="text-tactical-red font-bold text-[10px]">{detail?.threatLevel} THREAT</span>
                            <span className="text-tactical-amber font-bold text-[10px]">{detail?.confidence}% MATCH</span>
                          </div>
                          <span className="text-muted-foreground text-[10px] block mt-1">{detail?.flagReason}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                        <div className="bg-card border border-border/40 p-2.5 rounded">
                          <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">LICENSE PLATE</span>
                          <span className="font-bold text-tactical-red text-xs tracking-widest">{detail?.plate}</span>
                        </div>
                        <div className="bg-card border border-border/40 p-2.5 rounded">
                          <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">VEHICLE</span>
                          <span className="font-bold text-foreground">{detail?.vehicleDesc}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Images */}
                  <div className="flex flex-col gap-3 self-start">
                    {activeIncident.kind === "flagged_person" ? (
                      <>
                        {/* Face Image */}
                        <div 
                          onClick={() => setZoomedImage("/suspect_face.jpg")}
                          className="relative aspect-[4/3] rounded-lg overflow-hidden border border-tactical-red/35 bg-black group shadow-md cursor-zoom-in hover:border-tactical-red/60 transition-all duration-300"
                        >
                          <img 
                            src="/suspect_face.jpg" 
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
                          onClick={() => setZoomedImage("/suspect_cnic.jpg")}
                          className="relative aspect-[4/3] rounded-lg overflow-hidden border border-tactical-red/35 bg-black group shadow-md cursor-zoom-in hover:border-tactical-red/60 transition-all duration-300"
                        >
                          <img 
                            src="/suspect_cnic.jpg" 
                            alt="CNIC Database" 
                            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-tactical-green text-white text-[7px] font-bold font-mono tracking-widest">
                            CNIC COPY
                          </div>
                        </div>
                      </>
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

                {/* FIR/Warrant Info Section */}
                {detail?.firImage && (
                  <div
                    onClick={() => setShowFirDetail(true)}
                    className="flex gap-3 p-3 rounded-lg bg-tactical-red/5 border border-tactical-red/25 cursor-pointer hover:border-tactical-red/50 transition-colors group"
                  >
                    <div className="relative h-16 w-12 rounded overflow-hidden border border-border shrink-0 bg-black">
                      <img src={detail.firImage} alt="Scanned Document" className="h-full w-full object-cover opacity-90" />
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-tactical-green/80 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0 font-mono">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FileText className="h-3.5 w-3.5 text-tactical-red" />
                        <span className="text-[10px] font-bold text-tactical-red tracking-wider">
                          {activeIncident.kind === "flagged_person" ? "ARREST WARRANT — SCANNED DOCUMENT" : "FIR MATCH — SCANNED DOCUMENT"}
                        </span>
                      </div>
                      <p className="text-[9px] text-muted-foreground leading-relaxed font-mono">
                        {activeIncident.kind === "flagged_person" ? (
                          <>
                            Warrant No. <span className="text-foreground font-bold">{detail.firNo}</span> · PS Bhara Kahu
                            <br />Date Issued {detail.firDate} · Suspect <span className="text-tactical-red font-bold">{detail.personName}</span>
                          </>
                        ) : (
                          <>
                            FIR No. <span className="text-foreground font-bold">{detail.firNo}</span> · PS Airport, Rawalpindi
                            <br />Dated {detail.firDate} · Plate <span className="text-tactical-red font-bold">{detail.plate}</span>
                          </>
                        )}
                      </p>
                      <span className="text-[8px] text-tactical-cyan tracking-widest uppercase group-hover:underline">
                        Click to view scanned {activeIncident.kind === "flagged_person" ? "Warrant" : "FIR"} →
                      </span>
                    </div>
                  </div>
                )}

                {/* Video Section */}
                {activeIncident.videoSrc && (
                  <div className="space-y-2">
                    <span className="block font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Live Surveillance Feed</span>
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border/50 bg-black">
                      <video src={activeIncident.videoSrc} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/60 border border-white/10 backdrop-blur-md text-[8px] font-mono font-bold tracking-widest text-tactical-red flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-tactical-red blink" />
                        {activeIncident.camera}
                      </div>
                    </div>
                  </div>
                )}

                {/* Incident description details */}
                <div className="bg-card border border-border/40 p-4 rounded-lg space-y-1">
                  <span className="block text-[9px] text-muted-foreground uppercase mb-1">Incident Overview / Action Description</span>
                  <p className="text-foreground/90 leading-relaxed font-mono">{activeIncident.description}</p>
                </div>

                {/* Responding Force & Workflow Sequence details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Responding Unit Detail */}
                  {assignedUnit ? (
                    <div className="rounded-lg bg-card border border-border/40 p-4 space-y-2">
                      <span className="block font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Assigned Respond Force</span>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-tactical-cyan/10 border border-tactical-cyan/30 flex items-center justify-center shrink-0">
                          {assignedUnit.unitType === "officer" ? (
                            <User className="h-5 w-5 text-tactical-cyan" />
                          ) : (
                            <Car className="h-5 w-5 text-tactical-cyan" />
                          )}
                        </div>
                        <div className="font-mono text-xs flex-1">
                          <p className="font-bold">{assignedUnit.callsign} <span className="text-muted-foreground font-normal">· {assignedUnit.name}</span></p>
                          <p className="text-[10px] text-muted-foreground">
                            {assignedUnit.unitType === "officer" ? assignedUnit.rank : assignedUnit.vehicle} · {assignedUnit.status}
                          </p>
                        </div>
                        <span className="font-mono text-[8px] tracking-wider px-2 py-0.5 rounded bg-tactical-cyan/15 text-tactical-cyan border border-tactical-cyan/40">
                          RESPONDING
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-card border border-border/40 p-4 text-center py-6 font-mono text-xs text-muted-foreground">
                      <ShieldAlert className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                      No unit assigned yet.
                    </div>
                  )}

                  {/* Workflow Sequence */}
                  <div className="rounded-lg bg-card border border-border/40 p-4 space-y-2">
                    <span className="block font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Resolution Workflow Sequence</span>
                    <div className="space-y-1.5">
                      {[
                        { label: "Capture (CCTV)", step: 0 },
                        { label: "Match (FIR/Watchlist)", step: 1 },
                        { label: "Zone Lookup", step: 2 },
                        { label: "Resolution (Unit)", step: 3 },
                        { label: "Response", step: 4 },
                        { label: "Resolved", step: 5 },
                      ].map((s) => {
                        const currentStep =
                          activeIncident.status === "pending" ? 2
                          : activeIncident.status === "dispatched" ? 4
                          : activeIncident.status === "on_scene" ? 4
                          : 5;
                        const isActive = s.step <= currentStep;
                        return (
                          <div key={s.label} className="flex items-center justify-between font-mono text-xs">
                            <span className={isActive ? "text-tactical-green" : "text-muted-foreground"}>{s.label}</span>
                            <span className={`text-[10px] font-bold ${isActive ? "text-tactical-green" : "text-muted-foreground"}`}>
                              {isActive ? "✓ Done" : "Awaiting"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Content Body - Dual Column for other incident types */
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-secondary/15">
                {/* Left Column: Video stream, FIR profiles, details */}
                <div className="space-y-4">
                  {activeIncident.videoSrc && (
                    <div className="space-y-2">
                      <span className="block font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Live Surveillance Feed</span>
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border/50 bg-black">
                        <video src={activeIncident.videoSrc} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/60 border border-white/10 backdrop-blur-md text-[8px] font-mono font-bold tracking-widest text-tactical-red flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-tactical-red blink" />
                          {activeIncident.camera}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg bg-card border border-border/40 p-4 space-y-2">
                    <span className="block font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Case Description</span>
                    <p className="font-mono text-xs leading-relaxed text-foreground/80">{activeIncident.description}</p>
                  </div>



                  {/* FIA Profile if Flagged Person */}
                  {activeIncident.kind === "flagged_person" && detail && (
                    <div className="rounded-lg bg-tactical-red/5 border border-tactical-red/25 p-4 flex gap-4">
                      <div className="h-16 w-16 rounded-md bg-secondary border border-border flex items-center justify-center shrink-0">
                        <User className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div className="font-mono text-[10px] space-y-1 flex-1">
                        <span className="block font-bold text-tactical-red text-[9px]">FIA WATCHLIST MATCH</span>
                        <p><span className="text-muted-foreground">Name:</span> {detail.personName} ({detail.personId})</p>
                        <p><span className="text-muted-foreground">Passport:</span> {detail.passport} ({detail.nationality})</p>
                        <p><span className="text-muted-foreground">Reason:</span> <span className="text-tactical-red font-bold">{detail.flagReason}</span></p>
                        <p><span className="text-muted-foreground">Confidence:</span> <span className="text-tactical-red font-bold">{detail.confidence}%</span></p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: GPS Grid, Response Team Status, and Action shortcuts */}
                <div className="space-y-4">
                  <div className="rounded-lg bg-card border border-border/40 p-4 space-y-3">
                    <span className="block font-mono text-[9px] text-muted-foreground tracking-widest uppercase">GPS Location Grid</span>
                    <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                      <div className="bg-secondary/40 rounded px-2.5 py-1.5">
                        <span className="text-muted-foreground block text-[9px]">ZONE</span>
                        <span className={`font-bold ${zoneMeta[activeIncident.zone].color}`}>{activeIncident.zone}</span>
                      </div>
                      <div className="bg-secondary/40 rounded px-2.5 py-1.5">
                        <span className="text-muted-foreground block text-[9px]">CO CCTV</span>
                        <span>{activeIncident.camera}</span>
                      </div>
                      <div className="bg-secondary/40 rounded px-2.5 py-1.5">
                        <span className="text-muted-foreground block text-[9px]">LATITUDE</span>
                        <span>{activeIncident.lat.toFixed(6)}°</span>
                      </div>
                      <div className="bg-secondary/40 rounded px-2.5 py-1.5">
                        <span className="text-muted-foreground block text-[9px]">LONGITUDE</span>
                        <span>{activeIncident.lng.toFixed(6)}°</span>
                      </div>
                    </div>
                  </div>

                  {/* Responding Unit Detail */}
                  {assignedUnit ? (
                    <div className="rounded-lg bg-card border border-border/40 p-4 space-y-2">
                      <span className="block font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Assigned Respond Force</span>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-tactical-cyan/10 border border-tactical-cyan/30 flex items-center justify-center shrink-0">
                          {assignedUnit.unitType === "officer" ? (
                            <User className="h-5 w-5 text-tactical-cyan" />
                          ) : (
                            <Car className="h-5 w-5 text-tactical-cyan" />
                          )}
                        </div>
                        <div className="font-mono text-xs flex-1">
                          <p className="font-bold">{assignedUnit.callsign} <span className="text-muted-foreground font-normal">· {assignedUnit.name}</span></p>
                          <p className="text-[10px] text-muted-foreground">
                            {assignedUnit.unitType === "officer" ? assignedUnit.rank : assignedUnit.vehicle} · {assignedUnit.status}
                          </p>
                        </div>
                        <span className="font-mono text-[8px] tracking-wider px-2 py-0.5 rounded bg-tactical-cyan/15 text-tactical-cyan border border-tactical-cyan/40">
                          RESPONDING
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-card border border-border/40 p-4 text-center py-6 font-mono text-xs text-muted-foreground">
                      <ShieldAlert className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                      No unit assigned yet.
                    </div>
                  )}

                  {/* Timeline flow */}
                  <div className="rounded-lg bg-card border border-border/40 p-4 space-y-2">
                    <span className="block font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Resolution Workflow Sequence</span>
                    <div className="space-y-1.5">
                      {[
                        { label: "Capture (CCTV)", step: 0 },
                        { label: "Match (FIR/Watchlist)", step: 1 },
                        { label: "Zone Lookup", step: 2 },
                        { label: "Resolution (Unit)", step: 3 },
                        { label: "Response", step: 4 },
                        { label: "Resolved", step: 5 },
                      ].map((s) => {
                        const currentStep =
                          activeIncident.status === "pending" ? 2
                          : activeIncident.status === "dispatched" ? 4
                          : activeIncident.status === "on_scene" ? 4
                          : 5;
                        const isActive = s.step <= currentStep;
                        return (
                          <div key={s.label} className="flex items-center justify-between font-mono text-xs">
                            <span className={isActive ? "text-tactical-green" : "text-muted-foreground"}>{s.label}</span>
                            <span className={`text-[10px] font-bold ${isActive ? "text-tactical-green" : "text-muted-foreground"}`}>
                              {isActive ? "✓ Done" : "Awaiting"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="px-5 py-4 border-t border-border/50 bg-secondary/30 shrink-0 flex gap-3">
              {activeIncident.status === "pending" && (
                <button
                  onClick={() => {
                    setShowResolution(true);
                    setShowMaximizedDetail(false);
                  }}
                  className="flex-1 py-3 rounded-lg font-mono text-xs tracking-widest uppercase font-bold bg-tactical-green text-[#06080D] hover:bg-tactical-green/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Dispatch Response Team
                </button>
              )}
              {activeIncident.status !== "resolved" && activeIncident.status !== "pending" && (
                <button
                  onClick={() => {
                    handleResolve();
                    setShowMaximizedDetail(false);
                  }}
                  className="flex-1 py-3 rounded-lg font-mono text-xs tracking-widest uppercase font-bold bg-tactical-green text-[#06080D] hover:bg-tactical-green/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Case Resolved
                </button>
              )}
              <button
                onClick={() => setShowMaximizedDetail(false)}
                className="px-6 py-3 bg-secondary hover:bg-secondary/70 border border-border text-foreground font-mono text-xs tracking-wider uppercase rounded cursor-pointer"
              >
                Close Case File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FIR/WARRANT SCAN MODAL ── */}
      {showFirDetail && (activeIncident?.kind === "stolen_vehicle" || activeIncident?.id === "EVT-205") && detail?.firImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowFirDetail(false)}
          />
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-card border border-tactical-red/30 rounded-xl overflow-hidden shadow-2xl flex flex-col z-10 fade-in-up">
            <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between bg-tactical-red/10 text-tactical-red shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-mono text-sm font-bold tracking-wide">
                  {activeIncident.kind === "flagged_person" 
                    ? `SCANNED WARRANT — No. ${detail.firNo} · SUSPECT ${detail.personName}` 
                    : `SCANNED FIR — No. ${detail.firNo} · STOLEN VEHICLE ${detail.plate}`
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
              <div className="relative bg-black/60 p-4 flex items-start justify-center">
                <img
                  src={detail.firImage}
                  alt="Scanned Document"
                  className="max-h-[70vh] w-auto rounded border border-border/60 shadow-lg"
                />
                <div className="absolute top-6 left-6 px-2 py-0.5 rounded bg-black/70 border border-tactical-green/40 text-[8px] font-mono font-bold tracking-widest text-tactical-green flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-tactical-green blink" />
                  OCR SCAN COMPLETE
                </div>
              </div>
              {/* Extracted fields */}
              <div className="p-4 space-y-2 border-l border-border/40">
                <p className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground uppercase mb-1">
                  {activeIncident.kind === "flagged_person" ? "Extracted Warrant & CNIC Data" : "Extracted FIR Data"}
                </p>
                {(activeIncident.kind === "flagged_person" ? [
                  ["Suspect Name", detail.personName || ""],
                  ["CNIC Number", "61101-9876543-1"],
                  ["Warrant No.", detail.firNo || ""],
                  ["Date Issued", detail.firDate || ""],
                  ["Issuing Court", "Magistrate Court, Islamabad (ICT)"],
                  ["Jurisdiction", detail.policeStation || ""],
                  ["Charges", detail.flagReason || ""],
                ] : [
                  ["FIR No.", detail.firNo || ""],
                  ["Date Lodged", detail.firDate || ""],
                  ["Police Station", detail.policeStation || ""],
                  ["Complainant", detail.complainant || ""],
                  ["Contact", detail.contact || ""],
                  ["Vehicle", detail.vehicleDesc || ""],
                  ["Registration", detail.plate || ""],
                ]).map(([k, v]) => (
                  <div key={k} className="bg-accent/30 rounded px-2.5 py-1.5 font-mono text-[10px]">
                    <span className="text-muted-foreground block text-[8px] uppercase tracking-wider">{k}</span>
                    <span className={k === "Registration" || k === "CNIC Number" ? "text-tactical-red font-bold tracking-widest" : "text-foreground"}>{v}</span>
                  </div>
                ))}
                <div className="bg-tactical-red/10 border border-tactical-red/30 rounded px-2.5 py-2 font-mono text-[9px] text-tactical-red leading-relaxed">
                  {activeIncident.kind === "flagged_person" 
                    ? `CCTV facial match triggers court warrant No. ${detail.firNo}. Verify identification logs and hold suspect for law enforcement handoff.`
                    : `ANPR plate hit matches this FIR at ${detail.confidence}% confidence. Vehicle reported stolen — intercept and verify chassis number.`
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FEED DETAIL MODAL (zoomed camera view) ── */}
      {showFeedDetail && activeIncident?.videoSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowFeedDetail(false)}
          />
          <div className="relative w-full max-w-2xl bg-card border border-tactical-red/30 rounded-xl overflow-hidden shadow-2xl flex flex-col z-10 fade-in-up">
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-tactical-red/10 text-tactical-red">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                <span className="font-mono text-sm font-bold tracking-wide">
                  {activeIncident.id} — {activeIncident.type} · {activeIncident.camera}
                </span>
              </div>
              <button
                onClick={() => setShowFeedDetail(false)}
                className="p-1 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-tactical-red/30 bg-black">
                <video
                  src={activeIncident.videoSrc}
                  autoPlay loop muted playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded bg-black/60 border border-white/10 backdrop-blur-md text-[10px] font-mono font-bold tracking-widest text-tactical-red flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-tactical-red blink" />
                  {activeIncident.camera} — LIVE
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                {activeIncident.kind === "stolen_vehicle" && detail && (
                  <>
                    <div className="bg-secondary/40 border border-border p-3 rounded-lg">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Vehicle Match</span>
                      <span className="font-bold text-foreground">{detail.vehicleDesc}</span>
                    </div>
                    <div className="bg-secondary/40 border border-border p-3 rounded-lg">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">License Plate</span>
                      <span className="font-bold text-tactical-red tracking-widest">{detail.plate}</span>
                    </div>
                    <div className="bg-secondary/40 border border-border p-3 rounded-lg col-span-2">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Correlation Summary</span>
                      <span className="font-bold text-tactical-amber">
                        Plate matches stolen-vehicle FIR No. {detail.firNo} ({detail.policeStation}, dated {detail.firDate}) at {detail.confidence}% confidence
                      </span>
                    </div>
                  </>
                )}
                {activeIncident.kind === "blacklisted_vehicle" && detail && (
                  <>
                    <div className="bg-secondary/40 border border-border p-3 rounded-lg">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Vehicle Match</span>
                      <span className="font-bold text-foreground">{detail.vehicleDesc}</span>
                    </div>
                    <div className="bg-secondary/40 border border-border p-3 rounded-lg">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">License Plate</span>
                      <span className="font-bold text-tactical-red tracking-widest">{detail.plate}</span>
                    </div>
                    <div className="bg-secondary/40 border border-border p-3 rounded-lg col-span-2">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Correlation Summary</span>
                      <span className="font-bold text-tactical-amber">Plate matches watchlist & occupant matches facial database ({detail.occupantName}, {detail.occupantId})</span>
                    </div>
                  </>
                )}
                {activeIncident.kind === "flagged_person" && detail && (
                  <>
                    <div className="bg-secondary/40 border border-border p-3 rounded-lg">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Subject</span>
                      <span className="font-bold text-tactical-red">{detail.personName} ({detail.personId})</span>
                    </div>
                    <div className="bg-secondary/40 border border-border p-3 rounded-lg">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Passport / Flight</span>
                      <span className="font-bold text-foreground">{detail.passport} · {detail.flight}</span>
                    </div>
                    <div className="bg-secondary/40 border border-border p-3 rounded-lg col-span-2">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Flag Reason</span>
                      <span className="font-bold text-tactical-amber">{detail.flagReason} — {detail.confidence}% facial match</span>
                    </div>
                  </>
                )}
                {activeIncident.kind === "queue_congestion" && detail && (
                  <>
                    <div className="bg-secondary/40 border border-border p-3 rounded-lg">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Passengers In Queue</span>
                      <span className="font-bold text-tactical-amber">{detail.peopleCount} pax (limit {detail.threshold})</span>
                    </div>
                    <div className="bg-secondary/40 border border-border p-3 rounded-lg">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Estimated Wait</span>
                      <span className="font-bold text-foreground">{detail.waitTime}</span>
                    </div>
                    <div className="bg-secondary/40 border border-border p-3 rounded-lg col-span-2">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Location</span>
                      <span className="font-bold text-tactical-amber">{detail.counter}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MANAGE UNITS OVERLAY ── */}
      {showManageGroups && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowManageGroups(false); setAddingGroup(false); }}
          />

          <div className="relative w-full max-w-2xl max-h-[85vh] bg-card border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col mx-4">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-tactical-cyan" />
                <span className="font-mono text-sm font-bold tracking-wide">Manage ASF Units</span>
                <span className="font-mono text-[9px] text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded">
                  {groups.length} units
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAddingGroup(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-tactical-green text-[#06080D] font-mono text-[10px] font-bold tracking-wider hover:bg-tactical-green/90 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  ADD UNIT
                </button>
                <button
                  onClick={() => { setShowManageGroups(false); setAddingGroup(false); }}
                  className="p-1.5 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {addingGroup && (
              <div className="px-5 py-4 border-b border-border/60 bg-secondary/50 shrink-0">
                <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase mb-3">
                  New ASF Unit
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Unit Type
                    </label>
                    <div className="flex gap-1.5">
                      {(["vehicle", "officer"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setNewGroup((p) => ({ ...p, unitType: t }))}
                          className={`flex items-center gap-1.5 font-mono text-[9px] tracking-wider px-3 py-1.5 rounded border transition-colors uppercase ${
                            newGroup.unitType === t
                              ? "bg-tactical-green/15 text-tactical-green border-tactical-green/40"
                              : "text-muted-foreground border-border hover:border-muted-foreground/40"
                          }`}
                        >
                          {t === "vehicle" ? <Car className="h-3 w-3" /> : <User className="h-3 w-3" />}
                          {t === "vehicle" ? "Patrol Vehicle" : "Officer (On Foot)"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                      {newGroup.unitType === "officer" ? "Officer Name *" : "Unit Name *"}
                    </label>
                    <input
                      type="text"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup((p) => ({ ...p, name: e.target.value }))}
                      placeholder={newGroup.unitType === "officer" ? "e.g. Constable Adnan" : "e.g. ASF Foxtrot"}
                      className="w-full px-3 py-2 rounded-md bg-card border border-border text-xs font-mono placeholder:text-muted-foreground/40 focus:border-tactical-green/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                      Callsign *
                    </label>
                    <input
                      type="text"
                      value={newGroup.callsign}
                      onChange={(e) => setNewGroup((p) => ({ ...p, callsign: e.target.value.toUpperCase() }))}
                      placeholder="e.g. FOXTROT-1"
                      className="w-full px-3 py-2 rounded-md bg-card border border-border text-xs font-mono placeholder:text-muted-foreground/40 focus:border-tactical-green/50 focus:outline-none"
                    />
                  </div>
                  {newGroup.unitType === "vehicle" && (
                    <>
                      <div>
                        <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                          Vehicle
                        </label>
                        <input
                          type="text"
                          value={newGroup.vehicle}
                          onChange={(e) => setNewGroup((p) => ({ ...p, vehicle: e.target.value }))}
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
                          value={newGroup.personnel}
                          onChange={(e) => setNewGroup((p) => ({ ...p, personnel: e.target.value }))}
                          placeholder="4"
                          min="1"
                          max="20"
                          className="w-full px-3 py-2 rounded-md bg-card border border-border text-xs font-mono placeholder:text-muted-foreground/40 focus:border-tactical-green/50 focus:outline-none"
                        />
                      </div>
                    </>
                  )}
                  <div className="col-span-2">
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Zone
                    </label>
                    <div className="flex gap-1.5">
                      {(["Zone A", "Zone B", "Zone C"] as const).map((z) => (
                        <button
                          key={z}
                          onClick={() => setNewGroup((p) => ({ ...p, zone: p.zone === z ? "" : z }))}
                          className={`flex items-center gap-1.5 font-mono text-[9px] tracking-wider px-3 py-1.5 rounded border transition-colors uppercase ${
                            newGroup.zone === z
                              ? "bg-tactical-green/15 text-tactical-green border-tactical-green/40"
                              : "text-muted-foreground border-border hover:border-muted-foreground/40"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${zoneMeta[z].dot}`} />
                          {z}
                        </button>
                      ))}
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
                            newGroup.capabilities.includes(cap)
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
                    onClick={handleAddGroup}
                    disabled={!newGroup.name || !newGroup.callsign}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-mono text-[10px] font-bold tracking-wider transition-colors ${
                      newGroup.name && newGroup.callsign
                        ? "bg-tactical-green text-[#06080D] hover:bg-tactical-green/90"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    CREATE UNIT
                  </button>
                  <button
                    onClick={() => setAddingGroup(false)}
                    className="px-4 py-2 rounded-md font-mono text-[10px] tracking-wider text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground/40 transition-colors"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border/60">
                    {["Type", "Callsign", "Vehicle/Rank", "Crew", "Zone", "Capabilities", "Status", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.id} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-2.5">
                        {group.unitType === "officer" ? (
                          <User className="h-3.5 w-3.5 text-tactical-cyan" />
                        ) : (
                          <Car className="h-3.5 w-3.5 text-tactical-green" />
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-[11px] font-bold block">{group.callsign}</span>
                        <span className="font-mono text-[9px] text-muted-foreground">{group.name}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">
                        {group.unitType === "officer" ? group.rank || "Officer" : group.vehicle}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground text-center">{group.personnel}</td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">{group.zone}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {group.capabilities.map((cap) => (
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
                                setGroups((prev) =>
                                  prev.map((t) =>
                                    t.id === group.id ? { ...t, status: s } : t
                                  )
                                )
                              }
                              className={`font-mono text-[8px] tracking-wider px-1.5 py-1 rounded border transition-colors capitalize ${
                                group.status === s
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
                          onClick={() => handleRemoveGroup(group.id)}
                          className="p-1 rounded hover:bg-tactical-red/10 text-muted-foreground/40 hover:text-tactical-red transition-colors"
                          title="Remove unit"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {groups.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <Users className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="font-mono text-xs text-muted-foreground">No units registered. Add a unit to get started.</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border/60 bg-secondary/30 shrink-0">
              <p className="font-mono text-[9px] text-muted-foreground/60">
                Units are stored in-app. Add, remove, and manage ASF vehicles and officers from this panel.
              </p>
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
