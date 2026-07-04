// =====================================================================
//  Passenger-flow simulation engine (framework-agnostic).
//  Agents flow Portal → Check-in → Security → Pier → Gate. Walking speed
//  drops with local lane density (Greenshields) plus car-following so
//  queues form. Check-in & Security are M/M/c servers.
//
//  Capacity levers behave realistically:
//   • more check-in desks / security lanes  → shorter queues → lower
//     congestion, lower transit time, fewer flight delays
//   • more open gates                       → load spread over more piers
//     → less pier congestion → fewer delays
//   • higher arrival rate                   → the opposite
// =====================================================================
import { GATES, LANES, LANEMAP, P, PIER_COL, ZONES, alongLane, laneOf, laneRatio, zoneOf, type Gate, type Pier } from './geometry'
import {
  generateSchedule,
  flightRuntime,
  gateStatusFrom,
  activeFlightAt,
  DAY_START,
  DAY_END,
  DAY_SCALE,
  type Flight,
  type FlightView,
  type GateStatus,
  type Scenario,
} from './schedule'

export interface HistoryPoint {
  clock: number
  thru: number
  secWait: number
  cong: number
  inTerminal: number
}

export enum PH {
  WALK_IN,
  CHECKIN,
  TO_SEC,
  SECURITY,
  TO_GATE,
  AT_GATE,
  DONE,
}

export interface Agent {
  id: number
  phase: PH
  lane: string
  s: number
  gate: Gate
  born: number
  speedBase: number
  jitter: number
  colHex: number
  x: number
  y: number
  atGate?: number
}

export interface SimParams {
  rate: number
  secLanes: number
  chkDesks: number
  activeGates: number
  walk: number
}

interface Station {
  queue: Agent[]
  busyUntil: { a: Agent; until: number }[]
}

// Service times (sim-seconds) and display conversion.
const T_CHECKIN = 11
const T_SECURITY = 7
const MIN_PER_SEC = 0.5 // sim is time-compressed; 1 sim-sec ≈ 0.5 displayed minutes
const FLIGHT_SLACK_MIN = 6 // designed processing buffer before a flight slips
const ON_TIME_MIN = 15 // a flight is "on time" if delay ≤ this

export class Engine {
  t = 0
  agents: Agent[] = []
  served = 0
  thruWindow: number[] = []
  transit: number[] = []
  stations: { checkin: Station; security: Station } = {
    checkin: { queue: [], busyUntil: [] },
    security: { queue: [], busyUntil: [] },
  }
  // flights
  departures = 0
  flightDelays: number[] = [] // rolling window (minutes)
  private nextDep: number[] = []
  private headway: number[] = []
  private gateOrder: number[] = [] // interleaved across piers
  private activeGates = GATES.length
  private prm: SimParams = { rate: 45, secLanes: 6, chkDesks: 9, activeGates: GATES.length, walk: 1 }

  // day-of-operations flight schedule + clock
  scenario: Scenario = 'normal'
  seed = 20260704
  clockSec = DAY_START
  schedule: Flight[] = []
  history: HistoryPoint[] = []
  private lastHist = DAY_START
  private lastBoarded = 0

  private spawnAcc = 0
  private nextId = 1

  constructor() {
    this.schedule = generateSchedule(this.seed, this.scenario)
    // interleave gates across piers so "fewer gates" still uses all three piers
    const byPier: Record<Pier, number[]> = { south: [], east: [], west: [] }
    GATES.forEach((g, i) => byPier[g.pier].push(i))
    const maxLen = Math.max(byPier.south.length, byPier.east.length, byPier.west.length)
    for (let k = 0; k < maxLen; k++)
      for (const p of ['south', 'east', 'west'] as Pier[]) if (byPier[p][k] != null) this.gateOrder.push(byPier[p][k])
    // flight schedule
    GATES.forEach((_, i) => {
      this.nextDep[i] = 40 + Math.random() * 90
      this.headway[i] = 95 + Math.random() * 70
    })
    for (let i = 0; i < 40; i++) {
      this.spawn()
      this.agents[i].s = Math.random() * 8
    }
  }

  reset() {
    this.t = 0
    this.agents = []
    this.served = 0
    this.thruWindow = []
    this.transit = []
    this.spawnAcc = 0
    this.departures = 0
    this.flightDelays = []
    this.stations = { checkin: { queue: [], busyUntil: [] }, security: { queue: [], busyUntil: [] } }
    GATES.forEach((g, i) => {
      g.load = 0
      this.nextDep[i] = this.t + 40 + Math.random() * 90
    })
    this.clockSec = DAY_START
    this.history = []
    this.lastHist = DAY_START
    this.lastBoarded = 0
    this.schedule = generateSchedule(this.seed, this.scenario)
  }

  /** switch scenario; returns recommended operations parameters for the store */
  setScenario(s: Scenario): Partial<SimParams> {
    this.scenario = s
    this.reset()
    switch (s) {
      case 'peak':
        return { rate: 120 }
      case 'security':
        return { secLanes: 2 }
      case 'evacuation':
        return { rate: 5 }
      default:
        return { rate: 45, secLanes: 6 }
    }
  }

  // ---- schedule-driven views ----------------------------------------
  flightViews(): FlightView[] {
    return this.schedule.map((f) => {
      const rt = flightRuntime(f, this.clockSec)
      return { ...f, etd: rt.etd, status: rt.status, boarded: rt.boarded }
    })
  }
  gateStatuses(): Record<string, { status: GateStatus; flight?: FlightView }> {
    const out: Record<string, { status: GateStatus; flight?: FlightView }> = {}
    for (const g of GATES) {
      const f = activeFlightAt(this.schedule, g.id, this.clockSec)
      if (!f) {
        out[g.id] = { status: 'available' }
        continue
      }
      const rt = flightRuntime(f, this.clockSec)
      out[g.id] = { status: gateStatusFrom(rt.status), flight: { ...f, etd: rt.etd, status: rt.status, boarded: rt.boarded } }
    }
    return out
  }
  zoneMetrics() {
    const counts: Record<string, number> = {}
    for (const z of ZONES) counts[z.id] = 0
    for (const a of this.agents) {
      const z = zoneOf(a.x, a.y)
      if (z) counts[z] = (counts[z] || 0) + 1
    }
    return ZONES.map((z) => ({ id: z.id, label: z.label, count: counts[z.id] }))
  }
  private totalBoarded() {
    let s = 0
    for (const f of this.schedule) s += flightRuntime(f, this.clockSec).boarded
    return s
  }
  gateUtil() {
    const m: Record<string, { boarded: number; pax: number }> = {}
    for (const f of this.schedule) {
      const e = (m[f.gateId] ||= { boarded: 0, pax: 0 })
      e.boarded += flightRuntime(f, this.clockSec).boarded
      e.pax += f.paxCount
    }
    return GATES.map((g) => ({ gate: g.id, util: m[g.id] && m[g.id].pax ? Math.round((m[g.id].boarded / m[g.id].pax) * 100) : 0 }))
  }

  private activeSet() {
    return new Set(this.gateOrder.slice(0, this.activeGates))
  }

  spawn() {
    const pool = this.gateOrder.slice(0, this.activeGates)
    const gi = pool[(Math.random() * pool.length) | 0]
    const gate = GATES[gi]
    this.agents.push({
      id: this.nextId++,
      phase: PH.WALK_IN,
      lane: 'entry',
      s: 0,
      gate,
      born: this.t,
      speedBase: 0.9 + Math.random() * 0.35,
      jitter: Math.random() * 2 - 1,
      colHex: PIER_COL[gate.pier],
      x: P.portal.x + (Math.random() * 4 - 2),
      y: P.portal.y + Math.random() * 1.6,
    })
  }

  surge(n = 120) {
    for (let i = 0; i < n; i++) this.spawn()
  }

  // ---- derived realism metrics ---------------------------------------
  /** expected queue wait (displayed minutes) at each processor */
  waitsMin() {
    const chk = (this.stations.checkin.queue.length / Math.max(1, this.prm.chkDesks)) * T_CHECKIN * MIN_PER_SEC
    const sec = (this.stations.security.queue.length / Math.max(1, this.prm.secLanes)) * T_SECURITY * MIN_PER_SEC
    return { checkin: chk, security: sec }
  }
  /** processor queue load vs comfortable capacity (drops as servers open) */
  stationRatios() {
    return {
      chk: this.stations.checkin.queue.length / (this.prm.chkDesks * 6),
      sec: this.stations.security.queue.length / (this.prm.secLanes * 6),
    }
  }
  flightStats() {
    const n = this.flightDelays.length
    const onTime = n ? Math.round((100 * this.flightDelays.filter((d) => d <= ON_TIME_MIN).length) / n) : 100
    const avgDelay = n ? this.flightDelays.reduce((a, b) => a + b, 0) / n : 0
    const delayed = this.flightDelays.filter((d) => d > ON_TIME_MIN).length
    return { onTime, avgDelay, delayed, departures: this.departures }
  }

  /** Full KPI snapshot for the UI. Congestion folds the corridor densities
   *  together with the processor-queue loads, so opening lanes lowers it. */
  snapshot() {
    const transit = this.transit.length ? this.transit.reduce((p, c) => p + c, 0) / this.transit.length : 0
    const sr = this.stationRatios()
    const waits = this.waitsMin()
    const flt = this.flightStats()
    const ratios = [...LANES.map(laneRatio), sr.chk, sr.sec]
    let m = 0,
      mx = 0
    for (const r0 of ratios) {
      const r = Math.min(1.4, r0)
      m += r
      mx = Math.max(mx, r)
    }
    m /= ratios.length
    const lanes = [
      ...LANES.map((l) => ({ id: l.id, label: l.label, occ: l.occ, ratio: laneRatio(l) })),
      { id: 'q-chk', label: 'Check-in Queue', occ: this.stations.checkin.queue.length, ratio: sr.chk },
      { id: 'q-sec', label: 'Security Queue', occ: this.stations.security.queue.length, ratio: sr.sec },
    ]
    return {
      inSystem: this.agents.length,
      thru: this.thruWindow.length,
      transit: Math.round(transit),
      cong: Math.min(100, Math.round((0.6 * mx + 0.4 * m) * 72)),
      clock: Math.floor(this.t),
      clockSec: this.clockSec,
      lanes,
      chkWait: waits.checkin,
      secWait: waits.security,
      onTime: flt.onTime,
      avgDelay: flt.avgDelay,
      delayed: flt.delayed,
      departures: flt.departures,
    }
  }

  private placeOnLane(a: Agent) {
    const l = laneOf(a.lane)
    const t = Math.min(1, a.s / l.len)
    const p = alongLane(l, t)
    const d = (() => {
      const aa = alongLane(l, Math.max(0, t - 0.01)),
        bb = alongLane(l, Math.min(1, t + 0.01))
      const m = Math.hypot(bb.x - aa.x, bb.y - aa.y) || 1
      return { x: (bb.x - aa.x) / m, y: (bb.y - aa.y) / m }
    })()
    const perp = { x: -d.y, y: d.x }
    const lat = a.jitter * (l.width * 0.32)
    a.x = p.x + perp.x * lat
    a.y = p.y + perp.y * lat
  }

  private serviceStation(st: Station, n: number, T: number, onDone: (a: Agent) => void) {
    st.busyUntil = st.busyUntil.filter((b) => {
      if (this.t >= b.until) {
        onDone(b.a)
        return false
      }
      return true
    })
    while (st.busyUntil.length < n && st.queue.length > 0) {
      const a = st.queue.shift()!
      st.busyUntil.push({ a, until: this.t + T * (0.7 + Math.random() * 0.6) })
    }
  }

  update(dt: number, prm: SimParams) {
    this.prm = prm
    this.activeGates = prm.activeGates
    this.t += dt
    // advance the day-of-operations clock (loops the day)
    this.clockSec += dt * DAY_SCALE
    if (this.clockSec >= DAY_END) {
      this.clockSec = DAY_START + (this.clockSec - DAY_END)
      this.lastBoarded = 0
    }
    this.spawnAcc += (prm.rate / 60) * dt
    while (this.spawnAcc >= 1) {
      this.spawn()
      this.spawnAcc -= 1
    }

    // corridor occupancy counts ONLY people walking the corridors — people
    // queued at a desk/checkpoint belong to that station, not the lane.
    for (const l of LANES) l.occ = 0
    const byLane: Record<string, Agent[]> = {}
    for (const a of this.agents) {
      if (a.phase === PH.WALK_IN || a.phase === PH.TO_SEC || a.phase === PH.TO_GATE) {
        ;(byLane[a.lane] || (byLane[a.lane] = [])).push(a)
        laneOf(a.lane).occ++
      }
    }
    for (const id in byLane) byLane[id].sort((p, q) => p.s - q.s)

    const baseSpeed = 8 * prm.walk
    for (const a of this.agents) {
      if (a.phase === PH.WALK_IN || a.phase === PH.CHECKIN || a.phase === PH.TO_SEC || a.phase === PH.TO_GATE) {
        const l = laneOf(a.lane)
        const density = l.occ / (l.len * 0.55)
        const cf = Math.max(0.18, 1 - density * 0.5)
        let v = baseSpeed * a.speedBase * cf
        const arr = byLane[a.lane]
        if (arr) {
          const idx = arr.indexOf(a)
          if (idx >= 0 && idx < arr.length - 1) {
            const gap = arr[idx + 1].s - a.s
            if (gap < 1.1) v = Math.min(v, Math.max(0, (gap - 0.55) * 4))
          }
        }
        a.s += v * dt
        if (a.phase === PH.CHECKIN && a.s > l.len - 0.4) a.s = l.len - 0.4
        this.placeOnLane(a)
        if (a.phase === PH.TO_GATE && a.lane === a.gate.pier) {
          const target = a.gate.t * l.len
          if (a.s >= target) {
            a.phase = PH.AT_GATE
            a.atGate = this.t
            a.gate.load++
            continue
          }
        }
        if (a.s >= l.len - 0.2) {
          if (a.phase === PH.WALK_IN) {
            a.phase = PH.CHECKIN
            a.lane = 'checkin'
            a.s = 0
            this.stations.checkin.queue.push(a)
          } else if (a.phase === PH.TO_SEC) {
            a.phase = PH.SECURITY
            this.stations.security.queue.push(a)
          } else if (a.phase === PH.TO_GATE && a.lane === 'postsec') {
            a.lane = a.gate.pier
            a.s = 0
          }
        }
      }
      if (a.phase === PH.CHECKIN || a.phase === PH.SECURITY) {
        const st = a.phase === PH.CHECKIN ? P.checkin : P.security
        a.x = st.x + a.jitter * (a.phase === PH.CHECKIN ? 10 : 8.5)
        a.y = st.y + 2.4 + ((a.id * 37) % 9) * 0.62 + (a.phase === PH.SECURITY ? 0.5 : 0)
      }
    }

    this.serviceStation(this.stations.checkin, prm.chkDesks, T_CHECKIN, (a) => {
      a.phase = PH.TO_SEC
      a.lane = 'checkin'
      a.s = LANEMAP.checkin.len * 0.55
    })
    this.serviceStation(this.stations.security, prm.secLanes, T_SECURITY, (a) => {
      a.phase = PH.TO_GATE
      a.s = 0
      a.lane = 'postsec'
    })

    for (const a of this.agents) {
      if (a.phase === PH.AT_GATE) {
        a.x = a.gate.door.x + a.jitter * 1.5
        a.y = a.gate.door.y + ((a.id % 5) - 2) * 0.45
        if (this.t - (a.atGate || 0) > 8) {
          a.phase = PH.DONE
          a.gate.load = Math.max(0, a.gate.load - 1)
          this.served++
          this.thruWindow.push(this.t)
          this.transit.push(this.t - a.born)
          if (this.transit.length > 400) this.transit.shift()
        }
      }
    }

    // ---- flight departures & delays --------------------------------
    const wait = this.waitsMin()
    const active = this.activeSet()
    for (let gi = 0; gi < GATES.length; gi++) {
      if (this.t < this.nextDep[gi]) continue
      this.nextDep[gi] = this.t + this.headway[gi]
      if (!active.has(gi)) continue // closed stand → no flight
      const g = GATES[gi]
      const pierRatio = laneRatio(laneOf(g.pier))
      // delay driven by how long passengers wait to be processed, plus
      // crowding on the pier serving this stand.
      const delay = Math.max(0, wait.checkin + wait.security - FLIGHT_SLACK_MIN) + Math.max(0, pierRatio - 1) * 8 + Math.random() * 2
      this.flightDelays.push(delay)
      if (this.flightDelays.length > 60) this.flightDelays.shift()
      this.departures++
    }

    this.agents = this.agents.filter((a) => a.phase !== PH.DONE)
    if (this.agents.length > 5000) this.agents.splice(0, this.agents.length - 5000)
    this.thruWindow = this.thruWindow.filter((t) => this.t - t < 60)

    this.sampleHistory()
  }

  private sampleHistory() {
    if (this.clockSec - this.lastHist < 1800) return // every 30 simulated minutes
    this.lastHist = this.clockSec
    const tb = this.totalBoarded()
    const thru = Math.max(0, tb - this.lastBoarded)
    this.lastBoarded = tb
    const cong = this.snapshot().cong
    this.history.push({ clock: this.clockSec, thru, secWait: this.waitsMin().security, cong, inTerminal: this.agents.length })
    if (this.history.length > 96) this.history.shift()
  }
}

// Single shared engine instance for the app.
export const engine = new Engine()
