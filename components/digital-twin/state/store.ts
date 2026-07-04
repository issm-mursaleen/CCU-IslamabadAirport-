import { create } from 'zustand'
import { engine, type HistoryPoint } from '../sim/engine'
import type { Component } from '../sim/geometry'
import type { FlightView, GateStatus, Scenario } from '../sim/schedule'

export type ViewMode = 'stack' | 0 | 1 | 2

export interface Kpis {
  inSystem: number
  thru: number
  transit: number
  cong: number
  clock: number
  clockSec: number
  lanes: { id: string; label: string; occ: number; ratio: number }[]
  // processing waits (displayed minutes)
  chkWait: number
  secWait: number
  // flight punctuality
  onTime: number
  avgDelay: number
  delayed: number
  departures: number
}

export interface Dash {
  clockSec: number
  flights: FlightView[]
  gates: Record<string, { status: GateStatus; flight?: FlightView }>
  zones: { id: string; label: string; count: number }[]
  gateUtil: { gate: string; util: number }[]
  history: HistoryPoint[]
}

export interface Layers {
  aircraft: boolean
  labels: boolean
  context: boolean
  routes: boolean
  passengers: boolean
}

interface TwinState {
  // view
  mode: ViewMode
  topView: boolean
  selected: Component | null
  selectedGate: string | null
  layers: Layers
  scenario: Scenario
  search: string
  cameraPresetId: string
  dashOpen: boolean
  dash: Dash
  // sim params
  running: boolean
  heatmap: boolean
  rate: number
  secLanes: number
  chkDesks: number
  activeGates: number
  walk: number
  speed: number
  // live readouts
  kpis: Kpis
  // actions
  setMode: (m: ViewMode) => void
  toggleTop: () => void
  select: (c: Component | null) => void
  selectGate: (id: string | null) => void
  set: (patch: Partial<TwinState>) => void
  setKpis: (k: Kpis) => void
  setDash: (d: Dash) => void
  toggleLayer: (k: keyof Layers) => void
  setScenario: (s: Scenario) => void
  setSearch: (s: string) => void
  setCameraPreset: (id: string) => void
  toggleDash: () => void
}

export const useTwin = create<TwinState>((set) => ({
  mode: 'stack',
  topView: false,
  selected: null,
  selectedGate: null,
  layers: { aircraft: true, labels: true, context: true, routes: true, passengers: true },
  scenario: 'normal',
  search: '',
  cameraPresetId: 'overview',
  dashOpen: true,
  dash: { clockSec: 5 * 3600, flights: [], gates: {}, zones: [], gateUtil: [], history: [] },
  running: true,
  heatmap: true,
  rate: 45,
  secLanes: 6,
  chkDesks: 9,
  activeGates: 19,
  walk: 1,
  speed: 1,
  kpis: { inSystem: 0, thru: 0, transit: 0, cong: 0, clock: 0, clockSec: 5 * 3600, lanes: [], chkWait: 0, secWait: 0, onTime: 100, avgDelay: 0, delayed: 0, departures: 0 },
  setMode: (mode) => set({ mode, selected: null }),
  toggleTop: () => set((s) => ({ topView: !s.topView })),
  select: (selected) => set({ selected }),
  selectGate: (selectedGate) => set({ selectedGate }),
  set: (patch) => set(patch),
  setKpis: (kpis) => set({ kpis }),
  setDash: (dash) => set({ dash }),
  toggleLayer: (k) => set((s) => ({ layers: { ...s.layers, [k]: !s.layers[k] } })),
  setScenario: (scenario) =>
    set((s) => {
      const rec = engine.setScenario(scenario)
      return { scenario, selectedGate: null, ...rec, rate: rec.rate ?? s.rate, secLanes: rec.secLanes ?? s.secLanes }
    }),
  setSearch: (search) => set({ search }),
  setCameraPreset: (cameraPresetId) => set({ cameraPresetId }),
  toggleDash: () => set((s) => ({ dashOpen: !s.dashOpen })),
}))
