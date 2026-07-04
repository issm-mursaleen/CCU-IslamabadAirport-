// Deterministic display flight per gate — airline, code and tail colour for
// the floating aircraft labels.
import { GATES } from '../sim/geometry'

interface Airline {
  code: string
  name: string
  col: number
}
const AIRLINES: Airline[] = [
  { code: 'PK', name: 'PIA', col: 0x1fa463 },
  { code: 'EK', name: 'Emirates', col: 0xd71a21 },
  { code: 'QR', name: 'Qatar', col: 0x8a1538 },
  { code: 'TK', name: 'Turkish', col: 0xc8102e },
  { code: 'EY', name: 'Etihad', col: 0xbb8b53 },
  { code: 'SV', name: 'Saudia', col: 0x0f7a4d },
  { code: 'FZ', name: 'flydubai', col: 0xd4002a },
  { code: 'PF', name: 'AirSial', col: 0x2f6fd0 },
  { code: 'ER', name: 'Serene Air', col: 0x0aa0c8 },
]

export interface GateFlight {
  code: string
  airline: string
  col: number
}

export const GATE_FLIGHT: Record<string, GateFlight> = Object.fromEntries(
  GATES.map((g, i) => {
    const a = AIRLINES[(i * 3 + 1) % AIRLINES.length]
    const num = 100 + ((i * 137) % 880)
    return [g.id, { code: `${a.code}-${num}`, airline: a.name, col: a.col }]
  }),
)
