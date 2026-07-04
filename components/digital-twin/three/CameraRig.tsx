// Orbit controls plus animated camera moves when the floor/view changes.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { FLOORY } from '../sim/geometry'
import { useTwin, type ViewMode } from '../state/store'

function goal(mode: ViewMode, topView: boolean) {
  // Stacked view frames the whole airport (terminal + apron + context).
  if (mode === 'stack') return { pos: new THREE.Vector3(30, 135, 195), tgt: new THREE.Vector3(0, 10, -12) }
  const y = FLOORY[mode]
  if (topView) return { pos: new THREE.Vector3(0, y + 95, 0.1), tgt: new THREE.Vector3(0, y, 0) }
  return { pos: new THREE.Vector3(0, y + 44, 78), tgt: new THREE.Vector3(0, y, 2) }
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const PRESETS: Record<string, { pos: THREE.Vector3; tgt: THREE.Vector3 }> = {
  overview: { pos: V(30, 135, 195), tgt: V(0, 10, -12) },
  departures: { pos: V(0, 92, 96), tgt: V(0, 30, 2) },
  south: { pos: V(0, 64, -74), tgt: V(0, 30, -27) },
  east: { pos: V(-82, 62, 42), tgt: V(-31, 30, 14) },
  west: { pos: V(82, 62, 42), tgt: V(31, 30, 14) },
  security: { pos: V(0, 62, 50), tgt: V(0, 30, 5) },
  portal: { pos: V(0, 58, 88), tgt: V(0, 30, 25) },
}

export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const controls = useRef<OrbitControlsImpl>(null!)
  const mode = useTwin((s) => s.mode)
  const topView = useTwin((s) => s.topView)
  const presetId = useTwin((s) => s.cameraPresetId)
  const trans = useRef<{ t0: number; p0: THREE.Vector3; p1: THREE.Vector3; q0: THREE.Vector3; q1: THREE.Vector3 } | null>(null)

  const moveTo = (pos: THREE.Vector3, tgt: THREE.Vector3) => {
    if (!controls.current) return
    trans.current = { t0: performance.now(), p0: camera.position.clone(), p1: pos.clone(), q0: controls.current.target.clone(), q1: tgt.clone() }
    controls.current.enabled = false
  }

  useEffect(() => {
    const g = goal(mode, topView)
    moveTo(g.pos, g.tgt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, topView])

  useEffect(() => {
    const p = PRESETS[presetId]
    if (p) moveTo(p.pos, p.tgt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId])

  useFrame(() => {
    if (!trans.current || !controls.current) return
    const k = Math.min(1, (performance.now() - trans.current.t0) / 850)
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
    camera.position.lerpVectors(trans.current.p0, trans.current.p1, e)
    controls.current.target.lerpVectors(trans.current.q0, trans.current.q1, e)
    if (k >= 1) {
      trans.current = null
      controls.current.enabled = true
    }
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.09}
      maxPolarAngle={Math.PI * 0.495}
      minDistance={30}
      maxDistance={650}
      target={[0, 10, -12]}
    />
  )
}
