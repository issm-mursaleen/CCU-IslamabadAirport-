// Drives the simulation each frame and renders passengers as an
// InstancedMesh. Also publishes throttled KPIs to the store.
import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { engine } from '../sim/engine'
import { L3Y } from '../sim/geometry'
import { useTwin } from '../state/store'

const MAX = 3000
const tmp = new THREE.Object3D()
const col = new THREE.Color()

/** A little person: torso capsule + head sphere, with baked vertex colours
 *  (head brighter than body) that the per-instance pier colour multiplies. */
function makePersonGeometry() {
  const paint = (g: THREE.BufferGeometry, shade: number) => {
    const n = g.attributes.position.count
    const c = new Float32Array(n * 3)
    for (let i = 0; i < n * 3; i++) c[i] = shade
    g.setAttribute('color', new THREE.BufferAttribute(c, 3))
    return g
  }
  const body = new THREE.CapsuleGeometry(0.3, 0.6, 4, 10)
  body.translate(0, 0.6, 0) // base at floor
  paint(body, 0.7)
  const head = new THREE.SphereGeometry(0.27, 12, 10)
  head.translate(0, 1.4, 0)
  paint(head, 1.0)
  return mergeGeometries([body, head], false)!
}

export function SimDriver() {
  const lastKpi = useRef(0)
  useFrame((_, delta) => {
    const s = useTwin.getState()
    if (s.running) {
      const dt = Math.min(0.05, delta) * s.speed
      const steps = Math.max(1, Math.ceil(dt / 0.05))
      const prm = { rate: s.rate, secLanes: s.secLanes, chkDesks: s.chkDesks, activeGates: s.activeGates, walk: s.walk }
      for (let i = 0; i < steps; i++) engine.update(dt / steps, prm)
    }
    if (engine.t - lastKpi.current >= 0.25) {
      lastKpi.current = engine.t
      const store = useTwin.getState()
      store.setKpis(engine.snapshot())
      store.setDash({
        clockSec: engine.clockSec,
        flights: engine.flightViews(),
        gates: engine.gateStatuses(),
        zones: engine.zoneMetrics(),
        gateUtil: engine.gateUtil(),
        history: engine.history.slice(),
      })
    }
  })
  return null
}

export function Passengers() {
  const mode = useTwin((s) => s.mode)
  const showPax = useTwin((s) => s.layers.passengers)
  const show = (mode === 'stack' || mode === 2) && showPax
  const ref = useRef<THREE.InstancedMesh>(null!)
  const geo = useMemo(() => makePersonGeometry(), [])

  useEffect(() => {
    // make sure instanceColor buffer exists
    ref.current.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3)
  }, [])

  useFrame(() => {
    const mesh = ref.current
    if (!mesh || !show) return
    const n = Math.min(engine.agents.length, MAX)
    for (let i = 0; i < n; i++) {
      const a = engine.agents[i]
      tmp.position.set(a.x, L3Y + 0.06, a.y)
      tmp.rotation.set(0, 0, 0)
      tmp.scale.set(1, 1, 1)
      tmp.updateMatrix()
      mesh.setMatrixAt(i, tmp.matrix)
      col.setHex(a.colHex)
      mesh.setColorAt(i, col)
    }
    tmp.position.set(0, -9999, 0)
    tmp.updateMatrix()
    for (let i = n; i < mesh.count; i++) mesh.setMatrixAt(i, tmp.matrix)
    mesh.count = n
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[geo, undefined, MAX]} visible={show} frustumCulled={false} castShadow>
      <meshStandardMaterial roughness={0.5} metalness={0.1} vertexColors />
    </instancedMesh>
  )
}
