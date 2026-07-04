import { useMemo } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { clockStr } from './format'
import { useTwin } from '../state/store'

const axis = { stroke: 'var(--dt-line)', fontSize: 9 }
const grid = 'var(--dt-panel2)'
const tip = { background: 'var(--dt-panel2)', border: '1px solid var(--dt-line)', borderRadius: 6, fontSize: 11 } as const

export function AnalyticsPanel() {
  const history = useTwin((s) => s.dash.history)
  const gateUtil = useTwin((s) => s.dash.gateUtil)
  const series = useMemo(
    () => history.map((h) => ({ t: clockStr(h.clock), thru: h.thru, wait: Math.round(h.secWait), cong: h.cong })),
    [history],
  )

  return (
    <div className="sec">
      <h2>Analytics</h2>
      <Chart title="Passenger throughput (boarded / 30m)">
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={series} margin={{ top: 4, right: 6, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="t" {...axis} minTickGap={28} />
            <YAxis {...axis} width={28} />
            <Tooltip contentStyle={tip} />
            <Line type="monotone" dataKey="thru" stroke="var(--dt-accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </Chart>
      <Chart title="Avg security wait (min)">
        <ResponsiveContainer width="100%" height={92}>
          <AreaChart data={series} margin={{ top: 4, right: 6, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="w" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--dt-amber)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="var(--dt-amber)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="t" {...axis} minTickGap={28} />
            <YAxis {...axis} width={28} />
            <Tooltip contentStyle={tip} />
            <Area type="monotone" dataKey="wait" stroke="var(--dt-amber)" fill="url(#w)" strokeWidth={2} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Chart>
      <Chart title="Gate utilisation (%)">
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={gateUtil} margin={{ top: 4, right: 6, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="gate" {...axis} interval={0} />
            <YAxis {...axis} width={28} domain={[0, 100]} />
            <Tooltip contentStyle={tip} />
            <Bar dataKey="util" fill="var(--dt-good)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </Chart>
      <Chart title="Congestion index">
        <ResponsiveContainer width="100%" height={84}>
          <LineChart data={series} margin={{ top: 4, right: 6, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="t" {...axis} minTickGap={28} />
            <YAxis {...axis} width={28} />
            <Tooltip contentStyle={tip} />
            <Line type="stepAfter" dataKey="cong" stroke="var(--dt-red)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </Chart>
    </div>
  )
}

function Chart({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: 'var(--dt-mut)', marginBottom: 2 }}>{title}</div>
      {children}
    </div>
  )
}
