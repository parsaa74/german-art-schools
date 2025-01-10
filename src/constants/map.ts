import { Vector3 } from 'three'

export const MAP_CONFIG = {
  radius: 5,
  centerLat: 51.1657,
  centerLng: 10.4515,
  origin: new Vector3(0, 0, 0),
  markerElevation: 0.1,
  labelElevation: 0.05
} as const

export const COLORS = {
  background: '#111827',
  globe: '#2563eb',
  borders: '#ffffff',
  marker: '#ff4444',
  text: '#ffffff',
  textOutline: '#000000'
} as const

export const MATERIALS = {
  globe: {
    opacity: 0.6,
    wireframe: true
  },
  state: {
    opacity: 0.8,
    shininess: 30
  },
  border: {
    opacity: 1.0,
    lineWidth: 2
  },
  marker: {
    opacity: 1.0
  }
} as const 