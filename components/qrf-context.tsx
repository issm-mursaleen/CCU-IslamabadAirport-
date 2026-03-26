"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/* ── Types ── */
export type IncidentStatus = "pending" | "dispatched" | "on_scene" | "resolved";

export type Incident = {
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

export type QRFTeam = {
  id: string;
  name: string;
  callsign: string;
  capabilities: string[];
  vehicle: string;
  personnel: number;
  status: string;
  lat: number;
  lng: number;
  sector: string;
  lastUpdate: number;
  heading: number;
};

/* ── Seed data ── */
const seedTeams: QRFTeam[] = [
  { id: "QRF-A", name: "QRF Alpha", callsign: "ALPHA-1", capabilities: ["armed", "patrol"], vehicle: "Toyota Hilux", personnel: 4, status: "available", lat: 33.7294, lng: 73.0931, sector: "F-6 / F-7", lastUpdate: 45, heading: 135 },
  { id: "QRF-B", name: "QRF Bravo", callsign: "BRAVO-1", capabilities: ["armed", "k9"], vehicle: "Land Cruiser", personnel: 5, status: "available", lat: 33.6932, lng: 73.0478, sector: "G-8 / G-9", lastUpdate: 120, heading: 45 },
  { id: "QRF-C", name: "QRF Charlie", callsign: "CHARLIE-1", capabilities: ["armed", "medical"], vehicle: "Hilux (Medical)", personnel: 4, status: "available", lat: 33.6678, lng: 73.0712, sector: "I-8 / I-9", lastUpdate: 30, heading: 270 },
  { id: "QRF-D", name: "QRF Delta", callsign: "DELTA-1", capabilities: ["armed", "bomb_disposal"], vehicle: "Armoured APC", personnel: 6, status: "available", lat: 33.7156, lng: 73.0623, sector: "E-7 / Blue Area", lastUpdate: 90, heading: 0 },
  { id: "QRF-E", name: "QRF Echo", callsign: "ECHO-1", capabilities: ["patrol"], vehicle: "Motorcycle Unit", personnel: 3, status: "available", lat: 33.6821, lng: 73.0318, sector: "G-10 / G-11", lastUpdate: 15, heading: 90 },
];

const seedIncidents: Incident[] = [
  { id: "INC-047", type: "Code Amber", typeCode: "amber", description: "Suspicious activity reported near main gate", site: "Site Bravo (F-6 Markaz)", lat: 33.7245, lng: 73.0856, reported: "14:28 PKT", requiredCap: "armed", status: "pending", assignedTeam: null },
  { id: "INC-046", type: "Code Red", typeCode: "red", description: "Confirmed intrusion at warehouse perimeter fence — armed response required", site: "Site Delta (I-8 Industrial)", lat: 33.6695, lng: 73.0780, reported: "13:58 PKT", requiredCap: "armed", status: "pending", assignedTeam: null },
  { id: "INC-045", type: "Code Blue", typeCode: "blue", description: "Guard medical emergency — collapse at post, requires medical QRF", site: "Site Alpha (Blue Area)", lat: 33.7180, lng: 73.0590, reported: "13:15 PKT", requiredCap: "medical", status: "dispatched", assignedTeam: "QRF-C" },
  { id: "INC-044", type: "Code Green", typeCode: "green", description: "False alarm verification — motion sensor triggered in empty wing", site: "Site Echo (G-9 Markaz)", lat: 33.6900, lng: 73.0400, reported: "12:40 PKT", requiredCap: "patrol", status: "resolved", assignedTeam: "QRF-E" },
  { id: "INC-043", type: "Code Amber", typeCode: "amber", description: "Unknown vehicle parked near compound wall for 30+ min", site: "Site Charlie (DHA Phase 2)", lat: 33.7050, lng: 73.0650, reported: "11:22 PKT", requiredCap: "armed", status: "resolved", assignedTeam: "QRF-A" },
  { id: "INC-042", type: "Code Black", typeCode: "black", description: "Unattended bag found near reception — bomb disposal standby", site: "Site Bravo (F-6 Markaz)", lat: 33.7260, lng: 73.0870, reported: "10:05 PKT", requiredCap: "bomb_disposal", status: "resolved", assignedTeam: "QRF-D" },
];

/* ── Context ── */
type QRFContextType = {
  teams: QRFTeam[];
  setTeams: React.Dispatch<React.SetStateAction<QRFTeam[]>>;
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
};

const QRFContext = createContext<QRFContextType | null>(null);

export function QRFProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<QRFTeam[]>(seedTeams);
  const [incidents, setIncidents] = useState<Incident[]>(seedIncidents);

  /* GPS drift runs globally so positions update even when not on QRF page */
  useEffect(() => {
    const id = setInterval(() => {
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

  return (
    <QRFContext.Provider value={{ teams, setTeams, incidents, setIncidents }}>
      {children}
    </QRFContext.Provider>
  );
}

export function useQRF() {
  const ctx = useContext(QRFContext);
  if (!ctx) throw new Error("useQRF must be used within QRFProvider");
  return ctx;
}
