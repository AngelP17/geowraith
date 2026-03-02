import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';

interface MapLayersProps {
  map: MaplibreMap | null;
}

interface LayerConfig {
  id: string;
  name: string;
  color: string;
  source: string;
  type: 'circle' | 'line';
}

const LAYERS: LayerConfig[] = [
  { 
    id: 'fires', 
    name: 'Active Fires (24h)', 
    color: '#ff4444', 
    source: '/data/fires.geojson',
    type: 'circle'
  },
  { 
    id: 'bases', 
    name: 'Military Bases', 
    color: '#ff8800', 
    source: '/data/military_bases.geojson',
    type: 'circle'
  },
  { 
    id: 'cables', 
    name: 'Undersea Cables', 
    color: '#4488ff', 
    source: '/data/undersea_cables.geojson',
    type: 'line'
  },
  { 
    id: 'conflicts', 
    name: 'Conflict Zones', 
    color: '#ff0000', 
    source: '/data/conflict_zones.geojson',
    type: 'circle'
  },
];

export const MapLayers: React.FC<MapLayersProps> = ({ map }) => {
  const [enabledLayers, setEnabledLayers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const abortControllersRef = useRef<globalThis.Map<string, AbortController>>(new globalThis.Map());
  const layerDataRef = useRef<globalThis.Map<string, GeoJSON.GeoJSON>>(new globalThis.Map());

  // Cleanup abort controllers on unmount
  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach((controller: AbortController) => controller.abort());
      abortControllersRef.current.clear();
    };
  }, []);

  const removeLayerFromMap = useCallback((layerId: string) => {
    if (!map) return;

    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(layerId)) {
      map.removeSource(layerId);
    }
  }, [map]);

  const addLayerToMap = useCallback((layer: LayerConfig, data: GeoJSON.GeoJSON) => {
    if (!map || !map.isStyleLoaded() || map.getSource(layer.id)) {
      return;
    }

    map.addSource(layer.id, {
      type: 'geojson',
      data,
    });

    if (layer.type === 'circle') {
      map.addLayer({
        id: layer.id,
        type: 'circle',
        source: layer.id,
        paint: {
          'circle-radius': 6,
          'circle-color': layer.color,
          'circle-opacity': 0.8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#000',
        },
      });
      return;
    }

    map.addLayer({
      id: layer.id,
      type: 'line',
      source: layer.id,
      paint: {
        'line-color': layer.color,
        'line-width': 2,
        'line-opacity': 0.8,
      },
    });
  }, [map]);

  const loadLayerData = useCallback(async (layer: LayerConfig): Promise<GeoJSON.GeoJSON> => {
    const cached = layerDataRef.current.get(layer.id);
    if (cached) {
      return cached;
    }

    const controller = new AbortController();
    abortControllersRef.current.set(layer.id, controller);
    try {
      const response = await fetch(layer.source, { signal: controller.signal });
      if (!response.ok) {
        throw new Error('Failed to load layer data');
      }
      const data = (await response.json()) as GeoJSON.GeoJSON;
      layerDataRef.current.set(layer.id, data);
      return data;
    } finally {
      abortControllersRef.current.delete(layer.id);
    }
  }, []);

  const ensureLayerEnabled = useCallback(async (layer: LayerConfig) => {
    const data = await loadLayerData(layer);
    addLayerToMap(layer, data);
  }, [addLayerToMap, loadLayerData]);

  useEffect(() => {
    if (!map) return;

    const handleStyleLoad = () => {
      enabledLayers.forEach((layerId) => {
        const layer = LAYERS.find((entry) => entry.id === layerId);
        if (!layer) return;
        void ensureLayerEnabled(layer);
      });
    };

    map.on('style.load', handleStyleLoad);
    return () => {
      map.off('style.load', handleStyleLoad);
    };
  }, [enabledLayers, ensureLayerEnabled, map]);

  const toggleLayer = useCallback(async (layer: LayerConfig) => {
    if (!map) return;

    if (enabledLayers.has(layer.id)) {
      const controller = abortControllersRef.current.get(layer.id);
      if (controller) {
        controller.abort();
      }
      removeLayerFromMap(layer.id);
      setEnabledLayers((prev) => {
        const next = new Set(prev);
        next.delete(layer.id);
        return next;
      });
      return;
    }

    setEnabledLayers((prev) => new Set(prev).add(layer.id));
    setLoading((prev) => new Set(prev).add(layer.id));

    try {
      await ensureLayerEnabled(layer);
    } catch (error) {
      setEnabledLayers((prev) => {
        const next = new Set(prev);
        next.delete(layer.id);
        return next;
      });

      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error(`[MapLayers] Failed to load ${layer.name}:`, error);
      }
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(layer.id);
        return next;
      });
    }
  }, [enabledLayers, ensureLayerEnabled, map, removeLayerFromMap]);

  if (!map) return null;

  return (
    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md p-4 rounded-lg border border-white/10 z-10 max-w-[200px]">
      <h3 className="text-white font-semibold mb-3 text-sm">Context Layers</h3>
      <div className="space-y-2">
        {LAYERS.map(layer => (
          <label 
            key={layer.id} 
            className="flex items-center gap-2 text-white/80 text-xs cursor-pointer hover:text-white transition-colors"
          >
            <input
              type="checkbox"
              checked={enabledLayers.has(layer.id)}
              onChange={() => toggleLayer(layer)}
              disabled={loading.has(layer.id)}
              className="rounded border-white/30 bg-black/50"
            />
            {loading.has(layer.id) ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              <>
                <span style={{ color: layer.color }}>●</span>
                {layer.name}
              </>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};
