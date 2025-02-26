import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'

import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    lazy: async () => {
      const { default: App } = await import('./app')
      return { Component: App }
    },
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: Home } = await import('./screens/Home')
          return { Component: Home }
        }
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
