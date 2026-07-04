// Modeled check-in desks and security lanes on Level 3. The number of units
// tracks the "Check-in desks" / "Security lanes" sliders.
import { P, L3Y } from '../sim/geometry'
import { useTwin } from '../state/store'

function DeskRow({
  cx,
  cz,
  n,
  color,
  kind,
}: {
  cx: number
  cz: number
  n: number
  color: number
  kind: 'checkin' | 'security'
}) {
  const span = Math.min(kind === 'checkin' ? 30 : 26, n * 2.8)
  const cell = span / n
  return (
    <group>
      {Array.from({ length: n }).map((_, i) => {
        const x = cx - span / 2 + (i + 0.5) * cell
        return (
          <group key={i} position={[x, L3Y, cz]}>
            {/* counter / lane base */}
            <mesh position={[0, 0.6, 0]} castShadow>
              <boxGeometry args={[cell * 0.62, 1.2, kind === 'checkin' ? 1.6 : 2.6]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} roughness={0.5} metalness={0.2} />
            </mesh>
            {kind === 'checkin' ? (
              // agent monitor
              <mesh position={[0, 1.55, 0.4]} rotation={[-0.25, 0, 0]}>
                <boxGeometry args={[0.9, 0.6, 0.08]} />
                <meshStandardMaterial color={0x0c1420} emissive={0x39d0d8} emissiveIntensity={0.4} />
              </mesh>
            ) : (
              // archway gantry for the screening lane
              <group>
                <mesh position={[cell * 0.28, 1.5, 0]}>
                  <boxGeometry args={[0.18, 2.4, 1.4]} />
                  <meshStandardMaterial color={0xcfe0f5} roughness={0.4} metalness={0.3} />
                </mesh>
                <mesh position={[-cell * 0.28, 1.5, 0]}>
                  <boxGeometry args={[0.18, 2.4, 1.4]} />
                  <meshStandardMaterial color={0xcfe0f5} roughness={0.4} metalness={0.3} />
                </mesh>
                <mesh position={[0, 2.75, 0]}>
                  <boxGeometry args={[cell * 0.64, 0.25, 1.4]} />
                  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
                </mesh>
              </group>
            )}
          </group>
        )
      })}
    </group>
  )
}

export function Stations() {
  const mode = useTwin((s) => s.mode)
  const chkDesks = useTwin((s) => s.chkDesks)
  const secLanes = useTwin((s) => s.secLanes)
  const show = mode === 'stack' || mode === 2
  return (
    <group visible={show}>
      <DeskRow cx={P.checkin.x} cz={P.checkin.y} n={chkDesks} color={0x7c9cff} kind="checkin" />
      <DeskRow cx={P.security.x} cz={P.security.y} n={secLanes} color={0x39d0d8} kind="security" />
    </group>
  )
}
