// Glowing congestion ribbons laid along each corridor lane on Level 3.
// Colour shifts green→amber→red with local density each frame.
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { LANES, L3Y, laneRatio, congHex, type Lane } from '../sim/geometry'
import { useTwin } from '../state/store'

function ribbonGeometry(l: Lane) {
  const pos: number[] = [],
    idx: number[] = [],
    n = l.pts.length
  for (let i = 0; i < n; i++) {
    const prev = l.pts[Math.max(0, i - 1)],
      next = l.pts[Math.min(n - 1, i + 1)]
    let dx = next.x - prev.x,
      dy = next.y - prev.y
    const m = Math.hypot(dx, dy) || 1
    dx /= m
    dy /= m
    const px = -dy,
      py = dx,
      w = l.width / 2,
      L = l.pts[i]
    pos.push(L.x + px * w, 0, L.y + py * w, L.x - px * w, 0, L.y - py * w)
  }
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export function Lanes() {
  const mode = useTwin((s) => s.mode)
  const show = mode === 'stack' || mode === 2
  const geos = useMemo(() => LANES.map(ribbonGeometry), [])
  const mats = useRef<THREE.MeshStandardMaterial[]>([])

  useFrame(() => {
    const heatmap = useTwin.getState().heatmap
    for (let i = 0; i < LANES.length; i++) {
      const mt = mats.current[i]
      if (!mt) continue
      if (heatmap) {
        const r = laneRatio(LANES[i])
        const h = congHex(r)
        mt.color.setHex(h)
        mt.emissive.setHex(h)
        mt.emissiveIntensity = 0.4 + Math.min(0.7, r * 0.6)
        mt.opacity = 0.82
      } else {
        mt.color.setHex(0x2a3c5a)
        mt.emissive.setHex(0x101822)
        mt.emissiveIntensity = 0.1
        mt.opacity = 0.5
      }
    }
  })

  return (
    <group position={[0, L3Y + 0.16, 0]} visible={show}>
      {LANES.map((l, i) => (
        <mesh key={l.id} geometry={geos[i]}>
          <meshStandardMaterial
            ref={(m) => m && (mats.current[i] = m)}
            color={0x28c76f}
            emissive={0x28c76f}
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
            roughness={0.6}
            side={2}
          />
        </mesh>
      ))}
    </group>
  )
}
