import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
    AppBar,
    Toolbar,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    Chip,
    alpha,
    Button,
    Tooltip
} from '@mui/material'
import {
    Dashboard as DashboardIcon,
    Settings as SettingsIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    Monitor as MonitorIcon,
    Home as HomeIcon,
    FolderShared as ClientsIcon,
    NotificationsActive as AlertsIcon,
    Language as LanguageIcon
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../hooks/useApp'
import { logout } from '../store/slices/authSlice'
import { useBranding } from '../context/BrandingContext'
import { useTheme } from '@mui/material/styles'

export default function MainLayout() {
    const theme = useTheme()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const { logo } = useBranding()

    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useAppDispatch()
    const { user } = useAppSelector((state) => state.auth)

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
    const handleProfileMenuClose = () => setAnchorEl(null)

    const handleLogout = async () => {
        await dispatch(logout())
        navigate('/login')
    }

    const navigationItems = [
        { text: 'Início', icon: <HomeIcon fontSize="small" />, path: '/' },
        { text: 'Gerenciamento', icon: <ClientsIcon fontSize="small" />, path: '/settings/clients' },
        { text: 'Monitoramento', icon: <MonitorIcon fontSize="small" />, path: '/monitoring' },
        { text: 'Configurações', icon: <SettingsIcon fontSize="small" />, path: '/settings' },
    ]

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: '#151b26',
                    color: '#ffffff',
                    boxShadow: 'none',
                    borderBottom: `2px solid ${theme.palette.primary.main}`
                }}
            >
                <Toolbar sx={{ minHeight: '56px !important', px: 2 }}>
                    {/* Logo Area */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 4 }}>
                        {logo?.url ? (
                            <Box
                                component="img"
                                src={logo.url}
                                alt="Logo"
                                sx={{ height: 28, width: 'auto', objectFit: 'contain' }}
                            />
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: 'primary.main',
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <DashboardIcon sx={{ color: 'white', fontSize: 20 }} />
                                </Box>
                                <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                                    OnliOps
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Navigation Items (Top Bar) */}
                    <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
                        {navigationItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.path !== '/' && location.pathname.startsWith(item.path))

                            return (
                                <Button
                                    key={item.text}
                                    startIcon={item.icon}
                                    onClick={() => navigate(item.path)}
                                    sx={{
                                        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.65)',
                                        bgcolor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                                        px: 2,
                                        py: 0.8,
                                        borderRadius: 0,
                                        height: '56px',
                                        textTransform: 'none',
                                        fontSize: '0.875rem',
                                        fontWeight: isActive ? 600 : 400,
                                        borderBottom: isActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.05)',
                                            color: '#ffffff'
                                        }
                                    }}
                                >
                                    {item.text}
                                </Button>
                            )
                        })}
                    </Box>

                    {/* Right Side Tools */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Tooltip title="Alertas Ativos">
                            <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                <AlertsIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                            <Box sx={{ textAlign: 'right', mr: 1, display: { xs: 'none', sm: 'block' } }}>
                                <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>
                                    Olá,
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                                    {user?.name || 'Administrador'}
                                </Typography>
                            </Box>

                            <IconButton
                                onClick={handleProfileMenuOpen}
                                sx={{ p: 0.5, bgcolor: 'rgba(255,255,255,0.05)' }}
                            >
                                <Avatar sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: 'primary.main',
                                    fontSize: '0.9rem',
                                    fontWeight: 700
                                }}>
                                    {user?.name?.[0] || 'A'}
                                </Avatar>
                            </IconButton>
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Profile Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                PaperProps={{
                    sx: {
                        minWidth: 200,
                        mt: 1,
                        bgcolor: '#1c2533',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                    }
                }}
            >
                <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={700}>{user?.name}</Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)">{user?.email}</Typography>
                </Box>
                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                <MenuItem onClick={() => { navigate('/settings'); handleProfileMenuClose(); }}>
                    <ListItemIcon><SettingsIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.7)' }} /></ListItemIcon>
                    <ListItemText primary="Minha Conta" />
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ color: '#ff4d4f' }}>
                    <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#ff4d4f' }} /></ListItemIcon>
                    <ListItemText primary="Sair do Sistema" />
                </MenuItem>
            </Menu>

            {/* Sub-Header / Context Bar (Optional but common in HikCentral) */}
            <Box sx={{
                mt: '56px',
                height: 40,
                bgcolor: '#f8f9fb',
                borderBottom: '1px solid #d1d5db',
                display: 'flex',
                alignItems: 'center',
                px: 3
            }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LanguageIcon sx={{ fontSize: 14 }} /> Brasil / Português
                </Typography>
                <Divider orientation="vertical" flexItem sx={{ mx: 2, my: 1 }} />
                <Typography variant="caption" fontWeight={600} color="primary.main">
                    Ambiente de Produção
                </Typography>
            </Box>

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: '100%',
                    minHeight: 'calc(100vh - 96px)',
                    animation: 'fadeIn 0.3s ease-out'
                }}
            >
                <Outlet />
            </Box>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </Box>
    )
}

function Divider({ sx, orientation, flexItem }: any) {
    return <Box sx={{
        bgcolor: 'rgba(0,0,0,0.12)',
        width: orientation === 'vertical' ? '1px' : '100%',
        height: orientation === 'vertical' ? (flexItem ? 'auto' : '100%') : '1px',
        ...sx
    }} />
}
