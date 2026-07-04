import type { Scenario } from '../sim/schedule'
import { useTwin } from '../state/store'

const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: 'normal', label: 'Normal Day' },
  { id: 'peak', label: 'Peak Hour Rush' },
  { id: 'cascade', label: 'Delayed Flight Cascade' },
  { id: 'security', label: 'Security Bottleneck' },
  { id: 'evacuation', label: 'Emergency Evacuation' },
]

export function ScenarioSelect() {
  const scenario = useTwin((s) => s.scenario)
  const setScenario = useTwin((s) => s.setScenario)
  return (
    <select
      value={scenario}
      onChange={(e) => setScenario(e.target.value as Scenario)}
      style={{ background: 'var(--dt-panel2)', border: '1px solid var(--dt-line)', borderRadius: 6, color: 'var(--dt-txt)', fontSize: 11, padding: '4px 7px', outline: 'none' }}
    >
      {SCENARIOS.map((s) => (
        <option key={s.id} value={s.id}>
          {s.label}
        </option>
      ))}
    </select>
  )
}
