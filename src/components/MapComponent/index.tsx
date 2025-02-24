import React from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

const COORDS_OSNABRUECK: [number, number] = [52.2719595, 8.047635]

export default function MapComponent() {
  return (
    <MapContainer
      center={COORDS_OSNABRUECK}
      zoom={13}
      style={{ height: '80vh', width: '100%', padding: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <Marker position={COORDS_OSNABRUECK}>
        <Popup>
          A pretty CSS3 popup. <br /> Easily customizable.
        </Popup>
      </Marker>
    </MapContainer>
  )
}
