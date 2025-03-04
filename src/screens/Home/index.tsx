import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { LayersControl, MapContainer, TileLayer } from 'react-leaflet'
import { Button } from '@mui/material'
import { Download as DownloadIcon } from '@mui/icons-material'
import haversine from 'haversine-distance'

import StartAndEndPointPicker from '../../components/StartAndEndPointPicker'
import RouteLayer from '../../components/RouteLayer'
import ObstaclesLayer from '../../components/ObstaclesLayer'
import OSRMApi from '../../osrm-api'

import type { OSMID, Route } from '../../osrm-api/types'
import type { LineString } from 'geojson'
import type { OverpassCount, OverpassWay } from '../../types'

const COORDS_OSNABRUECK: [number, number] = [52.2719595, 8.047635]

const routing_api = new OSRMApi()

interface ObstacleOnRoute {
  obstacle: OverpassWay
  nodeid: OSMID
}

export default function HomeScreen() {
  const [routeData, setRouteData] = useState<{
    route: Route<LineString, false, true>
    extraNodeData: Record<
      OSMID,
      {
        speed: number
        coordinates: [number, number]
        timestamp: number
        distance: number
      }
    >
  } | null>(null)
  const [obstacles, setObstacles] = useState<ObstacleOnRoute[] | null>(null)
  const [tunnels, setTunnels] = useState<ObstacleOnRoute[] | null>(null)
  const [fetchingRoute, setFetchingRoute] = useState(false)
  const [fetchingObstacles, setFetchingObstacles] = useState(false)

  const lookupRoute = useCallback(
    async (start: [number, number], end: [number, number]) => {
      setRouteData(null)
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

      const nodeCoords = newRoute.routes[0].legs
        .map((leg) => leg.steps)
        .flat()
        .map((step, i) => step.geometry.coordinates.slice(i === 0 ? 0 : 1))
        .flat()

      const nodeSpeeds = newRoute.routes[0].legs
        .map((leg) => leg.annotation.speed)
        .flat()
        // Convert to km/h
        .map((speedMps) => speedMps * 3.6)
      // We only get speeds for the paths between nodes, but it'd be easier if we could have speeds *at* the nodes
      // Fake this by simply assuming the speed between nodes is the speed at the further-along node and setting the
      // very first node's speed to 0
      nodeSpeeds.unshift(0)

      const nodeDistances = newRoute.routes[0].legs
        .map((leg) => leg.annotation.distance)
        .flat()
        .reduce(
          (previousValue, currentValue) => [
            ...previousValue,
            previousValue.at(-1)! + currentValue
          ],
          [0]
        )

      const nodeTimestamps = newRoute.routes[0].legs
        .map((leg) => leg.annotation.duration)
        .flat()
        .reduce(
          (previousValue, currentValue) => [
            ...previousValue,
            previousValue.at(-1)! + currentValue
          ],
          [0]
        )

      const newNodeData: Record<
        OSMID,
        {
          speed: number
          coordinates: [number, number]
          timestamp: number
          distance: number
        }
      > = {}
      newRoute.routes[0].legs
        .map((leg) => leg.annotation.nodes)
        .flat()
        .forEach((nodeid, i) => {
          const coords = nodeCoords[i]
          const speedAtNode = nodeSpeeds[i]
          const timestamp = nodeTimestamps[i]
          const distance = nodeDistances[i]
          if (!coords || !speedAtNode || !timestamp || !distance) return
          newNodeData[nodeid] = {
            coordinates: coords.toReversed() as [number, number],
            speed: speedAtNode,
            timestamp,
            distance
          }
        })

      setRouteData({ route: newRoute.routes[0], extraNodeData: newNodeData })
      setFetchingRoute(false)
    },
    [setRouteData]
  )

  useEffect(() => {
    if (routeData) {
      console.log('Route updated:', routeData.route)
      console.log('Node extra data:', routeData.extraNodeData)
    }
  }, [routeData])

  useEffect(() => {
    if (!routeData) {
      setObstacles(null)
      return
    }
    setFetchingObstacles(true)
    const even: number[] = [],
      odd: number[] = []
    routeData.route.legs
      .map((leg) => leg.annotation.nodes)
      .flat()
      .forEach((v, i) => (i % 2 ? odd : even).push(v))
    console.log('Fetching bridges...')
    const query = `
[out:json][timeout: 500];
node(id: ${even});
way(bn)[highway]->.route_a;
._ -> .nodes_a;
node(id: ${odd});
way(bn)[highway]->.route_b;
._ -> .nodes_b;
(.nodes_a; .nodes_b;)->._;
way(bn)->.adjacent;

way.route_a.route_b->.route;

way.route[tunnel]->.tunnels;
.tunnels out count;
.tunnels out geom;
     
(.route; - way.route[man_made="bridge"];)->.route;
way(around.route:0)[bridge][man_made!="bridge"]->.bridges;
(.bridges; - .adjacent;)->.crossing;
.crossing out ids geom;`
    console.log(query)
    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query)
    })
      .then((data) => data.json())
      .then(({ elements }: { elements: [OverpassCount, ...OverpassWay[]] }) => {
        const tunnelCount = Number(elements[0].tags.ways)
        const obstacles = elements.slice(1) as OverpassWay[]

        const newObstacles: ObstacleOnRoute[] = []
        const newTunnels: ObstacleOnRoute[] = []

        obstacles.forEach((obstacle, i) => {
          const isTunnel = i < tunnelCount
          const center: [number, number] = [
            (obstacle.bounds.minlat + obstacle.bounds.maxlat) / 2,
            (obstacle.bounds.minlon + obstacle.bounds.maxlon) / 2
          ]
          const nearestNode = Object.entries(routeData.extraNodeData)
            .map(([id, data]) => ({
              id: Number(id),
              data,
              distance: haversine(center, data.coordinates)
            }))
            .reduce((prev, curr) =>
              prev.distance < curr.distance ? prev : curr
            )
          const newEntry = {
            obstacle,
            nodeid: Number(nearestNode.id)
          }
          if (isTunnel) {
            newTunnels.push(newEntry)
          } else {
            newObstacles.push(newEntry)
          }
        })

        setObstacles(newObstacles)
        setTunnels(newTunnels)
        console.log('Obstacles updated:', newObstacles)
        console.log('Tunnels updated:', newTunnels)
        setFetchingObstacles(false)
      })
  }, [routeData])

  const routeButtonLoadingText = useMemo(() => {
    if (fetchingRoute) return 'Fetching route'
    if (fetchingObstacles) return 'Fetching obstacles'
    return undefined
  }, [fetchingRoute, fetchingObstacles])

  const obstaclesToDraw = useMemo(
    () => [...(obstacles ?? []), ...(tunnels ?? [])].map((el) => el.obstacle),
    [obstacles, tunnels]
  )

  const downloadRouteData = useCallback(() => {
    if (!routeData || !obstacles || !tunnels) return
    const blob = new Blob(
      [
        JSON.stringify({
          routeData: {
            route: routeData.route,
            extraRouteData: Object.entries(routeData.extraNodeData)
              .map(([id, data]) => ({
                id,
                ...data
              }))
              .sort((a, b) => a.distance - b.distance)
          },
          obstacles,
          tunnels
        })
      ],
      { type: 'application/json' }
    )
    const href = URL.createObjectURL(blob)
    const linkElem = document.createElement('a')
    linkElem.href = href
    linkElem.download = 'RouteData.json'
    document.body.appendChild(linkElem)
    linkElem.click()
    document.body.removeChild(linkElem)
  }, [routeData, obstacles, tunnels])

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
        {routeData && <RouteLayer route={routeData.route} />}
        {obstacles && <ObstaclesLayer obstacles={obstaclesToDraw} />}
      </LayersControl>
      <div className='leaflet-bottom leaflet-left'>
        <Button
          className='leaflet-control'
          sx={{ margin: 3 }}
          variant='contained'
          color='primary'
          startIcon={<DownloadIcon />}
          disabled={
            !routeData ||
            !obstacles ||
            !tunnels ||
            fetchingRoute ||
            fetchingObstacles
          }
          onClick={downloadRouteData}
        >
          Download route data
        </Button>
      </div>
    </MapContainer>
  )
}
