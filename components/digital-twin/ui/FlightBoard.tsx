// FIDS-style departures board. Filter with the search box; click a row to
// select its gate (highlights the gate + opens the detail panel).
import { useMemo } from 'react'
import { clockStr } from './format'
import { useTwin } from '../state/store'
import type { FlightView } from '../sim/schedule'

function status(f: FlightView): { t: string; c: string } {
  if (f.status === 'departed') return { t: 'Departed', c: 'var(--dt-mut)' }
  if (f.status === 'boarding') return { t: 'Boarding', c: 'var(--dt-accent)' }
  if (f.status === 'delayed') return { t: `Delayed +${f.delayMin}m`, c: 'var(--dt-red)' }
  return { t: f.delayMin > 0 ? `Delayed +${f.delayMin}m` : 'On time', c: f.delayMin > 0 ? 'var(--dt-amber)' : 'var(--dt-good)' }
}

export function FlightBoard() {
  const flights = useTwin((s) => s.dash.flights)
  const clock = useTwin((s) => s.dash.clockSec)
  const search = useTwin((s) => s.search)
  const setSearch = useTwin((s) => s.setSearch)
  const selectGate = useTwin((s) => s.selectGate)
  const selectedGate = useTwin((s) => s.selectedGate)
  const setMode = useTwin((s) => s.setMode)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return flights
      .filter((f) => f.etd > clock - 20 * 60)
      .filter((f) => !q || f.code.toLowerCase().includes(q) || f.airline.toLowerCase().includes(q) || f.destination.toLowerCase().includes(q) || f.gateId.toLowerCase().includes(q))
      .sort((a, b) => a.etd - b.etd)
      .slice(0, 40)
  }, [flights, clock, search])

  return (
    <div className="sec">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Departures</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search…"
          style={{ background: 'var(--dt-panel2)', border: '1px solid var(--dt-line)', borderRadius: 6, color: 'var(--dt-txt)', fontSize: 11, padding: '3px 7px', width: 110, outline: 'none' }}
        />
      </div>
      <div style={{ maxHeight: 230, overflowY: 'auto' }}>
        <table style={{ width: '100%', fontSize: 11, fontFamily: 'var(--font-ibm-mono), monospace', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: 'var(--dt-mut)', textAlign: 'left' }}>
              <th style={{ padding: '2px 4px' }}>Flight</th>
              <th>Dest</th>
              <th>Gate</th>
              <th>ETD</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const st = status(f)
              const sel = selectedGate === f.gateId
              return (
                <tr
                  key={f.id}
                  onClick={() => {
                    selectGate(sel ? null : f.gateId)
                    if (!sel) setMode(2)
                  }}
                  style={{ cursor: 'pointer', borderTop: '1px solid var(--dt-line)', background: sel ? 'color-mix(in srgb, var(--dt-accent) 14%, transparent)' : 'transparent' }}
                >
                  <td style={{ padding: '3px 4px', color: 'var(--dt-txt)' }}>
                    {f.code}
                    {f.intl && <span style={{ color: 'var(--dt-accent)', fontSize: 9, marginLeft: 3 }}>INTL</span>}
                  </td>
                  <td style={{ color: 'var(--dt-txt)', maxWidth: 66, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.destination}</td>
                  <td style={{ color: 'var(--dt-txt)' }}>{f.gateId}</td>
                  <td style={{ color: 'var(--dt-txt)' }}>{clockStr(f.etd)}</td>
                  <td style={{ color: st.c }}>{st.t}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
