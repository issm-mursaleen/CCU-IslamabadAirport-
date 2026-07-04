// In-canvas scene composition: lights, airport ground & context, building,
// simulation.
import { Floors } from './Floors'
import { Shell } from './Shell'
import { Gates } from './Gates'
import { Stations } from './Stations'
import { InteriorL3 } from './InteriorL3'
import { Lanes } from './Lanes'
import { Pins } from './Pins'
import { Passengers, SimDriver } from './Passengers'
import { AirportGround } from './AirportGround'
import { AirportContext } from './AirportContext'
import { CameraRig } from './CameraRig'

export function Scene() {
  return (
    <>
      <color attach="background" args={[0x080b12]} />
      <fog attach="fog" args={[0x080b12, 260, 900]} />

      <hemisphereLight args={[0x9fc0ff, 0x0a0e16, 0.55]} />
      <ambientLight intensity={0.18} />
      <directionalLight
        position={[120, 220, 90]}
        intensity={1.0}
        color={0xdfeaff}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-160}
        shadow-camera-right={160}
        shadow-camera-top={160}
        shadow-camera-bottom={-160}
        shadow-camera-near={10}
        shadow-camera-far={600}
      />
      {/* cool rim fill */}
      <directionalLight position={[-90, 60, -120]} intensity={0.25} color={0x39d0d8} />

      <AirportGround />
      <AirportContext />

      <Floors />
      <Shell />
      <InteriorL3 />
      <Gates />
      <Stations />
      <Lanes />
      <Pins />
      <Passengers />

      <SimDriver />
      <CameraRig />
    </>
  )
}
