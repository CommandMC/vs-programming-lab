import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'

import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import MapComponent from './components/MapComponent'

const router = createBrowserRouter([
  {
    path: '/',
    lazy: async () => {
      const { default: App } = await import('./app')
      return { Component: App }
    },
    children: [
      {
        path: 'map',
        element: <MapComponent />
      }
    ]
  }
])

const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
