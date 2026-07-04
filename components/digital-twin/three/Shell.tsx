// Modeled terminal envelope: hexagonal processor hub, three pier volumes
// with arched roofs, a portal canopy, perimeter columns. Glass curtain
// walls go translucent when you focus a single floor so you can see in.
import { useMemo } from 'react'
import { P, dist, type Vec2 } from '../sim/geometry'
import { useTwin } from '../state/store'

const WALL_TOP = 2 * 15 + 4 // ≈ top of pier walls (L3 + parapet)
const HUB_TOP = 2 * 15 + 9

interface PierDef {
  id: string
  a: Vec2
  b: Vec2
  w: number
}
const PIERS: PierDef[] = [
  { id: 'south', a: P.junction, b: P.sTip, w: 9 },
  { id: 'east', a: P.junction, b: P.eTip, w: 8 },
  { id: 'west', a: P.junction, b: P.wTip, w: 8 },
]
const HUB = { x: P.junction.x, y: (P.junction.y + P.security.y) / 2 }

function pierTransform(p: PierDef) {
  const dx = p.b.x - p.a.x,
    dz = p.b.y - p.a.y
  const theta = Math.atan2(dz, dx)
  const len = dist(p.a, p.b) + 8
  const mid = { x: (p.a.x + p.b.x) / 2, y: (p.a.y + p.b.y) / 2 }
  return { theta, len, mid }
}

export function Shell() {
  const mode = useTwin((s) => s.mode)
  // The envelope spans all floors, so it only makes sense in the stacked view.
  const visible = mode === 'stack'
  const glass = 0.13
  const roofOp = 0.22

  const piers = useMemo(() => PIERS.map((p) => ({ def: p, ...pierTransform(p) })), [])

  return (
    <group visible={visible}>
      {/* Processor hub */}
      <mesh position={[HUB.x, HUB_TOP / 2 - 0.5, HUB.y]}>
        <cylinderGeometry args={[17, 19, HUB_TOP, 6]} />
        <meshPhysicalMaterial color={0x8fc6ff} transparent opacity={glass} roughness={0.08} metalness={0.2} transmission={0.6} side={2} />
      </mesh>
      {/* Hub roof cap */}
      <mesh position={[HUB.x, HUB_TOP - 0.5, HUB.y]}>
        <cylinderGeometry args={[12, 18, 5, 6]} />
        <meshStandardMaterial color={0x2f6f86} transparent opacity={roofOp} roughness={0.3} metalness={0.5} side={2} />
      </mesh>

      {piers.map(({ def, theta, len, mid }) => (
        <group key={def.id}>
          {/* pier glass volume */}
          <mesh position={[mid.x, WALL_TOP / 2 - 0.5, mid.y]} rotation={[0, -theta, 0]}>
            <boxGeometry args={[len, WALL_TOP, def.w]} />
            <meshPhysicalMaterial color={0x8fc6ff} transparent opacity={glass} roughness={0.08} metalness={0.2} transmission={0.6} side={2} />
          </mesh>
          {/* arched roof */}
          <mesh position={[mid.x, WALL_TOP - 0.5, mid.y]} rotation={[0, -theta, Math.PI / 2]}>
            <cylinderGeometry args={[def.w / 2 + 1.2, def.w / 2 + 1.2, len, 16, 1, true, 0, Math.PI]} />
            <meshStandardMaterial color={0x39d0d8} emissive={0x0d3540} transparent opacity={roofOp} roughness={0.25} metalness={0.4} side={2} />
          </mesh>
          {/* ridge beam */}
          <mesh position={[mid.x, WALL_TOP + def.w / 2 + 0.3, mid.y]} rotation={[0, -theta, 0]}>
            <boxGeometry args={[len, 0.5, 0.5]} />
            <meshStandardMaterial color={0x4f7fa5} metalness={0.6} roughness={0.4} />
          </mesh>
          {/* perimeter columns */}
          {Array.from({ length: 5 }).map((_, i) => {
            const t = i / 4
            const cx = def.a.x + (def.b.x - def.a.x) * t
            const cz = def.a.y + (def.b.y - def.a.y) * t
            const nx = -Math.sin(theta),
              nz = Math.cos(theta)
            return [1, -1].map((sgn) => (
              <mesh key={i + '_' + sgn} position={[cx + nx * sgn * (def.w / 2), (WALL_TOP - 0.5) / 2, cz + nz * sgn * (def.w / 2)]}>
                <cylinderGeometry args={[0.55, 0.55, WALL_TOP - 0.5, 8]} />
                <meshStandardMaterial color={0x32445f} metalness={0.5} roughness={0.5} />
              </mesh>
            ))
          })}
        </group>
      ))}

      {/* Portal canopy over the kerbside */}
      <group>
        <mesh position={[P.portal.x, 2 * 15 + 0.5, P.portal.y + 1]} rotation={[0, 0, 0]}>
          <boxGeometry args={[34, 0.6, 12]} />
          <meshStandardMaterial color={0x2f6f86} transparent opacity={roofOp + 0.08} roughness={0.3} metalness={0.5} side={2} />
        </mesh>
        {[-15, -5, 5, 15].map((dx) => (
          <mesh key={dx} position={[P.portal.x + dx, 15, P.portal.y + 5]}>
            <cylinderGeometry args={[0.5, 0.5, 2 * 15, 8]} />
            <meshStandardMaterial color={0x32445f} metalness={0.5} roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
