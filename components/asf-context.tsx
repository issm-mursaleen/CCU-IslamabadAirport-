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
  assignedGroup: string | null;
  plateMatch?: boolean;
  facialMatch?: boolean;
};

export type ASFGroup = {
  id: string;
  name: string;
  callsign: string;
  capabilities: string[];
  vehicle: string;
  personnel: number;
  status: string;
  lat: number;
  lng: number;
  zone: "Zone A" | "Zone B" | "Zone C" | "Unassigned";
  lastUpdate: number;
  heading: number;
  driver: string;
  assignedTo: string;
  destination: string;
  eta: string;
};

/* ── Coordinates around Islamabad Airport (33.551, 72.830) ── */
const seedGroups: ASFGroup[] = [
  { id: "ASF-G1", name: "ASF Group 1",   callsign: "ALPHA-1",   capabilities: ["armed", "patrol"],         vehicle: "Toyota Hilux",    personnel: 4, status: "available", lat: 33.5550, lng: 72.8250, zone: "Zone A",         lastUpdate: 45,  heading: 135, driver: "Sgt. Imran Malik",   assignedTo: "Ali Hassan",      destination: "Terminal 1 Gate",    eta: "4 min"   },
  { id: "ASF-G2", name: "ASF Group 2",   callsign: "BRAVO-1",   capabilities: ["armed", "k9"],             vehicle: "Land Cruiser",    personnel: 5, status: "available", lat: 33.5480, lng: 72.8350, zone: "Zone B",         lastUpdate: 120, heading: 45,  driver: "Cpl. Naveed Shah",    assignedTo: "Bilal Khan",      destination: "Cargo Area",         eta: "7 min"   },
  { id: "ASF-G3", name: "ASF Group 3",   callsign: "CHARLIE-1", capabilities: ["armed", "medical"],        vehicle: "Hilux (Medical)", personnel: 4, status: "available", lat: 33.5420, lng: 72.8220, zone: "Zone C",         lastUpdate: 30,  heading: 270, driver: "Cpl. Tariq Mehmood",  assignedTo: "Kamran Yousuf",   destination: "Runway South",       eta: "3 min"   },
  { id: "ASF-G4", name: "ASF Group 4",   callsign: "DELTA-1",   capabilities: ["armed", "bomb_disposal"],  vehicle: "Armoured APC",    personnel: 6, status: "available", lat: 33.5580, lng: 72.8380, zone: "Zone A",         lastUpdate: 90,  heading: 0,   driver: "Lt. Kamran Yousuf",   assignedTo: "Shahid Awan",     destination: "VIP Parking",        eta: "Standby" },
  { id: "ASF-G5", name: "ASF Group 5",   callsign: "ECHO-1",    capabilities: ["patrol"],                  vehicle: "Motorcycle Unit", personnel: 3, status: "available", lat: 33.5510, lng: 72.8300, zone: "Zone B",         lastUpdate: 15,  heading: 90,  driver: "Cpl. Faraz Ali",      assignedTo: "Faraz Ali",       destination: "Perimeter Loop",     eta: "2 min"   },
];

const seedIncidents: Incident[] = [
  { id: "INC-101", type: "Suspicious Vehicle", typeCode: "red", description: "Vehicle + occupant match confirmed (plate flag and facial watchlist hit inside cabin).", site: "Zone B Checkpoint", lat: 33.5495, lng: 72.8320, reported: "14:28 PKT", requiredCap: "armed", status: "pending", assignedGroup: null, plateMatch: true, facialMatch: true },
  { id: "INC-102", type: "Perimeter Intrusion", typeCode: "amber", description: "Confirmed intrusion at southern perimeter fence — armed response required", site: "Zone C South", lat: 33.5400, lng: 72.8200, reported: "13:58 PKT", requiredCap: "armed", status: "pending", assignedGroup: null },
  { id: "INC-103", type: "Medical Emergency", typeCode: "blue", description: "Passenger collapse at departure gate, requires medical group", site: "Zone A Concourse", lat: 33.5540, lng: 72.8270, reported: "13:15 PKT", requiredCap: "medical", status: "dispatched", assignedGroup: "ASF-G3" },
];

/* ── Context ── */
type ASFContextType = {
  groups: ASFGroup[];
  setGroups: React.Dispatch<React.SetStateAction<ASFGroup[]>>;
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
};

const ASFContext = createContext<ASFContextType | null>(null);

export function ASFProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<ASFGroup[]>(seedGroups);
  const [incidents, setIncidents] = useState<Incident[]>(seedIncidents);

  /* GPS drift runs globally so positions update even when not on ASF page */
  useEffect(() => {
    const id = setInterval(() => {
      setGroups((prev) =>
        prev.map((t) => ({
          ...t,
          lat: t.lat + (Math.random() - 0.5) * 0.0004, // Reduced drift for smaller airport scale
          lng: t.lng + (Math.random() - 0.5) * 0.0004,
          lastUpdate: Math.max(0, t.lastUpdate - 2 + Math.floor(Math.random() * 5)),
        }))
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <ASFContext.Provider value={{ groups, setGroups, incidents, setIncidents }}>
      {children}
    </ASFContext.Provider>
  );
}

export function useASF() {
  const ctx = useContext(ASFContext);
  if (!ctx) throw new Error("useASF must be used within ASFProvider");
  return ctx;
}
