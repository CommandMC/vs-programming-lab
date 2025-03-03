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

export type { OverpassCount, OverpassWay }
