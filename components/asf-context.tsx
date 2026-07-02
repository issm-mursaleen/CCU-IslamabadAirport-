"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/* ── Types ── */
export type IncidentStatus = "pending" | "dispatched" | "on_scene" | "resolved";
export type Zone = "Zone A" | "Zone B" | "Zone C";
export type UnitType = "vehicle" | "officer";
export type EventKind =
  | "stolen_vehicle"
  | "blacklisted_vehicle"
  | "flagged_person"
  | "queue_congestion";

/* Detail payload attached to a camera event — fields depend on kind */
export type EventDetail = {
  confidence?: number;
  /* vehicle events */
  plate?: string;
  vehicleDesc?: string;
  firNo?: string;
  firDate?: string;
  policeStation?: string;
  complainant?: string;
  contact?: string;
  firImage?: string;
  watchlistRef?: string;
  occupantName?: string;
  occupantId?: string;
  /* flagged person events */
  personName?: string;
  personId?: string;
  flagReason?: string;
  threatLevel?: string;
  passport?: string;
  nationality?: string;
  flight?: string;
  /* queue congestion events */
  peopleCount?: number;
  threshold?: number;
  waitTime?: string;
  counter?: string;
};

export type Incident = {
  id: string;
  type: string;
  typeCode: string;
  kind: EventKind;
  description: string;
  site: string;
  zone: Zone;
  camera: string;
  videoSrc?: string;
  lat: number;
  lng: number;
  reported: string;
  requiredCap: string;
  status: IncidentStatus;
  assignedGroup: string | null;
  detail?: EventDetail;
  plateMatch?: boolean;
  facialMatch?: boolean;
};

export type ASFGroup = {
  id: string;
  name: string;
  callsign: string;
  unitType: UnitType;
  rank?: string;
  capabilities: string[];
  vehicle: string;
  personnel: number;
  status: string;
  lat: number;
  lng: number;
  zone: Zone | "Unassigned";
  lastUpdate: number;
  heading: number;
  driver: string;
  assignedTo: string;
  destination: string;
  eta: string;
};

/* ── Deployed ASF units around Islamabad Airport ──
   Zone A = approach road outside the airport (vehicle patrols)
   Zone B = terminal / airport itself (officers on foot + rapid unit)
   Zone C = runway & apron area (officers on foot + ONE patrol car) */
const seedGroups: ASFGroup[] = [
  /* Zone A — road patrols (vehicles) */
  { id: "ASF-A1", name: "Road Patrol 1",     callsign: "ALPHA-1",   unitType: "vehicle", capabilities: ["armed", "patrol"],        vehicle: "Toyota Hilux",      personnel: 4, status: "available", lat: 33.5588, lng: 72.8402, zone: "Zone A", lastUpdate: 22,  heading: 130, driver: "Sgt. Imran Malik",    assignedTo: "Airport Road Loop",   destination: "Main Approach Rd",   eta: "Patrolling" },
  { id: "ASF-A2", name: "Road Patrol 2",     callsign: "ALPHA-2",   unitType: "vehicle", capabilities: ["armed", "k9"],            vehicle: "Land Cruiser",      personnel: 5, status: "available", lat: 33.5601, lng: 72.8455, zone: "Zone A", lastUpdate: 51,  heading: 310, driver: "Cpl. Naveed Shah",    assignedTo: "Outer Cordon",        destination: "Toll Plaza Gate",    eta: "Patrolling" },
  { id: "ASF-A3", name: "Gate Interdiction", callsign: "ALPHA-3",   unitType: "vehicle", capabilities: ["armed", "bomb_disposal"], vehicle: "Armoured APC",      personnel: 6, status: "available", lat: 33.5570, lng: 72.8508, zone: "Zone A", lastUpdate: 74,  heading: 45,  driver: "Lt. Kamran Yousuf",   assignedTo: "Gate 01 Cordon",      destination: "Entry Checkpoint",   eta: "Standby"    },

  /* Zone B — terminal officers on foot + one rapid unit */
  { id: "ASF-B1", name: "Constable Ahmed Raza",   callsign: "BRAVO-1", unitType: "officer", rank: "Constable", capabilities: ["patrol"],           vehicle: "On Foot",        personnel: 1, status: "available", lat: 33.5565, lng: 72.8290, zone: "Zone B", lastUpdate: 8,   heading: 0,   driver: "—", assignedTo: "Check-in Hall",        destination: "Counters 12–18",     eta: "On Post" },
  { id: "ASF-B2", name: "Constable Waqar Abbasi", callsign: "BRAVO-2", unitType: "officer", rank: "Constable", capabilities: ["patrol"],           vehicle: "On Foot",        personnel: 1, status: "available", lat: 33.5548, lng: 72.8312, zone: "Zone B", lastUpdate: 14,  heading: 0,   driver: "—", assignedTo: "Departure Concourse",  destination: "FIA Counters",       eta: "On Post" },
  { id: "ASF-B3", name: "ASI Zubair Khattak",     callsign: "BRAVO-3", unitType: "officer", rank: "ASI",       capabilities: ["armed", "patrol"],  vehicle: "On Foot",        personnel: 1, status: "available", lat: 33.5578, lng: 72.8262, zone: "Zone B", lastUpdate: 5,   heading: 0,   driver: "—", assignedTo: "International Wing",   destination: "Immigration Hall",   eta: "On Post" },
  { id: "ASF-B4", name: "LC Sania Gul",           callsign: "BRAVO-4", unitType: "officer", rank: "Lady Constable", capabilities: ["patrol", "medical"], vehicle: "On Foot", personnel: 1, status: "available", lat: 33.5537, lng: 72.8338, zone: "Zone B", lastUpdate: 19,  heading: 0,   driver: "—", assignedTo: "Family Lounge",        destination: "Domestic Wing",      eta: "On Post" },
  { id: "ASF-B5", name: "Terminal Rapid Unit",    callsign: "BRAVO-5", unitType: "vehicle", capabilities: ["armed", "medical"],    vehicle: "Hilux (Medical)",   personnel: 4, status: "available", lat: 33.5525, lng: 72.8270, zone: "Zone B", lastUpdate: 33,  heading: 220, driver: "Cpl. Tariq Mehmood",  assignedTo: "Terminal Forecourt",  destination: "Kerbside Standby",   eta: "2 min" },

  /* Zone C — runway/apron officers on foot + ONE patrol car */
  { id: "ASF-C1", name: "Havildar Rashid Mengal", callsign: "CHARLIE-1", unitType: "officer", rank: "Havildar",  capabilities: ["armed", "patrol"], vehicle: "On Foot",     personnel: 1, status: "available", lat: 33.5472, lng: 72.8368, zone: "Zone C", lastUpdate: 11,  heading: 0,   driver: "—", assignedTo: "Apron East",           destination: "Aircraft Stands",    eta: "On Post" },
  { id: "ASF-C2", name: "Constable Bilal Turi",   callsign: "CHARLIE-2", unitType: "officer", rank: "Constable", capabilities: ["armed"],           vehicle: "On Foot",     personnel: 1, status: "available", lat: 33.5455, lng: 72.8255, zone: "Zone C", lastUpdate: 27,  heading: 0,   driver: "—", assignedTo: "Runway Mid-Point",     destination: "Taxiway Bravo",      eta: "On Post" },
  { id: "ASF-C3", name: "Constable Farhan Shinwari", callsign: "CHARLIE-3", unitType: "officer", rank: "Constable", capabilities: ["patrol", "k9"], vehicle: "On Foot",     personnel: 1, status: "available", lat: 33.5488, lng: 72.8135, zone: "Zone C", lastUpdate: 42,  heading: 0,   driver: "—", assignedTo: "Runway West End",      destination: "Perimeter Fence",    eta: "On Post" },
  { id: "ASF-C4", name: "Runway Patrol Car",      callsign: "CHARLIE-MOBILE", unitType: "vehicle", capabilities: ["armed", "patrol"], vehicle: "Toyota Hilux (Follow-Me)", personnel: 3, status: "available", lat: 33.5443, lng: 72.8305, zone: "Zone C", lastUpdate: 16, heading: 260, driver: "Cpl. Faraz Ali", assignedTo: "Runway Sweep", destination: "Runway 28R Threshold", eta: "Patrolling" },
];

/* ── Camera events per zone ── */
const seedIncidents: Incident[] = [
  /* Zone A — road outside the airport */
  {
    id: "EVT-201", type: "STOLEN VEHICLE", typeCode: "red", kind: "stolen_vehicle",
    description: "ANPR hit on airport approach road — plate BAF-678 matches stolen-vehicle FIR No. 932/25 lodged 14-06-2025. Scanned FIR retrieved and attached.",
    site: "Zone A — Main Approach Road", zone: "Zone A",
    camera: "CAM-114 (ANPR — Approach Rd)", videoSrc: "/videos/vehicle_traffic_output_exit.mp4",
    lat: 33.5592, lng: 72.8418, reported: "14:32 PKT", requiredCap: "armed",
    status: "pending", assignedGroup: null, plateMatch: true,
    detail: {
      confidence: 97,
      plate: "BAF-678",
      vehicleDesc: "Suzuki Cultus (White)",
      firNo: "932/25",
      firDate: "14-06-2025",
      policeStation: "PS Airport, Rawalpindi",
      complainant: "Muhammad Abbas",
      contact: "0336-2817557",
      firImage: "/fir-scan.png",
    },
  },
  {
    id: "EVT-202", type: "BLACKLISTED VEHICLE", typeCode: "red", kind: "blacklisted_vehicle",
    description: "Vehicle + occupant match confirmed — plate LEA-4601 on LEA blacklist and occupant facial hit against watchlist database.",
    site: "Zone A — Gate 01 Checkpoint", zone: "Zone A",
    camera: "CAM-208 (ANPR — Gate 01)", videoSrc: "/videos/plate_recognition_output_parking_area.mp4",
    lat: 33.5568, lng: 72.8492, reported: "14:28 PKT", requiredCap: "armed",
    status: "pending", assignedGroup: null, plateMatch: true, facialMatch: true,
    detail: {
      confidence: 98,
      plate: "LEA-4601",
      vehicleDesc: "Toyota Grande (White Sedan)",
      watchlistRef: "LEA Blacklist / VIP-Executive correlation DB",
      occupantName: "Tariq Malik",
      occupantId: "WL-501-A",
      threatLevel: "CRITICAL",
    },
  },

  /* Zone B — terminal / airport itself */
  {
    id: "EVT-203", type: "QUEUE CONGESTION", typeCode: "amber", kind: "queue_congestion",
    description: "Passenger density above threshold at international check-in — 46 pax in queue vs limit 30. Crowd control required at counters 12–18.",
    site: "Zone B — Check-in Hall", zone: "Zone B",
    camera: "CAM-311 (Check-in Hall)", videoSrc: "/videos/counter_people_que.mp4",
    lat: 33.5558, lng: 72.8298, reported: "14:25 PKT", requiredCap: "patrol",
    status: "pending", assignedGroup: null,
    detail: { peopleCount: 46, threshold: 30, waitTime: "25 min", counter: "International Check-in 12–18", confidence: 94 },
  },
  {
    id: "EVT-204", type: "QUEUE CONGESTION", typeCode: "amber", kind: "queue_congestion",
    description: "FIA immigration queue backing into concourse — 38 pax vs limit 25. Additional lane opening and marshalling required.",
    site: "Zone B — FIA Immigration", zone: "Zone B",
    camera: "CAM-317 (FIA Counters)", videoSrc: "/videos/Fia_counter.mp4",
    lat: 33.5544, lng: 72.8322, reported: "14:11 PKT", requiredCap: "patrol",
    status: "pending", assignedGroup: null,
    detail: { peopleCount: 38, threshold: 25, waitTime: "18 min", counter: "FIA Immigration 4–7", confidence: 92 },
  },

  /* Zone C — runway & apron area */
  {
    id: "EVT-205", type: "FLAGGED PERSON", typeCode: "red", kind: "flagged_person",
    description: "Facial recognition hit at aircraft exit — passenger matches FIA AML watchlist (money laundering). Intercept before landside egress.",
    site: "Zone C — Apron, Aircraft Exit", zone: "Zone C",
    camera: "CAM-402 (Apron — Aircraft Exit)", videoSrc: "/videos/face+_detection_airplane_Exit.mp4",
    lat: 33.5470, lng: 72.8385, reported: "14:19 PKT", requiredCap: "armed",
    status: "pending", assignedGroup: null, facialMatch: true,
    detail: {
      confidence: 96,
      personName: "Salman Qureshi",
      personId: "FIA-WL-2231",
      flagReason: "Money Laundering — FIA Red Book / AML Watchlist",
      threatLevel: "HIGH",
      passport: "AK9182734",
      nationality: "Pakistani",
      flight: "PK-301 (KHI → ISB)",
    },
  },
  {
    id: "EVT-206", type: "FLAGGED PERSON", typeCode: "amber", kind: "flagged_person",
    description: "Watchlist match in runway transit corridor — subject flagged for financial fraud under Interpol Blue Notice. Verify identity and hold.",
    site: "Zone C — Transit Corridor", zone: "Zone C",
    camera: "CAM-408 (Transit Corridor)", videoSrc: "/videos/zone_tracker_output_1_counter_area.mp4",
    lat: 33.5452, lng: 72.8228, reported: "13:54 PKT", requiredCap: "patrol",
    status: "pending", assignedGroup: null, facialMatch: true,
    detail: {
      confidence: 89,
      personName: "Imtiaz Baig",
      personId: "FIA-WL-1187",
      flagReason: "Financial Fraud — Interpol Blue Notice",
      threatLevel: "MEDIUM",
      passport: "CV1103382",
      nationality: "Pakistani",
      flight: "PK-368 (LHE → ISB)",
    },
  },
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
          // officers drift less than vehicles
          lat: t.lat + (Math.random() - 0.5) * (t.unitType === "officer" ? 0.00012 : 0.0004),
          lng: t.lng + (Math.random() - 0.5) * (t.unitType === "officer" ? 0.00012 : 0.0004),
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
