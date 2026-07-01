"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAlerts } from "@/components/alert-context";
import { useASF, type IncidentStatus, type ASFGroup } from "@/components/asf-context";
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

/* Types re-exported from context */

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

export default function ASFPage() {
  const { addAlert } = useAlerts();
  const { groups, setGroups, incidents, setIncidents } = useASF();
  const [mounted, setMounted] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [incidentFilter, setIncidentFilter] = useState<string>("all");
  const [showManageGroups, setShowManageGroups] = useState(false);
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    callsign: "",
    vehicle: "",
    personnel: "4",
    zone: "",
    capabilities: [] as string[],
    lat: "33.70",
    lng: "73.06",
  });

  useEffect(() => setMounted(true), []);

  const activeIncident = incidents.find((inc) => inc.id === selectedIncident) || null;

  const activeZone = activeIncident ? (activeIncident.site.includes("Zone A") ? "Zone A" : activeIncident.site.includes("Zone C") ? "Zone C" : "Zone B") : "Unassigned";

  /* rank groups by distance + capability for selected incident */
  const rankedGroups = activeIncident
    ? [...groups]
        .filter((t) => t.capabilities.includes(activeIncident.requiredCap))
        .map((t) => ({
          ...t,
          distance: haversine(t.lat, t.lng, activeIncident.lat, activeIncident.lng),
          eta: Math.round(
            (haversine(t.lat, t.lng, activeIncident.lat, activeIncident.lng) / 40) * 60
          ),
          isSameZone: t.zone === activeZone
        }))
        .sort((a, b) => {
          if (a.isSameZone && !b.isSameZone) return -1;
          if (!a.isSameZone && b.isSameZone) return 1;
          return a.distance - b.distance;
        })
    : [];

  const handleDispatch = useCallback(() => {
    if (!selectedGroup || !selectedIncident) return;
    const inc = incidents.find((i) => i.id === selectedIncident);
    const group = groups.find((t) => t.id === selectedGroup);
    if (!inc || !group) return;

    setIncidents((prev) =>
      prev.map((i) =>
        i.id === selectedIncident
          ? { ...i, status: "dispatched" as IncidentStatus, assignedGroup: selectedGroup }
          : i
      )
    );
    setGroups((prev) =>
      prev.map((t) =>
        t.id === selectedGroup ? { ...t, status: "en_route" } : t
      )
    );

    // Auto-alert: notify Duty Manager about dispatch
    addAlert({
      type: "incident",
      priority: inc.typeCode === "red" || inc.typeCode === "black" ? "critical" : "high",
      recipient: "Duty Manager",
      recipientPhone: "+92 300 1234567",
      message: `DISPATCH: ${inc.id} — ${inc.type} at ${inc.site}. ${group.name} (${group.callsign}) dispatched. ETA ${Math.round((haversine(group.lat, group.lng, inc.lat, inc.lng) / 40) * 60)} min.`,
      triggeredBy: "MOD-01 (ASF Auto)",
    });

    // Auto-alert: notify group lead
    addAlert({
      type: "incident",
      priority: inc.typeCode === "red" || inc.typeCode === "black" ? "critical" : "high",
      recipient: `${group.callsign} Lead`,
      recipientPhone: "+92 301 XXXXXXX",
      message: `RESPOND: ${inc.id} at ${inc.site}. ${inc.description}. Respond immediately.`,
      triggeredBy: "MOD-01 (ASF Auto)",
    });
  }, [selectedGroup, selectedIncident, incidents, groups, addAlert]);

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
    // Free the assigned group
    if (inc.assignedGroup) {
      setGroups((prev) =>
        prev.map((t) =>
          t.id === inc.assignedGroup ? { ...t, status: "available" } : t
        )
      );
    }
    setSelectedGroup(null);

    // Auto-alert: notify about resolution
    addAlert({
      type: "incident",
      priority: "normal",
      recipient: "Duty Manager",
      recipientPhone: "+92 300 1234567",
      message: `RESOLVED: ${inc.id} — ${inc.type} at ${inc.site} has been resolved. ${inc.assignedGroup ? `Group ${inc.assignedGroup} released back to available.` : ""}`,
      triggeredBy: "MOD-01 (ASF Auto)",
    });
  }, [selectedIncident, incidents, addAlert]);

  const handleAddGroup = useCallback(() => {
    if (!newGroup.name || !newGroup.callsign) return;
    const id = `ASF-${String.fromCharCode(65 + groups.length)}`;
    setGroups((prev) => [
      ...prev,
      {
        id,
        name: newGroup.name,
        callsign: newGroup.callsign,
        capabilities: newGroup.capabilities.length > 0 ? newGroup.capabilities : ["patrol"],
        vehicle: newGroup.vehicle || "Vehicle TBD",
        personnel: parseInt(newGroup.personnel) || 4,
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
    setNewGroup({ name: "", callsign: "", vehicle: "", personnel: "4", zone: "", capabilities: [], lat: "33.5510", lng: "72.8300" });
    setAddingGroup(false);
  }, [newGroup, groups.length]);

  const handleRemoveGroup = useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((t) => t.id !== groupId));
    if (selectedGroup === groupId) setSelectedGroup(null);
  }, [selectedGroup]);

  const toggleCapability = (cap: string) => {
    setNewGroup((prev) => ({
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
            <h1 className="text-xl font-bold tracking-tight">ASF Zone Assignment</h1>
            <p className="text-xs text-muted-foreground font-mono">
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManageGroups(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-tactical-cyan/10 border border-tactical-cyan/30 text-tactical-cyan font-mono text-[10px] tracking-wide hover:bg-tactical-cyan/20 transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            MANAGE TEAMS ({groups.length})
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

      {/* Main 3-column layout: Incidents | Map | Group Panel */}
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
                      setSelectedGroup(null);
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
                    {inc.assignedGroup && (
                      <div className="mt-1.5 flex items-center gap-1 font-mono text-[9px]">
                        <ShieldCheck className="h-2.5 w-2.5 text-tactical-cyan" />
                        <span className="text-tactical-cyan">
                          Assigned: {groups.find((t) => t.id === inc.assignedGroup)?.callsign || inc.assignedGroup}
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
                GPS LIVE
              </span>
              <Signal className="h-3 w-3 text-tactical-green blink" />
            </div>
          </div>

          {/* Leaflet Map area */}
          <div className="relative w-full" style={{ height: "520px" }}>
            <TacticalMap
              groups={groups.map((t) => ({
                id: t.id,
                callsign: t.callsign,
                lat: t.lat,
                lng: t.lng,
                status: t.status,
                heading: t.heading,
                vehicle: t.vehicle,
                personnel: t.personnel,
                driver: t.driver,
                assignedTo: t.assignedTo,
                destination: t.destination,
                eta: t.eta,
              }))}
              incident={{
                id: mapIncident.id,
                type: mapIncident.type,
                lat: mapIncident.lat,
                lng: mapIncident.lng,
              }}
              selectedGroup={selectedGroup}
              onSelectGroup={setSelectedGroup}
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

        {/* ── RIGHT PANEL: Incident Detail + Group Dispatch ── */}
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
                      <span className="text-muted-foreground block">ZONE</span>
                      <span className="text-foreground">{activeZone}</span>
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

              {/* Group selection — only show if incident is not resolved */}
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
                      {activeIncident.status === "pending" ? "Select Group (by distance)" : "Assigned Group"}
                    </span>
                  </div>
                  <div className="divide-y divide-border/30 max-h-[220px] overflow-y-auto">
                    {rankedGroups.length > 0 ? rankedGroups.map((group, i) => (
                      <div
                        key={group.id}
                        className={`px-4 py-2.5 cursor-pointer transition-all ${
                          selectedGroup === group.id
                            ? "bg-tactical-green/5 border-l-2 border-l-tactical-green"
                            : "hover:bg-accent/20 border-l-2 border-l-transparent"
                        } ${activeIncident.status !== "pending" && group.id !== activeIncident.assignedGroup ? "opacity-30 pointer-events-none" : ""}`}
                        onClick={() => {
                          if (activeIncident.status === "pending") setSelectedGroup(group.id);
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-muted-foreground w-4">#{i + 1}</span>
                            <span className="font-mono text-xs font-bold">{group.callsign}</span>
                            <div className={`h-1.5 w-1.5 rounded-full ${statusBg[group.status] || "bg-muted"}`} />
                            {group.isSameZone && (
                              <span className="ml-2 font-mono text-[8px] tracking-wider px-1.5 py-0.5 rounded bg-tactical-cyan/15 text-tactical-cyan border border-tactical-cyan/40">
                                IN ZONE
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-tactical-cyan">{group.distance.toFixed(2)} km</span>
                        </div>
                        <div className="flex items-center gap-3 ml-6 text-[9px] font-mono text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />ETA ~{group.eta} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="h-2.5 w-2.5" />{group.vehicle}
                          </span>
                          <span className={`capitalize ${statusColors[group.status] || ""}`}>
                            {group.status.replace("_", " ")}
                          </span>
                        </div>

                        {/* GPS readout for selected */}
                        {selectedGroup === group.id && (
                          <div className="mt-2 ml-6 p-2 rounded bg-secondary border border-border/50">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-mono">
                              <div>
                                <span className="text-muted-foreground">LAT </span>
                                <span className="text-tactical-green tabular-nums">{group.lat.toFixed(6)}°</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">LNG </span>
                                <span className="text-tactical-green tabular-nums">{group.lng.toFixed(6)}°</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">HDG </span>
                                <span className="text-foreground">{group.heading}°</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">UPD </span>
                                <span className={group.lastUpdate > 100 ? "text-tactical-amber" : "text-foreground"}>
                                  {group.lastUpdate}s ago
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
                          No capable groups available for this incident type.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {/* Dispatch — only for pending incidents with a selected group */}
                {activeIncident.status === "pending" && (
                  <button
                    onClick={handleDispatch}
                    disabled={!selectedGroup}
                    className={`w-full py-3 rounded-lg font-mono text-xs tracking-widest uppercase font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedGroup
                        ? "bg-tactical-green text-[#06080D] hover:bg-tactical-green/90 pulse-glow cursor-pointer"
                        : "bg-muted text-muted-foreground border border-border cursor-not-allowed"
                    }`}
                  >
                    <Send className="h-4 w-4" />
                    {selectedGroup
                      ? `Dispatch ${groups.find((t) => t.id === selectedGroup)?.callsign}`
                      : "Select a group to dispatch"}
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
                  ASF Zone Assignment Flow
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { label: "Capture (Vehicle+Face)", step: 0 },
                    { label: "Enrich (Zone Lookup)", step: 1 },
                    { label: "Enrich (Group Search)", step: 2 },
                    { label: "Alert Dispatch", step: 3 },
                    { label: "Respond (On Scene)", step: 4 },
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
                Select an incident from the left panel to view details, dispatch a group, or mark it resolved.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── MANAGE TEAMS OVERLAY ── */}
      {showManageGroups && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowManageGroups(false); setAddingGroup(false); }}
          />

          {/* Panel */}
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-card border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col mx-4">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-tactical-cyan" />
                <span className="font-mono text-sm font-bold tracking-wide">Manage ASF Groups</span>
                <span className="font-mono text-[9px] text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded">
                  {groups.length} groups
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAddingGroup(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-tactical-green text-[#06080D] font-mono text-[10px] font-bold tracking-wider hover:bg-tactical-green/90 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  ADD TEAM
                </button>
                <button
                  onClick={() => { setShowManageGroups(false); setAddingGroup(false); }}
                  className="p-1.5 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Add group form */}
            {addingGroup && (
              <div className="px-5 py-4 border-b border-border/60 bg-secondary/50 shrink-0">
                <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase mb-3">
                  New ASF Group
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. ASF Foxtrot"
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
                  <div className="col-span-2">
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                      Zone
                    </label>
                    <input
                      type="text"
                      value={newGroup.zone}
                      onChange={(e) => setNewGroup((p) => ({ ...p, zone: e.target.value }))}
                      placeholder="e.g. Zone A"
                      className="w-full px-3 py-2 rounded-md bg-card border border-border text-xs font-mono placeholder:text-muted-foreground/40 focus:border-tactical-green/50 focus:outline-none"
                    />
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
                    CREATE TEAM
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

            {/* Group list */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border/60">
                    {["ID", "Callsign", "Vehicle", "Crew", "Zone", "Capabilities", "Status", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] tracking-[0.12em] text-muted-foreground uppercase font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.id} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">{group.id}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-[11px] font-bold block">{group.callsign}</span>
                        <span className="font-mono text-[9px] text-muted-foreground">{group.name}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">{group.vehicle}</td>
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
                          title="Remove group"
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
                  <p className="font-mono text-xs text-muted-foreground">No groups registered. Add a group to get started.</p>
                </div>
              )}
            </div>

            {/* Panel footer */}
            <div className="px-5 py-3 border-t border-border/60 bg-secondary/30 shrink-0">
              <p className="font-mono text-[9px] text-muted-foreground/60">
                Groups are stored in-app. Add, remove, and manage ASF groups from this panel.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
