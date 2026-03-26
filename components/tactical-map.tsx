"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

interface TeamMarker {
  id: string;
  callsign: string;
  lat: number;
  lng: number;
  status: string;
  heading: number;
}

interface IncidentMarker {
  id: string;
  type: string;
  lat: number;
  lng: number;
}

interface TacticalMapProps {
  teams: TeamMarker[];
  incident: IncidentMarker;
  selectedTeam: string | null;
  onSelectTeam: (id: string) => void;
}

const statusColorMap: Record<string, string> = {
  available: "#00FF9D",
  en_route: "#FFB700",
  on_scene: "#FF3D3D",
  dispatched: "#FFB700",
};

export default function TacticalMap({
  teams,
  incident,
  selectedTeam,
  onSelectTeam,
}: TacticalMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const teamMarkersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const incidentMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const cssLoadedRef = useRef(false);

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
      center: [33.7, 73.06],
      zoom: 13,
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
      teamMarkersRef.current.clear();
      incidentMarkerRef.current = null;
      routeLineRef.current = null;
    };
  }, []);

  // Update team markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    teams.forEach((team) => {
      const color = statusColorMap[team.status] || "#00FF9D";
      const existing = teamMarkersRef.current.get(team.id);

      if (existing) {
        existing.setLatLng([team.lat, team.lng]);
        existing.setStyle({
          color: color,
          fillColor: color,
          fillOpacity: selectedTeam === team.id ? 0.8 : 0.4,
          weight: selectedTeam === team.id ? 3 : 2,
          radius: selectedTeam === team.id ? 10 : 7,
        });
      } else {
        const marker = L.circleMarker([team.lat, team.lng], {
          radius: selectedTeam === team.id ? 10 : 7,
          color: color,
          fillColor: color,
          fillOpacity: selectedTeam === team.id ? 0.8 : 0.4,
          weight: selectedTeam === team.id ? 3 : 2,
        })
          .addTo(map)
          .on("click", () => onSelectTeam(team.id));

        marker.bindTooltip(
          `<div style="font-family:monospace;font-size:10px;letter-spacing:0.1em;color:${color};font-weight:bold;background:#0d1117ee;border:1px solid ${color}44;padding:3px 8px;border-radius:4px;">${team.callsign}</div>`,
          {
            permanent: true,
            direction: "bottom",
            offset: [0, 8],
            className: "tactical-tooltip",
          }
        );

        teamMarkersRef.current.set(team.id, marker);
      }

      // Update tooltip content with current callsign color
      const m = teamMarkersRef.current.get(team.id);
      if (m) {
        m.setTooltipContent(
          `<div style="font-family:monospace;font-size:10px;letter-spacing:0.1em;color:${color};font-weight:bold;background:#0d1117ee;border:1px solid ${color}44;padding:3px 8px;border-radius:4px;">${team.callsign}</div>`
        );
      }
    });
  }, [teams, selectedTeam, onSelectTeam]);

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

    if (selectedTeam) {
      const team = teams.find((t) => t.id === selectedTeam);
      if (team) {
        routeLineRef.current = L.polyline(
          [
            [team.lat, team.lng],
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
  }, [selectedTeam, teams, incident]);

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
