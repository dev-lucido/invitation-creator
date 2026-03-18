import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, Button, Box, Container,
  CssBaseline, IconButton, Drawer, List, ListItem, ListItemButton,
  ListItemText, useMediaQuery, useTheme
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { useState } from 'react'
import AdminPage from './pages/AdminPage'
import UserPage from './pages/UserPage'

const theme = createTheme({
  palette: {
    primary: { main: '#1a1a2e' },
    secondary: { main: '#e94560' },
  },
  typography: {
    fontFamily: '"Georgia", serif',
    h4: { fontFamily: '"Georgia", serif' },
    h5: { fontFamily: '"Georgia", serif' },
    h6: { fontFamily: '"Georgia", serif' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 8 },
        contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
      },
    },
    MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 12 } } },
  },
})

const NAV_LINKS = [
  { label: 'Create Invitation', to: '/' },
  { label: 'Admin', to: '/admin' },
]

function NavBar() {
  const loc = useLocation()
  const muiTheme = useTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'))
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,.08)' }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1, fontWeight: 700, letterSpacing: 1, color: '#fff',
            textDecoration: 'none', fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          ✉ InviteForge
        </Typography>

        {isMobile ? (
          <>
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#fff' }}>
              <MenuIcon />
            </IconButton>
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
              <Box sx={{ width: 220, pt: 1 }}>
                <Box display="flex" justifyContent="flex-end" px={1}>
                  <IconButton onClick={() => setDrawerOpen(false)}>
                    <CloseIcon />
                  </IconButton>
                </Box>
                <List>
                  {NAV_LINKS.map(link => (
                    <ListItem key={link.to} disablePadding>
                      <ListItemButton
                        component={Link}
                        to={link.to}
                        selected={loc.pathname === link.to}
                        onClick={() => setDrawerOpen(false)}
                      >
                        <ListItemText primary={link.label} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Drawer>
          </>
        ) : (
          NAV_LINKS.map(link => (
            <Button
              key={link.to}
              component={Link}
              to={link.to}
              sx={{
                color: loc.pathname === link.to ? '#e94560' : '#ffffffaa',
                fontWeight: loc.pathname === link.to ? 700 : 400,
                ml: 1,
              }}
            >
              {link.label}
            </Button>
          ))
        )}
      </Toolbar>
    </AppBar>
  )
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <NavBar />
        <Container maxWidth={false} disableGutters>
          <Box sx={{ minHeight: 'calc(100vh - 64px)', bgcolor: '#fafafa' }}>
            <Routes>
              <Route path="/" element={<UserPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </Box>
        </Container>
      </BrowserRouter>
    </ThemeProvider>
  )
}