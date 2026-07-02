"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

interface GroupMarker {
  id: string;
  callsign: string;
  lat: number;
  lng: number;
  status: string;
  heading: number;
  unitType?: "vehicle" | "officer";
  rank?: string;
  name?: string;
  vehicle?: string;
  personnel?: number;
  driver?: string;
  assignedTo?: string;
  destination?: string;
  eta?: string;
}

interface IncidentMarker {
  id: string;
  type: string;
  typeCode?: string;
  status?: string;
  lat: number;
  lng: number;
}

interface TacticalMapProps {
  groups: GroupMarker[];
  incidents: IncidentMarker[];
  selectedGroup: string | null;
  selectedIncident?: string | null;
  onSelectGroup: (id: string) => void;
  onSelectIncident?: (id: string) => void;
  fitAllZones?: boolean;
  activeZone?: string;
}

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

// Unique body color per unit slot (index-based)
const GROUP_COLORS = [
  "#26C6DA", // teal
  "#EF5350", // red
  "#42A5F5", // blue
  "#FFA726", // orange
  "#AB47BC", // purple
  "#66BB6A", // green
  "#EC407A", // pink
  "#8D6E63", // brown
];

/* Zone polygons (approximated for Islamabad Airport) */
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

export default function TacticalMap({
  groups,
  incidents,
  selectedGroup,
  selectedIncident,
  onSelectGroup,
  onSelectIncident,
  fitAllZones = false,
  activeZone = "all",
}: TacticalMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const groupMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const incidentMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const routeLineRef = useRef<L.Polyline | null>(null);
  const zonesRef = useRef<Record<string, L.Polygon>>({});
  const cssLoadedRef = useRef(false);

  /** Top-down car icon — unique team color body, proper car silhouette with curves. */
  const getVehicleIcon = (groupColor: string, statusColor: string, heading: number, selected: boolean) => {
    const w = selected ? 20 : 16;
    const h = selected ? 34 : 28;
    const scale = selected ? 1.06 : 1;
    return L.divIcon({
      className: "qrf-vehicle-marker",
      html: `
        <div class="qrf-vehicle-wrap" style="width:${w}px;height:${h}px;transform:rotate(${heading}deg) scale(${scale});filter:drop-shadow(0 4px 10px rgba(0,0,0,0.5));">
          <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 32 52" style="display:block;overflow:visible;">
            <!-- Drop shadow -->
            <ellipse cx="17" cy="28" rx="13" ry="22" fill="rgba(0,0,0,0.22)" transform="translate(1,2)"/>

            <!-- Wheel wells (dark cutouts behind body) -->
            <ellipse cx="4.5" cy="13" rx="4"  ry="5.5" fill="#1a1a1a"/>
            <ellipse cx="27.5" cy="13" rx="4" ry="5.5" fill="#1a1a1a"/>
            <ellipse cx="4.5" cy="39" rx="4"  ry="5.5" fill="#1a1a1a"/>
            <ellipse cx="27.5" cy="39" rx="4" ry="5.5" fill="#1a1a1a"/>

            <!-- Wheels -->
            <ellipse cx="4.5" cy="13" rx="3"  ry="4.5" fill="#2a2a2a"/>
            <ellipse cx="27.5" cy="13" rx="3" ry="4.5" fill="#2a2a2a"/>
            <ellipse cx="4.5" cy="39" rx="3"  ry="4.5" fill="#2a2a2a"/>
            <ellipse cx="27.5" cy="39" rx="3" ry="4.5" fill="#2a2a2a"/>
            <!-- Hub caps -->
            <ellipse cx="4.5" cy="13" rx="1.2" ry="1.8" fill="#555"/>
            <ellipse cx="27.5" cy="13" rx="1.2" ry="1.8" fill="#555"/>
            <ellipse cx="4.5" cy="39" rx="1.2" ry="1.8" fill="#555"/>
            <ellipse cx="27.5" cy="39" rx="1.2" ry="1.8" fill="#555"/>

            <!-- Car body -->
            <path d="
              M16 2
              C 22 2, 27 5, 28 9
              L 28.5 13 L 28.5 16
              L 28 17
              L 28 35
              L 28.5 36 L 28.5 39
              L 28 43
              C 27 47, 22 50, 16 50
              C 10 50, 5 47, 4 43
              L 3.5 39 L 3.5 36
              L 4 35
              L 4 17
              L 3.5 16 L 3.5 13
              L 4 9
              C 5 5, 10 2, 16 2
              Z
            " fill="${groupColor}" stroke="rgba(0,0,0,0.3)" stroke-width="0.8"/>

            <!-- Hood highlight -->
            <path d="M10 3.5 C13 2.5, 19 2.5, 22 3.5 L 24 9 C 21 8, 11 8, 8 9 Z" fill="rgba(255,255,255,0.2)"/>

            <!-- Front windshield -->
            <path d="M8.5 15 C9 13.5, 11 12.5, 16 12.5 C21 12.5, 23 13.5, 23.5 15 L 23.5 22 C23 23, 21 23.5, 16 23.5 C11 23.5, 9 23, 8.5 22 Z" fill="#1a2330" opacity="0.9"/>

            <!-- Cabin roof -->
            <rect x="7" y="24" width="18" height="8" rx="1.5" fill="rgba(255,255,255,0.18)"/>

            <!-- Rear windshield -->
            <path d="M8.5 33 C9 32, 11 31.5, 16 31.5 C21 31.5, 23 32, 23.5 33 L 23.5 40 C23 41, 21 41.5, 16 41.5 C11 41.5, 9 41, 8.5 40 Z" fill="#1a2330" opacity="0.85"/>

            <!-- Trunk highlight -->
            <path d="M10 43 C13 44, 19 44, 22 43 L 24 47 C 21 49, 11 49, 8 47 Z" fill="rgba(255,255,255,0.12)"/>

            <!-- Side mirrors -->
            <path d="M4 17.5 C2.5 17.5, 1 18.5, 1 20 C1 21.5, 2.5 22.5, 4 22.5" fill="${groupColor}" stroke="rgba(0,0,0,0.3)" stroke-width="0.6"/>
            <path d="M28 17.5 C29.5 17.5, 31 18.5, 31 20 C31 21.5, 29.5 22.5, 28 22.5" fill="${groupColor}" stroke="rgba(0,0,0,0.3)" stroke-width="0.6"/>

            <!-- Headlights -->
            <path d="M9 4.5 C11 3.5, 14 3, 16 3 L 16 5 C14 5, 11 5.5, 9.5 6.5 Z" fill="rgba(255,255,200,0.95)"/>
            <path d="M23 4.5 C21 3.5, 18 3, 16 3 L 16 5 C18 5, 21 5.5, 22.5 6.5 Z" fill="rgba(255,255,200,0.95)"/>

            <!-- Tail lights -->
            <path d="M9 47.5 C11 48.5, 14 49, 16 49 L 16 47 C14 47, 11 46.5, 9.5 45.5 Z" fill="rgba(255,50,50,0.95)"/>
            <path d="M23 47.5 C21 48.5, 18 49, 16 49 L 16 47 C18 47, 21 46.5, 22.5 45.5 Z" fill="rgba(255,50,50,0.95)"/>

            <!-- Status color indicator dot (top center) -->
            <circle cx="16" cy="7.5" r="2.2" fill="${statusColor}" stroke="rgba(0,0,0,0.4)" stroke-width="0.5"/>

            <!-- Selected ring -->
            ${selected ? `<path d="M16 2 C22 2,27 5,28 9 L28.5 13 L28.5 16 L28 17 L28 35 L28.5 36 L28.5 39 L28 43 C27 47,22 50,16 50 C10 50,5 47,4 43 L3.5 39 L3.5 36 L4 35 L4 17 L3.5 16 L3.5 13 L4 9 C5 5,10 2,16 2 Z" fill="none" stroke="white" stroke-width="2" opacity="0.85"/>` : ''}
          </svg>
        </div>
      `,
      iconSize: [w, h],
      iconAnchor: [w / 2, h / 2],
    });
  };

  /** Security officer icon — circular badge with police/shield figure. */
  const getOfficerIcon = (statusColor: string, selected: boolean) => {
    const s = selected ? 30 : 24;
    return L.divIcon({
      className: "asf-officer-marker",
      html: `
        <div style="width:${s}px;height:${s}px;filter:drop-shadow(0 3px 8px rgba(0,0,0,0.5));">
          <svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 32 32" style="display:block;">
            <!-- Badge circle -->
            <circle cx="16" cy="16" r="14" fill="#0d1a2b" stroke="${statusColor}" stroke-width="2.2"/>
            ${selected ? `<circle cx="16" cy="16" r="15.4" fill="none" stroke="white" stroke-width="1.4" opacity="0.9"/>` : ""}
            <!-- Police cap -->
            <path d="M9.5 11.5 C9.5 8.5, 12 6.5, 16 6.5 C20 6.5, 22.5 8.5, 22.5 11.5 L 22.5 12.2 L 9.5 12.2 Z" fill="${statusColor}"/>
            <rect x="8.6" y="12" width="14.8" height="1.8" rx="0.9" fill="#1f2d3d" stroke="${statusColor}" stroke-width="0.5"/>
            <circle cx="16" cy="9.6" r="1.1" fill="#0d1a2b"/>
            <!-- Head -->
            <circle cx="16" cy="17" r="3.4" fill="#e8c39e"/>
            <!-- Shoulders / torso -->
            <path d="M8.5 27.5 C8.5 23, 11.5 21, 16 21 C20.5 21, 23.5 23, 23.5 27.5 Z" fill="${statusColor}"/>
            <path d="M14.4 21.2 L 16 24.4 L 17.6 21.2 Z" fill="#0d1a2b" opacity="0.85"/>
          </svg>
        </div>
      `,
      iconSize: [s, s],
      iconAnchor: [s / 2, s / 2],
    });
  };

  // Inject Leaflet CSS via <link> tag (reliable across Next.js versions)
  useEffect(() => {
    if (cssLoadedRef.current) return;
    if (document.querySelector('link[href*="leaflet"]')) {
      cssLoadedRef.current = true;
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    document.head.appendChild(link);
    cssLoadedRef.current = true;
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [33.5505, 72.8280],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    L.control
      .attribution({ position: "bottomright", prefix: false })
      .addAttribution(
        '&copy; <a href="https://www.openstreetmap.org/copyright" style="color:#4a5568">OSM</a> &copy; <a href="https://carto.com/" style="color:#4a5568">CARTO</a>'
      )
      .addTo(map);

    // Zone polygons — A: road outside airport, B: terminal, C: runway/apron
    const zoneA = L.polygon(ZONE_A, { color: '#22c55e', weight: 2, fillColor: '#22c55e', fillOpacity: 0.08, interactive: false }).addTo(map);
    zoneA.bindTooltip('ZONE A — APPROACH ROAD', { permanent: true, direction: 'center', className: 'zone-label' });
    zonesRef.current["Zone A"] = zoneA;

    const zoneB = L.polygon(ZONE_B, { color: '#f59e0b', weight: 2, fillColor: '#f59e0b', fillOpacity: 0.08, interactive: false }).addTo(map);
    zoneB.bindTooltip('ZONE B — TERMINAL', { permanent: true, direction: 'center', className: 'zone-label' });
    zonesRef.current["Zone B"] = zoneB;

    const zoneC = L.polygon(ZONE_C, { color: '#ef4444', weight: 2, fillColor: '#ef4444', fillOpacity: 0.08, interactive: false }).addTo(map);
    zoneC.bindTooltip('ZONE C — RUNWAY / APRON', { permanent: true, direction: 'center', className: 'zone-label' });
    zonesRef.current["Zone C"] = zoneC;

    if (fitAllZones) {
      const bounds = L.latLngBounds([...ZONE_A, ...ZONE_B, ...ZONE_C]);
      map.fitBounds(bounds, { padding: [10, 10] });
    }

    mapRef.current = map;

    // Force a resize check after mount — fixes the grey/black blank map issue
    const resizeTimer = setTimeout(() => {
      if (mapRef.current) {
        map.invalidateSize();
        if (fitAllZones) {
          map.fitBounds(L.latLngBounds([...ZONE_A, ...ZONE_B, ...ZONE_C]), { padding: [10, 10] });
        }
      }
    }, 200);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      groupMarkersRef.current.clear();
      incidentMarkersRef.current.clear();
      routeLineRef.current = null;
      zonesRef.current = {};
    };
  }, [fitAllZones]);

  // Update zone highlights and map view focus zoom
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const zA = zonesRef.current["Zone A"];
    const zB = zonesRef.current["Zone B"];
    const zC = zonesRef.current["Zone C"];

    if (!zA || !zB || !zC) return;

    // Default styling configs
    const highlightConfig = {
      "Zone A": { color: '#22c55e', weight: 3.5, fillColor: '#22c55e', fillOpacity: 0.15 },
      "Zone B": { color: '#f59e0b', weight: 3.5, fillColor: '#f59e0b', fillOpacity: 0.15 },
      "Zone C": { color: '#ef4444', weight: 3.5, fillColor: '#ef4444', fillOpacity: 0.15 },
    };

    const greyConfig = { color: '#4b5563', weight: 1, fillColor: '#4b5563', fillOpacity: 0.01 };

    if (!activeZone || activeZone === "all") {
      // Restore all zones to their original color & weight
      zA.setStyle({ color: '#22c55e', weight: 2, fillColor: '#22c55e', fillOpacity: 0.08 });
      zB.setStyle({ color: '#f59e0b', weight: 2, fillColor: '#f59e0b', fillOpacity: 0.08 });
      zC.setStyle({ color: '#ef4444', weight: 2, fillColor: '#ef4444', fillOpacity: 0.08 });

      // fit bounds with padding
      const bounds = L.latLngBounds([...ZONE_A, ...ZONE_B, ...ZONE_C]);
      map.flyToBounds(bounds, { padding: [10, 10], duration: 1.2 });
    } else {
      // Highlight only activeZone, grey out other two
      const zonesList = ["Zone A", "Zone B", "Zone C"] as const;
      zonesList.forEach((z) => {
        const poly = zonesRef.current[z];
        if (!poly) return;
        if (z === activeZone) {
          poly.setStyle(highlightConfig[z]);
        } else {
          poly.setStyle(greyConfig);
        }
      });

      // Fly map bounds to focus on the active highlighted zone!
      const activeCoords = activeZone === "Zone A" ? ZONE_A : activeZone === "Zone B" ? ZONE_B : ZONE_C;
      const bounds = L.latLngBounds(activeCoords);
      map.flyToBounds(bounds, { padding: [40, 40], duration: 1.2 });
    }
  }, [activeZone]);

  // Update unit markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const activeTeamIds = new Set(groups.map((t) => t.id));
    for (const [id, marker] of groupMarkersRef.current.entries()) {
      if (!activeTeamIds.has(id)) {
        marker.remove();
        groupMarkersRef.current.delete(id);
      }
    }

    groups.forEach((group, idx) => {
      const groupColor = GROUP_COLORS[idx % GROUP_COLORS.length];
      const statusColor = statusColorMap[group.status] || "#00FF9D";
      const existing = groupMarkersRef.current.get(group.id);
      const selected = selectedGroup === group.id;
      const isOfficer = group.unitType === "officer";
      const icon = isOfficer
        ? getOfficerIcon(statusColor, selected)
        : getVehicleIcon(groupColor, statusColor, group.heading, selected);
      const labelColor = isOfficer ? statusColor : groupColor;

      const isLight = document.documentElement.classList.contains("light");
      const bg      = isLight ? "#ffffff"              : "#0d1117";
      const divider = isLight ? "#c8d0dc"              : "#30363d55";
      const label   = isLight ? "#5a6578"              : "#8b949e";
      const value   = isLight ? "#141820"              : "#e6edf3";
      const etaClr  = isLight ? "#047857"              : "#00FF9D";
      const shadow  = isLight ? "0 8px 24px rgba(0,0,0,0.18)" : "0 8px 24px rgba(0,0,0,0.6)";

      const popupHtml = (t: GroupMarker, color: string) => {
        const border   = isLight ? `${color}66` : `${color}55`;
        const headerBg = isLight ? `${color}12` : `${color}18`;
        const rows: [string, string, string][] = isOfficer
          ? [
              ["Officer", t.name ?? "—", value],
              ["Rank", t.rank ?? "—", value],
              ["Post", t.assignedTo ?? "—", value],
              ["Sector", t.destination ?? "—", color],
              ["Status", (t.status || "").replace("_", " ").toUpperCase(), etaClr],
            ]
          : [
              ["Vehicle", t.vehicle ?? "—", value],
              ["Driver", t.driver ?? "—", value],
              ["Crew", t.personnel != null ? `${t.personnel} personnel` : "—", value],
              ["Destination", t.destination ?? "—", color],
              ["ETA", t.eta ?? "—", etaClr],
            ];
        return `
        <div style="font-family:monospace;min-width:220px;background:${bg};border:1px solid ${border};border-radius:8px;overflow:hidden;box-shadow:${shadow};">
          <div style="background:${headerBg};border-bottom:1px solid ${border};padding:8px 12px;display:flex;align-items:center;justify-content:space-between;">
            <span style="color:${color};font-size:11px;font-weight:bold;letter-spacing:0.12em;">${t.callsign}</span>
            <span style="font-size:9px;color:${label};letter-spacing:0.08em;">${t.id}</span>
          </div>
          <div style="padding:10px 12px;display:grid;gap:7px;">
            ${rows
              .map(
                ([k, v, c], i) => `
            <div style="display:flex;justify-content:space-between;align-items:center;${i < rows.length - 1 ? `border-bottom:1px solid ${divider};padding-bottom:6px;` : ""}">
              <span style="font-size:9px;color:${label};letter-spacing:0.1em;text-transform:uppercase;white-space:nowrap;margin-right:8px;">${k}</span>
              <span style="font-size:10px;color:${c};font-weight:bold;text-align:right;">${v}</span>
            </div>`
              )
              .join("")}
          </div>
        </div>`;
      };

      const tooltipHtml = `<div style="font-family:monospace;font-size:10px;letter-spacing:0.1em;color:${labelColor};font-weight:bold;background:#0d1117ee;border:1px solid ${labelColor}44;padding:3px 8px;border-radius:4px;">${group.callsign}</div>`;

      if (existing) {
        existing.setLatLng([group.lat, group.lng]);
        existing.setIcon(icon);
        existing.setZIndexOffset(selected ? 400 : 200);
        if (existing.getPopup()) existing.setPopupContent(popupHtml(group, labelColor));
        existing.setTooltipContent(tooltipHtml);
      } else {
        const marker = L.marker([group.lat, group.lng], { icon })
          .addTo(map)
          .on("click", () => onSelectGroup(group.id));

        marker.bindTooltip(tooltipHtml, {
          permanent: true,
          direction: "bottom",
          offset: [0, 8],
          className: "tactical-tooltip",
        });

        marker.bindPopup(popupHtml(group, labelColor), {
          className: "tactical-popup",
          maxWidth: 260,
          offset: [0, -8],
          closeButton: false,
          autoClose: true,
        });

        marker.on("mouseover", () => marker.openPopup());
        marker.on("mouseout",  () => marker.closePopup());

        marker.setZIndexOffset(selected ? 400 : 200);
        groupMarkersRef.current.set(group.id, marker);
      }
    });
  }, [groups, selectedGroup, onSelectGroup]);

  // Update incident/event markers (all events plotted, colored by type code)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const activeIds = new Set(incidents.map((i) => i.id));
    for (const [id, marker] of incidentMarkersRef.current.entries()) {
      if (!activeIds.has(id)) {
        marker.remove();
        incidentMarkersRef.current.delete(id);
      }
    }

    incidents.forEach((incident) => {
      const resolved = incident.status === "resolved";
      const color = resolved ? "#00FF9D" : incidentColorMap[incident.typeCode || "red"] || "#FF3D3D";
      const selected = selectedIncident === incident.id;
      const pulse = !resolved && incident.status === "pending";
      const size = selected ? 32 : 26;

      const icon = L.divIcon({
        className: "incident-marker",
        html: `
          <div style="position:relative;width:${size}px;height:${size}px;">
            <div style="position:absolute;inset:0;background:${color}26;border:2px solid ${color};border-radius:4px;transform:rotate(45deg);display:flex;align-items:center;justify-content:center;${selected ? `box-shadow:0 0 12px ${color}AA;` : ""}">
              ${
                resolved
                  ? `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(-45deg)"><path d="M20 6 9 17l-5-5"/></svg>`
                  : `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(-45deg)"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`
              }
            </div>
            ${pulse ? `<div style="position:absolute;inset:-4px;border:2px solid ${color};border-radius:6px;transform:rotate(45deg);animation:incidentPing 2s ease-out infinite;opacity:0.4;"></div>` : ""}
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const tooltipHtml = `<div style="font-family:monospace;font-size:10px;background:#0d1117ee;border:1px solid ${color}55;padding:4px 10px;border-radius:4px;">
          <span style="color:${color};font-weight:bold;">${incident.id}</span>
          <span style="color:#888;margin-left:6px;">${incident.type}</span>
        </div>`;

      const existing = incidentMarkersRef.current.get(incident.id);
      if (existing) {
        existing.setLatLng([incident.lat, incident.lng]);
        existing.setIcon(icon);
        existing.setZIndexOffset(selected ? 500 : 300);
        existing.setTooltipContent(tooltipHtml);
      } else {
        const marker = L.marker([incident.lat, incident.lng], { icon, zIndexOffset: 300 })
          .addTo(map)
          .on("click", () => {
            if (onSelectIncident) onSelectIncident(incident.id);
          });
        marker.bindTooltip(tooltipHtml, {
          direction: "top",
          offset: [0, -12],
          className: "tactical-tooltip",
        });
        incidentMarkersRef.current.set(incident.id, marker);
      }
    });
  }, [incidents, selectedIncident, onSelectIncident]);

  // Draw route line from selected unit to selected incident
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (selectedGroup && selectedIncident) {
      const group = groups.find((t) => t.id === selectedGroup);
      const incident = incidents.find((i) => i.id === selectedIncident);
      if (group && incident) {
        routeLineRef.current = L.polyline(
          [
            [group.lat, group.lng],
            [incident.lat, incident.lng],
          ],
          {
            color: "#00FF9D",
            weight: 2,
            dashArray: "8 5",
            opacity: 0.6,
          }
        ).addTo(map);
      }
    }
  }, [selectedGroup, selectedIncident, groups, incidents]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .tactical-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .tactical-tooltip::before {
          display: none !important;
        }
        .leaflet-control-zoom a {
          background: #0d1117ee !important;
          color: #00FF9D !important;
          border-color: #30363D !important;
          font-family: monospace !important;
        }
        .leaflet-control-zoom a:hover {
          background: #161b22 !important;
          color: #00FF9D !important;
        }
        .qrf-vehicle-marker, .asf-officer-marker {
          background: transparent !important;
          border: none !important;
        }
        .qrf-vehicle-wrap {
          transform-origin: center center;
        }
        .incident-marker {
          background: transparent !important;
          border: none !important;
        }
        .zone-label {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: rgba(255, 255, 255, 0.45) !important;
          font-family: monospace !important;
          font-weight: bold;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        }
        .zone-label::before {
          display: none !important;
        }
        @keyframes incidentPing {
          0% { transform: rotate(45deg) scale(1); opacity: 0.5; }
          100% { transform: rotate(45deg) scale(2.5); opacity: 0; }
        }
      `,
        }}
      />
    </div>
  );
}
