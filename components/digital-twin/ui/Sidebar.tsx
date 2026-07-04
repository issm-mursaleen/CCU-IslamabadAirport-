// Left control panel: floor selector, KPIs, demand/ops sliders, controls,
// and the live per-lane congestion list.
import { engine } from '../sim/engine'
import { congHex, FLOOR_NAMES } from '../sim/geometry'
import { useTwin, type ViewMode } from '../state/store'

function hex(n: number) {
  return '#' + n.toString(16).padStart(6, '0')
}

function Slider({ label, value, min, max, fmt, onChange }: { label: string; value: number; min: number; max: number; fmt?: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <div className="row">
      <label>{label}</label>
      <span>
        <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} />
        <span className="val">{fmt ? fmt(value) : value}</span>
      </span>
    </div>
  )
}

export function Sidebar() {
  const s = useTwin()
  const k = s.kpis

  const floorBtn = (m: ViewMode, title: string, sub: string) => (
    <button className={s.mode === m ? 'act' : ''} onClick={() => s.setMode(m)}>
      <span className="fl-t">{title}</span>
      <span className="fl-s">{sub}</span>
    </button>
  )

  return (
    <aside id="side">
      <div className="brand">
        <h1>
          <span className="dot" />
          PTB — 3D Digital Twin
        </h1>
        <div className="sub">Passenger Terminal Building · Multi-Floor · Lane-Congestion Simulation</div>
      </div>

      <div className="sec">
        <h2>Floor / View</h2>
        <div className="btns floorbtns" style={{ flexDirection: 'column' }}>
          {floorBtn('stack', '▣ Stacked Building', 'All levels · exploded view')}
          {floorBtn(2, 'Level 3 — Departures', 'Check-in · Security · Gates · live sim')}
          {floorBtn(1, 'Level 2 — Processing', 'Transfer · lounges · plant')}
          {floorBtn(0, 'Level 1 — Arrivals', 'Baggage · immigration · apron')}
        </div>
        <div className="btns" style={{ marginTop: 8 }}>
          <button onClick={s.toggleTop}>🎥 {s.topView ? 'Perspective' : 'Top-down'}</button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--dt-mut)', marginTop: 8 }}>Click any glowing pin to inspect a component.</div>
      </div>

      <div className="sec">
        <h2>Departures (L3) — Live KPIs</h2>
        <div className="kpis">
          <div className="kpi">
            <div className="k">In Terminal</div>
            <div className="v">{k.inSystem}</div>
          </div>
          <div className="kpi">
            <div className="k">Throughput</div>
            <div className="v">
              {k.thru} <span className="u">pax/min</span>
            </div>
          </div>
          <div className="kpi">
            <div className="k">Avg Transit</div>
            <div className="v">
              {k.transit}
              <span className="u"> s</span>
            </div>
          </div>
          <div className="kpi">
            <div className="k">Congestion</div>
            <div className="v" style={{ color: k.cong > 66 ? 'var(--dt-red)' : k.cong > 38 ? 'var(--dt-amber)' : 'var(--dt-good)' }}>
              {k.cong}
              <span className="u">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sec">
        <h2>Flight Punctuality</h2>
        <div className="kpis">
          <div className="kpi">
            <div className="k">On-time</div>
            <div className="v" style={{ color: k.onTime > 85 ? 'var(--dt-good)' : k.onTime > 65 ? 'var(--dt-amber)' : 'var(--dt-red)' }}>
              {k.onTime}
              <span className="u">%</span>
            </div>
          </div>
          <div className="kpi">
            <div className="k">Avg Delay</div>
            <div className="v">
              {k.avgDelay.toFixed(1)}
              <span className="u"> min</span>
            </div>
          </div>
          <div className="kpi">
            <div className="k">Delayed</div>
            <div className="v">
              {k.delayed}
              <span className="u"> /{Math.min(60, k.departures)}</span>
            </div>
          </div>
          <div className="kpi">
            <div className="k">Departures</div>
            <div className="v">{k.departures}</div>
          </div>
        </div>
        <div className="st" style={{ marginTop: 10 }}>
          <span className="nm">Check-in wait</span>
          <span className="val">{k.chkWait.toFixed(1)} min</span>
        </div>
        <div className="st">
          <span className="nm">Security wait</span>
          <span className="val">{k.secWait.toFixed(1)} min</span>
        </div>
      </div>

      <div className="sec">
        <h2>Demand & Operations</h2>
        <Slider label="Arrival rate" value={s.rate} min={5} max={160} onChange={(v) => s.set({ rate: v })} />
        <Slider label="Security lanes open" value={s.secLanes} min={1} max={10} onChange={(v) => s.set({ secLanes: v })} />
        <Slider label="Check-in desks open" value={s.chkDesks} min={2} max={14} onChange={(v) => s.set({ chkDesks: v })} />
        <Slider label="Gates open" value={s.activeGates} min={6} max={19} onChange={(v) => s.set({ activeGates: v })} />
        <Slider label="Walk speed" value={Math.round(s.walk * 100)} min={40} max={160} fmt={(v) => (v / 100).toFixed(1) + '×'} onChange={(v) => s.set({ walk: v / 100 })} />
        <Slider label="Sim speed" value={Math.round(s.speed * 100)} min={25} max={500} fmt={(v) => (v / 100).toFixed(1) + '×'} onChange={(v) => s.set({ speed: v / 100 })} />
      </div>

      <div className="sec">
        <h2>Controls</h2>
        <div className="btns" style={{ marginBottom: 8 }}>
          <button className="pri" onClick={() => s.set({ running: !s.running })}>
            {s.running ? '⏸ Pause' : '▶ Resume'}
          </button>
          <button onClick={() => engine.reset()}>↺ Reset</button>
        </div>
        <div className="btns">
          <button
            onClick={() => {
              engine.surge(120)
              s.set({ rate: 140 })
              if (s.mode !== 'stack' && s.mode !== 2) s.setMode(2)
            }}
          >
            ⚡ Peak Surge
          </button>
          <button onClick={() => s.set({ heatmap: !s.heatmap })}>🔥 Heatmap: {s.heatmap ? 'ON' : 'OFF'}</button>
        </div>
      </div>

      <div className="sec">
        <h2>Lane Congestion (L3)</h2>
        <div className="station-list">
          {k.lanes.map((l) => {
            const c = hex(congHex(l.ratio))
            const lbl = l.ratio > 1 ? 'JAM' : l.ratio > 0.6 ? 'BUSY' : 'OK'
            return (
              <div className="st" key={l.id}>
                <span className="nm">{l.label}</span>
                <span className="pill" style={{ background: c + '22', color: c, border: `1px solid ${c}55` }}>
                  {l.occ} · {lbl}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="sec">
        <h2>Density Legend</h2>
        <div className="legend">
          <div className="lg">
            <span className="sw" style={{ background: 'var(--dt-good)' }} />
            Free flow · low density
          </div>
          <div className="lg">
            <span className="sw" style={{ background: 'var(--dt-amber)' }} />
            Building · moderate
          </div>
          <div className="lg">
            <span className="sw" style={{ background: 'var(--dt-red)' }} />
            Congested · bottleneck
          </div>
        </div>
      </div>

      <div className="foot">Floor surfaces are the real PTB CAD plans (Levels 1–3) rendered as blueprints inside a modeled glass shell. Each capsule = one passenger.</div>
    </aside>
  )
}
