import { useTwin } from '../state/store'

export const CAM_PRESETS: { id: string; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'departures', label: 'Departures' },
  { id: 'south', label: 'South Pier' },
  { id: 'east', label: 'East Wing' },
  { id: 'west', label: 'West Wing' },
  { id: 'security', label: 'Security' },
  { id: 'portal', label: 'Portal' },
]

export function CameraPresets() {
  const active = useTwin((s) => s.cameraPresetId)
  const set = useTwin((s) => s.setCameraPreset)
  return (
    <div id="campresets">
      {CAM_PRESETS.map((p) => (
        <button key={p.id} className={'chip' + (active === p.id ? ' on' : '')} onClick={() => set(p.id)}>
          {p.label}
        </button>
      ))}
    </div>
  )
}
