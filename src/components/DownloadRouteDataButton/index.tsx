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

// Dataset from "Starling on the Autobahn"
const RECONFIG_TIMES = {
  70: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13461504, 13672448, 23439616, 25587968,
    34379520, 34596608, 37515008, 45909760, 46413312, 47580416, 48136704,
    68345088, 68817408, 74352640, 123596032, 127510272, 132064000, 133460992,
    143529984, 146937088, 148631040, 150536960, 154935552, 158836480, 161521920,
    171047424, 174555136, 180129792, 182045440, 185075712, 185171456, 186605312,
    189602560, 199033600, 206359040, 206434304, 271048192, 419481600, 420012288,
    652453888, 745147392
  ],
  90: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6532864,
    6911488, 16810496, 28829952, 32168960, 35625216, 40716288, 44990464,
    59750400, 59818496, 62915072, 80645632, 98333440, 124497664, 148504576,
    167576320, 176940800, 191953408
  ],
  110: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 15847936, 16083456, 28801024, 31694080, 39279104,
    43147008, 43705344, 45405952, 48247040, 60380416, 66402560, 67795968,
    68565504, 69858816, 73089792, 85536768, 90182144, 112837376, 114850304,
    136484864, 144446464, 146667008, 161777920, 167479552, 171886848, 172044032,
    174341120, 174759424, 177205248, 192642048, 197186304, 201307392, 205159168,
    213825280, 222594304
  ],
  130: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16968448, 19590144,
    19591168, 20020736, 21331968, 21726720, 23985920, 32317952, 32917504,
    38766848, 38871296, 39981312, 40573184, 41804544, 43597056, 43689472,
    44243456, 44936192, 46909952, 48239360, 51153408, 52485376, 53404672,
    53974528, 54038528, 58017792, 58379264, 59395072, 60079616, 65491456,
    66082048, 84583424, 90043648, 107404544, 108176896, 120807424, 132408064,
    137545216, 141739008, 141907968, 142459136, 145517056, 147832832, 149261312,
    152830208, 153150208, 156933632, 157299968, 157311744, 158851840, 164039168,
    164288768, 165096448, 169457664, 169481728, 175682560, 177655552, 179946240,
    187096576, 187896064, 191387904, 191526144, 196468224, 196716544, 215778816,
    245185536, 254909952
  ],
  Infinity: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 26135552, 26685952, 26792960, 30057728, 34160384, 40537600,
    41865472, 45981696, 46792704, 53938432, 55959808, 66511616, 90154496,
    93607168, 113829632, 131690240, 145350400, 155823872, 157269760, 159066368,
    161696000, 161940736, 172187392, 173911296, 175986432, 176257024, 176343808,
    190660608, 223380736, 227106816, 267744256, 285883136, 363116544, 484728576,
    730063872, 789922048, 977241856
  ]
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
        .map((nodeData) => nodeData.segmentLength / (nodeData.speed / 3.6))
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

    const lossTimestamps: Record<number, number> = Object.fromEntries(
      nodeData.map((node) => [
        absoluteTimes[node.id]!,
        timeUnderBridge[node.id]!
      ])
    )

    // Add reconfigurations
    const lastNodeTimestamp = absoluteTimes[nodeData.at(-1)!.id]!
    for (
      let nextReconfigurationTimestamp = 15;
      nextReconfigurationTimestamp < lastNodeTimestamp;
      nextReconfigurationTimestamp += 15
    ) {
      const lastNodeBeforeReconfTimestamp = nodeData.findLast(
        (node) => absoluteTimes[node.id]! < nextReconfigurationTimestamp
      )!

      const speedBucket = Object.entries(RECONFIG_TIMES).find(
        ([maxSpeed]) => lastNodeBeforeReconfTimestamp.speed < Number(maxSpeed)
      )![1]
      const reconfigTimeChoice =
        speedBucket[Math.floor(Math.random() * speedBucket.length)]! /
        Math.pow(10, 9)

      const lastNodeTimestamp = absoluteTimes[lastNodeBeforeReconfTimestamp.id]!
      const lastNodeTuB = timeUnderBridge[lastNodeBeforeReconfTimestamp.id]!
      if (lastNodeTimestamp + lastNodeTuB > nextReconfigurationTimestamp) {
        // Reconfiguration occurs while under bridge. Add the reconfiguration time onto the TuB
        lossTimestamps[absoluteTimes[lastNodeBeforeReconfTimestamp.id]!] =
          nextReconfigurationTimestamp - lastNodeTimestamp + reconfigTimeChoice
      } else {
        // Reconfiguration occurs while not under bridge, add a new timestamp for it
        lossTimestamps[nextReconfigurationTimestamp] = reconfigTimeChoice
      }
    }

    const blob = new Blob(
      [
        `timestamp,lossTime\n`,
        Object.entries(lossTimestamps)
          .filter(([, lossTime]) => lossTime)
          .toSorted((a, b) => Number(a[0]) - Number(b[0]))
          .map(([timestamp, lossTime]) => `${timestamp},${lossTime}`)
          .join('\n')
      ],
      { type: 'text/csv' }
    )
    const href = URL.createObjectURL(blob)
    const linkElem = document.createElement('a')
    linkElem.href = href
    linkElem.download = 'RouteData.csv'
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
