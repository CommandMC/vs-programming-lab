import React, { useEffect, useState } from 'react'
import L, { type Layer as LeafletLayer } from 'leaflet'
import { useLeafletContext } from '@react-leaflet/core'
import chroma from 'chroma-js'
import { Paper } from '@mui/material'

import type { RouteFeatureCollection } from '../../types'

interface Props {
  route: RouteFeatureCollection
}

const gradient = chroma.scale(['red', 'yellow', 'green'])

export default function RouteLayer({ route }: Props) {
  const { map, layersControl } = useLeafletContext()
  const [routeLayer, setRouteLayer] = useState<LeafletLayer | null>(null)

  useEffect(() => {
    const newLayer = L.layerGroup()
    const waypoints = route.features[0]!.geometry.coordinates.map(
      (waypoint) => waypoint.toReversed() as [number, number]
    )
    for (const step of route.features[0]!.properties['segments'][0]!.steps) {
      const speed_mps = step.distance / step.duration
      const speed_kmh = speed_mps * 3.6
      const relative_speed = Math.max(speed_kmh - 10, 0) / 120
      const color_at_speed = gradient(relative_speed)
      const [firstWaypointIndex, lastWaypointIndex] = step.way_points
      L.polyline(waypoints.slice(firstWaypointIndex, lastWaypointIndex + 1), {
        color: color_at_speed.hex()
      })
        .bindPopup(
          L.popup({
            content: `${step.instruction}<br />${speed_kmh.toFixed(2)} km/h`
          })
        )
        .addTo(newLayer)
    }
    if (routeLayer) {
      routeLayer.remove()
      layersControl?.removeLayer(routeLayer)
    }
    newLayer.addTo(map)
    layersControl?.addOverlay(newLayer, 'Route')
    setRouteLayer(newLayer)
    return () => {
      newLayer.remove()
      layersControl?.removeLayer(newLayer)
    }
  }, [route, layersControl])

  return (
    <div className='leaflet-bottom leaflet-right'>
      <div className='leaflet-control leaflet-bar'>
        <Paper sx={{ marginBottom: 3, paddingX: 1, width: 200 }}>
          <p>Speed Legend:</p>
          <div
            style={{
              width: '100%',
              height: 10,
              background: 'linear-gradient(to right, red, yellow, green)'
            }}
          ></div>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <p>10</p>
            <p>50</p>
            <p>90</p>
            <p>130</p>
          </div>
        </Paper>
      </div>
    </div>
  )
}
