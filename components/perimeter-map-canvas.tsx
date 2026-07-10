"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Polygon, Rectangle, TileLayer, Tooltip } from "react-leaflet";
import type { LatLngExpression, LatLngTuple } from "leaflet";

// Centered on Islamabad International Airport Terminal Building (IIAP)
const MAP_CENTER: LatLngExpression = [33.5580, 72.8280];

// Secure airport perimeter bounds covering runways, taxiways, and terminal concourse
const PERIMETER_BOUNDS: [LatLngTuple, LatLngTuple] = [
  [33.5420, 72.8020],
  [33.5720, 72.8480],
];

const CAMERA_NODES: Array<{
  id: string;
  label: string;
  position: LatLngTuple;
  color: string;
}> = [
  { id: "cam-1", label: "CAM-112", position: [33.5590, 72.8280], color: "#4CC3FF" }, // Departures Concourse
  { id: "cam-2", label: "CAM-105", position: [33.5582, 72.8270], color: "#4CC3FF" }, // Secure Staff Area
  { id: "cam-3", label: "CAM-201", position: [33.5598, 72.8272], color: "#4CC3FF" }, // Passport Control
  { id: "cam-4", label: "CAM-301", position: [33.5605, 72.8255], color: "#FF3D3D" }, // Gate 12 Faulty Camera
  { id: "cam-5", label: "CAM-011", position: [33.5570, 72.8210], color: "#4CC3FF" }, // Apron Drone surveillance
  { id: "cam-6", label: "CAM-002", position: [33.5650, 72.8120], color: "#4CC3FF" }, // North-West Fence Boundary
  { id: "cam-7", label: "CAM-004", position: [33.5555, 72.8340], color: "#4CC3FF" }, // Public Parking Lot
];

const GATE_MARKERS: Array<{
  id: string;
  label: string;
  position: LatLngTuple;
  color: string;
}> = [
  { id: "gate-1", label: "GATE-1", position: [33.5682, 72.8385], color: "#00FF9D" }, // Airport Access Road Checkpoint
  { id: "gate-2", label: "GATE-2", position: [33.5575, 72.8245], color: "#00FF9D" }, // Restricted Apron Gate
];

const ALERT_MARKERS: Array<{
  id: string;
  label: string;
  position: LatLngTuple;
  color: string;
}> = [
  { id: "alert-1", label: "BREACH", position: [33.5662, 72.8190], color: "#FF3D3D" }, // North fence sensor breach
  { id: "alert-2", label: "CARGO-WARN", position: [33.5540, 72.8310], color: "#FFB700" }, // Cargo terminal left bag
  { id: "alert-3", label: "TAXI-ALERT", position: [33.5582, 72.8160], color: "#FF3D3D" }, // Unauthorized movement near Taxiway Bravo
  { id: "alert-4", label: "RUNWAY-BREACH", position: [33.5488, 72.8135], color: "#FF3D3D" }, // Runway West fence breach
];

const STRUCTURE_BLOCKS: Array<{
  id: string;
  name: string;
  bounds: [LatLngTuple, LatLngTuple];
  stroke: string;
  fill: string;
}> = [
  {
    id: "terminal",
    name: "Main Passenger Terminal Hub",
    bounds: [
      [33.5582, 72.8252],
      [33.5608, 72.8295],
    ],
    stroke: "#4CC3FF",
    fill: "#4CC3FF22",
  },
  {
    id: "hangar",
    name: "PIA Maintenance Hangar Hub",
    bounds: [
      [33.5630, 72.8150],
      [33.5655, 72.8190],
    ],
    stroke: "#9A6BFF",
    fill: "#9A6BFF22",
  },
  {
    id: "fuel",
    name: "IIAP Fuel Storage Depot",
    bounds: [
      [33.5615, 72.8080],
      [33.5635, 72.8115],
    ],
    stroke: "#FFB700",
    fill: "#FFB70022",
  },
  {
    id: "cargo",
    name: "Air Cargo Terminal Complex",
    bounds: [
      [33.5535, 72.8290],
      [33.5558, 72.8330],
    ],
    stroke: "#00FF9D",
    fill: "#00FF9D22",
  },
];

export default function PerimeterMapCanvas() {
  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={14}
      minZoom={12}
      maxZoom={18}
      zoomControl
      style={{ height: "100%", width: "100%" }}
      className="[&_.leaflet-control-zoom]:!border-border/60 [&_.leaflet-control-zoom_a]:!bg-[#0d1117ee] [&_.leaflet-control-zoom_a]:!text-tactical-green [&_.leaflet-control-zoom_a]:!border-border [&_.leaflet-control-zoom_a:hover]:!bg-[#161b22]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Red secure perimeter dotted envelope */}
      <Rectangle
        bounds={PERIMETER_BOUNDS}
        pathOptions={{
          color: "#FF4D4F",
          weight: 2.5,
          fillColor: "#FF4D4F",
          fillOpacity: 0.04,
          dashArray: "8 6",
        }}
      >
        <Tooltip permanent direction="center" className="!bg-tactical-red/80 !text-white !border-none !font-mono !text-[9px] !tracking-widest">
          ISLAMABAD INTL AIRPORT SECURE PERIMETER ZONE
        </Tooltip>
      </Rectangle>

      {/* Runway Sector Overlay */}
      <Polygon
        positions={[
          [33.5430, 72.8100],
          [33.5480, 72.8500],
          [33.5450, 72.8520],
          [33.5400, 72.8120],
        ]}
        pathOptions={{
          color: "#9A6BFF",
          weight: 1.5,
          fillColor: "#9A6BFF",
          fillOpacity: 0.12,
        }}
      >
        <Tooltip sticky direction="top" className="!bg-secondary !border-border !text-foreground !font-mono !text-[9px] uppercase tracking-wide">
          Runway 10R / 28L Flight Lane
        </Tooltip>
      </Polygon>

      {/* Airport structures drawing */}
      {STRUCTURE_BLOCKS.map((block) => (
        <Rectangle
          key={block.id}
          bounds={block.bounds}
          pathOptions={{
            color: block.stroke,
            weight: 2,
            fillColor: block.fill,
            fillOpacity: 0.35,
          }}
        >
          <Tooltip sticky direction="top" className="!bg-secondary !border-border !text-foreground !font-mono !text-[9px] uppercase tracking-wider font-bold">
            {block.name}
          </Tooltip>
        </Rectangle>
      ))}

      {/* Airport cameras layout */}
      {CAMERA_NODES.map((node) => (
        <CircleMarker
          key={node.id}
          center={node.position}
          radius={7}
          pathOptions={{
            color: node.color,
            fillColor: "#0D1117",
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Tooltip permanent direction="center" offset={[0, 0]} className="!bg-transparent !border-none !shadow-none !p-0">
            <span className="font-mono text-[8px] font-bold text-white">{node.id.split("-")[1]}</span>
          </Tooltip>
          <Tooltip direction="top" className="!bg-secondary !border-border !text-foreground !font-mono !text-[9px] uppercase">
            Surveillance Hub: {node.id.toUpperCase()}
          </Tooltip>
        </CircleMarker>
      ))}

      {/* Airport gate access controls */}
      {GATE_MARKERS.map((node) => (
        <CircleMarker
          key={node.id}
          center={node.position}
          radius={8}
          pathOptions={{
            color: node.color,
            fillColor: node.color,
            fillOpacity: 0.95,
            weight: 1.5,
          }}
        >
          <Tooltip permanent direction="center" offset={[0, 0]} className="!bg-transparent !border-none !shadow-none !p-0">
            <span className="font-mono text-[8px] font-black text-black">{node.id.split("-")[1]}</span>
          </Tooltip>
          <Tooltip direction="top" className="!bg-secondary !border-border !text-foreground !font-mono !text-[9px] uppercase font-bold">
            Access Checkpoint: {node.id.toUpperCase()}
          </Tooltip>
        </CircleMarker>
      ))}

      {/* Airport alert triggers */}
      {ALERT_MARKERS.map((node) => (
        <CircleMarker
          key={node.id}
          center={node.position}
          radius={9}
          pathOptions={{
            color: "#FFFFFF",
            fillColor: node.color,
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Tooltip permanent direction="center" offset={[0, 0]} className="!bg-transparent !border-none !shadow-none !p-0">
            <span className="font-mono text-[8px] font-bold text-white">!</span>
          </Tooltip>
          <Tooltip permanent direction="top" className="!bg-tactical-red !border-none !text-white !font-mono !text-[9px] uppercase tracking-wider font-bold">
            {node.label}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
