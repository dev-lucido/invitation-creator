import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Container, CssBaseline, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useState } from 'react';
import AdminPage from './pages/AdminPage';
import UserPage from './pages/UserPage';
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
});
const NAV_LINKS = [
    { label: 'Create Invitation', to: '/' },
    { label: 'Admin', to: '/admin' },
];
function NavBar() {
    const loc = useLocation();
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
    const [drawerOpen, setDrawerOpen] = useState(false);
    return (_jsx(AppBar, { position: "sticky", elevation: 0, sx: { bgcolor: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,.08)' }, children: _jsxs(Toolbar, { children: [_jsx(Typography, { variant: "h6", component: Link, to: "/", sx: {
                        flexGrow: 1, fontWeight: 700, letterSpacing: 1, color: '#fff',
                        textDecoration: 'none', fontSize: { xs: '1rem', sm: '1.25rem' }
                    }, children: "\u2709 InviteForge" }), isMobile ? (_jsxs(_Fragment, { children: [_jsx(IconButton, { onClick: () => setDrawerOpen(true), sx: { color: '#fff' }, children: _jsx(MenuIcon, {}) }), _jsx(Drawer, { anchor: "right", open: drawerOpen, onClose: () => setDrawerOpen(false), children: _jsxs(Box, { sx: { width: 220, pt: 1 }, children: [_jsx(Box, { display: "flex", justifyContent: "flex-end", px: 1, children: _jsx(IconButton, { onClick: () => setDrawerOpen(false), children: _jsx(CloseIcon, {}) }) }), _jsx(List, { children: NAV_LINKS.map(link => (_jsx(ListItem, { disablePadding: true, children: _jsx(ListItemButton, { component: Link, to: link.to, selected: loc.pathname === link.to, onClick: () => setDrawerOpen(false), children: _jsx(ListItemText, { primary: link.label }) }) }, link.to))) })] }) })] })) : (NAV_LINKS.map(link => (_jsx(Button, { component: Link, to: link.to, sx: {
                        color: loc.pathname === link.to ? '#e94560' : '#ffffffaa',
                        fontWeight: loc.pathname === link.to ? 700 : 400,
                        ml: 1,
                    }, children: link.label }, link.to))))] }) }));
}
export default function App() {
    return (_jsxs(ThemeProvider, { theme: theme, children: [_jsx(CssBaseline, {}), _jsxs(BrowserRouter, { children: [_jsx(NavBar, {}), _jsx(Container, { maxWidth: false, disableGutters: true, children: _jsx(Box, { sx: { minHeight: 'calc(100vh - 64px)', bgcolor: '#fafafa' }, children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(UserPage, {}) }), _jsx(Route, { path: "/admin", element: _jsx(AdminPage, {}) })] }) }) })] })] }));
}
