interface LatLonObj {
  lat: number
  lon: number
}

interface OverpassWay {
  geometry: LatLonObj[]
  id: number
  type: 'way'
}

export type { OverpassWay }
