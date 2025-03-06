import React from 'react'
import { Paper } from '@mui/material'
import { LayerGroup, LayersControl } from 'react-leaflet'
import RoutePolyline from './components/RoutePolyline'

import type { NodeData } from '../../types'
import type { OSMID } from '../../osrm-api/types'

interface Props {
  nodeData: NodeData[]
  distanceUnderBridge: Record<OSMID, number>
}

function RouteLayer({ nodeData, distanceUnderBridge }: Props) {
  return (
    <>
      <LayersControl.Overlay checked name='Route'>
        <LayerGroup>
          {nodeData.map((second, i) => {
            if (i === 0) return null
            const first = nodeData[i - 1]!
            return (
              <RoutePolyline
                key={i}
                id1={first.id}
                id2={second.id}
                pos1={first.coordinates}
                pos2={second.coordinates}
                speed={second.speed}
                distance={first.distanceAlongRoute}
                distanceUnderBridge={distanceUnderBridge[second.id]}
              />
            )
          })}
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
