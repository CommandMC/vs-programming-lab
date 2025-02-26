import React, { useCallback, useEffect, useRef, useState } from 'react'
import L, { type Layer as LeafletLayer, type Map as LeafletMap } from 'leaflet'
import { MapContainer, TileLayer } from 'react-leaflet'
import type { GeoJsonObject } from 'geojson'

import StartAndEndPointPicker from '../../components/StartAndEndPointPicker'

const COORDS_OSNABRUECK: [number, number] = [52.2719595, 8.047635]

export default function HomeScreen() {
  const [route, setRoute] = useState<GeoJsonObject | null>(null)
  const mapContainerRef = useRef<LeafletMap>(null)
  const [routeLayer, setRouteLayer] = useState<LeafletLayer | null>(null)

  const lookupRoute = useCallback(
    async (start: [number, number], end: [number, number]) => {
      const response = await fetch(
        'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
        {
          method: 'post',
          headers: {
            'Authorization': import.meta.env['VITE_OPENROUTESERVICE_API_KEY'],
            'Accept':
              'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: JSON.stringify({
            coordinates: [start.toReversed(), end.toReversed()],
            attributes: ['avgspeed']
          })
        }
      )
      const json = await response.json()
      if (mapContainerRef.current) {
        if (routeLayer !== null) mapContainerRef.current.removeLayer(routeLayer)
        setRouteLayer(L.geoJson(json).addTo(mapContainerRef.current))
      }
      setRoute(json)
    },
    [setRoute, mapContainerRef.current, routeLayer]
  )

  useEffect(() => {
    console.log(route)
  }, [route])

  return (
    <MapContainer
      ref={mapContainerRef}
      center={COORDS_OSNABRUECK}
      zoom={11}
      style={{ height: '100vh', width: '100%', padding: 0 }}
    >
      <TileLayer
        className='map-tiles'
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <StartAndEndPointPicker onRoutePressed={lookupRoute} />
    </MapContainer>
  )
}
