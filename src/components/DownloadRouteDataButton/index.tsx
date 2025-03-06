import React, { useCallback } from 'react'
import { Button } from '@mui/material'
import { Download as DownloadIcon } from '@mui/icons-material'
import type { NodeData, ObstacleOnRoute } from '../../types'

interface Props {
  disabled: boolean
  nodeData: NodeData[]
  obstacles: ObstacleOnRoute[] | null
  tunnels: ObstacleOnRoute[] | null
}

function DownloadRouteDataButton({
  disabled,
  nodeData,
  obstacles,
  tunnels
}: Props) {
  const downloadRouteData = useCallback(() => {
    if (!nodeData || !obstacles || !tunnels) return
    const blob = new Blob(
      [
        JSON.stringify({
          routeData: nodeData,
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
  }, [nodeData, obstacles, tunnels])

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
