import type { OSMID } from './osrm-api/types'

interface LatLonObj {
  lat: number
  lon: number
}

interface OverpassCount {
  type: 'count'
  id: number
  tags: Record<'nodes' | 'ways' | 'relations' | 'total', string>
}

interface OverpassWay {
  type: 'way'
  id: number
  bounds: {
    minlat: number
    minlon: number
    maxlat: number
    maxlon: number
  }
  geometry: LatLonObj[]
}

interface OverpassWayBody {
  type: 'way'
  id: number
  nodes: OSMID[]
  tags: Record<string, string>
}

interface NodeData {
  id: OSMID
  speed: number
  coordinates: [number, number]
  distanceAlongRoute: number
  segmentLength: number
}

interface ObstacleOnRoute {
  obstacle: OverpassWay
  nodeid: OSMID
  osm_name?: string | null
  bast_name?: string | null
  est_width?: number
  osm_width?: number | null
  bast_width?: number | null
  bwnr_tbwnr?: string | null
}

export type {
  OverpassCount,
  OverpassWay,
  OverpassWayBody,
  NodeData,
  ObstacleOnRoute
}
