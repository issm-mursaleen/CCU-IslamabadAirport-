"use client";

import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer, Rectangle, CircleMarker, Polygon, Tooltip } from "react-leaflet";
import type { LatLngExpression, LatLngTuple } from "leaflet";

const MAP_CENTER: LatLngExpression = [33.7008, 73.0556];

const PERIMETER_BOUNDS: [LatLngTuple, LatLngTuple] = [
  [33.6976, 73.0518],
  [33.7042, 73.0596],
];

const CAMERA_NODES: Array<{
  id: string;
  label: string;
  position: LatLngTuple;
  color: string;
}> = [
  { id: "cam-1", label: "C", position: [33.7005, 73.0546], color: "#4CC3FF" },
  { id: "cam-2", label: "C", position: [33.6992, 73.0529], color: "#4CC3FF" },
  { id: "cam-3", label: "C", position: [33.7014, 73.0571], color: "#4CC3FF" },
  { id: "cam-4", label: "C", position: [33.7022, 73.0550], color: "#4CC3FF" },
  { id: "cam-5", label: "C", position: [33.6986, 73.0578], color: "#4CC3FF" },
];

const GATE_MARKERS: Array<{
  id: string;
  label: string;
  position: LatLngTuple;
  color: string;
}> = [
  { id: "gate-1", label: "G", position: [33.7031, 73.0582], color: "#00FF9D" },
  { id: "gate-2", label: "G", position: [33.7003, 73.0563], color: "#00FF9D" },
];

const ALERT_MARKERS: Array<{
  id: string;
  label: string;
  position: LatLngTuple;
  color: string;
}> = [
  { id: "alert-1", label: "!", position: [33.6997, 73.0524], color: "#FF3D3D" },
  { id: "alert-2", label: "!", position: [33.6984, 73.0556], color: "#FFB700" },
  { id: "alert-3", label: "!", position: [33.7012, 73.0585], color: "#FF3D3D" },
];

const STRUCTURE_BLOCKS: Array<{
  id: string;
  bounds: [LatLngTuple, LatLngTuple];
  stroke: string;
  fill: string;
}> = [
  {
    id: "b1",
    bounds: [
      [33.7010, 73.0527],
      [33.7018, 73.0541],
    ],
    stroke: "#00FF9D",
    fill: "#00FF9D22",
  },
  {
    id: "b2",
    bounds: [
      [33.6996, 73.0545],
      [33.7006, 73.0558],
    ],
    stroke: "#7B7DFF",
    fill: "#7B7DFF22",
  },
  {
    id: "b3",
    bounds: [
      [33.7007, 73.0560],
      [33.7018, 73.0573],
    ],
    stroke: "#FFB700",
    fill: "#FFB70022",
  },
  {
    id: "b4",
    bounds: [
      [33.6981, 73.0533],
      [33.6993, 73.0550],
    ],
    stroke: "#4CC3FF",
    fill: "#4CC3FF22",
  },
];

export default function PerimeterMapPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Digital Fence &amp; Perimeter Monitoring</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">
          AI-powered perimeter intrusion detection and zone monitoring
        </p>
      </div>

      <div className="glow-border rounded-xl bg-card noise-texture p-3 md:p-4">
        <div className="relative h-[360px] md:h-[460px] w-full overflow-hidden rounded-lg border border-border/60 bg-black">
          <MapContainer
            center={MAP_CENTER}
            zoom={16}
            minZoom={14}
            maxZoom={19}
            zoomControl
            style={{ height: "100%", width: "100%" }}
            className="[&_.leaflet-control-zoom]:!border-border/60 [&_.leaflet-control-zoom_a]:!bg-[#0d1117ee] [&_.leaflet-control-zoom_a]:!text-tactical-green [&_.leaflet-control-zoom_a]:!border-border [&_.leaflet-control-zoom_a:hover]:!bg-[#161b22]"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Rectangle
              bounds={PERIMETER_BOUNDS}
              pathOptions={{
                color: "#FF4D4F",
                weight: 2,
                fillColor: "#FF4D4F",
                fillOpacity: 0.08,
                dashArray: "8 6",
              }}
            >
              <Tooltip permanent direction="center" className="!bg-tactical-red/80 !text-white !border-none !font-mono !text-[9px]">
                PERIMETER ZONE
              </Tooltip>
            </Rectangle>

            <Polygon
              positions={[
                [33.6986, 73.0552],
                [33.6996, 73.0568],
                [33.7008, 73.0556],
                [33.6999, 73.0541],
              ]}
              pathOptions={{
                color: "#9A6BFF",
                weight: 1.5,
                fillColor: "#9A6BFF",
                fillOpacity: 0.15,
              }}
            />

            {STRUCTURE_BLOCKS.map((block) => (
              <Rectangle
                key={block.id}
                bounds={block.bounds}
                pathOptions={{
                  color: block.stroke,
                  weight: 2,
                  fillColor: block.fill,
                  fillOpacity: 0.45,
                }}
              />
            ))}

            {CAMERA_NODES.map((node) => (
              <CircleMarker
                key={node.id}
                center={node.position}
                radius={8}
                pathOptions={{
                  color: node.color,
                  fillColor: "#0D1117",
                  fillOpacity: 1,
                  weight: 2,
                }}
              >
                <Tooltip permanent direction="center" offset={[0, 0]} className="!bg-transparent !border-none !shadow-none !p-0">
                  <span className="font-mono text-[9px] font-bold text-white">{node.label}</span>
                </Tooltip>
              </CircleMarker>
            ))}

            {GATE_MARKERS.map((node) => (
              <CircleMarker
                key={node.id}
                center={node.position}
                radius={9}
                pathOptions={{
                  color: node.color,
                  fillColor: node.color,
                  fillOpacity: 0.95,
                  weight: 1.5,
                }}
              >
                <Tooltip permanent direction="center" offset={[0, 0]} className="!bg-transparent !border-none !shadow-none !p-0">
                  <span className="font-mono text-[9px] font-black text-black">{node.label}</span>
                </Tooltip>
              </CircleMarker>
            ))}

            {ALERT_MARKERS.map((node) => (
              <CircleMarker
                key={node.id}
                center={node.position}
                radius={10}
                pathOptions={{
                  color: "#FFFFFF",
                  fillColor: node.color,
                  fillOpacity: 1,
                  weight: 2,
                }}
              >
                <Tooltip permanent direction="center" offset={[0, 0]} className="!bg-transparent !border-none !shadow-none !p-0">
                  <span className="font-mono text-[10px] font-bold text-white">{node.label}</span>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
