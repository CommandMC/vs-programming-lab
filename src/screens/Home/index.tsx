import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { LayersControl, MapContainer, TileLayer } from 'react-leaflet'
import haversine from 'haversine-distance'

import StartAndEndPointPicker from '../../components/StartAndEndPointPicker'
import RouteLayer from '../../components/RouteLayer'
import ObstaclesLayer from '../../components/ObstaclesLayer'
import OSRMApi from '../../osrm-api'

import type { OSMID, Route } from '../../osrm-api/types'
import type { LineString } from 'geojson'
import type {
  NodeData,
  ObstacleOnRoute,
  OverpassCount,
  OverpassWay,
  OverpassWayBody
} from '../../types'
import DownloadRouteDataButton from '../../components/DownloadRouteDataButton'

const COORDS_OSNABRUECK: [number, number] = [52.2719595, 8.047635]

const routing_api = new OSRMApi()

export default function HomeScreen() {
  const [routeData, setRouteData] = useState<{
    route: Route<LineString, false, true>
    extraNodeData: Record<OSMID, Omit<NodeData, 'id'>>
  } | null>(null)
  const [nodeSpeedLimits, setNodeSpeedLimits] = useState<Record<
    OSMID,
    string
  > | null>(null)
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

      const newNodeData: Record<
        OSMID,
        {
          speed: number
          coordinates: [number, number]
          distance: number
        }
      > = {}
      newRoute.routes[0].legs
        .map((leg) => leg.annotation.nodes)
        .flat()
        .forEach((nodeid, i) => {
          const coords = nodeCoords[i]
          const speedAtNode = nodeSpeeds[i]
          const distance = nodeDistances[i]
          if (!coords || !speedAtNode || !distance) return
          newNodeData[nodeid] = {
            coordinates: coords.toReversed() as [number, number],
            speed: speedAtNode,
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
.route out count;
.route out body;

way.route[tunnel]->.tunnels;
.tunnels out count;
.tunnels out geom;
     
(.route; - way.route[man_made="bridge"];)->.route;
way(around.route:0)[bridge][man_made!="bridge"]->.bridges;
(.bridges; - .adjacent;)->.crossing;
.crossing out ids geom;`
    console.log(query)
    const overpassQueryPromise = fetch(
      'https://overpass-api.de/api/interpreter',
      {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query)
      }
    )
      .then((data) => data.json())
      .then(
        ({ elements }) =>
          elements as (OverpassCount | OverpassWay | OverpassWayBody)[]
      )
    const obstacleDataImportPromise = fetch('/obstacle_data.json')
      .then((res) => res.json())
      .then(
        (json) =>
          json as Record<OSMID, Omit<ObstacleOnRoute, 'obstacle' | 'nodeid'>>
      )

    Promise.all([overpassQueryPromise, obstacleDataImportPromise]).then(
      ([elements, obstacleData]) => {
        // Update node speed based on way speed limits (OSRM won't give us speeds faster than ~110km/h)
        const routeWaysCount = Number((elements[0] as OverpassCount).tags.ways)
        const routeWays = elements.slice(
          1,
          routeWaysCount + 1
        ) as OverpassWayBody[]

        setNodeSpeedLimits(
          Object.fromEntries(
            routeWays
              .map((way) =>
                way.nodes
                  .filter((nodeid) => nodeid in routeData.extraNodeData)
                  .map((nodeid) => [nodeid, way.tags['maxspeed']])
              )
              .flat()
          )
        )

        const tunnelCount = Number(
          (elements[routeWaysCount + 1] as OverpassCount).tags.ways
        )
        const obstacles = elements.slice(routeWaysCount + 2) as OverpassWay[]

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
            const extraData = obstacleData[obstacle.id]
            if (extraData) newObstacles.push({ ...newEntry, ...extraData })
          }
        })

        setObstacles(newObstacles)
        setTunnels(newTunnels)
        console.log('Obstacles updated:', newObstacles)
        console.log('Tunnels updated:', newTunnels)
        setFetchingObstacles(false)
      }
    )
  }, [routeData])

  const routeButtonLoadingText = useMemo(() => {
    if (fetchingRoute) return 'Fetching route'
    if (fetchingObstacles) return 'Fetching obstacles'
    return undefined
  }, [fetchingRoute, fetchingObstacles])

  const obstaclesToDraw = useMemo(
    () => [...(obstacles ?? []), ...(tunnels ?? [])],
    [obstacles, tunnels]
  )

  const nodeDataWithUpdatedSpeeds = useMemo(() => {
    if (!routeData) return []
    return Object.entries(routeData.extraNodeData)
      .map(([key, value]) => ({
        id: Number(key),
        ...value
      }))
      .sort((a, b) => a.distance - b.distance)
      .map((node) => {
        // OSRM tops out at ~110km/h, even if there isn't a speed limit / the speed limit is higher
        // If that's the case, use the speed limit as the speed value instead
        const speedLimitAtNode = nodeSpeedLimits?.[node.id]
        if (speedLimitAtNode && node.speed >= 110) {
          if (speedLimitAtNode === 'none') {
            node.speed = 130
          } else {
            node.speed = Number(speedLimitAtNode)
          }
        }
        return node
      })
  }, [routeData, nodeSpeedLimits])

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
        {routeData && <RouteLayer nodeData={nodeDataWithUpdatedSpeeds} />}
        {obstacles && <ObstaclesLayer obstacles={obstaclesToDraw} />}
      </LayersControl>
      <DownloadRouteDataButton
        disabled={fetchingRoute || fetchingObstacles}
        nodeData={nodeDataWithUpdatedSpeeds}
        obstacles={obstacles}
        tunnels={tunnels}
      />
    </MapContainer>
  )
}
