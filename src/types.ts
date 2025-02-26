import type { FeatureCollection, LineString } from 'geojson'

interface RouteStep {
  distance: number
  duration: number
  instruction: string
  name: string
  type: number
  way_points: [number, number]
}

interface RouteSegment {
  distance: number
  duration: number
  steps: RouteStep[]
}

type RouteFeatureCollection = FeatureCollection<
  LineString,
  {
    segments: RouteSegment[]
    summary: {
      distance: number
      duration: number
    }
    way_points: [number, number]
  }
>

export type { RouteFeatureCollection }
