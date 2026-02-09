import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
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
    alpha,
    Tooltip,
    Drawer,
    CssBaseline,
    Divider
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
    Language as LanguageIcon,
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../hooks/useApp'
import { logout } from '../store/slices/authSlice'
import { clearProjectContext } from '../store/slices/projectSlice'
import { useBranding } from '../context/BrandingContext'
import { useTheme } from '@mui/material/styles'

const drawerWidth = 240

export default function MainLayout() {
    const theme = useTheme()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [open, setOpen] = useState(true)
    const { logo } = useBranding()

    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useAppDispatch()
    const { user } = useAppSelector((state) => state.auth)
    const { currentClient, currentProject } = useAppSelector((state) => state.project)

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
    const handleProfileMenuClose = () => setAnchorEl(null)

    const handleLogout = async () => {
        await dispatch(logout())
        navigate('/login')
    }

    const handleHomeClick = () => {
        dispatch(clearProjectContext())
        navigate('/')
    }

    const navigationItems = [
        { text: 'Dashboard Global', icon: <HomeIcon />, path: '/', action: handleHomeClick },
        { text: 'Monitoramento', icon: <MonitorIcon />, path: '/monitoring' },
        { text: 'Central de Integrações', icon: <LanguageIcon />, path: '/settings/integrations' },
        { text: 'Gerenciamento', icon: <ClientsIcon />, path: '/settings/clients' },
        { text: 'Configurações', icon: <SettingsIcon />, path: '/settings' },
    ]

    const toggleDrawer = () => {
        setOpen(!open)
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <CssBaseline />

            {/* AppBar */}
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: '#151b26',
                    color: '#ffffff',
                    boxShadow: 'none',
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    transition: theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                }}
            >
                <Toolbar sx={{ minHeight: '56px !important', px: 2 }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={toggleDrawer}
                        edge="start"
                        sx={{ mr: 2 }}
                    >
                        {open ? <ChevronLeftIcon /> : <MenuIcon />}
                    </IconButton>

                    {/* Logo Area */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 0 }}>
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

                    {/* Spacer */}
                    <Box sx={{ flexGrow: 1 }} />

                    {/* Context Information (Current Client/Project) */}
                    {currentClient && (
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            mr: 3,
                            bgcolor: 'rgba(255,255,255,0.05)',
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', lineHeight: 1 }}>
                                    CLIENTE
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.light' }}>
                                    {currentClient.name}
                                </Typography>
                            </Box>
                            {currentProject && (
                                <>
                                    <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 0.8 }} />
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', lineHeight: 1 }}>
                                            PROJETO
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff' }}>
                                            {currentProject.name}
                                        </Typography>
                                    </Box>
                                </>
                            )}
                        </Box>
                    )}

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

            {/* Sidebar (Drawer) */}
            <Drawer
                variant="permanent"
                open={open}
                sx={{
                    width: open ? drawerWidth : 64,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                    [`& .MuiDrawer-paper`]: {
                        width: open ? drawerWidth : 64,
                        overflowX: 'hidden',
                        backgroundColor: '#151b26',
                        color: 'rgba(255,255,255,0.7)',
                        borderRight: '1px solid rgba(255,255,255,0.05)',
                        transition: theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                        zIndex: (theme) => theme.zIndex.drawer,
                        pt: '56px'
                    },
                }}
            >
                <List sx={{ pt: 2 }}>
                    {navigationItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/' && location.pathname.startsWith(item.path))

                        return (
                            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                                <ListItemButton
                                    onClick={() => item.action ? item.action() : navigate(item.path)}
                                    sx={{
                                        minHeight: 48,
                                        justifyContent: open ? 'initial' : 'center',
                                        px: 2.5,
                                        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
                                        bgcolor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                                        borderLeft: isActive ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.04)',
                                            color: '#ffffff'
                                        }
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            mr: open ? 3 : 'auto',
                                            justifyContent: 'center',
                                            color: 'inherit'
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        sx={{
                                            opacity: open ? 1 : 0,
                                            '& .MuiTypography-root': {
                                                fontSize: '0.875rem',
                                                fontWeight: isActive ? 600 : 400
                                            }
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        )
                    })}
                </List>

                <Box sx={{ flexGrow: 1 }} />

                {/* Language / Environment indicator in Sidebar when open */}
                {open && (
                    <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)' }}>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <LanguageIcon sx={{ fontSize: 14 }} /> Português (BR)
                        </Typography>
                        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.05)', my: 1 }} />
                        <Typography variant="caption" color="primary.main" fontWeight={700}>
                            PRODUÇÃO V1.2
                        </Typography>
                    </Box>
                )}
            </Drawer>

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

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${open ? drawerWidth : 64}px)` },
                    mt: '56px',
                    minHeight: 'calc(100vh - 56px)',
                    animation: 'fadeIn 0.3s ease-out',
                    transition: theme.transitions.create('margin', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
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
