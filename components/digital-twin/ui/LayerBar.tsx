// Bottom toolbar of layer toggle chips (like the reference view).
import { useTwin, type Layers } from '../state/store'

const LAYER_CHIPS: { k: keyof Layers; label: string }[] = [
  { k: 'passengers', label: 'Passengers' },
  { k: 'aircraft', label: 'Aircraft' },
  { k: 'routes', label: 'Routes' },
  { k: 'context', label: 'Buildings' },
]

export function LayerBar() {
  const layers = useTwin((s) => s.layers)
  const toggleLayer = useTwin((s) => s.toggleLayer)
  const heatmap = useTwin((s) => s.heatmap)
  const setHeat = useTwin((s) => s.set)

  return (
    <div id="layerbar">
      {LAYER_CHIPS.map((c) => (
        <button key={c.k} className={'chip' + (layers[c.k] ? ' on' : '')} onClick={() => toggleLayer(c.k)}>
          {c.label}
        </button>
      ))}
      <button className={'chip' + (heatmap ? ' on' : '')} onClick={() => setHeat({ heatmap: !heatmap })}>
        Heatmap
      </button>
    </div>
  )
}
