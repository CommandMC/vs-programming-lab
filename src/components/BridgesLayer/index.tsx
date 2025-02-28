import React from 'react'
import { LayerGroup, LayersControl, Polyline, Popup } from 'react-leaflet'

import type { OverpassWay } from '../../types'
import { useMediaQuery } from '@mui/material'

interface Props {
  bridges: OverpassWay[]
}

function BridgesLayer({ bridges }: Props) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  return (
    <LayersControl.Overlay checked name='Bridges'>
      <LayerGroup>
        {bridges.map((bridge) => (
          <Polyline
            key={bridge.id}
            positions={bridge.geometry.map(({ lat, lon }) => [lat, lon])}
            pathOptions={{
              color: prefersDarkMode ? 'white' : 'darkblue'
            }}
          >
            <Popup>{bridge.id}</Popup>
          </Polyline>
        ))}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}

export default React.memo(BridgesLayer)
