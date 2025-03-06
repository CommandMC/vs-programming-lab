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
        {obstacles.map(({ obstacle, widthData }) => {
          return (
            <Polyline
              key={obstacle.id}
              positions={obstacle.geometry.map(({ lat, lon }) => [lat, lon])}
              pathOptions={{
                color: prefersDarkMode ? 'white' : 'darkblue'
              }}
            >
              <Popup>
                OSM ID: {obstacle.id}
                {widthData?.est_width && (
                  <>
                    <br />
                    Estimated width: {widthData.est_width} m
                  </>
                )}
                {widthData?.osm_width && (
                  <>
                    <br />
                    OSM width: {widthData.osm_width} m
                  </>
                )}
                {widthData?.bast_width && (
                  <>
                    <br />
                    BASt width: {widthData.bast_width.toFixed(2)} m
                  </>
                )}
                {widthData?.bwnr_tbwnr && (
                  <>
                    <br />
                    BWNR: {widthData.bwnr_tbwnr}
                  </>
                )}
              </Popup>
            </Polyline>
          )
        })}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}

export default React.memo(ObstaclesLayer)
