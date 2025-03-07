import React from 'react'
import type { Position } from 'geojson'
import chroma from 'chroma-js'
import { Polyline, Popup } from 'react-leaflet'

interface Props {
  pos1: Position
  pos2: Position
  timeUnderBridge: number
}

const gradient = chroma.scale(['green', 'yellow', 'red'])

function TimeUnderBridgeLine({ pos1, pos2, timeUnderBridge }: Props) {
  if (!timeUnderBridge) return <></>
  const color_at_time = gradient(timeUnderBridge)
  return (
    <Polyline
      positions={[pos1 as [number, number], pos2 as [number, number]]}
      color={color_at_time.hex()}
    >
      <Popup>{timeUnderBridge.toFixed(2)}</Popup>
    </Polyline>
  )
}

export default React.memo(TimeUnderBridgeLine)
