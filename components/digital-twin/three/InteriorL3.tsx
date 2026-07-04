// 3D terminal massing on the departures floor (L3): glass concourse balustrade
// walls along every corridor, gate-lounge seating, and retail/duty-free units —
// so the floor reads as a model, not just the (now dimmed) blueprint.
import { useMemo } from 'react'
import { GATES, LANES, L3Y, P, uv, type Vec2 } from '../sim/geometry'
import { useTwin } from '../state/store'

interface WallT {
  x: number
  z: number
  len: number
  rot: number
}

function buildWalls(): WallT[] {
  const walls: WallT[] = []
  for (const l of LANES) {
    for (let i = 1; i < l.pts.length; i++) {
      const a = l.pts[i - 1]
      const b = l.pts[i]
      const dx = b.x - a.x
      const dz = b.y - a.y
      const len = Math.hypot(dx, dz)
      if (len < 0.5) continue
      const nx = -dz / len
      const nz = dx / len
      const rot = -Math.atan2(dz, dx)
      const mx = (a.x + b.x) / 2
      const mz = (a.y + b.y) / 2
      for (const s of [1, -1]) {
        walls.push({ x: mx + nx * s * (l.width / 2), z: mz + nz * s * (l.width / 2), len, rot })
      }
    }
  }
  return walls
}

const RETAIL: { p: Vec2; w: number; d: number; sign: number }[] = [
  { p: uv(0.4, 0.5), w: 5, d: 4, sign: 0xffb648 },
  { p: uv(0.6, 0.5), w: 5, d: 4, sign: 0x39d0d8 },
  { p: uv(0.4, 0.42), w: 4, d: 4, sign: 0xc792ea },
  { p: uv(0.6, 0.42), w: 4, d: 4, sign: 0x7c9cff },
  { p: uv(0.5, 0.52), w: 6, d: 3.4, sign: 0xffb648 },
]

function GateSeats({ gx, gz, ix, iz }: { gx: number; gz: number; ix: number; iz: number }) {
  // two rows of seats set back from the gate toward the concourse
  const seats = []
  for (let row = 0; row < 2; row++) {
    for (let c = -1; c <= 1; c++) {
      seats.push([gx + ix * (2.5 + row * 1.4) + -iz * c * 1.5, iz * (2.5 + row * 1.4) + ix * c * 1.5 + gz] as const)
    }
  }
  return (
    <group>
      {seats.map((s, i) => (
        <mesh key={i} position={[s[0], L3Y + 0.45, s[1]]} castShadow>
          <boxGeometry args={[1, 0.9, 1]} />
          <meshStandardMaterial color={0x2b3446} roughness={0.7} metalness={0.15} />
        </mesh>
      ))}
    </group>
  )
}

export function InteriorL3() {
  const mode = useTwin((s) => s.mode)
  const onSim = mode === 'stack' || mode === 2
  const walls = useMemo(buildWalls, [])

  return (
    <group visible={onSim}>
      {/* concourse balustrade walls */}
      {walls.map((w, i) => (
        <mesh key={i} position={[w.x, L3Y + 1.2, w.z]} rotation={[0, w.rot, 0]}>
          <boxGeometry args={[w.len, 2.4, 0.3]} />
          <meshStandardMaterial color={0x1c2942} emissive={0x39d0d8} emissiveIntensity={0.1} transparent opacity={0.6} metalness={0.4} roughness={0.3} />
        </mesh>
      ))}

      {/* gate-lounge seating (inner side of each gate) */}
      {GATES.map((g) => {
        // inward direction (toward concourse centreline) = -perp
        const ix = -g.perp.x
        const iz = -g.perp.y
        return <GateSeats key={g.id} gx={g.door.x} gz={g.door.y} ix={ix} iz={iz} />
      })}

      {/* retail / duty-free units */}
      {RETAIL.map((r, i) => (
        <group key={i} position={[r.p.x, L3Y, r.p.y]}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <boxGeometry args={[r.w, 2.2, r.d]} />
            <meshStandardMaterial color={0x16202f} roughness={0.6} metalness={0.3} />
          </mesh>
          {/* lit signage band */}
          <mesh position={[0, 2.3, 0]}>
            <boxGeometry args={[r.w + 0.2, 0.4, r.d + 0.2]} />
            <meshStandardMaterial color={r.sign} emissive={r.sign} emissiveIntensity={0.7} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* check-in / security halls hinted by the P nodes already have desks in Stations */}
      <mesh position={[P.junction.x, L3Y + 0.05, P.junction.y]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4, 4.6, 32]} />
        <meshBasicMaterial color="#28c76f" transparent opacity={0.4} side={2} />
      </mesh>
    </group>
  )
}
