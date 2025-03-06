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
  distance: number
  distanceUnderBridge?: number
}

const gradient = chroma.scale(['red', 'yellow', 'green'])

function RoutePolyline({
  id1,
  id2,
  pos1,
  pos2,
  speed,
  distance,
  distanceUnderBridge
}: Props) {
  const relative_speed = Math.max(speed - 10, 0) / 120
  const color_at_speed = gradient(relative_speed)

  return (
    <Polyline
      positions={[pos1 as [number, number], pos2 as [number, number]]}
      color={color_at_speed.hex()}
    >
      <Popup>
        OSM IDs:
        <ul>
          <li>{id1}</li>
          <li>{id2}</li>
        </ul>
        Speed: {speed.toFixed(2)} km/h
        <br />
        Distance on route: {(distance / 1000).toFixed(3)} km
        {distanceUnderBridge && (
          <>
            <br />
            Distance under bridge: {distanceUnderBridge.toFixed(2)} m
          </>
        )}
      </Popup>
    </Polyline>
  )
}

export default React.memo(RoutePolyline)
