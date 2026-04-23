import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, Button, Box, Container, CssBaseline,
  IconButton, Drawer, List, ListItem, ListItemButton, ListItemText,
  useMediaQuery, useTheme, Chip, Avatar
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import LogoutIcon from '@mui/icons-material/Logout'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import PersonIcon from '@mui/icons-material/Person'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AdminPage from './pages/AdminPage'
import UserPage from './pages/UserPage'
import LoginPage from './pages/LoginPage'

const theme = createTheme({
  palette: {
    primary: { main: '#0084cb' },
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

function RequireLogin({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()
  const location = useLocation()
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isAdmin } = useAuth()
  const location = useLocation()
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

// ── Logo component — put your logo image in public/logo.png ───────────────────
function Logo() {
  return (
    <Box
      component={Link}
      to="/"
      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none', flexGrow: 1 }}
    >
      <Avatar
        src="/logo.jpg"
        alt="SDB E - Greetings"
        variant="rounded"
        sx={{
          width: 200, height: 34,
          // bgcolor: 'rgba(255,255,255,0.1)',
          fontSize: 18,
          // Show ✉ emoji as fallback if logo.png doesn't exist
          '& img': { objectFit: 'contain' },
        }}
      >
        ✉
      </Avatar>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700, letterSpacing: 0.5, color: '#fff',
          fontSize: { xs: '1rem', sm: '1.2rem' },
        }}
      >
        SDB E - Greetings
      </Typography>
    </Box>
  )
}

function NavBar() {
  const loc = useLocation()
  const { isAdmin, isLoggedIn, user, logout } = useAuth()
  const muiTheme = useTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = () => setDrawerOpen(false)

  const navLinks = isLoggedIn ? [
    { label: 'Create Invitation', to: '/' },
    ...(isAdmin ? [{ label: 'Template Manager', to: '/admin' }] : []),
  ] : []

  return (
    <AppBar position="sticky" elevation={0}
      sx={{ bgcolor: '#0084cb', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
      <Toolbar sx={{ gap: 1 }}>
        <Logo />

        {isMobile ? (
          <>
            {isLoggedIn && (
              <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#fff' }}>
                <MenuIcon />
              </IconButton>
            )}
            <Drawer anchor="right" open={drawerOpen} onClose={closeDrawer}>
              <Box sx={{ width: 240, pt: 1 }}>
                <Box display="flex" justifyContent="flex-end" px={1}>
                  <IconButton onClick={closeDrawer}><CloseIcon /></IconButton>
                </Box>
                {isLoggedIn && (
                  <Box px={2} pb={1.5}>
                    <Chip
                      icon={isAdmin ? <AdminPanelSettingsIcon /> : <PersonIcon />}
                      label={`${user?.username} (${user?.role})`}
                      size="small" color={isAdmin ? 'error' : 'default'} variant="outlined"
                    />
                  </Box>
                )}
                <List>
                  {navLinks.map(link => (
                    <ListItem key={link.to} disablePadding>
                      <ListItemButton component={Link} to={link.to}
                        selected={loc.pathname === link.to} onClick={closeDrawer}>
                        <ListItemText primary={link.label} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  {isLoggedIn && (
                    <ListItem disablePadding>
                      <ListItemButton onClick={() => { logout(); closeDrawer() }}>
                        <ListItemText primary="Sign Out" primaryTypographyProps={{ color: 'error' }} />
                      </ListItemButton>
                    </ListItem>
                  )}
                </List>
              </Box>
            </Drawer>
          </>
        ) : (
          <>
            {navLinks.map(link => (
              <Button key={link.to} component={Link} to={link.to} sx={{
                color: loc.pathname === link.to ? '#e94560' : '#ffffffaa',
                fontWeight: loc.pathname === link.to ? 700 : 400,
              }}>
                {link.label}
              </Button>
            ))}
            {isLoggedIn && (
              <Box display="flex" alignItems="center" gap={1} ml={1}>
                <Chip
                  icon={isAdmin
                    ? <AdminPanelSettingsIcon sx={{ fontSize: '15px !important' }} />
                    : <PersonIcon sx={{ fontSize: '15px !important' }} />}
                  label={user?.username} size="small"
                  sx={{
                    bgcolor: isAdmin ? 'rgba(233,69,96,0.15)' : 'rgba(255,255,255,0.1)',
                    color: isAdmin ? '#e94560' : '#ffffffcc',
                    border: `1px solid ${isAdmin ? 'rgba(233,69,96,0.4)' : 'rgba(255,255,255,0.2)'}`,
                  }}
                />
                <Button onClick={logout} startIcon={<LogoutIcon />} size="small" sx={{ color: '#ffffffaa' }}>
                  Sign Out
                </Button>
              </Box>
            )}
          </>
        )}
      </Toolbar>
    </AppBar>
  )
}

function InnerApp() {
  return (
    <>
      <NavBar />
      <Container maxWidth={false} disableGutters>
        <Box sx={{ minHeight: 'calc(100vh - 64px)', bgcolor: '#fafafa' }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RequireLogin><UserPage /></RequireLogin>} />
            <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Container>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <InnerApp />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}