import React, { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  OutlinedInput,
  Paper,
  Typography
} from '@mui/material'
import L from 'leaflet'
import { LayerGroup, LayersControl, Marker, Popup, useMap } from 'react-leaflet'

import LocationPicker from './components/LocationPicker'

interface Props {
  onRoutePressed: (
    startCoords: [number, number],
    endCoords: [number, number]
  ) => void
  setMaxSpeed: (maxSpeed: number) => unknown
  loadingText?: string
}

function RouteParametersPicker({
  onRoutePressed,
  setMaxSpeed,
  loadingText
}: Props) {
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null)
  const [endPoint, setEndPoint] = useState<[number, number] | null>(null)
  const [maxSpeed, setMaxSpeedTemp] = useState(130)

  const startRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const maxSpeedRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (startRef.current) L.DomEvent.disableClickPropagation(startRef.current)
    if (endRef.current) L.DomEvent.disableClickPropagation(endRef.current)
    if (maxSpeedRef.current)
      L.DomEvent.disableClickPropagation(maxSpeedRef.current)
  }, [startRef.current, endRef.current, maxSpeedRef.current])

  return (
    <>
      <div className='leaflet-top leaflet-left'>
        <Paper
          className='leaflet-control leaflet-bar'
          sx={{ padding: 2, display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          <LocationPicker
            ref={startRef}
            label='Start location'
            onLocationUpdate={setStartPoint}
          />
          <LocationPicker
            ref={endRef}
            label='End location'
            onLocationUpdate={setEndPoint}
          />
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
          <FormControl>
            <Box marginTop={3} display='flex' flexDirection='column'>
              <Typography id='max-speed-slider'>Max speed:</Typography>
              <OutlinedInput
                type='number'
                ref={maxSpeedRef}
                aria-labelledby='max-speed-slider'
                defaultValue={130}
                endAdornment={
                  <InputAdornment position='end'>km/h</InputAdornment>
                }
                onChange={(e) => setMaxSpeedTemp(Number(e.target.value))}
              />
            </Box>
            <Button color='success' onClick={() => setMaxSpeed(maxSpeed)}>
              Update speed limit
            </Button>
          </FormControl>
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

export default React.memo(RouteParametersPicker)
