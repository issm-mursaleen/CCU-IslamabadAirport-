// Floating overlays: current view label (top-left) and sim clock (top-right).
import { FLOOR_NAMES } from '../sim/geometry'
import { useTwin } from '../state/store'

export function Hud() {
  const mode = useTwin((s) => s.mode)
  const clock = useTwin((s) => s.kpis.clock)
  const view = mode === 'stack' ? 'Stacked Building' : FLOOR_NAMES[mode]
  const mm = String(Math.floor(clock / 60)).padStart(2, '0')
  const ss = String(clock % 60).padStart(2, '0')
  return (
    <>
      <div id="hud" className="ov">
        View: <b>{view}</b>
      </div>
      <div id="clock" className="ov">
        ⏱ {mm}:{ss}
      </div>
    </>
  )
}
