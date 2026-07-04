// Right-hand operations dashboard: day clock + scenario, zone occupancy,
// gate detail, FIDS departures board and analytics.
import { ScenarioSelect } from './ScenarioSelect'
import { ZoneMetrics } from './ZoneMetrics'
import { GateDetailPanel } from './GateDetailPanel'
import { FlightBoard } from './FlightBoard'
import { AnalyticsPanel } from './AnalyticsPanel'
import { clockStr } from './format'
import { useTwin } from '../state/store'

export function RightPanel() {
  const open = useTwin((s) => s.dashOpen)
  const toggle = useTwin((s) => s.toggleDash)
  const clock = useTwin((s) => s.dash.clockSec)
  const onTime = useTwin((s) => s.kpis.onTime)

  if (!open)
    return (
      <button onClick={toggle} className="ov" style={{ position: 'absolute', top: 14, right: 14, zIndex: 20, cursor: 'pointer', color: 'var(--dt-accent)' }}>
        ☰ Ops
      </button>
    )

  return (
    <aside id="dash">
      <div className="dashhead">
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--dt-mut)' }}>Ops · Simulated day</div>
          <div style={{ fontFamily: 'var(--font-ibm-mono), monospace', fontSize: 22, color: 'var(--dt-accent)' }}>{clockStr(clock)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'var(--dt-mut)' }}>On-time</div>
          <div style={{ fontFamily: 'var(--font-ibm-mono), monospace', fontSize: 18, color: onTime > 85 ? 'var(--dt-good)' : onTime > 65 ? 'var(--dt-amber)' : 'var(--dt-red)' }}>{onTime}%</div>
        </div>
        <button onClick={toggle} style={{ background: 'none', border: 0, color: 'var(--dt-mut)', fontSize: 18, cursor: 'pointer', flex: 'none' }}>
          ⟩
        </button>
      </div>
      <div className="sec" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--dt-mut)' }}>Scenario</span>
        <ScenarioSelect />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <ZoneMetrics />
        <GateDetailPanel />
        <FlightBoard />
        <AnalyticsPanel />
      </div>
    </aside>
  )
}
