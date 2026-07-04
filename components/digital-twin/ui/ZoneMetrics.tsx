import { useTwin } from '../state/store'

export function ZoneMetrics() {
  const zones = useTwin((s) => s.dash.zones)
  return (
    <div className="sec">
      <h2>Zone Occupancy (L3)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {zones.map((z) => (
          <div key={z.id} style={{ background: 'var(--dt-panel2)', border: '1px solid var(--dt-line)', borderRadius: 8, padding: '7px 10px' }}>
            <div style={{ fontSize: 10, color: 'var(--dt-mut)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{z.label}</div>
            <div style={{ fontFamily: 'var(--font-ibm-mono), monospace', fontSize: 18, color: 'var(--dt-txt)' }}>{z.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
