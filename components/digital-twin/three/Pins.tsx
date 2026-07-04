// Clickable component markers on each floor. Clicking selects the component
// (opens the info card); a small floating chip labels each one.
import { useState } from 'react'
import { Html } from '@react-three/drei'
import { COMPONENTS, FLOORY, uv, type Component } from '../sim/geometry'
import { useTwin } from '../state/store'

function hex(n: number) {
  return '#' + n.toString(16).padStart(6, '0')
}

function Pin({ c }: { c: Component }) {
  const [hover, setHover] = useState(false)
  const select = useTwin((s) => s.select)
  const selected = useTwin((s) => s.selected)
  const p = uv(c.u, c.v)
  const active = selected?.name === c.name
  const e = hover || active ? 1.1 : 0.6
  return (
    <group position={[p.x, FLOORY[c.f], p.y]}>
      <mesh
        position={[0, 3.4, 0]}
        scale={hover ? 1.25 : 1}
        onClick={(ev) => {
          ev.stopPropagation()
          select(c)
        }}
        onPointerOver={(ev) => {
          ev.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = 'default'
        }}
      >
        <octahedronGeometry args={[1.15]} />
        <meshStandardMaterial color={c.cat} emissive={c.cat} emissiveIntensity={e} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 3.4, 6]} />
        <meshBasicMaterial color={c.cat} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.7, 24]} />
        <meshBasicMaterial color={c.cat} transparent opacity={0.5} side={2} />
      </mesh>
      <Html position={[0, 5.3, 0]} center distanceFactor={60} pointerEvents="none" style={{ pointerEvents: 'none' }}>
        <div
          style={{
            whiteSpace: 'nowrap',
            font: '600 12px Segoe UI, sans-serif',
            color: hex(c.cat),
            background: 'rgba(10,16,26,0.82)',
            border: `1px solid ${hex(c.cat)}55`,
            padding: '2px 8px',
            borderRadius: 7,
            transform: hover || active ? 'scale(1.06)' : 'scale(1)',
          }}
        >
          {c.name}
        </div>
      </Html>
    </group>
  )
}

export function Pins() {
  const mode = useTwin((s) => s.mode)
  return (
    <group>
      {COMPONENTS.map((c) => (
        <group key={c.name} visible={mode === 'stack' || mode === c.f}>
          <Pin c={c} />
        </group>
      ))}
    </group>
  )
}
