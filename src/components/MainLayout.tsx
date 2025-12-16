import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
    AppBar,
    Toolbar,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    IconButton,
    Collapse,
    Avatar,
    Menu,
    MenuItem,
    Chip,
    Divider,
} from '@mui/material'
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    ExpandLess,
    ExpandMore,
    CameraAlt,
    Dvr,
    Router,
    Computer,
    Wifi,
    Storage,
    SettingsEthernet,
    Settings as SettingsIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    Map as MapIcon,
    Face as FaceIcon,
    DevicesOther,
    Category as CategoryIcon,
    Monitor as MonitorIcon,
    Home as HomeIcon,
    ExitToApp as ExitIcon
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../hooks/useApp'
import { clearProjectContext, setCurrentProject } from '../store/slices/projectSlice'
import { logout } from '../store/slices/authSlice'
import { api } from '../services/api'
import { useBranding } from '../context/BrandingContext'

import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

const drawerWidth = 220

const iconMap: any = {
    CameraAlt: <CameraAlt />,
    Dvr: <Dvr />,
    Router: <Router />,
    Storage: <Storage />,
    Computer: <Computer />,
    Wifi: <Wifi />,
    Face: <FaceIcon />,
    DevicesOther: <DevicesOther />
}

export default function MainLayout() {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [mobileOpen, setMobileOpen] = useState(false)
    const [devicesOpen, setDevicesOpen] = useState(true)
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [categories, setCategories] = useState<any[]>([])
    const { logo } = useBranding()

    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useAppDispatch()
    const { user } = useAppSelector((state) => state.auth)
    const { currentProject, currentClient } = useAppSelector((state) => state.project)

    useEffect(() => {
        api.getCategories().then(data => {
            if (data) setCategories(data)
        }).catch(err => console.error(err))
    }, [])

    // Ensure mobile drawer is closed when switching to desktop
    useEffect(() => {
        if (!isMobile) {
            setMobileOpen(false)
        }
    }, [isMobile])

    const handleDrawerToggle = () => {
        if (isMobile) {
            setMobileOpen(!mobileOpen)
        }
    }
    const handleDevicesToggle = () => setDevicesOpen(!devicesOpen)

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
    const handleProfileMenuClose = () => setAnchorEl(null)

    const handleLogout = async () => {
        await dispatch(logout())
        navigate('/login')
    }

    const handleChangeProject = () => {
        dispatch(clearProjectContext())
        navigate('/clients')
    }

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    ]

    // Use fetched categories or fallback to defaults if empty (though we populated DB)
    const categoryItems = categories.length > 0 ? categories.map(c => ({
        text: c.name,
        icon: iconMap[c.icon] || <DevicesOther />,
        path: `/devices/${c.slug}`
    })) : []

    // Add "Todos" item at the beginning
    const deviceItems = [
        { text: 'Todos', icon: <DevicesOther />, path: '/devices/all' },
        ...categoryItems
    ]

    const networkItems = [
        { text: 'VLANs', icon: <SettingsEthernet />, path: '/vlans' },
        { text: 'Topologia', icon: <MapIcon />, path: '/topology' },
    ]

    const drawer = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            {/* Subtle gradient background for sidebar */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: (theme) => theme.palette.mode === 'dark'
                        ? 'linear-gradient(180deg, rgba(22, 33, 62, 0.95) 0%, rgba(15, 15, 35, 0.98) 100%)'
                        : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 1) 100%)',
                    zIndex: 0,
                }}
            />
            <Toolbar sx={{ px: 2, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {logo?.url ? (
                        <Box
                            component="img"
                            src={logo.url}
                            alt="Logo"
                            sx={{
                                height: 36,
                                width: 'auto',
                                maxWidth: 140,
                                objectFit: 'contain',
                            }}
                        />
                    ) : (
                        <>
                            <Box
                                sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                                }}
                            >
                                <DashboardIcon sx={{ color: 'white', fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography
                                    variant="h6"
                                    noWrap
                                    sx={{
                                        fontWeight: 'bold',
                                        fontSize: '1.1rem',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    OnliOps
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -0.5 }}>
                                    Platform
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
            </Toolbar>
            <Box sx={{ overflow: 'auto', flex: 1, position: 'relative', zIndex: 1, px: 1.5, pt: 1 }}>
                <List sx={{
                    '& .MuiListItemButton-root': {
                        borderRadius: 2,
                        mb: 0.5,
                        mx: 0,
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 3,
                            height: 0,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '0 4px 4px 0',
                            transition: 'height 0.2s ease',
                        },
                        '&:hover': {
                            bgcolor: (theme) => theme.palette.mode === 'dark'
                                ? 'rgba(99, 102, 241, 0.08)'
                                : 'rgba(99, 102, 241, 0.05)',
                            '& .MuiListItemIcon-root': {
                                color: 'primary.main',
                            },
                        },
                        '&.Mui-selected': {
                            bgcolor: (theme) => theme.palette.mode === 'dark'
                                ? 'rgba(99, 102, 241, 0.12)'
                                : 'rgba(99, 102, 241, 0.08)',
                            '&::before': {
                                height: '60%',
                            },
                            '& .MuiListItemIcon-root': {
                                color: 'primary.main',
                            },
                            '& .MuiListItemText-primary': {
                                fontWeight: 600,
                                color: 'primary.main',
                            },
                            '&:hover': {
                                bgcolor: (theme) => theme.palette.mode === 'dark'
                                    ? 'rgba(99, 102, 241, 0.15)'
                                    : 'rgba(99, 102, 241, 0.1)',
                            },
                        },
                    },
                    '& .MuiListItemIcon-root': {
                        minWidth: 40,
                        transition: 'color 0.2s ease',
                    },
                }}>
                    {/* ========== PLATAFORMA - Sempre visível ========== */}
                    <ListItem disablePadding>
                        <Box sx={{ px: 1, py: 1, mb: 0.5 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    fontWeight: 700,
                                    letterSpacing: '0.5px',
                                    color: 'text.secondary',
                                    fontSize: '0.65rem',
                                }}
                            >
                                PLATAFORMA
                            </Typography>
                        </Box>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton
                            selected={location.pathname === '/'}
                            onClick={() => navigate('/')}
                        >
                            <ListItemIcon><HomeIcon /></ListItemIcon>
                            <ListItemText primary="Dashboard Global" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton
                            selected={location.pathname === '/monitoring'}
                            onClick={() => navigate('/monitoring')}
                        >
                            <ListItemIcon><MonitorIcon /></ListItemIcon>
                            <ListItemText primary="Monitoramento" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton
                            selected={location.pathname.startsWith('/settings')}
                            onClick={() => navigate('/settings')}
                        >
                            <ListItemIcon><SettingsIcon /></ListItemIcon>
                            <ListItemText primary="Configurações" />
                        </ListItemButton>
                    </ListItem>

                    {/* ========== PROJETO - Só com tenant selecionado ========== */}
                    {currentProject && (
                        <>
                            <Divider sx={{ my: 2, mx: -1.5, borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />

                            {/* Header do Projeto */}
                            <ListItem disablePadding>
                                <Box sx={{ px: 1, py: 1, width: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontWeight: 700,
                                                letterSpacing: '0.5px',
                                                color: 'text.secondary',
                                                fontSize: '0.65rem',
                                            }}
                                        >
                                            PROJETO
                                        </Typography>
                                        <Chip
                                            label="Sair"
                                            size="small"
                                            icon={<ExitIcon sx={{ fontSize: 14 }} />}
                                            onClick={handleChangeProject}
                                            color="error"
                                            variant="outlined"
                                            sx={{ height: 22, fontSize: '0.7rem' }}
                                        />
                                    </Box>
                                    <Typography variant="body2" fontWeight="bold" color="primary">
                                        {currentProject.name}
                                    </Typography>
                                    {currentClient && (
                                        <Typography variant="caption" color="text.secondary">
                                            {currentClient.name}
                                        </Typography>
                                    )}
                                </Box>
                            </ListItem>

                            {/* Dashboard do Projeto */}
                            <ListItem disablePadding>
                                <ListItemButton
                                    selected={location.pathname === '/dashboard'}
                                    onClick={() => navigate('/dashboard')}
                                >
                                    <ListItemIcon><DashboardIcon /></ListItemIcon>
                                    <ListItemText primary="Dashboard" />
                                </ListItemButton>
                            </ListItem>

                            {/* Devices Section */}
                            <ListItemButton onClick={handleDevicesToggle}>
                                <ListItemIcon><Router /></ListItemIcon>
                                <ListItemText primary="Dispositivos" />
                                {devicesOpen ? <ExpandLess /> : <ExpandMore />}
                            </ListItemButton>
                            <Collapse in={devicesOpen} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    {deviceItems.map((item) => (
                                        <ListItemButton
                                            key={item.text}
                                            sx={{ pl: 4 }}
                                            selected={location.pathname === item.path}
                                            onClick={() => navigate(item.path)}
                                        >
                                            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                                            <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem' }} />
                                        </ListItemButton>
                                    ))}
                                </List>
                            </Collapse>

                            {/* Network Section */}
                            <ListItem disablePadding>
                                <Box sx={{ mt: 2, mb: 0.5, px: 1 }}>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontWeight: 700,
                                            letterSpacing: '0.5px',
                                            color: 'text.secondary',
                                            fontSize: '0.65rem',
                                        }}
                                    >
                                        REDE
                                    </Typography>
                                </Box>
                            </ListItem>
                            {networkItems.map((item) => (
                                <ListItem key={item.text} disablePadding>
                                    <ListItemButton
                                        selected={location.pathname === item.path}
                                        onClick={() => navigate(item.path)}
                                    >
                                        <ListItemIcon>{item.icon}</ListItemIcon>
                                        <ListItemText primary={item.text} />
                                    </ListItemButton>
                                </ListItem>
                            ))}

                            {/* Categorias */}
                            <ListItem disablePadding>
                                <Box sx={{ mt: 2, mb: 0.5, px: 1 }}>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontWeight: 700,
                                            letterSpacing: '0.5px',
                                            color: 'text.secondary',
                                            fontSize: '0.65rem',
                                        }}
                                    >
                                        SISTEMA
                                    </Typography>
                                </Box>
                            </ListItem>
                            <ListItem disablePadding>
                                <ListItemButton
                                    selected={location.pathname === '/settings/categories'}
                                    onClick={() => navigate('/settings/categories')}
                                >
                                    <ListItemIcon><CategoryIcon /></ListItemIcon>
                                    <ListItemText primary="Categorias" />
                                </ListItemButton>
                            </ListItem>
                        </>
                    )}
                </List>
            </Box>
        </Box>
    )

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(22, 33, 62, 0.8)'
                        : 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(10px)',
                    color: 'text.primary',
                    boxShadow: 'none',
                    borderBottom: (theme) =>
                        `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        {currentProject ? (
                            <>
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Cliente:
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                                            {currentClient?.name || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Projeto:
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {currentProject.name}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Chip
                                    label="Alterar Projeto"
                                    size="small"
                                    variant="outlined"
                                    onClick={handleChangeProject}
                                    sx={{ cursor: 'pointer', height: 24 }}
                                />
                            </>
                        ) : (
                            <Typography variant="h6" fontWeight="bold" color="primary.main">
                                OnliOps Platform
                            </Typography>
                        )}
                    </Typography>

                    <IconButton
                        onClick={handleProfileMenuOpen}
                        sx={{
                            p: 0.5,
                            border: '2px solid transparent',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) padding-box, linear-gradient(135deg, #667eea 0%, #764ba2 100%) border-box',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                transform: 'scale(1.05)',
                            },
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 32,
                                height: 32,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                            }}
                        >
                            {user?.name?.[0] || <PersonIcon />}
                        </Avatar>
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleProfileMenuClose}
                        PaperProps={{
                            sx: {
                                minWidth: 180,
                                mt: 1,
                                background: (theme) => theme.palette.mode === 'dark'
                                    ? 'rgba(22, 33, 62, 0.95)'
                                    : 'rgba(255, 255, 255, 0.98)',
                                backdropFilter: 'blur(10px)',
                                border: (theme) =>
                                    `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                            }
                        }}
                    >
                        <MenuItem
                            onClick={handleLogout}
                            sx={{
                                py: 1.5,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    '& .MuiListItemIcon-root': {
                                        color: 'error.main',
                                    },
                                    '& .MuiTypography-root': {
                                        color: 'error.main',
                                    },
                                },
                            }}
                        >
                            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                            <Typography variant="body2" fontWeight={500}>Sair</Typography>
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                {isMobile && (
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{ keepMounted: true }}
                        sx={{
                            display: { xs: 'block', sm: 'none' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                    >
                        {drawer}
                    </Drawer>
                )}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    minHeight: '100vh',
                    bgcolor: 'background.default'
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box >
    )
}
