import React from 'react'
import { Paper } from '@mui/material'
import { LayerGroup, LayersControl } from 'react-leaflet'
import RouteLeg from './components/RouteLeg'

import type { Route } from '../../osrm-api/types'
import type { LineString } from 'geojson'

interface Props {
  route: Route<LineString, false, true>
}

function RouteLayer({ route }: Props) {
  return (
    <>
      <LayersControl.Overlay checked name='Route'>
        <LayerGroup>
          {route.legs.map((leg, i) => (
            <RouteLeg key={i} leg={leg} />
          ))}
        </LayerGroup>
      </LayersControl.Overlay>
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
    </>
  )
}

export default React.memo(RouteLayer)
