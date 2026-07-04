// Deterministic day-of-operations flight schedule for the FIDS board, gate
// status, gate-detail panel and analytics. Independent of the passenger
// micro-sim; both are driven by the same simulated day clock.
import { GATES } from './geometry'

export type Scenario = 'normal' | 'peak' | 'cascade' | 'security' | 'evacuation'
export type BodyType = 'narrow' | 'wide'
export type GateStatus = 'available' | 'occupied' | 'boarding' | 'delayed'

export const DAY_START = 5 * 3600 // 05:00 (seconds of day)
export const DAY_END = 24 * 3600
export const DAY_SCALE = 120 // simulated day-seconds advanced per engine second
export const BOARDING_LEAD = 40 * 60 // boarding opens 40 min before ETD

export interface Flight {
  id: string
  airline: string
  code: string
  destination: string
  gateId: string
  body: BodyType
  std: number
  delayMin: number
  paxCount: number
  intl: boolean
  col: number
}
export interface FlightView extends Flight {
  etd: number
  status: GateStatus | 'departed' | 'scheduled'
  boarded: number
}

interface Airline {
  code: string
  name: string
  intl: boolean
  col: number
  dests: string[]
}
const AIRLINES: Airline[] = [
  { code: 'PK', name: 'PIA', intl: false, col: 0x1fa463, dests: ['Karachi', 'Lahore', 'Peshawar', 'Skardu', 'Gilgit'] },
  { code: 'ER', name: 'Serene Air', intl: false, col: 0x0aa0c8, dests: ['Karachi', 'Lahore', 'Gwadar'] },
  { code: 'PF', name: 'AirSial', intl: false, col: 0x2f6fd0, dests: ['Karachi', 'Lahore', 'Sialkot'] },
  { code: 'EK', name: 'Emirates', intl: true, col: 0xd71a21, dests: ['Dubai'] },
  { code: 'QR', name: 'Qatar Airways', intl: true, col: 0x8a1538, dests: ['Doha'] },
  { code: 'TK', name: 'Turkish', intl: true, col: 0xc8102e, dests: ['Istanbul'] },
  { code: 'EY', name: 'Etihad', intl: true, col: 0xbb8b53, dests: ['Abu Dhabi'] },
  { code: 'SV', name: 'Saudia', intl: true, col: 0x0f7a4d, dests: ['Jeddah', 'Riyadh', 'Madinah'] },
  { code: 'FZ', name: 'flydubai', intl: true, col: 0xd4002a, dests: ['Dubai'] },
]

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateSchedule(seed: number, scenario: Scenario): Flight[] {
  const rand = rng(seed)
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
  const count = 58 + Math.floor(rand() * 16)
  const flights: Flight[] = []
  for (let i = 0; i < count; i++) {
    const a = pick(AIRLINES)
    const body: BodyType = a.intl ? (rand() < 0.7 ? 'wide' : 'narrow') : rand() < 0.2 ? 'wide' : 'narrow'
    const gate = GATES[i % GATES.length]
    let std: number
    const roll = rand()
    if (roll < 0.35) std = 6 * 3600 + rand() * 3 * 3600
    else if (roll < 0.7) std = 18 * 3600 + rand() * 3 * 3600
    else std = DAY_START + rand() * (DAY_END - DAY_START)
    const paxBase = body === 'wide' ? 220 + rand() * 130 : 100 + rand() * 80
    const paxCount = Math.round(paxBase * (scenario === 'peak' ? 1.5 : 1))
    let delayMin = rand() < (scenario === 'security' ? 0.22 : 0.1) ? Math.round(15 + rand() * 75) : 0
    if (scenario === 'cascade' && gate.pier === 'south' && i % GATES.length === 1) delayMin = Math.max(delayMin, 60)
    flights.push({
      id: `${a.code}${100 + ((i * 37) % 880)}-${i}`,
      airline: a.name,
      code: `${a.code}-${100 + ((i * 37) % 880)}`,
      destination: pick(a.dests),
      gateId: gate.id,
      body,
      std: Math.round(std),
      delayMin,
      paxCount,
      intl: a.intl,
      col: a.col,
    })
  }
  flights.sort((x, y) => x.std + x.delayMin * 60 - (y.std + y.delayMin * 60))
  return flights
}

export const etdOf = (f: Flight) => f.std + f.delayMin * 60

export function flightRuntime(f: Flight, clock: number): { etd: number; status: FlightView['status']; boarded: number } {
  const etd = etdOf(f)
  const boardStart = etd - BOARDING_LEAD
  let status: FlightView['status']
  let boarded = 0
  if (clock >= etd) {
    status = 'departed'
    boarded = f.paxCount
  } else if (clock >= boardStart) {
    status = f.delayMin > 0 ? 'delayed' : 'boarding'
    boarded = Math.round(f.paxCount * Math.min(1, (clock - boardStart) / (etd - boardStart)))
  } else if (clock >= etd - 3 * 3600) {
    status = f.delayMin > 0 ? 'delayed' : 'occupied'
  } else {
    status = 'scheduled'
  }
  return { etd, status, boarded }
}

export function gateStatusFrom(status: FlightView['status']): GateStatus {
  if (status === 'boarding') return 'boarding'
  if (status === 'delayed') return 'delayed'
  if (status === 'occupied') return 'occupied'
  return 'available'
}

/** soonest not-yet-departed flight at a gate */
export function activeFlightAt(flights: Flight[], gateId: string, clock: number): Flight | undefined {
  let best: Flight | undefined
  for (const f of flights) {
    if (f.gateId !== gateId) continue
    if (etdOf(f) < clock) continue
    if (!best || f.std < best.std) best = f
  }
  return best
}
