import type { LineString } from 'geojson'

/*
General concepts
*/

// OpenStreetMap Node ID
type OSMID = number

// [longitude, latitude]
type LonLatTuple = [number, number]

interface Route<
  GeometryT,
  HasSummary extends boolean,
  HasAnnotation extends boolean
> {
  distance: number
  duration: number
  geometry: GeometryT
  weight: number
  weight_name: string
  legs: RouteLeg<GeometryT, HasSummary, HasAnnotation>[]
}

interface RouteLeg<
  GeometryT,
  HasSummary extends boolean,
  HasAnnotation extends boolean
> {
  distance: number
  duration: number
  weight: number
  summary: HasSummary extends true ? string : ''
  steps: RouteStep<GeometryT>[]
  annotation: HasAnnotation extends true ? Annotation : undefined
}

interface Annotation {
  distance: number[]
  duration: number[]
  datasources: number[]
  nodes: OSMID[]
  weight: number[]
  speed: number[]
  metadata: {
    datasource_names: string[]
  }
}

interface RouteStep<GeometryT> {
  distance: number
  duration: number
  geometry: GeometryT
  weight: number
  name: string
  ref?: string
  pronunciation?: string
  destinations?: string
  exits: string
  mode: string
  maneuver: StepManeuver
  intersections: Intersection[]
  rotary_name?: string
  rotary_pronunciation?: string
  driving_side: 'left' | 'right'
}

interface StepManeuver {
  location: LonLatTuple
  bearing_before: number
  bearing_after: number
  type:
    | 'turn'
    | 'new name'
    | 'depart'
    | 'arrive'
    | 'merge'
    | 'ramp'
    | 'on ramp'
    | 'off ramp'
    | 'fork'
    | 'end of road'
    | 'use lane'
    | 'continue'
    | 'roundabout'
    | 'rotary'
    | 'roundabout turn'
    | 'notification'
    | 'exit roundabout'
    | 'exit rotary'
}

interface Lane {
  indications: (
    | 'none'
    | 'uturn'
    | 'sharp right'
    | 'right'
    | 'slight right'
    | 'straight'
    | 'slight left'
    | 'left'
    | 'sharp left'
  )[]
  valid: 'true' | 'false'
}

interface Intersection {
  location: LonLatTuple
  bearings: number[]
  classes: string[]
  entry: ('true' | 'false')[]
  in: number
  out: number
  lanes?: Lane[]
}

interface Waypoint {
  name: string
  location: LonLatTuple
  distance: number
  hint: string
}

/*
Services
*/

type Service = 'route' | 'nearest' | 'table' | 'match' | 'trip' | 'tile'

interface CommonOptions<ServiceT extends Service> {
  service: ServiceT
  version?: 'v1'
  profile: 'car' | 'bike' | 'foot'
  coordinates: LonLatTuple[]
  format?: 'json' | 'flatbuffers'
  // TODO
  bearings?: unknown
  // TODO
  radiuses?: unknown
  generate_hints?: boolean
  // TODO
  hints?: unknown
  // TODO
  approaches?: unknown
  exclude?: string[]
  snapping?: 'default' | 'any'
  skip_waypoints?: boolean
}

interface NearestServiceOptions extends CommonOptions<'nearest'> {
  number?: number
}

interface RouteServiceOptions extends CommonOptions<'route'> {
  alternatives?: boolean | number
  steps?: boolean
  annotations?:
    | 'true'
    | 'false'
    | 'nodes'
    | 'distance'
    | 'duration'
    | 'datasources'
    | 'weight'
    | 'speed'
  geometries?: 'polyline' | 'polyline6' | 'geojson'
  overview?: 'simplified' | 'full' | 'false'
  continue_straight?: 'default' | 'true' | 'false'
  waypoints?: number[]
}

interface GeneralResponse {
  message?: string
  data_version: string
}

type GeneralErrorCodes =
  | 'InvalidUrl'
  | 'InvalidService'
  | 'InvalidVersion'
  | 'InvalidOptions'
  | 'InvalidQuery'
  | 'InvalidValue'
  | 'NoSegment'
  | 'TooBig'

interface ServiceSpecificErrorCodes {
  nearest: []
  route: 'NoRoute'
  // TODO: All services below
  table: []
  match: []
  trip: []
  tile: []
}

interface ErrorResponse<ServiceT extends Service> extends GeneralResponse {
  code: GeneralErrorCodes | ServiceSpecificErrorCodes[ServiceT]
}

interface SuccessResponse extends GeneralResponse {
  code: 'Ok'
}

interface NearestServiceResponse<OptionsT extends NearestServiceOptions>
  extends SuccessResponse {
  waypoints: OptionsT['skip_waypoints'] extends true ? undefined
  : (Waypoint & { nodes: OSMID[] })[]
}

type RouteFromRouteServiceOptions<Options extends RouteServiceOptions> = Route<
  Options['geometries'] extends 'geojson' ? LineString : string,
  false,
  Options['annotations'] extends 'true' ? true : false
>

interface RouteServiceResponse<OptionsT extends RouteServiceOptions>
  extends SuccessResponse {
  waypoints: OptionsT['skip_waypoints'] extends true ? undefined : Waypoint[]
  routes: [
    RouteFromRouteServiceOptions<OptionsT>,
    ...RouteFromRouteServiceOptions<OptionsT>[]
  ]
}

export type {
  OSMID,
  Route,
  RouteLeg,
  RouteStep,
  NearestServiceOptions,
  RouteServiceOptions,
  ErrorResponse,
  NearestServiceResponse,
  RouteServiceResponse
}
