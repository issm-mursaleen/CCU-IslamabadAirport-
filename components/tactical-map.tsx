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
  vehicle?: string;
  driver?: string;
  assignedTo?: string;
  destination?: string;
  eta?: string;
}

interface IncidentMarker {
  id: string;
  type: string;
  lat: number;
  lng: number;
}

interface TacticalMapProps {
  groups: GroupMarker[];
  incident: IncidentMarker;
  selectedGroup: string | null;
  onSelectGroup: (id: string) => void;
}

const statusColorMap: Record<string, string> = {
  available: "#00FF9D",
  en_route: "#FFB700",
  on_scene: "#FF3D3D",
  dispatched: "#FFB700",
};

// Unique car body color per team slot (index-based)
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

export default function TacticalMap({
  groups,
  incident,
  selectedGroup,
  onSelectGroup,
}: TacticalMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const groupMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const incidentMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
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

            <!-- Car body — proper silhouette using path -->
            <!-- Front bumper curves in, sides flare slightly, rear curves in -->
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
      center: [33.5510, 72.8300],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    // Colorful OpenStreetMap tile layer
    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
      }
    ).addTo(map);

    // Add zoom control to top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Attribution
    L.control
      .attribution({ position: "bottomright", prefix: false })
      .addAttribution(
        '&copy; <a href="https://www.openstreetmap.org/copyright" style="color:#4a5568">OSM</a> &copy; <a href="https://carto.com/" style="color:#4a5568">CARTO</a>'
      )
      .addTo(map);

    mapRef.current = map;

    // Force a resize check after mount — fixes the grey/black blank map issue
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapRef.current = null;
      groupMarkersRef.current.clear();
      incidentMarkerRef.current = null;
      routeLineRef.current = null;
    };
  }, []);

  // Update team markers
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
      const vehicleIcon = getVehicleIcon(groupColor, statusColor, group.heading, selected);

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
        return `
        <div style="font-family:monospace;min-width:220px;background:${bg};border:1px solid ${border};border-radius:8px;overflow:hidden;box-shadow:${shadow};">
          <div style="background:${headerBg};border-bottom:1px solid ${border};padding:8px 12px;display:flex;align-items:center;justify-content:space-between;">
            <span style="color:${color};font-size:11px;font-weight:bold;letter-spacing:0.12em;">${t.callsign}</span>
            <span style="font-size:9px;color:${label};letter-spacing:0.08em;">${t.id}</span>
          </div>
          <div style="padding:10px 12px;display:grid;gap:7px;">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid ${divider};padding-bottom:6px;">
              <span style="font-size:9px;color:${label};letter-spacing:0.1em;text-transform:uppercase;">Vehicle</span>
              <span style="font-size:10px;color:${value};font-weight:bold;">${t.vehicle ?? "—"}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid ${divider};padding-bottom:6px;">
              <span style="font-size:9px;color:${label};letter-spacing:0.1em;text-transform:uppercase;">Driver</span>
              <span style="font-size:10px;color:${value};font-weight:bold;">${t.driver ?? "—"}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid ${divider};padding-bottom:6px;">
              <span style="font-size:9px;color:${label};letter-spacing:0.1em;text-transform:uppercase;">Assigned To</span>
              <span style="font-size:10px;color:${value};font-weight:bold;">${t.assignedTo ?? "—"}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid ${divider};padding-bottom:6px;">
              <span style="font-size:9px;color:${label};letter-spacing:0.1em;text-transform:uppercase;white-space:nowrap;margin-right:8px;">Destination</span>
              <span style="font-size:10px;color:${color};font-weight:bold;text-align:right;">${t.destination ?? "—"}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:9px;color:${label};letter-spacing:0.1em;text-transform:uppercase;">ETA</span>
              <span style="font-size:10px;color:${etaClr};font-weight:bold;">${t.eta ?? "—"}</span>
            </div>
          </div>
        </div>`;
      };

      if (existing) {
        existing.setLatLng([group.lat, group.lng]);
        existing.setIcon(vehicleIcon);
        existing.setZIndexOffset(selected ? 400 : 200);
        // Refresh popup content in case team data changed
        if (existing.getPopup()) existing.setPopupContent(popupHtml(group, groupColor));
      } else {
        const marker = L.marker([group.lat, group.lng], { icon: vehicleIcon })
          .addTo(map)
          .on("click", () => onSelectGroup(group.id));

        marker.bindTooltip(
          `<div style="font-family:monospace;font-size:10px;letter-spacing:0.1em;color:${groupColor};font-weight:bold;background:#0d1117ee;border:1px solid ${groupColor}44;padding:3px 8px;border-radius:4px;">${group.callsign}</div>`,
          { permanent: true, direction: "bottom", offset: [0, 8], className: "tactical-tooltip" }
        );

        marker.bindPopup(popupHtml(group, groupColor), {
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

      // Update tooltip callsign label color
      const m = groupMarkersRef.current.get(group.id);
      if (m) {
        m.setTooltipContent(
          `<div style="font-family:monospace;font-size:10px;letter-spacing:0.1em;color:${groupColor};font-weight:bold;background:#0d1117ee;border:1px solid ${groupColor}44;padding:3px 8px;border-radius:4px;">${group.callsign}</div>`
        );
      }
    });
  }, [groups, selectedGroup, onSelectGroup]);

  // Update incident marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (incidentMarkerRef.current) {
      incidentMarkerRef.current.setLatLng([incident.lat, incident.lng]);
    } else {
      const pulseIcon = L.divIcon({
        className: "incident-marker",
        html: `
          <div style="position:relative;width:28px;height:28px;">
            <div style="position:absolute;inset:0;background:rgba(255,61,61,0.15);border:2px solid #FF3D3D;border-radius:4px;transform:rotate(45deg);display:flex;align-items:center;justify-content:center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF3D3D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(-45deg)"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <div style="position:absolute;inset:-4px;border:2px solid #FF3D3D;border-radius:6px;transform:rotate(45deg);animation:incidentPing 2s ease-out infinite;opacity:0.4;"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      incidentMarkerRef.current = L.marker([incident.lat, incident.lng], {
        icon: pulseIcon,
      }).addTo(map);

      incidentMarkerRef.current.bindTooltip(
        `<div style="font-family:monospace;font-size:10px;background:#0d1117ee;border:1px solid #FF3D3D55;padding:4px 10px;border-radius:4px;">
          <span style="color:#FF3D3D;font-weight:bold;">${incident.id}</span>
          <span style="color:#888;margin-left:6px;">${incident.type}</span>
        </div>`,
        {
          direction: "top",
          offset: [0, -12],
          className: "tactical-tooltip",
        }
      );
    }
  }, [incident]);

  // Draw route line from selected team to incident
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (selectedGroup) {
      const group = groups.find((t) => t.id === selectedGroup);
      if (group) {
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
  }, [selectedGroup, groups, incident]);

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
        .qrf-vehicle-marker {
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
