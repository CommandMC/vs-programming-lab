import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { LayersControl, MapContainer, TileLayer } from 'react-leaflet'
import { Button } from '@mui/material'
import { Download as DownloadIcon } from '@mui/icons-material'

import StartAndEndPointPicker from '../../components/StartAndEndPointPicker'
import RouteLayer from '../../components/RouteLayer'
import ObstaclesLayer from '../../components/ObstaclesLayer'
import OSRMApi from '../../osrm-api'

import type { Route } from '../../osrm-api/types'
import type { LineString } from 'geojson'
import type { OverpassWay } from '../../types'

const COORDS_OSNABRUECK: [number, number] = [52.2719595, 8.047635]

const routing_api = new OSRMApi()

export default function HomeScreen() {
  const [route, setRoute] = useState<Route<LineString, false, true> | null>(
    null
  )
  const [obstacles, setObstacles] = useState<OverpassWay[] | null>(null)
  const [fetchingRoute, setFetchingRoute] = useState(false)
  const [fetchingObstacles, setFetchingObstacles] = useState(false)

  const lookupRoute = useCallback(
    async (start: [number, number], end: [number, number]) => {
      setRoute(null)
      setFetchingRoute(true)
      const newRoute = await routing_api.route_request({
        service: 'route',
        profile: 'car',
        coordinates: [
          start.toReversed() as [number, number],
          end.toReversed() as [number, number]
        ],
        geometries: 'geojson',
        steps: true,
        annotations: 'true'
      })
      setRoute(newRoute.routes[0])
      setFetchingRoute(false)
    },
    [setRoute]
  )

  useEffect(() => {
    if (route) console.log('Route updated:', route)
  }, [route])

  useEffect(() => {
    if (!route) {
      setObstacles(null)
      return
    }
    setFetchingObstacles(true)
    const even: number[] = [],
      odd: number[] = []
    route.legs
      .map((leg) => leg.annotation.nodes)
      .flat()
      .forEach((v, i) => (i % 2 ? odd : even).push(v))
    console.log('Fetching bridges...')
    const query = `
[out:json][timeout: 500];
node(id: ${even});
way(bn)[highway]->.route_a;
node(id: ${odd});
way(bn)[highway]->.route_b;

way.route_a.route_b->.route;
way.route[tunnel]->.tunnels;
     
(.route; - way.route[man_made="bridge"];)->.route;
way(around.route:0)[bridge][man_made!="bridge"]->.bridges;
(.bridges; - .route;)->.crossing;
(.tunnels; .crossing;);
out ids geom;`
    console.log(query)
    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query)
    })
      .then((data) => data.json())
      .then(({ elements: obstacles }: { elements: OverpassWay[] }) => {
        setObstacles(obstacles)
        console.log('Obstacles updated:', obstacles)
        setFetchingObstacles(false)
      })
  }, [route])

  const routeButtonLoadingText = useMemo(() => {
    if (fetchingRoute) return 'Fetching route'
    if (fetchingObstacles) return 'Fetching obstacles'
    return undefined
  }, [fetchingRoute, fetchingObstacles])

  return (
    <MapContainer
      center={COORDS_OSNABRUECK}
      zoom={11}
      style={{ height: '100vh', width: '100%', padding: 0 }}
    >
      <TileLayer
        className='map-tiles'
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <LayersControl position='topright'>
        <StartAndEndPointPicker
          onRoutePressed={lookupRoute}
          loadingText={routeButtonLoadingText}
        />
        {route && <RouteLayer route={route} />}
        {obstacles && <ObstaclesLayer obstacles={obstacles} />}
      </LayersControl>
      <div className='leaflet-bottom leaflet-left'>
        <Button
          className='leaflet-control'
          sx={{ margin: 3 }}
          variant='contained'
          color='primary'
          startIcon={<DownloadIcon />}
        >
          Download route data
        </Button>
      </div>
    </MapContainer>
  )
}
