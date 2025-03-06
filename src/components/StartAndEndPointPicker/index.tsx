import React, { useEffect, useState } from 'react'
import { Button, Paper } from '@mui/material'
import L from 'leaflet'
import { LayerGroup, LayersControl, Marker, Popup, useMap } from 'react-leaflet'

import LocationPicker from './components/LocationPicker'

interface Props {
  onRoutePressed: (
    startCoords: [number, number],
    endCoords: [number, number]
  ) => void
  loadingText?: string
}

function StartAndEndPointPicker({ onRoutePressed, loadingText }: Props) {
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null)
  const [endPoint, setEndPoint] = useState<[number, number] | null>(null)

  const map = useMap()

  useEffect(() => {
    if (startPoint && endPoint) {
      map.fitBounds(L.latLngBounds(startPoint, endPoint))
    } else {
      const pointToFocusOn = startPoint ?? endPoint
      if (!pointToFocusOn) return
      map.panTo(pointToFocusOn)
    }
  }, [startPoint, endPoint])

  return (
    <>
      <div className='leaflet-top leaflet-left'>
        <Paper
          className='leaflet-control leaflet-bar'
          sx={{ padding: 2, display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          <LocationPicker
            label='Start location'
            onLocationUpdate={setStartPoint}
          />
          <LocationPicker label='End location' onLocationUpdate={setEndPoint} />
          <Button
            loading={!!loadingText}
            color='success'
            disabled={!startPoint || !endPoint}
            loadingPosition='start'
            onClick={() => {
              if (!startPoint || !endPoint) return
              onRoutePressed(startPoint, endPoint)
            }}
          >
            {loadingText ?? 'Compute route'}
          </Button>
        </Paper>
      </div>
      <LayersControl.Overlay checked name='Start/End markers'>
        <LayerGroup>
          {startPoint && (
            <Marker position={startPoint}>
              <Popup>Start point</Popup>
            </Marker>
          )}
          {endPoint && (
            <Marker position={endPoint}>
              <Popup>End point</Popup>
            </Marker>
          )}
        </LayerGroup>
      </LayersControl.Overlay>
    </>
  )
}

export default React.memo(StartAndEndPointPicker)
