import React, { useMemo } from 'react'
import { Paper } from '@mui/material'
import { LayerGroup, LayersControl } from 'react-leaflet'
import RoutePolyline from './components/RoutePolyline'

import type { NodeDataRecord } from '../../types'

interface Props {
  nodeData: NodeDataRecord
}

function RouteLayer({ nodeData }: Props) {
  const routeNodeArr = useMemo(
    () =>
      Object.entries(nodeData)
        .map(([key, value]) => ({
          id: Number(key),
          ...value
        }))
        .sort((a, b) => a.distance - b.distance),
    [nodeData]
  )

  return (
    <>
      <LayersControl.Overlay checked name='Route'>
        <LayerGroup>
          {routeNodeArr.map((second, i) => {
            if (i === 0) return null
            const first = routeNodeArr[i - 1]!
            return (
              <RoutePolyline
                key={i}
                id1={first.id}
                id2={second.id}
                pos1={first.coordinates}
                pos2={second.coordinates}
                speed={second.speed}
                distance={first.distance}
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
