import React from 'react'
import { Polyline, Popup } from 'react-leaflet'
import chroma from 'chroma-js'

import type { Position } from 'geojson'
import type { OSMID } from '../../../osrm-api/types'

interface Props {
  id1: OSMID
  id2: OSMID
  pos1: Position
  pos2: Position
  speed: number
}

const gradient = chroma.scale(['red', 'yellow', 'green'])

function RoutePolyline({ id1, id2, pos1, pos2, speed }: Props) {
  const speed_kmh = speed * 3.6
  const relative_speed = Math.max(speed_kmh - 10, 0) / 120
  const color_at_speed = gradient(relative_speed)

  return (
    <Polyline
      positions={[
        pos1.toReversed() as [number, number],
        pos2.toReversed() as [number, number]
      ]}
      color={color_at_speed.hex()}
    >
      <Popup>
        OSM IDs:
        <ul>
          <li>{id1}</li>
          <li>{id2}</li>
        </ul>
        Speed: {speed_kmh.toFixed(2)} km/h
      </Popup>
    </Polyline>
  )
}

export default React.memo(RoutePolyline)
