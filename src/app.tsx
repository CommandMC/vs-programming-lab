import {
  AppBar,
  Button,
  createTheme,
  CssBaseline,
  ThemeProvider,
  Toolbar,
  useMediaQuery
} from '@mui/material'
import { Home as IconHome, Map as IconMap } from '@mui/icons-material'
import React, { useMemo } from 'react'
import { NavLink, Outlet } from 'react-router'

export default function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode: prefersDarkMode ? 'dark' : 'light'
      }
    })
  }, [prefersDarkMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position='sticky' sx={{ marginBottom: 3 }}>
        <Toolbar sx={{ gap: 2 }}>
          <NavLink to='/'>
            <Button variant='contained' startIcon={<IconHome />}>
              Home
            </Button>
          </NavLink>
          <NavLink to='/map'>
            <Button variant='contained' color='success' startIcon={<IconMap />}>
              Map
            </Button>
          </NavLink>
        </Toolbar>
      </AppBar>
      <Outlet />
    </ThemeProvider>
  )
}
