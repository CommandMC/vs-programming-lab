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
  maxSpeed: number
  speed: number
  length: number
  distanceAlongRoute: number
  timeUnderBridge?: number
  distanceUnderBridge?: number
}

const gradient = chroma.scale(['red', 'yellow', 'green'])

function RoutePolyline({
  id1,
  id2,
  pos1,
  pos2,
  maxSpeed,
  speed,
  length,
  distanceAlongRoute,
  timeUnderBridge,
  distanceUnderBridge
}: Props) {
  const relative_speed = Math.max(speed - 10, 0) / (maxSpeed - 10)
  const color_at_speed = gradient(relative_speed)
  const time_in_segment = length / (speed / 3.6)

  return (
    <Polyline
      positions={[pos1 as [number, number], pos2 as [number, number]]}
      pathOptions={{
        color: color_at_speed.hex()
      }}
    >
      <Popup>
        OSM IDs:
        <ul>
          <li>{id1}</li>
          <li>{id2}</li>
        </ul>
        Speed: {speed.toFixed(2)} km/h
        <br />
        Time spent in segment: {time_in_segment.toFixed(2)} s
        {timeUnderBridge !== undefined && (
          <>
            <br />
            Time under bridge: {timeUnderBridge.toFixed(2)} s
          </>
        )}
        <br />
        Segment length: {length.toFixed(2)} m<br />
        Distance on route: {(distanceAlongRoute / 1000).toFixed(3)} km
        {distanceUnderBridge !== undefined && (
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
