// Right-hand card describing the selected component, with a few live stats.
import type { ReactNode } from 'react'
import { engine } from '../sim/engine'
import { GATES, FLOOR_NAMES } from '../sim/geometry'
import { useTwin } from '../state/store'

export function InfoCard() {
  const selected = useTwin((s) => s.selected)
  const select = useTwin((s) => s.select)
  if (!selected) return null
  const c = selected

  let stat: ReactNode = null
  if (c.type === 'Processor' && /Security/.test(c.name))
    stat = (
      <>
        <span>
          Lanes open <b>{useTwin.getState().secLanes}</b>
        </span>
        <span>
          Queue <b>{engine.stations.security.queue.length}</b>
        </span>
      </>
    )
  else if (/Check-in/.test(c.name))
    stat = (
      <>
        <span>
          Desks open <b>{useTwin.getState().chkDesks}</b>
        </span>
        <span>
          Queue <b>{engine.stations.checkin.queue.length}</b>
        </span>
      </>
    )
  else if (c.type === 'Gates') {
    const pier = c.name.includes('South') ? 'south' : c.name.includes('East') ? 'east' : 'west'
    const list = GATES.filter((g) => g.pier === pier)
    const load = list.reduce((s, g) => s + g.load, 0)
    stat = (
      <>
        <span>
          Stands <b>{list.length}</b>
        </span>
        <span>
          At gate <b>{load}</b>
        </span>
      </>
    )
  }

  return (
    <div id="info" className="ov">
      <span className="x" onClick={() => select(null)}>
        ✕
      </span>
      <div className="it">{c.type}</div>
      <h3>{c.name}</h3>
      <div className="lv">{FLOOR_NAMES[c.f]}</div>
      <p>{c.desc}</p>
      {stat && <div className="stat">{stat}</div>}
    </div>
  )
}
