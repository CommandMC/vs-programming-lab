import React from 'react'
import { LayerGroup, LayersControl, Polyline, Popup } from 'react-leaflet'

import type { OverpassWay } from '../../types'
import { useMediaQuery } from '@mui/material'

interface Props {
  obstacles: OverpassWay[]
}

function ObstaclesLayer({ obstacles }: Props) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  return (
    <LayersControl.Overlay checked name='Obstacles'>
      <LayerGroup>
        {obstacles.map((obstacle) => (
          <Polyline
            key={obstacle.id}
            positions={obstacle.geometry.map(({ lat, lon }) => [lat, lon])}
            pathOptions={{
              color: prefersDarkMode ? 'white' : 'darkblue'
            }}
          >
            <Popup>OSM ID: {obstacle.id}</Popup>
          </Polyline>
        ))}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}

export default React.memo(ObstaclesLayer)
