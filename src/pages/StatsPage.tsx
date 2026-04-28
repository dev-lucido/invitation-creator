// src/pages/StatsPage.tsx

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Tabs, Tab, Divider, Button, Stack,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import PeopleIcon from '@mui/icons-material/People'
import LoginIcon from '@mui/icons-material/Login'
import DownloadIcon from '@mui/icons-material/Download'
import PersonIcon from '@mui/icons-material/Person'
import TranslateIcon from '@mui/icons-material/Translate'
import ImageIcon from '@mui/icons-material/Image'
import { fetchStats, StatsResponse, UserStat, ActivityEvent } from '../utils/api'

// ── Helpers ────────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.slice(0, 2).toUpperCase()
}
function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function timeAgo(iso: string | null) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const FLAG: Record<string, string> = { English: '🇬🇧', Sinhala: '🇱🇰', Tamil: '🇮🇳' }
const EVENT_COLOR: Record<string, string> = {
  login: '#0084cb',
  login_failed: '#e94560',
  download: '#2e7d32',
}
const EVENT_LABEL: Record<string, string> = {
  login: 'Login',
  login_failed: 'Failed Login',
  download: 'Download',
}

// ── Summary card ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{
        width: 48, height: 48, borderRadius: 2,
        bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={800} lineHeight={1}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Box>
    </Paper>
  )
}

// ── User stats table ───────────────────────────────────────────────────────────
function UserStatsTable({ stats }: { stats: UserStat[] }) {
  const sorted = [...stats].sort((a, b) => (b.downloadCount + b.loginCount) - (a.downloadCount + a.loginCount))
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="center">Logins</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="center">Downloads</TableCell>
            <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Languages</TableCell>
            <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Last Login</TableCell>
            <TableCell sx={{ fontWeight: 700, display: { xs: 'none', lg: 'table-cell' } }}>Last Activity</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map(u => (
            <TableRow key={u.username} hover>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Avatar sx={{
                    width: 30, height: 30, fontSize: 11, fontWeight: 700,
                    bgcolor: u.role === 'admin' ? '#e94560' : '#0084cb',
                  }}>
                    {initials(u.username)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{u.username}</Typography>
                    <Chip label={u.role} size="small" variant="outlined"
                      color={u.role === 'admin' ? 'error' : 'default'}
                      sx={{ height: 16, fontSize: 10, mt: 0.3 }} />
                  </Box>
                </Box>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontWeight={u.loginCount > 0 ? 700 : 400}
                  color={u.loginCount > 0 ? 'text.primary' : 'text.disabled'}>
                  {u.loginCount}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontWeight={u.downloadCount > 0 ? 700 : 400}
                  color={u.downloadCount > 0 ? '#2e7d32' : 'text.disabled'}>
                  {u.downloadCount}
                </Typography>
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <Box display="flex" gap={0.5} flexWrap="wrap">
                  {Object.entries(u.languages).length === 0
                    ? <Typography variant="caption" color="text.disabled">—</Typography>
                    : Object.entries(u.languages).map(([lang, count]) => (
                      <Chip key={lang} label={`${FLAG[lang] || ''} ${lang} ×${count}`}
                        size="small" variant="outlined" sx={{ fontSize: 11, height: 20 }} />
                    ))}
                </Box>
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                <Typography variant="caption" color="text.secondary" title={formatDateTime(u.lastLogin)}>
                  {u.lastLogin ? timeAgo(u.lastLogin) : '—'}
                </Typography>
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                <Typography variant="caption" color="text.secondary" title={formatDateTime(u.lastActivity)}>
                  {u.lastActivity ? timeAgo(u.lastActivity) : '—'}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
          {sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.disabled">No activity data yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// ── Activity feed ──────────────────────────────────────────────────────────────
function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {events.length === 0 ? (
        <Box py={4} textAlign="center">
          <Typography variant="body2" color="text.disabled">No activity recorded yet.</Typography>
        </Box>
      ) : (
        <Box sx={{ maxHeight: 480, overflowY: 'auto' }}>
          {events.map((e, i) => (
            <Box key={e.id || i} sx={{
              display: 'flex', alignItems: 'flex-start', gap: 2,
              px: 2, py: 1.5,
              borderBottom: i < events.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' },
            }}>
              {/* Dot */}
              <Box sx={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0, mt: 0.7,
                bgcolor: EVENT_COLOR[e.type] || '#999',
              }} />
              <Box flex={1} minWidth={0}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="body2" fontWeight={700} noWrap>{e.username}</Typography>
                  <Chip
                    label={EVENT_LABEL[e.type] || e.type}
                    size="small"
                    sx={{
                      height: 18, fontSize: 10,
                      bgcolor: `${EVENT_COLOR[e.type] || '#999'}18`,
                      color: EVENT_COLOR[e.type] || '#999',
                      border: `1px solid ${EVENT_COLOR[e.type] || '#999'}40`,
                    }}
                  />
                  {e.language && (
                    <Typography variant="caption" color="text.secondary">
                      {FLAG[e.language] || ''} {e.language}
                    </Typography>
                  )}
                  {e.templateName && (
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 160 }}
                      title={e.templateName}>
                      "{e.templateName}"
                    </Typography>
                  )}
                </Box>
                <Typography variant="caption" color="text.disabled" title={formatDateTime(e.timestamp)}>
                  {formatDateTime(e.timestamp)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  )
}

// ── Daily chart (pure CSS/SVG) ─────────────────────────────────────────────────
function DailyChart({ dailyDownloads }: { dailyDownloads: Record<string, number> }) {
  // Last 30 days
  const days: { date: string; label: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({
      date: key,
      label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      count: dailyDownloads[key] || 0,
    })
  }
  const max = Math.max(...days.map(d => d.count), 1)

  if (days.every(d => d.count === 0)) {
    return (
      <Box py={4} textAlign="center">
        <Typography variant="body2" color="text.disabled">No downloads recorded yet.</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', minWidth: 400, height: 120, px: 0.5 }}>
        {days.map(d => (
          <Box key={d.date} sx={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
          }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
              {d.count > 0 ? d.count : ''}
            </Typography>
            <Box sx={{
              width: '100%',
              height: `${Math.max((d.count / max) * 80, d.count > 0 ? 4 : 0)}px`,
              bgcolor: d.count > 0 ? '#0084cb' : 'action.disabled',
              borderRadius: '2px 2px 0 0',
              transition: 'height .2s',
              opacity: d.count > 0 ? 1 : 0.2,
              minHeight: 2,
            }} />
            {/* x-axis label every ~5 days */}
            {[0, 6, 13, 20, 27, 29].includes(days.indexOf(d)) && (
              <Typography variant="caption" color="text.secondary"
                sx={{ fontSize: 9, transform: 'rotate(-30deg)', transformOrigin: 'top center', mt: 0.3 }}>
                {d.label}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

// ── Language + Template breakdown ─────────────────────────────────────────────
function BreakdownRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <Box mb={1.5}>
      <Box display="flex" justifyContent="space-between" mb={0.5}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" fontWeight={700}>{count} <Typography component="span" variant="caption" color="text.secondary">({pct}%)</Typography></Typography>
      </Box>
      <Box sx={{ height: 8, bgcolor: 'action.hover', borderRadius: 4, overflow: 'hidden' }}>
        <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: color, borderRadius: 4, transition: 'width .4s' }} />
      </Box>
    </Box>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState(0)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setStats(await fetchStats()) }
    catch { setError('Failed to load stats') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <CircularProgress />
    </Box>
  )
  if (error || !stats) return (
    <Box p={4}><Alert severity="error">{error || 'No data'}</Alert></Box>
  )

  const langTotal = Object.values(stats.languageTotals).reduce((a, b) => a + b, 0)
  const tplTotal = Object.values(stats.templateTotals).reduce((a, b) => a + b, 0)

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3} gap={2} flexWrap="wrap">
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Reports & Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            User activity, download statistics, and system insights.
          </Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} variant="outlined" size="small" onClick={load}>
          Refresh
        </Button>
      </Box>

      {/* Summary cards */}
      <Grid container spacing={2} mb={3}>
        {[
          { icon: <PeopleIcon />, label: 'Total Users', value: stats.summary.totalUsers, color: '#0084cb' },
          { icon: <LoginIcon />, label: 'Total Logins', value: stats.summary.totalLogins, color: '#7b2ff7' },
          { icon: <DownloadIcon />, label: 'Total Downloads', value: stats.summary.totalDownloads, color: '#2e7d32' },
          { icon: <PersonIcon />, label: 'Active Users (30 days)', value: stats.summary.activeUsers, color: '#e94560' },
        ].map(c => (
          <Grid item xs={6} md={3} key={c.label}>
            <StatCard {...c} />
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }} variant="scrollable" scrollButtons="auto">
        <Tab label="User Activity" />
        <Tab label="Downloads Over Time" />
        <Tab label="Language & Templates" />
        <Tab label="Activity Feed" />
      </Tabs>

      {/* ── Tab 0: User Activity ── */}
      {tab === 0 && (
        <Box>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>Per-User Statistics</Typography>
          <UserStatsTable stats={stats.userStats} />
        </Box>
      )}

      {/* ── Tab 1: Downloads chart ── */}
      {tab === 1 && (
        <Box>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>Downloads — Last 30 Days</Typography>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
            <DailyChart dailyDownloads={stats.dailyDownloads} />
          </Paper>
        </Box>
      )}

      {/* ── Tab 2: Breakdowns ── */}
      {tab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                <TranslateIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>Language Breakdown</Typography>
                <Typography variant="caption" color="text.secondary" ml="auto">{langTotal} total</Typography>
              </Box>
              {langTotal === 0 ? (
                <Typography variant="body2" color="text.disabled" textAlign="center" py={2}>No downloads yet.</Typography>
              ) : (
                Object.entries(stats.languageTotals)
                  .sort((a, b) => b[1] - a[1])
                  .map(([lang, count]) => (
                    <BreakdownRow key={lang} label={`${FLAG[lang] || ''} ${lang}`} count={count} total={langTotal}
                      color={lang === 'English' ? '#0084cb' : lang === 'Sinhala' ? '#e94560' : '#7b2ff7'} />
                  ))
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                <ImageIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>Template Breakdown</Typography>
                <Typography variant="caption" color="text.secondary" ml="auto">{tplTotal} total</Typography>
              </Box>
              {tplTotal === 0 ? (
                <Typography variant="body2" color="text.disabled" textAlign="center" py={2}>No downloads yet.</Typography>
              ) : (
                Object.entries(stats.templateTotals)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, count], i) => (
                    <BreakdownRow key={name} label={name} count={count} total={tplTotal}
                      color={['#0084cb','#e94560','#2e7d32','#7b2ff7','#ed6c02'][i % 5]} />
                  ))
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ── Tab 3: Activity Feed ── */}
      {tab === 3 && (
        <Box>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            Recent Activity <Typography component="span" variant="caption" color="text.secondary">(last 100 events)</Typography>
          </Typography>
          <ActivityFeed events={stats.recentActivity} />
        </Box>
      )}
    </Box>
  )
}