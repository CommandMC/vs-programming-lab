import React, { useCallback, useEffect, useState } from 'react'
import { LayersControl, MapContainer, TileLayer } from 'react-leaflet'

import StartAndEndPointPicker from '../../components/StartAndEndPointPicker'
import RouteLayer from '../../components/RouteLayer'

import type { RouteFeatureCollection } from '../../types'

const COORDS_OSNABRUECK: [number, number] = [52.2719595, 8.047635]

export default function HomeScreen() {
  const [route, setRoute] = useState<RouteFeatureCollection | null>(null)

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
            options: { avoid_features: ['tollways'] }
          })
        }
      )
      setRoute(await response.json())
    },
    [setRoute]
  )

  useEffect(() => {
    if (route) console.log(route)
  }, [route])

  return (
    <MapContainer
      center={COORDS_OSNABRUECK}
      zoom={11}
      style={{ height: '100vh', width: '100%', padding: 0 }}
    >
      <TileLayer
        className='map-tiles'
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <LayersControl position='topright'>
        <StartAndEndPointPicker onRoutePressed={lookupRoute} />
        {route && <RouteLayer route={route} />}
      </LayersControl>
    </MapContainer>
  )
}
