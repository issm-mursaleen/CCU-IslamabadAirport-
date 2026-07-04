// Gate markers plus modeled aircraft docked at the departures-level (L3)
// stands, with jet bridges.
import { GATES, L3Y, dist, type Gate } from '../sim/geometry'
import { GATE_FLIGHT } from './flights'
import { useTwin } from '../state/store'

/** low-poly twin-engine jet, nose pointing +Z of the group, wheels at y≈0 */
function Jet({ tail }: { tail: number }) {
  const white = 0xeef2f8
  return (
    <group>
      {/* fuselage */}
      <mesh position={[0, 3.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[1.35, 9.5, 8, 16]} />
        <meshStandardMaterial color={white} roughness={0.35} metalness={0.3} />
      </mesh>
      <mesh position={[0, 3.2, 6.7]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[1.35, 2.6, 16]} />
        <meshStandardMaterial color={white} roughness={0.35} metalness={0.3} />
      </mesh>
      {/* window stripe */}
      <mesh position={[0, 3.85, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.36, 1.36, 8, 16, 1, true, -0.35, 0.7]} />
        <meshStandardMaterial color={0x0b1220} emissive={0x2a5a78} emissiveIntensity={0.3} side={2} />
      </mesh>
      {/* cockpit */}
      <mesh position={[0, 4.0, 5.6]}>
        <boxGeometry args={[1.5, 0.7, 1.3]} />
        <meshStandardMaterial color={0x0b1220} emissive={0x1a3a52} emissiveIntensity={0.4} />
      </mesh>
      {/* wings with dihedral + winglets */}
      <mesh position={[-4.6, 3.0, 0.4]} rotation={[0, 0, 0.06]} castShadow>
        <boxGeometry args={[8.5, 0.4, 3]} />
        <meshStandardMaterial color={white} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[4.6, 3.0, 0.4]} rotation={[0, 0, -0.06]} castShadow>
        <boxGeometry args={[8.5, 0.4, 3]} />
        <meshStandardMaterial color={white} roughness={0.4} metalness={0.3} />
      </mesh>
      {[-8.7, 8.7].map((x) => (
        <mesh key={x} position={[x, 3.5, 0.4]}>
          <boxGeometry args={[0.4, 1.4, 1.6]} />
          <meshStandardMaterial color={tail} emissive={tail} emissiveIntensity={0.2} />
        </mesh>
      ))}
      {/* engines */}
      {[-4.4, 4.4].map((x) => (
        <group key={x} position={[x, 2.2, 1.2]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[1.05, 1.05, 3.4, 14]} />
            <meshStandardMaterial color={0x2a3446} roughness={0.5} metalness={0.55} />
          </mesh>
          <mesh position={[0, 0, 1.75]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.9, 1.05, 0.4, 14, 1, true]} />
            <meshStandardMaterial color={0x0b1018} side={2} />
          </mesh>
        </group>
      ))}
      {/* tailplane + fin (livery) */}
      <mesh position={[0, 3.7, -5.7]} castShadow>
        <boxGeometry args={[7, 0.4, 1.8]} />
        <meshStandardMaterial color={white} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 5.6, -5.9]} rotation={[0.32, 0, 0]} castShadow>
        <boxGeometry args={[0.5, 4.2, 3.2]} />
        <meshStandardMaterial color={tail} emissive={tail} emissiveIntensity={0.3} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* main gear struts */}
      {[-1.4, 1.4].map((x) => (
        <mesh key={x} position={[x, 1.4, -0.5]}>
          <cylinderGeometry args={[0.18, 0.18, 3.6, 6]} />
          <meshStandardMaterial color={0x141a24} />
        </mesh>
      ))}
    </group>
  )
}

export function Gates() {
  const mode = useTwin((s) => s.mode)
  const showAircraft = useTwin((s) => s.layers.aircraft)
  const selectGate = useTwin((s) => s.selectGate)
  const selectedGate = useTwin((s) => s.selectedGate)
  const onSim = mode === 'stack' || mode === 2

  return (
    <group>
      {/* departures-floor gate desks (clickable → gate detail) */}
      <group visible={onSim}>
        {GATES.map((g) => {
          const col = g.pier === 'south' ? 0x7c9cff : g.pier === 'east' ? 0x39d0d8 : 0xc792ea
          const sel = selectedGate === g.id
          return (
            <group key={g.id} position={[g.door.x, L3Y, g.door.y]}>
              <mesh
                position={[0, 0.6, 0]}
                castShadow
                onClick={(e) => {
                  e.stopPropagation()
                  selectGate(sel ? null : g.id)
                }}
                onPointerOver={(e) => {
                  e.stopPropagation()
                  document.body.style.cursor = 'pointer'
                }}
                onPointerOut={() => (document.body.style.cursor = 'default')}
              >
                <boxGeometry args={[2.4, 1.2, 1.6]} />
                <meshStandardMaterial color={col} emissive={col} emissiveIntensity={sel ? 0.9 : 0.3} roughness={0.5} />
              </mesh>
              <mesh position={[0, 1.4, 0.5]} rotation={[-0.3, 0, 0]}>
                <boxGeometry args={[1.4, 0.7, 0.08]} />
                <meshStandardMaterial color={0x0b1220} emissive={col} emissiveIntensity={0.4} />
              </mesh>
              {sel && (
                <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[2.2, 2.8, 28]} />
                  <meshBasicMaterial color="#39d0d8" transparent opacity={0.9} side={2} />
                </mesh>
              )}
            </group>
          )
        })}
      </group>

      {/* aircraft docked at L3 stands */}
      <group visible={onSim && showAircraft}>
        {GATES.map((g: Gate) => {
          const fl = GATE_FLIGHT[g.id]
          const rot = -Math.atan2(g.perp.y, g.perp.x) + Math.PI / 2
          const bx = (g.door.x + g.ac.x) / 2
          const bz = (g.door.y + g.ac.y) / 2
          const blen = Math.max(2, dist(g.door, g.ac) - 5)
          const brot = -Math.atan2(g.ac.y - g.door.y, g.ac.x - g.door.x)
          return (
            <group key={g.id}>
              <group position={[g.ac.x, L3Y, g.ac.y]} rotation={[0, rot, 0]}>
                <Jet tail={fl.col} />
              </group>
              {/* jet bridge */}
              <mesh position={[bx, L3Y + 3, bz]} rotation={[0, brot, 0]} castShadow>
                <boxGeometry args={[blen, 2, 1.6]} />
                <meshStandardMaterial color={0x9fb2cc} roughness={0.6} metalness={0.3} />
              </mesh>
            </group>
          )
        })}
      </group>
    </group>
  )
}
