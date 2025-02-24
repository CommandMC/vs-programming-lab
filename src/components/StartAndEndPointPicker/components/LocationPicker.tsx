import React, { useCallback, useState } from 'react'
import { Autocomplete, TextField } from '@mui/material'
import * as Nominatim from 'nominatim-browser'
import type { NominatimResponse, GeocodeRequest } from 'nominatim-browser'

interface Props {
  label: string
  onLocationUpdate: (newCoordinates: [number, number] | null) => void
}

const COORDS_REGEX = /(\d+(?:.\d+)?),\s*(\d+(?:.\d+)?)/

export default function LocationPicker({ label, onLocationUpdate }: Props) {
  const [searchResults, setSearchResults] = useState<NominatimResponse[]>([])

  const setCoordinatesOrSearchForLocation = useCallback(
    async (coordsOrLocationName: string | NominatimResponse | null) => {
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
        return
      }
      const match = coordsOrLocationName.match(COORDS_REGEX)

      if (match) {
        // Case 2: User input coordinates ("lat,lon")
        const [, lat, lon] = match
        if (!lat || !lon) return
        onLocationUpdate([Number(lat), Number(lon)])
      } else {
        // Case 3: User wants to search for a location
        const request: GeocodeRequest = {
          q: coordsOrLocationName
        }
        const response = await Nominatim.geocode(request)
        setSearchResults(response)
      }
    },
    [setSearchResults]
  )

  return (
    <Autocomplete
      renderInput={(params) => (
        <TextField
          label={label}
          helperText='Insert coordinates or search for a location'
          {...params}
        />
      )}
      options={searchResults}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.display_name
      }
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
