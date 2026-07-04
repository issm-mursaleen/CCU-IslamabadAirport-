import { GATES } from '../sim/geometry'
import { clockStr, GATE_COLORS } from './format'
import { useTwin } from '../state/store'

export function GateDetailPanel() {
  const id = useTwin((s) => s.selectedGate)
  const gates = useTwin((s) => s.dash.gates)
  const selectGate = useTwin((s) => s.selectGate)
  if (!id) return null
  const g = GATES.find((x) => x.id === id)
  const info = gates[id]
  const f = info?.flight
  const util = f ? Math.min(100, Math.round((f.boarded / f.paxCount) * 100)) : 0
  const col = GATE_COLORS[info?.status ?? 'available']

  return (
    <div className="sec" style={{ background: 'color-mix(in srgb, var(--dt-accent) 5%, transparent)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ margin: 0, color: col }}>
          Gate {id} <span style={{ color: 'var(--dt-mut)', fontWeight: 400 }}>· {g?.pier} pier</span>
        </h2>
        <span style={{ cursor: 'pointer', color: 'var(--dt-mut)' }} onClick={() => selectGate(null)}>
          ✕
        </span>
      </div>
      {f ? (
        <div style={{ fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-ibm-mono), monospace', color: 'var(--dt-txt)' }}>{f.code}</span>
            <span style={{ color: 'var(--dt-txt)' }}>{f.airline}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--dt-mut)', fontSize: 11, marginBottom: 8 }}>
            <span>→ {f.destination}</span>
            <span>
              ETD {clockStr(f.etd)}
              {f.delayMin > 0 && <span style={{ color: 'var(--dt-red)' }}> (+{f.delayMin}m)</span>}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--dt-mut)', marginBottom: 3 }}>
            <span>
              Boarded {f.boarded} / {f.paxCount}
            </span>
            <span>{util}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'var(--dt-panel2)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${util}%`, background: 'var(--dt-good)' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Stat k="Status" v={info?.status ?? '—'} />
            <Stat k="Aircraft" v={f.body === 'wide' ? 'Wide-body' : 'Narrow-body'} />
            <Stat k="Turn" v={`${45 + (id.charCodeAt(1) % 5) * 5}m`} />
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--dt-mut)' }}>No active flight — gate available.</div>
      )}
    </div>
  )
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ flex: 1, background: 'var(--dt-panel2)', border: '1px solid var(--dt-line)', borderRadius: 6, padding: '4px 7px' }}>
      <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--dt-mut)' }}>{k}</div>
      <div style={{ fontSize: 11, color: 'var(--dt-txt)', textTransform: 'capitalize' }}>{v}</div>
    </div>
  )
}
