import React, { useCallback, useEffect, useRef, useState } from 'react'
import L, {
  type Layer as LeafletLayer,
  type Map as LeafletMap,
  type Control as LeafletControl
} from 'leaflet'
import { LayersControl, MapContainer, TileLayer } from 'react-leaflet'
import type { GeoJsonObject } from 'geojson'
import chroma from 'chroma-js'

import StartAndEndPointPicker from '../../components/StartAndEndPointPicker'

const COORDS_OSNABRUECK: [number, number] = [52.2719595, 8.047635]

export default function HomeScreen() {
  const [route, setRoute] = useState<GeoJsonObject | null>(null)
  const mapContainerRef = useRef<LeafletMap>(null)
  const layerControlRef = useRef<LeafletControl.Layers>(null)
  const [routeLayer, setRouteLayer] = useState<LeafletLayer | null>(null)

  const lookupRoute = useCallback(
    async (start: [number, number], end: [number, number]) => {
      const response = await fetch(
        'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
        {
          method: 'post',
          headers: {
            'Authorization': import.meta.env['VITE_OPENROUTESERVICE_API_KEY'],
            'Accept':
              'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: JSON.stringify({
            coordinates: [start.toReversed(), end.toReversed()],
            options: { avoid_features: ['tollways'] }
          })
        }
      )
      const json = await response.json()
      setRoute(json)
      if (mapContainerRef.current && layerControlRef.current) {
        if (routeLayer !== null) {
          mapContainerRef.current.removeLayer(routeLayer)
          layerControlRef.current.removeLayer(routeLayer)
        }
        const newLayer = L.layerGroup()
        const waypoints: [number, number][] =
          json.features[0].geometry.coordinates.map(
            (waypoint: [number, number]) => waypoint.toReversed()
          )
        const gradient = chroma.scale(['red', 'yellow', 'green'])
        for (const step of json.features[0].properties.segments[0].steps) {
          const speed_mps = step.distance / step.duration
          const speed_kmh = speed_mps * 3.6
          const relative_speed = speed_kmh / 130
          const color_at_speed = gradient(relative_speed)
          const [firstWaypointIndex, lastWaypointIndex] = step.way_points
          L.polyline(
            waypoints.slice(firstWaypointIndex, lastWaypointIndex + 1),
            {
              color: color_at_speed.hex()
            }
          )
            .bindPopup(
              L.popup({
                content: `${step.instruction}<br />${speed_kmh.toFixed(2)} km/h`
              })
            )
            .addTo(newLayer)
        }
        newLayer.addTo(mapContainerRef.current)
        layerControlRef.current.addOverlay(newLayer, 'Route')
        setRouteLayer(newLayer)
      }
    },
    [setRoute, mapContainerRef.current, layerControlRef.current, routeLayer]
  )

  useEffect(() => {
    if (route) console.log(route)
  }, [route])

  return (
    <MapContainer
      ref={mapContainerRef}
      center={COORDS_OSNABRUECK}
      zoom={11}
      style={{ height: '100vh', width: '100%', padding: 0 }}
    >
      <TileLayer
        className='map-tiles'
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <LayersControl position='topright' ref={layerControlRef}>
        <StartAndEndPointPicker onRoutePressed={lookupRoute} />
      </LayersControl>
    </MapContainer>
  )
}
