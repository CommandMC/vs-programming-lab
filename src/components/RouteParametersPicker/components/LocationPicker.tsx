import React, { useCallback, useState } from 'react'
import { Autocomplete, TextField } from '@mui/material'
import NominatimApi from '../../../nominatim-api'
import type { PlaceOutput } from '../../../nominatim-api/types'

interface Props {
  ref: React.RefObject<HTMLDivElement | null>
  label: string
  onLocationUpdate: (newCoordinates: [number, number] | null) => void
}

const COORDS_REGEX = /(\d+(?:.\d+)?),\s*(\d+(?:.\d+)?)/

const nominatimApi = new NominatimApi()

function LocationPicker({ ref, label, onLocationUpdate }: Props) {
  const [selectedLocation, setSelectedLocation] = useState<PlaceOutput | null>(
    null
  )
  const [searchResults, setSearchResults] = useState<PlaceOutput[]>([])

  const setCoordinatesOrSearchForLocation = useCallback(
    async (coordsOrLocationName: string | PlaceOutput | null) => {
      if (!coordsOrLocationName) {
        onLocationUpdate(null)
        setSearchResults([])
        return
      }

      if (typeof coordsOrLocationName === 'object') {
        // Case 1: User selected a location they searched for
        onLocationUpdate([
          Number(coordsOrLocationName.lat),
          Number(coordsOrLocationName.lon)
        ])
        setSelectedLocation(coordsOrLocationName)
        return
      }
      const match = coordsOrLocationName.match(COORDS_REGEX)

      if (match) {
        // Case 2: User input coordinates ("lat,lon")
        const [, lat, lon] = match
        if (!lat || !lon) return
        onLocationUpdate([Number(lat), Number(lon)])
        const reverseResponse = await nominatimApi.reverse({ lat, lon })
        setSearchResults([reverseResponse])
        setSelectedLocation(reverseResponse)
      } else {
        // Case 3: User wants to search for a location
        const response = await nominatimApi.search({
          q: coordsOrLocationName
        })

        setSearchResults(
          // Deduplicate results
          response.reduce(
            (results: PlaceOutput[], newResult) =>
              (
                results.find(
                  (result) => result.display_name === newResult.display_name
                )
              ) ?
                results
              : [...results, newResult],
            []
          )
        )
      }
    },
    [setSearchResults]
  )

  return (
    <Autocomplete
      value={selectedLocation}
      renderInput={(params) => (
        <TextField
          ref={ref}
          label={label}
          helperText='Insert coordinates or search for a location'
          {...params}
        />
      )}
      options={searchResults}
      getOptionLabel={(option) => option.display_name}
      includeInputInList
      filterSelectedOptions
      noOptionsText='Hit Enter to search for given input'
      onChange={(_, value) => setCoordinatesOrSearchForLocation(value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const value = (e.target as any).value
          void setCoordinatesOrSearchForLocation(value)
          e.preventDefault()
        }
      }}
    />
  )
}

export default React.memo(LocationPicker)
