import React, { useEffect, useState } from 'react'
import L, { type Layer as LeafletLayer } from 'leaflet'
import { useLeafletContext } from '@react-leaflet/core'
import chroma from 'chroma-js'
import { Paper } from '@mui/material'

import type { OSMID, Route, RouteLeg } from '../../osrm-api/types'
import type { LineString, Position } from 'geojson'

interface Props {
  route: Route<LineString, false, true>
}

const gradient = chroma.scale(['red', 'yellow', 'green'])

export default function RouteLayer({ route }: Props) {
  const { map, layersControl } = useLeafletContext()
  const [routeNodesLayer, setRouteNodesLayer] = useState<LeafletLayer | null>(
    null
  )

  useEffect(() => {
    const newLayer = L.layerGroup()

    function renderPolyline(
      first_id: OSMID,
      second_id: OSMID,
      pos1: Position,
      pos2: Position,
      speed: number
    ) {
      const speed_kmh = speed * 3.6
      const relative_speed = Math.max(speed_kmh - 10, 0) / 120
      const color_at_speed = gradient(relative_speed)

      L.polyline(
        [
          pos1.toReversed() as [number, number],
          pos2.toReversed() as [number, number]
        ],
        { color: color_at_speed.hex() }
      )
        .bindPopup(
          L.popup({
            content: `OSM IDs:<br />${first_id}<br />${second_id}`
          })
        )
        .addTo(newLayer)
    }

    function renderRouteLeg(leg: RouteLeg<LineString, false, true>) {
      const coordinates = leg.steps
        .map((step, i) => step.geometry.coordinates.slice(i === 0 ? 0 : 1))
        .flat()
      leg.annotation.nodes.map((nodeid, i) => {
        const next_id = leg.annotation.nodes[i + 1]
        if (!next_id) return
        renderPolyline(
          nodeid,
          next_id,
          coordinates[i]!,
          coordinates[i + 1]!,
          leg.annotation.speed[i]!
        )
      })
    }

    route.legs.map(renderRouteLeg)

    if (routeNodesLayer) {
      routeNodesLayer.remove()
      layersControl?.removeLayer(routeNodesLayer)
    }
    newLayer.addTo(map)
    layersControl?.addOverlay(newLayer, 'Route')
    setRouteNodesLayer(newLayer)
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
