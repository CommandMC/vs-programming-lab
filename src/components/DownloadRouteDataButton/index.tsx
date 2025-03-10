import React, { useCallback } from 'react'
import { Button } from '@mui/material'
import { Download as DownloadIcon } from '@mui/icons-material'
import type { NodeData, ObstacleOnRoute } from '../../types'
import type { OSMID } from '../../osrm-api/types'

interface Props {
  disabled: boolean
  nodeData: NodeData[]
  obstacles: ObstacleOnRoute[] | null
  tunnels: ObstacleOnRoute[] | null
  distanceUnderBridge: Record<OSMID, number>
  timeUnderBridge: Record<OSMID, number>
}

function DownloadRouteDataButton({
  disabled,
  nodeData,
  obstacles,
  tunnels,
  distanceUnderBridge,
  timeUnderBridge
}: Props) {
  const downloadRouteData = useCallback(() => {
    if (!nodeData || !obstacles || !tunnels) return

    const absoluteTimes: Record<OSMID, number> = Object.fromEntries(
      nodeData
        .map((nodeData) => nodeData.distanceAlongRoute / (nodeData.speed / 3.6))
        .reduce(
          (previousValue, currentValue) => [
            ...previousValue,
            previousValue.at(-1)! + currentValue
          ],
          [0]
        )
        .slice(0, -1)
        .map((timestamp, i) => [nodeData[i]!.id, timestamp])
    )

    const blob = new Blob(
      [
        JSON.stringify({
          routeData: nodeData.map((node) => ({
            ...node,
            distanceUnderBridge: distanceUnderBridge[node.id] ?? 0,
            timeUnderBridge: timeUnderBridge[node.id] ?? 0,
            timeAlongRoute: absoluteTimes[node.id]
          })),
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
  }, [nodeData, obstacles, tunnels, distanceUnderBridge, timeUnderBridge])

  return (
    <div className='leaflet-bottom leaflet-left'>
      <Button
        className='leaflet-control'
        sx={{ margin: 3 }}
        variant='contained'
        color='primary'
        startIcon={<DownloadIcon />}
        disabled={disabled || !nodeData.length || !obstacles || !tunnels}
        onClick={downloadRouteData}
      >
        Download route data
      </Button>
    </div>
  )
}

export default React.memo(DownloadRouteDataButton)
