// Three stacked floor plates. Each plate's top surface shows the real CAD
// plan (blueprint) for that level; a thick slab gives it body. Focusing a
// single level ghosts the others.
import { useMemo } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { PW, PD, FLOORY } from '../sim/geometry'
import { useTwin } from '../state/store'

function usePlateGeometry() {
  return useMemo(() => {
    const g = new THREE.BufferGeometry()
    const hx = PW / 2,
      hz = PD / 2
    const pos = new Float32Array([-hx, 0, -hz, hx, 0, -hz, -hx, 0, hz, hx, 0, hz])
    const uv = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0])
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    g.setIndex([0, 2, 1, 1, 2, 3])
    g.computeVertexNormals()
    return g
  }, [])
}

export function Floors() {
  const mode = useTwin((s) => s.mode)
  const geo = usePlateGeometry()
  const tex = useTexture(['/plans/L1.png', '/plans/L2.png', '/plans/L3.png'])
  tex.forEach((t) => {
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
  })

  return (
    <group>
      {FLOORY.map((y, f) => {
        // In single-floor view only the selected level is shown.
        const visible = mode === 'stack' || mode === f
        return (
          <group key={f} position={[0, y, 0]} visible={visible}>
            {/* slab body */}
            <mesh position={[0, -0.45, 0]} receiveShadow>
              <boxGeometry args={[PW + 1.5, 0.7, PD + 1.5]} />
              <meshStandardMaterial color={0x0c1420} roughness={0.95} metalness={0.05} />
            </mesh>
            {/* glowing edge */}
            <lineSegments position={[0, -0.45, 0]}>
              <edgesGeometry args={[new THREE.BoxGeometry(PW + 1.5, 0.7, PD + 1.5)]} />
              <lineBasicMaterial color={0x2f8fb0} transparent opacity={0.6} />
            </lineSegments>
            {/* plan surface — dimmed to a subtle underlay beneath the 3D models */}
            <mesh geometry={geo} position={[0, 0.02, 0]}>
              <meshBasicMaterial map={tex[f]} color={0x3a4657} transparent opacity={0.55} depthWrite={false} />
            </mesh>
          </group>
        )
      })}
      {/* vertical service / elevator core — only in the stacked view */}
      <mesh position={[0, 15, 0.16 * PD]} visible={mode === 'stack'}>
        <boxGeometry args={[5, 2 * 15 + 1, 5]} />
        <meshStandardMaterial color={0x3a5f86} transparent opacity={0.18} roughness={0.2} metalness={0.5} side={2} />
      </mesh>
    </group>
  )
}
