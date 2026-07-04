// Airside ground: grass, apron pad, a runway with edge lights & centreline,
// glowing taxiway / service-road routes, and stand markings.
import { Line } from '@react-three/drei'
import { useTwin } from '../state/store'

type P3 = [number, number, number]
const Y = 0.16

const ROUTES: { name: string; color: string; pts: P3[]; label: P3 }[] = [
  {
    name: 'RWY 09/27',
    color: '#39d0d8',
    pts: [
      [-165, Y, -120],
      [165, Y, -120],
    ],
    label: [120, Y, -120],
  },
  {
    name: 'Taxiway A',
    color: '#ffcf3f',
    pts: [
      [-72, Y, -60],
      [72, Y, -60],
      [72, Y, 46],
      [-72, Y, 46],
      [-72, Y, -60],
    ],
    label: [72, Y, -8],
  },
  {
    name: 'Taxiway B',
    color: '#ffcf3f',
    pts: [
      [0, Y, -60],
      [0, Y, -120],
    ],
    label: [0, Y, -92],
  },
  {
    name: 'Service Rd',
    color: '#ff5b6e',
    pts: [
      [78, Y, 22],
      [122, Y, 22],
      [122, Y, -42],
      [78, Y, -42],
    ],
    label: [122, Y, -10],
  },
]

function RunwayLights() {
  const items: P3[] = []
  for (let x = -160; x <= 160; x += 12) {
    items.push([x, 0.4, -132])
    items.push([x, 0.4, -108])
  }
  return (
    <group>
      {items.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.7, 6, 6]} />
          <meshBasicMaterial color={i % 2 ? '#8fdcff' : '#ffffff'} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

export function AirportGround() {
  const showRoutes = useTwin((s) => s.layers.routes)

  return (
    <group>
      {/* grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.62, -30]} receiveShadow>
        <planeGeometry args={[1000, 900]} />
        <meshStandardMaterial color={0x0c1512} roughness={1} />
      </mesh>
      {/* apron pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.46, -10]} receiveShadow>
        <planeGeometry args={[330, 300]} />
        <meshStandardMaterial color={0x10141d} roughness={0.95} metalness={0.05} />
      </mesh>
      {/* runway strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, -120]} receiveShadow>
        <planeGeometry args={[340, 26]} />
        <meshStandardMaterial color={0x0d1119} roughness={1} />
      </mesh>
      <Line points={[[-165, 0.1, -120], [165, 0.1, -120]]} color="#c9d6ea" lineWidth={1.5} dashed dashSize={7} gapSize={6} transparent opacity={0.55} />
      <RunwayLights />

      {/* glowing routes */}
      {showRoutes &&
        ROUTES.map((r) => (
          <group key={r.name}>
            <Line points={r.pts} color={r.color} lineWidth={3} transparent opacity={0.9} />
          </group>
        ))}
    </group>
  )
}
