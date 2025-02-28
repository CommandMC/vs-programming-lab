import React from 'react'
import RoutePolyline from './RoutePolyline'

import type { RouteLeg } from '../../../osrm-api/types'
import type { LineString } from 'geojson'

interface Props {
  leg: RouteLeg<LineString, false, true>
}

function RouteLeg({ leg }: Props) {
  const coordinates = leg.steps
    .map((step, i) => step.geometry.coordinates.slice(i === 0 ? 0 : 1))
    .flat()
  return leg.annotation.nodes.map((id1, i) => {
    const id2 = leg.annotation.nodes[i + 1]
    const pos1 = coordinates[i]
    const pos2 = coordinates[i + 1]
    const speed = leg.annotation.speed[i]
    if (!id2 || !pos1 || !pos2 || !speed) return null
    return (
      <RoutePolyline
        key={i}
        id1={id1}
        id2={id2}
        pos1={pos1}
        pos2={pos2}
        speed={speed}
      />
    )
  })
}

export default React.memo(RouteLeg)
