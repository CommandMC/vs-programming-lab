import React from 'react'
import { LayerGroup, LayersControl, Polyline, Popup } from 'react-leaflet'
import { useMediaQuery } from '@mui/material'

import type { ObstacleOnRoute } from '../../types'

interface Props {
  obstacles: ObstacleOnRoute[]
}

function ObstaclesLayer({ obstacles }: Props) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  return (
    <LayersControl.Overlay checked name='Obstacles'>
      <LayerGroup>
        {obstacles.map((obstacle) => {
          return (
            <Polyline
              key={obstacle.obstacle.id}
              positions={obstacle.obstacle.geometry.map(({ lat, lon }) => [
                lat,
                lon
              ])}
              pathOptions={{
                color: prefersDarkMode ? 'white' : 'darkblue'
              }}
            >
              <Popup>
                OSM ID: {obstacle.obstacle.id}
                <br />
                Nearest node on route: {obstacle.nodeid}
                {(
                  [
                    ['bast_name', 'BASt name', ''],
                    ['osm_name', 'OSM name', ''],
                    ['est_width', 'Estimated width', ' m'],
                    ['osm_width', 'OSM width', ' m'],
                    ['bast_width', 'BASt width', ' m'],
                    ['bwnr_tbwnr', 'BWNR', '']
                  ] as const
                ).map(([prop, prefix, suffix]) => {
                  if (!obstacle[prop]) {
                    return null
                  }
                  return (
                    <div key={prop}>
                      {prefix}:{' '}
                      {typeof obstacle[prop] === 'number' ?
                        obstacle[prop].toFixed(2)
                      : obstacle[prop]}
                      {suffix}
                    </div>
                  )
                })}
              </Popup>
            </Polyline>
          )
        })}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}

export default React.memo(ObstaclesLayer)
