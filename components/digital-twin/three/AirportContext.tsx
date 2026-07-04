// Airport context props around the apron: control tower, hangars, fuel-tank
// farm, office blocks and floodlight masts. Dark theme with lit accents.
import { useTwin } from '../state/store'

function ControlTower({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 11, 0]} castShadow>
        <cylinderGeometry args={[2.2, 3.2, 22, 12]} />
        <meshStandardMaterial color={0x28324a} roughness={0.7} metalness={0.3} />
      </mesh>
      {/* cab */}
      <mesh position={[0, 24, 0]} castShadow>
        <cylinderGeometry args={[5.5, 4.2, 5, 8]} />
        <meshStandardMaterial color={0x0e1626} emissive={0x39d0d8} emissiveIntensity={0.5} roughness={0.2} metalness={0.4} />
      </mesh>
      <mesh position={[0, 27.4, 0]}>
        <cylinderGeometry args={[6, 6, 0.6, 8]} />
        <meshStandardMaterial color={0x1a2434} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 30, 0]}>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshBasicMaterial color="#ff5b6e" toneMapped={false} />
      </mesh>
    </group>
  )
}

function Hangar({ pos, w = 34, d = 26 }: { pos: [number, number, number]; w?: number; d?: number }) {
  return (
    <group position={pos}>
      <mesh position={[0, 6, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 12, d]} />
        <meshStandardMaterial color={0x1b2333} roughness={0.75} metalness={0.25} />
      </mesh>
      {/* curved roof */}
      <mesh position={[0, 12, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[d / 2, d / 2, w, 16, 1, true, 0, Math.PI]} />
        <meshStandardMaterial color={0x222c40} roughness={0.6} metalness={0.35} side={2} />
      </mesh>
      {/* lit door */}
      <mesh position={[0, 4.5, d / 2 + 0.05]}>
        <planeGeometry args={[w * 0.7, 8]} />
        <meshStandardMaterial color={0x0b1220} emissive={0x39d0d8} emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}

function FuelFarm({ pos }: { pos: [number, number, number] }) {
  const tanks: [number, number][] = [
    [-9, -6],
    [0, -6],
    [9, -6],
    [-4.5, 5],
    [4.5, 5],
  ]
  return (
    <group position={pos}>
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <boxGeometry args={[34, 0.4, 28]} />
        <meshStandardMaterial color={0x141a26} roughness={1} />
      </mesh>
      {tanks.map((t, i) => (
        <mesh key={i} position={[t[0], 4, t[1]]} castShadow>
          <cylinderGeometry args={[4, 4, 8, 16]} />
          <meshStandardMaterial color={0x3a4658} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function Office({ pos, w, h, d }: { pos: [number, number, number]; w: number; h: number; d: number }) {
  return (
    <mesh position={[pos[0], h / 2, pos[2]]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={0x18202f} emissive={0x1a3a52} emissiveIntensity={0.25} roughness={0.6} metalness={0.3} />
    </mesh>
  )
}

function Floodlight({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 8, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 16, 6]} />
        <meshStandardMaterial color={0x2a3446} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 16, 0.6]}>
        <boxGeometry args={[3, 1, 0.6]} />
        <meshBasicMaterial color="#fff3c4" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 15, 4]} intensity={30} distance={90} decay={2} color="#cfe0ff" />
    </group>
  )
}

export function AirportContext() {
  const show = useTwin((s) => s.layers.context)
  if (!show) return null
  return (
    <group>
      <ControlTower pos={[92, 0, 60]} />
      <Hangar pos={[-100, 0, -25]} />
      <Hangar pos={[-100, 0, 20]} />
      <Hangar pos={[-100, 0, 62]} />
      <FuelFarm pos={[100, 0, -62]} />
      <Office pos={[-95, 0, -70]} w={22} h={16} d={18} />
      <Office pos={[-70, 0, -78]} w={16} h={11} d={14} />
      <Floodlight pos={[-70, 0, -55]} />
      <Floodlight pos={[70, 0, -55]} />
      <Floodlight pos={[70, 0, 45]} />
      <Floodlight pos={[-70, 0, 45]} />
    </group>
  )
}
