// src/pages/UsersPage.tsx

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, Chip, CircularProgress,
  Alert, Snackbar, Stack, Tooltip, Avatar,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import PersonIcon from '@mui/icons-material/Person'
import LockResetIcon from '@mui/icons-material/LockReset'
import { fetchUsers, createUser, updateUser, deleteUser, AppUser } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

function initials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface UserDialogProps {
  open: boolean
  editing: AppUser | null
  onClose: () => void
  onSaved: () => void
}

function UserDialog({ open, editing, onClose, onSaved }: UserDialogProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'user'>('user')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setUsername(editing?.username ?? '')
      setPassword('')
      setRole((editing?.role as 'admin' | 'user') ?? 'user')
      setError(null)
    }
  }, [open, editing])

  const handleSave = async () => {
    if (!username.trim()) { setError('Username is required'); return }
    if (!editing && !password) { setError('Password is required for new users'); return }
    setSaving(true); setError(null)
    try {
      if (editing) {
        const patch: { username?: string; password?: string; role?: 'admin' | 'user' } = {}
        if (username !== editing.username) patch.username = username.trim()
        if (password) patch.password = password
        if (role !== editing.role) patch.role = role
        await updateUser(editing.id, patch)
      } else {
        await createUser({ username: username.trim(), password, role })
      }
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {editing ? `Edit — ${editing.username}` : 'Create New User'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} mt={1}>
          <TextField
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            fullWidth size="small" autoFocus
            disabled={editing?.id === 'usr_admin'}
            helperText={editing?.id === 'usr_admin' ? 'Default admin username cannot be changed' : ''}
          />
          <TextField
            label={editing ? 'New Password (leave blank to keep)' : 'Password'}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth size="small"
          />
          <FormControl size="small" fullWidth disabled={editing?.id === 'usr_admin'}>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={role} onChange={e => setRole(e.target.value as 'admin' | 'user')}>
              <MenuItem value="user">
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon fontSize="small" /> User
                </Box>
              </MenuItem>
              <MenuItem value="admin">
                <Box display="flex" alignItems="center" gap={1}>
                  <AdminPanelSettingsIcon fontSize="small" /> Admin
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          {error && <Alert severity="error" sx={{ mt: 0 }}>{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AppUser | null>(null)
  const [snack, setSnack] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setUsers(await fetchUsers()) }
    catch { setError('Failed to load users') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (u: AppUser) => {
    if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return
    setDeleting(u.id)
    try {
      await deleteUser(u.id)
      setUsers(prev => prev.filter(x => x.id !== u.id))
      setSnack(`User "${u.username}" deleted`)
    } catch (e: any) {
      setSnack(e?.response?.data?.error || 'Delete failed')
    } finally {
      setDeleting(null) }
  }

  const openCreate = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (u: AppUser) => { setEditing(u); setDialogOpen(true) }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Create and manage user accounts. Admins have full access; users can only create invitations.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ flexShrink: 0, ml: 2 }}>
          New User
        </Button>
      </Box>

      <Box mt={3}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Created by</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(u => {
                  const isSelf = u.username === currentUser?.username
                  const isDefaultAdmin = u.id === 'usr_admin'
                  return (
                    <TableRow key={u.id} hover sx={{ opacity: deleting === u.id ? 0.4 : 1 }}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{
                            width: 32, height: 32, fontSize: 12, fontWeight: 700,
                            bgcolor: u.role === 'admin' ? '#e94560' : '#0084cb',
                          }}>
                            {initials(u.username)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{u.username}</Typography>
                            {isSelf && <Typography variant="caption" color="primary">You</Typography>}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={u.role === 'admin'
                            ? <AdminPanelSettingsIcon sx={{ fontSize: '14px !important' }} />
                            : <PersonIcon sx={{ fontSize: '14px !important' }} />}
                          label={u.role}
                          size="small"
                          color={u.role === 'admin' ? 'error' : 'default'}
                          variant={u.role === 'admin' ? 'filled' : 'outlined'}
                          sx={{ fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Typography variant="caption" color="text.secondary">{formatDate(u.createdAt)}</Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="caption" color="text.secondary">{u.createdBy || '—'}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit / change password">
                          <IconButton size="small" onClick={() => openEdit(u)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={isDefaultAdmin ? 'Cannot delete default admin' : isSelf ? 'Cannot delete yourself' : 'Delete user'}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={isDefaultAdmin || isSelf || deleting === u.id}
                              onClick={() => handleDelete(u)}
                            >
                              <DeleteIcon fontSize="small" color={isDefaultAdmin || isSelf ? 'disabled' : 'error'} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <UserDialog
        open={dialogOpen}
        editing={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { load(); setSnack(editing ? 'User updated!' : 'User created!') }}
      />

      <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack('')}
        message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  )
}