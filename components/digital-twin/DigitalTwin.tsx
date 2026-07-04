"use client";

// Reusable <DigitalTwin /> component: a 3D canvas (react-three-fiber) plus
// the HTML control overlays. Drop this into any React app.
//
//   import { DigitalTwin } from './DigitalTwin'
//   <DigitalTwin />            // fills its parent (position: relative)
//
import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './three/Scene'
import { Sidebar } from './ui/Sidebar'
import { Hud } from './ui/Hud'
import { InfoCard } from './ui/InfoCard'
import { LayerBar } from './ui/LayerBar'
import { RightPanel } from './ui/RightPanel'
import { CameraPresets } from './ui/CameraPresets'
import { useTwin } from './state/store'
import { engine } from './sim/engine'
import './styles.css'

const isDev = process.env.NODE_ENV !== 'production'

export function DigitalTwin() {
  const select = useTwin((s) => s.select)
  const selectGate = useTwin((s) => s.selectGate)
  useEffect(() => {
    // dev-only debug hook (stripped from production builds)
    if (isDev) (window as unknown as { twin: unknown }).twin = { engine, store: useTwin }
  }, [])
  return (
    <div className="digital-twin-root">
      <div id="app">
        <Sidebar />
        <div id="stage">
          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{ position: [30, 135, 195], fov: 46, near: 0.5, far: 3000 }}
            onPointerMissed={() => {
              select(null)
              selectGate(null)
            }}
            onCreated={(state) => {
              if (isDev) (window as unknown as { twinScene: unknown; twinR3F: unknown }).twinScene = state.scene
              if (isDev) (window as unknown as { twinR3F: unknown }).twinR3F = state
            }}
          >
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>
          <Hud />
          <InfoCard />
          <CameraPresets />
          <LayerBar />
        </div>
        <RightPanel />
      </div>
    </div>
  )
}
