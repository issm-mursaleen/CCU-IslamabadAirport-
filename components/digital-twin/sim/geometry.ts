// =====================================================================
//  PTB geometry — nodes, lanes, gates, components, helpers.
//  Coordinates are traced from the real Level-3 CAD plan and expressed
//  in a normalized plan space (u,v) ∈ [0,1] mapped onto a world plane.
// =====================================================================

export type Vec2 = { x: number; y: number } // y here is the world Z axis

// Plate world dimensions (blueprint textures are 1400×990 → aspect 1.414)
export const PW = 92
export const PD = (PW * 990) / 1400
export const FH = 15 // floor-to-floor height
export const FLOORY = [0, FH, 2 * FH] // L1, L2, L3 plate heights
export const L3Y = FLOORY[2]

export const PIER_COL = { south: 0x7c9cff, east: 0x39d0d8, west: 0xc792ea } as const
export type Pier = keyof typeof PIER_COL

/** normalized plan(u,v) → world plane (x = world X, y = world Z) */
export function uv(u: number, v: number): Vec2 {
  return { x: (u - 0.5) * PW, y: (v - 0.5) * PD }
}

export const P = {
  portal: uv(0.5, 0.885),
  forecourt: uv(0.5, 0.8),
  checkin: uv(0.5, 0.705),
  security: uv(0.5, 0.585),
  junction: uv(0.5, 0.455),
  sTip: uv(0.5, 0.075),
  eMid: uv(0.345, 0.575),
  eTip: uv(0.155, 0.715),
  wMid: uv(0.655, 0.575),
  wTip: uv(0.845, 0.715),
}

export interface Lane {
  id: string
  label: string
  pts: Vec2[]
  width: number
  cap: number
  len: number
  occ: number
}

export function dist(a: Vec2, b: Vec2) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}
function plen(pts: Vec2[]) {
  let l = 0
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i])
  return l
}
function lane(id: string, label: string, pts: Vec2[], width: number, cap: number): Lane {
  return { id, label, pts, width, cap, len: plen(pts), occ: 0 }
}

export const LANES: Lane[] = [
  lane('entry', 'Entrance Hall', [P.portal, P.forecourt, P.checkin], 5.4, 0.9),
  lane('checkin', 'Check-in → Security', [P.checkin, P.security], 5.0, 0.8),
  lane('postsec', 'Security → Junction', [P.security, P.junction], 4.2, 0.85),
  lane('south', 'South Pier', [P.junction, P.sTip], 3.4, 0.8),
  lane('east', 'East Wing', [P.junction, P.eMid, P.eTip], 3.2, 0.78),
  lane('west', 'West Wing', [P.junction, P.wMid, P.wTip], 3.2, 0.78),
]
export const LANEMAP: Record<string, Lane> = Object.fromEntries(LANES.map((l) => [l.id, l]))
export const laneOf = (id: string) => LANEMAP[id]

export function alongLane(l: Lane, t: number): Vec2 {
  let tg = t * l.len,
    acc = 0
  for (let i = 1; i < l.pts.length; i++) {
    const s = dist(l.pts[i - 1], l.pts[i])
    if (acc + s >= tg) {
      const f = (tg - acc) / s
      return {
        x: l.pts[i - 1].x + (l.pts[i].x - l.pts[i - 1].x) * f,
        y: l.pts[i - 1].y + (l.pts[i].y - l.pts[i - 1].y) * f,
      }
    }
    acc += s
  }
  return l.pts[l.pts.length - 1]
}
export function laneDir(l: Lane, t: number): Vec2 {
  const a = alongLane(l, Math.max(0, t - 0.01)),
    b = alongLane(l, Math.min(1, t + 0.01))
  const m = Math.hypot(b.x - a.x, b.y - a.y) || 1
  return { x: (b.x - a.x) / m, y: (b.y - a.y) / m }
}

export interface Gate {
  id: string
  pier: Pier
  t: number
  side: number
  door: Vec2
  ac: Vec2
  perp: Vec2
  load: number
}

function buildGates(): Gate[] {
  const G: Gate[] = []
  const defs = [
    { pier: 'south' as Pier, code: 'B', n: 7, outer: false },
    { pier: 'east' as Pier, code: 'A', n: 6, outer: true },
    { pier: 'west' as Pier, code: 'C', n: 6, outer: true },
  ]
  for (const d of defs) {
    const base = LANEMAP[d.pier]
    for (let i = 0; i < d.n; i++) {
      const t = 0.16 + (i / (d.n - 1)) * 0.74
      const pos = alongLane(base, t)
      const dir = laneDir(base, t)
      const perp = { x: -dir.y, y: dir.x }
      let side = i % 2 === 0 ? 1 : -1
      if (d.outer) {
        const a = { x: pos.x + perp.x, y: pos.y + perp.y },
          b = { x: pos.x - perp.x, y: pos.y - perp.y }
        side = Math.hypot(a.x, a.y) > Math.hypot(b.x, b.y) ? 1 : -1
      }
      const wd = base.width / 2
      const door = { x: pos.x + perp.x * side * (wd + 1.6), y: pos.y + perp.y * side * (wd + 1.6) }
      const ac = { x: pos.x + perp.x * side * (wd + 6.6), y: pos.y + perp.y * side * (wd + 6.6) }
      G.push({ id: d.code + (i + 1), pier: d.pier, t, side, door, ac, perp: { x: perp.x * side, y: perp.y * side }, load: 0 })
    }
  }
  return G
}
export const GATES = buildGates()

export interface Component {
  f: 0 | 1 | 2
  u: number
  v: number
  name: string
  type: string
  cat: number
  desc: string
}

export const COMPONENTS: Component[] = [
  // Level 3 — Departures
  { f: 2, u: 0.5, v: 0.9, name: 'Main Portal / Kerbside', type: 'Access', cat: 0x9fb2cc, desc: 'Departures set-down. Vehicles drop passengers at the frontage; doors feed the check-in hall.' },
  { f: 2, u: 0.5, v: 0.705, name: 'Check-in Hall', type: 'Processor', cat: 0x7c9cff, desc: 'Island desks and self-service bag-drop. Modelled as N parallel servers — adjust “Check-in desks”.' },
  { f: 2, u: 0.5, v: 0.585, name: 'Central Security Screening', type: 'Processor', cat: 0x39d0d8, desc: 'Centralised passenger screening. The system pinch-point — reduce “Security lanes” to watch queues build.' },
  { f: 2, u: 0.5, v: 0.455, name: 'Departures Concourse Junction', type: 'Circulation', cat: 0x28c76f, desc: 'Post-security node where flows split to the South Pier and the East / West wings.' },
  { f: 2, u: 0.42, v: 0.52, name: 'Duty-Free & Retail', type: 'Commercial', cat: 0xffb648, desc: 'Walk-through retail between security and the piers.' },
  { f: 2, u: 0.5, v: 0.2, name: 'South Pier — Gates B', type: 'Gates', cat: 0x7c9cff, desc: 'Contact stands B1–B7 along the central pier, wide-body capable (777-300ER).' },
  { f: 2, u: 0.22, v: 0.66, name: 'East Wing — Gates A', type: 'Gates', cat: 0x39d0d8, desc: 'Contact stands A1–A6 on the east concourse.' },
  { f: 2, u: 0.78, v: 0.66, name: 'West Wing — Gates C', type: 'Gates', cat: 0xc792ea, desc: 'Contact stands C1–C6 on the west concourse.' },
  // Level 2 — Processing / Mezzanine
  { f: 1, u: 0.5, v: 0.45, name: 'Transfer Hall', type: 'Circulation', cat: 0x28c76f, desc: 'Inter-pier transfer level connecting arriving and departing passengers airside.' },
  { f: 1, u: 0.5, v: 0.22, name: 'Holding Lounges (South)', type: 'Lounge', cat: 0x7c9cff, desc: 'Gate hold-rooms feeding the South Pier boarding bridges.' },
  { f: 1, u: 0.63, v: 0.46, name: 'Airline Lounges', type: 'Lounge', cat: 0xffb648, desc: 'Premium and contract lounges on the mezzanine.' },
  { f: 1, u: 0.35, v: 0.6, name: 'Mechanical Plant', type: 'Services', cat: 0x8aa0bd, desc: 'HVAC / electrical plant rooms serving the processor core.' },
  { f: 1, u: 0.5, v: 0.7, name: 'Office Suites', type: 'Back-of-house', cat: 0x8aa0bd, desc: 'Airline and operator offices above the check-in hall.' },
  // Level 1 — Arrivals / Apron
  { f: 0, u: 0.5, v: 0.55, name: 'Arrivals Hall', type: 'Processor', cat: 0x39d0d8, desc: 'Arriving passengers descend here from the piers toward immigration and baggage.' },
  { f: 0, u: 0.4, v: 0.46, name: 'Baggage Claim — North', type: 'Baggage', cat: 0xffb648, desc: 'Reclaim carousels fed by the inbound baggage hall.' },
  { f: 0, u: 0.6, v: 0.46, name: 'Baggage Claim — South', type: 'Baggage', cat: 0xffb648, desc: 'Reclaim carousels fed by the inbound baggage hall.' },
  { f: 0, u: 0.5, v: 0.4, name: 'Immigration / Border Control', type: 'Processor', cat: 0x7c9cff, desc: 'Primary inspection booths and e-gates for arriving international passengers.' },
  { f: 0, u: 0.5, v: 0.64, name: 'Customs', type: 'Processor', cat: 0x28c76f, desc: 'Red / green customs channels downstream of baggage reclaim.' },
  { f: 0, u: 0.5, v: 0.78, name: 'Meeters & Greeters / Kerb', type: 'Access', cat: 0x9fb2cc, desc: 'Arrivals concourse, greeters area and ground-transport pickup at grade.' },
  { f: 0, u: 0.2, v: 0.34, name: 'Apron / Aircraft Stands', type: 'Airside', cat: 0x39d0d8, desc: 'Aircraft parking stands and taxilanes around the piers.' },
]

// ---- congestion helpers ----
export function laneRatio(l: Lane) {
  return l.occ / Math.max(1, l.len * 0.55)
}
export function congHex(r: number) {
  r = Math.min(1.4, r)
  let R: number, G: number, B: number
  if (r < 0.5) {
    const k = r / 0.5
    R = 40 + k * 215
    G = 199
    B = 111 - k * 40
  } else if (r < 1.0) {
    const k = (r - 0.5) / 0.5
    R = 255
    G = 182 - k * 70
    B = 72
  } else {
    const k = Math.min(1, (r - 1) / 0.4)
    R = 255
    G = 112 - k * 21
    B = 72 + k * 38
  }
  return (R << 16) | (G << 8) | B
}
export const FLOOR_NAMES = ['Level 1 — Arrivals', 'Level 2 — Processing', 'Level 3 — Departures']

// ---- departures-floor zones (for per-zone occupancy metrics) ----
export interface Zone {
  id: string
  label: string
  min: Vec2 // world (x = X, y = Z)
  max: Vec2
}
function zoneUV(id: string, label: string, u0: number, v0: number, u1: number, v1: number): Zone {
  const a = uv(u0, v0),
    b = uv(u1, v1)
  return { id, label, min: { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y) }, max: { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y) } }
}
export const ZONES: Zone[] = [
  zoneUV('entrance', 'Entrance', 0.4, 0.78, 0.6, 0.96),
  zoneUV('checkin', 'Check-in Hall', 0.36, 0.63, 0.64, 0.78),
  zoneUV('security', 'Security', 0.38, 0.52, 0.62, 0.63),
  zoneUV('retail', 'Retail / Concourse', 0.33, 0.42, 0.67, 0.52),
  zoneUV('south', 'South Pier', 0.4, 0.04, 0.6, 0.42),
  zoneUV('east', 'East Wing', 0.05, 0.42, 0.4, 0.78),
  zoneUV('west', 'West Wing', 0.6, 0.42, 0.95, 0.78),
]
export function zoneOf(x: number, y: number): string | null {
  for (const z of ZONES) if (x >= z.min.x && x <= z.max.x && y >= z.min.y && y <= z.max.y) return z.id
  return null
}
