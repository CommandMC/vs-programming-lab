import React, { useCallback, useEffect, useState } from 'react'
import { LayersControl, MapContainer, TileLayer } from 'react-leaflet'
import { Button } from '@mui/material'
import { Download as DownloadIcon } from '@mui/icons-material'

import StartAndEndPointPicker from '../../components/StartAndEndPointPicker'
import RouteLayer from '../../components/RouteLayer'
import OSRMApi from '../../osrm-api'

import type { Route } from '../../osrm-api/types'
import type { LineString } from 'geojson'

const COORDS_OSNABRUECK: [number, number] = [52.2719595, 8.047635]

const routing_api = new OSRMApi()

export default function HomeScreen() {
  const [route, setRoute] = useState<Route<LineString, false, true> | null>(
    null
  )

  const lookupRoute = useCallback(
    async (start: [number, number], end: [number, number]) => {
      const newRoute = await routing_api.route_request({
        service: 'route',
        profile: 'car',
        coordinates: [
          start.toReversed() as [number, number],
          end.toReversed() as [number, number]
        ],
        geometries: 'geojson',
        steps: true,
        annotations: 'true'
      })
      setRoute(newRoute.routes[0])
    },
    [setRoute]
  )

  useEffect(() => {
    if (route) console.log('Route updated:', route)
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
