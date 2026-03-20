import { useState, useEffect } from 'react'
import {
  Box, Paper, Typography, TextField, Button, Alert,
  CircularProgress, InputAdornment, IconButton, Divider
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

export default function LoginPage() {
  const { login, isLoggedIn, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from || '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If already logged in, redirect immediately
  useEffect(() => {
    if (isLoggedIn) {
      navigate(isAdmin ? '/admin' : '/', { replace: true })
    }
  }, [isLoggedIn, isAdmin, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return
    setLoading(true)
    setError(null)
    try {
      await login(username.trim(), password)
      // login() updates the user state; useEffect above will handle redirect
    } catch (err: any) {
      setError(err.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#fafafa',
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 400,
          p: { xs: 3, sm: 4 },
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <Box
            sx={{
              width: 52, height: 52, borderRadius: '50%',
              bgcolor: '#1a1a2e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mb: 2,
            }}
          >
            <LockOutlinedIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Typography variant="h5" fontWeight={700}>Welcome to InviteForge</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5} textAlign="center">
            Sign in to create and download invitations
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            fullWidth
            size="small"
            autoComplete="username"
            autoFocus
            sx={{ mb: 2 }}
            disabled={loading}
          />
          <TextField
            label="Password"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            size="small"
            autoComplete="current-password"
            sx={{ mb: 2 }}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPass(v => !v)} edge="end" tabIndex={-1}>
                    {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || !username.trim() || !password}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </Box>

        <Divider sx={{ my: 2.5 }} />
        <Typography variant="caption" color="text.disabled" display="block" textAlign="center">
          Admins can manage templates and create invitations.
          <br />Regular users can only create invitations.
        </Typography>
      </Paper>
    </Box>
  )
}