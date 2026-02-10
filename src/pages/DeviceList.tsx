import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Download, Upload, Sparkles, ChevronDown, Briefcase, Folder, Building2, FolderOpen, ChevronRight, Users, HardDrive, Eye, Edit } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { NetworkDevice } from '../lib/supabase'
import { api } from '../services/api'
import InventoryTable from '../components/inventory/InventoryTable'
import InventoryForm from '../components/inventory/InventoryForm'
import DeviceDetailsSheet from '../components/inventory/DeviceDetailsSheet'
import ImportModal from '../components/inventory/ImportModal'
import SmartImportModal from '../components/inventory/SmartImportModal'
import {
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    useTheme,
    Divider,
    FormControl,
    InputLabel,
    Select,
    SelectChangeEvent,
    TextField,
    Breadcrumbs,
    Link,
    Paper,
    Fade,
    CircularProgress,
    Stack,
    alpha,
    Chip,
    Dialog,
    CardActionArea,
    Tooltip
} from '@mui/material'
import {
    NavigateNext,
    Home as HomeIcon,
    ChevronRight as ChevronRightIcon,
    Business as BusinessIcon,
    Dashboard as DashboardIcon
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../hooks/useApp'
import { setCurrentClient, setCurrentProject, fetchClients, fetchClientProjects } from '../store/slices/projectSlice'

interface DeviceListProps {
    categoryOverride?: string
}

type SelectionStep = 'client' | 'project' | 'devices'

export default function DeviceList({ categoryOverride }: DeviceListProps) {
    const navigate = useNavigate()
    const theme = useTheme()
    const dispatch = useAppDispatch()
    const { currentClient, currentProject, clients, projects, loading: projectLoading } = useAppSelector((state) => state.project)

    const [devices, setDevices] = useState<NetworkDevice[]>([])
    const [filteredDevices, setFilteredDevices] = useState<NetworkDevice[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid')
    const [showForm, setShowForm] = useState(false)
    const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null)
    const [showDetails, setShowDetails] = useState(false)
    const [editingDevice, setEditingDevice] = useState<NetworkDevice | null>(null)
    const [showImport, setShowImport] = useState(false)
    const [showSmartImport, setShowSmartImport] = useState(false)
    const [importMenuAnchor, setImportMenuAnchor] = useState<null | HTMLElement>(null)
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({
        key: 'ip_address',
        direction: 'asc'
    })

    const { category: urlCategory } = useParams()
    const category = categoryOverride || urlCategory

    // Selection step
    const [step, setStep] = useState<SelectionStep>('client')

    // Filters
    const [filterManufacturer, setFilterManufacturer] = useState<string>('all')
    const [filterLocation, setFilterLocation] = useState<string>('all')

    useEffect(() => {
        if (!categoryOverride && clients.length === 0) {
            dispatch(fetchClients())
        }
    }, [dispatch, clients.length, categoryOverride])

    useEffect(() => {
        if (currentClient && step === 'project') {
            dispatch(fetchClientProjects(currentClient.id))
        }
    }, [dispatch, currentClient, step])

    // Determine current step based on global state
    useEffect(() => {
        if (categoryOverride) {
            setStep('devices')
        } else if (currentProject && currentClient) {
            setStep('devices')
        } else if (currentClient) {
            setStep('project')
        } else {
            setStep('client')
        }
    }, [currentClient, currentProject, categoryOverride])

    useEffect(() => {
        if (step === 'devices' && currentProject) {
            loadData(currentProject.id)
        }
    }, [step, currentProject])

    useEffect(() => {
        applyFilters()
    }, [devices, categories, searchTerm, filterManufacturer, filterLocation, category, sortConfig])

    const loadData = async (projectId?: string) => {
        setLoading(true)
        try {
            const pid = projectId || currentProject?.id || localStorage.getItem('currentProjectId') || ''
            console.log('[DeviceList] Loading devices for project:', pid)
            const [devs, cats] = await Promise.all([
                api.getDevicesByProject(pid),
                api.getCategories()
            ])
            setDevices(devs || [])
            setCategories(cats || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const applyFilters = () => {
        let filtered = [...devices]

        // Category filter (skip if 'all' or not specified)
        if (category && category !== 'all') {
            if (category === 'other') {
                // Show devices with type 'other' OR types that don't match any known category
                const categorySlugs = categories.map(c => c.slug).filter(s => s !== 'other')
                filtered = filtered.filter(d => d.device_type === 'other' || !categorySlugs.includes(d.device_type))
            } else if (category === 'nvr') {
                // Special handling for legacy NVR/DVR split if needed, or rely on distinct categories
                filtered = filtered.filter(d => d.device_type === 'nvr' || d.device_type === 'dvr')
            } else if (category === 'controller') {
                filtered = filtered.filter(d => ['controller', 'reader', 'access_control'].includes(d.device_type))
            } else {
                filtered = filtered.filter(d => d.device_type === category)
            }
        }

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(device =>
                device.ip_address?.toLowerCase().includes(term) ||
                device.mac_address?.toLowerCase().includes(term) ||
                device.serial_number?.toLowerCase().includes(term) ||
                device.model?.toLowerCase().includes(term) ||
                device.hostname?.toLowerCase().includes(term) ||
                device.location?.toLowerCase().includes(term) ||
                device.manufacturer?.toLowerCase().includes(term)
            )
        }

        // Manufacturer filter
        if (filterManufacturer !== 'all') {
            filtered = filtered.filter(device => device.manufacturer === filterManufacturer)
        }

        // Location filter
        if (filterLocation !== 'all') {
            filtered = filtered.filter(device => device.location === filterLocation)
        }

        // Sorting
        if (sortConfig.key && sortConfig.direction) {
            filtered.sort((a: any, b: any) => {
                const aValue = a[sortConfig.key] || ''
                const bValue = b[sortConfig.key] || ''

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1
                }
                return 0
            })
        }

        setFilteredDevices(filtered)
    }

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' | null = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = null
        }
        setSortConfig({ key, direction })
    }

    const getTitle = () => {
        if (!category || category === 'all') return 'Todos os Dispositivos'
        const cat = categories.find(c => c.slug === category)
        return cat ? cat.name : 'Outros Dispositivos'
    }

    const handleAddDevice = () => {
        setEditingDevice(null)
        setShowForm(true)
    }

    const handleEditDevice = (device: NetworkDevice) => {
        setEditingDevice(device)
        setShowForm(true)
    }

    const handleViewDevice = (device: NetworkDevice) => {
        setSelectedDevice(device)
        setShowDetails(true)
    }

    const handleFormClose = () => {
        setShowForm(false)
        setEditingDevice(null)
        loadData()
    }

    const handleDetailsClose = () => {
        setShowDetails(false)
        setSelectedDevice(null)
    }

    const handleExportCSV = () => {
        const headers = ['Serial', 'IP', 'Tipo', 'Modelo', 'Fabricante', 'Localização', 'Status']
        const rows = filteredDevices.map(d => [
            d.serial_number || '',
            d.ip_address,
            d.device_type,
            d.model,
            d.manufacturer,
            d.location || '',
            d.status
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }

    const manufacturers = Array.from(new Set(devices.map(d => d.manufacturer).filter(Boolean)))
    const locations = Array.from(new Set(devices.map(d => d.location).filter(Boolean)))

    const handleClientSelect = (client: any) => {
        dispatch(setCurrentClient(client))
        dispatch(setCurrentProject(null))
        setStep('project')
    }

    const handleProjectSelect = (project: any) => {
        dispatch(setCurrentProject(project))
        setStep('devices')
    }

    const resetSelection = () => {
        dispatch(setCurrentClient(null))
        dispatch(setCurrentProject(null))
        setStep('client')
    }

    return (
        <Box sx={{ p: 4 }}>
            {/* Breadcrumbs for easier navigation */}
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs separator={<NavigateNext fontSize="small" />} aria-label="breadcrumb">
                    <Link
                        underline="hover"
                        sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', cursor: 'pointer' }}
                        onClick={resetSelection}
                    >
                        <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                        Início
                    </Link>
                    {currentClient && (
                        <Link
                            underline="hover"
                            sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', cursor: 'pointer' }}
                            onClick={() => { dispatch(setCurrentProject(null)); setStep('project'); }}
                        >
                            {currentClient.name}
                        </Link>
                    )}
                    {currentProject && (
                        <Typography color="text.primary" fontWeight={600}>
                            {currentProject.name}
                        </Typography>
                    )}
                </Breadcrumbs>

                <Box mt={2}>
                    <Typography variant="h4" fontWeight={700}>
                        {step === 'client' && 'Selecione o Cliente'}
                        {step === 'project' && `Projetos de ${currentClient?.name}`}
                        {step === 'devices' && getTitle()}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {step === 'client' && 'Escolha um cliente para visualizar seus projetos e dispositivos.'}
                        {step === 'project' && 'Selecione um projeto para listar os dispositivos cadastrados.'}
                        {step === 'devices' && `Visualizando infraestrutura de ${currentProject?.name}`}
                    </Typography>
                </Box>
            </Box>

            {/* Step 1: Client Selection */}
            {step === 'client' && (
                <Fade in={true}>
                    <Box>
                        {projectLoading && clients.length === 0 ? (
                            <Box display="flex" justifyContent="center" py={8}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Grid container spacing={3}>
                                {clients.map((client) => {
                                    return (
                                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={client.id}>
                                            <Card
                                                elevation={0}
                                                sx={{
                                                    height: '100%',
                                                    border: '2px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 2,
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        borderColor: 'primary.main',
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: (theme) => `0 10px 15px -3px ${alpha(theme.palette.common.black, 0.4)}`,
                                                    }
                                                }}
                                            >
                                                <CardActionArea
                                                    onClick={() => handleClientSelect(client)}
                                                    sx={{ height: '100%', p: 2 }}
                                                >
                                                    <Box display="flex" alignItems="center" gap={2}>
                                                        <Box sx={{
                                                            width: 40,
                                                            height: 40,
                                                            bgcolor: 'rgba(230, 0, 18, 0.05)',
                                                            borderRadius: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'primary.main',
                                                            border: '1px solid rgba(230, 0, 18, 0.1)'
                                                        }}>
                                                            <Building2 size={20} />
                                                        </Box>
                                                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                            <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ color: 'text.primary' }}>
                                                                {client.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Visualizar Projetos
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ color: 'text.disabled', display: 'flex' }}>
                                                            <ChevronRight size={18} />
                                                        </Box>
                                                    </Box>
                                                </CardActionArea>
                                            </Card>
                                        </Grid>
                                    )
                                })}
                                {!projectLoading && clients.length === 0 && (
                                    <Grid size={{ xs: 12 }}>
                                        <Box textAlign="center" py={8}>
                                            <Building2 size={48} color={theme.palette.text.disabled} strokeWidth={1} />
                                            <Typography color="text.secondary" mt={2}>Nenhum cliente encontrado.</Typography>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        )}
                    </Box>
                </Fade>
            )}

            {/* Step 2: Project Selection */}
            {step === 'project' && (
                <Fade in={true}>
                    <Box>
                        {projectLoading ? (
                            <Box display="flex" justifyContent="center" py={8}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Grid container spacing={3}>
                                {projects.map((project) => {
                                    const statusColor = project.status === 'active' ? '#22c55e' : '#94a3b8'
                                    return (
                                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={project.id}>
                                            <Card
                                                elevation={0}
                                                sx={{
                                                    height: '100%',
                                                    border: '2px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 2,
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        borderColor: 'primary.main',
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: (theme) => `0 10px 15px -3px ${alpha(theme.palette.common.black, 0.4)}`,
                                                    }
                                                }}
                                            >
                                                <CardActionArea
                                                    onClick={() => handleProjectSelect(project)}
                                                    sx={{ height: '100%', p: 2 }}
                                                >
                                                    <Box display="flex" alignItems="center" gap={2}>
                                                        <Box sx={{
                                                            width: 40,
                                                            height: 40,
                                                            bgcolor: 'rgba(230, 0, 18, 0.05)',
                                                            borderRadius: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'primary.main',
                                                            border: '1px solid rgba(230, 0, 18, 0.1)'
                                                        }}>
                                                            <Folder size={20} />
                                                        </Box>
                                                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                            <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ color: 'text.primary' }}>
                                                                {project.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Visualizar Dispositivos
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ color: 'text.disabled', display: 'flex' }}>
                                                            <ChevronRight size={18} />
                                                        </Box>
                                                    </Box>

                                                    <Grid container spacing={1} sx={{ mt: 2 }}>
                                                        <Grid size={{ xs: 6 }}>
                                                            <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: alpha(theme.palette.divider, 0.05), textAlign: 'center' }}>
                                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.6rem' }}>Devices</Typography>
                                                                <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.8rem' }}>{project.metrics?.devices || 0}</Typography>
                                                            </Box>
                                                        </Grid>
                                                        <Grid size={{ xs: 6 }}>
                                                            <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: alpha(theme.palette.divider, 0.05), textAlign: 'center' }}>
                                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.6rem' }}>Alerts</Typography>
                                                                <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.8rem' }} color={project.metrics?.alerts ? 'error.main' : 'inherit'}>
                                                                    {project.metrics?.alerts || 0}
                                                                </Typography>
                                                            </Box>
                                                        </Grid>
                                                    </Grid>
                                                </CardActionArea>
                                            </Card>
                                        </Grid>
                                    )
                                })}
                                {projects.length === 0 && (
                                    <Grid size={{ xs: 12 }}>
                                        <Box textAlign="center" py={8}>
                                            <FolderOpen size={48} color={theme.palette.text.disabled} strokeWidth={1} />
                                            <Typography color="text.secondary" mt={2}>Nenhum projeto encontrado para este cliente.</Typography>
                                            <Button variant="outlined" sx={{ mt: 2, borderRadius: 2 }} onClick={resetSelection}>Voltar aos Clientes</Button>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        )}
                    </Box>
                </Fade>
            )}

            {/* Step 3: Device Listing */}
            {step === 'devices' && (
                <Fade in={true}>
                    <Box>
                        <Box display="flex" justifyContent="flex-end" mb={3} gap={2}>
                            <Stack direction="row" spacing={1} sx={{ mr: 'auto' }}>
                                <Button
                                    size="small"
                                    variant={viewMode === 'table' ? 'contained' : 'outlined'}
                                    onClick={() => setViewMode('table')}
                                    sx={{ minWidth: 40, p: 1 }}
                                >
                                    <HomeIcon fontSize="small" />
                                </Button>
                                <Button
                                    size="small"
                                    variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                                    onClick={() => setViewMode('grid')}
                                    sx={{ minWidth: 40, p: 1 }}
                                >
                                    <DashboardIcon fontSize="small" />
                                </Button>
                            </Stack>
                            <Button
                                variant="outlined"
                                onClick={(e) => setImportMenuAnchor(e.currentTarget)}
                                startIcon={<Upload size={20} />}
                                endIcon={<ChevronDown size={16} />}
                            >
                                Importar
                            </Button>
                            <Menu
                                anchorEl={importMenuAnchor}
                                open={Boolean(importMenuAnchor)}
                                onClose={() => setImportMenuAnchor(null)}
                            >
                                <MenuItem onClick={() => { setImportMenuAnchor(null); setShowSmartImport(true); }}>
                                    <ListItemIcon><Sparkles size={18} color="#9333ea" /></ListItemIcon>
                                    <ListItemText
                                        primary="Importação Inteligente"
                                        secondary="Com categorização via IA"
                                    />
                                </MenuItem>
                                <MenuItem onClick={() => { setImportMenuAnchor(null); setShowImport(true); }}>
                                    <ListItemIcon><Upload size={18} /></ListItemIcon>
                                    <ListItemText
                                        primary="Importação Básica"
                                        secondary="Planilha SADP tradicional"
                                    />
                                </MenuItem>
                            </Menu>
                            <Button
                                variant="contained"
                                size="small"
                                disableElevation
                                onClick={() => {
                                    console.log('Clicking Add device');
                                    handleAddDevice();
                                }}
                                startIcon={<Plus size={18} />}
                                sx={{ borderRadius: 2, px: 2, fontWeight: 600 }}
                            >
                                Adicionar Dispositivo
                            </Button>
                        </Box>

                        <Card sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField
                                        fullWidth
                                        placeholder="Buscar..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        size="small"
                                        InputProps={{
                                            startAdornment: <Search size={20} style={{ marginRight: 8, opacity: 0.5 }} />
                                        }}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 8 }}>
                                    <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
                                        <Button
                                            variant="outlined"
                                            onClick={handleExportCSV}
                                            startIcon={<Download size={20} />}
                                        >
                                            Exportar CSV
                                        </Button>

                                        <Divider orientation="vertical" flexItem />

                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Filter size={18} style={{ opacity: 0.7 }} />
                                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                                Filtros:
                                            </Typography>
                                        </Box>

                                        <FormControl size="small" sx={{ minWidth: 150 }}>
                                            <Select
                                                value={filterManufacturer}
                                                onChange={(e) => setFilterManufacturer(e.target.value)}
                                                displayEmpty
                                            >
                                                <MenuItem value="all">Todos os Fabricantes</MenuItem>
                                                {manufacturers.map(m => (
                                                    <MenuItem key={m} value={m}>{m}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <FormControl size="small" sx={{ minWidth: 150 }}>
                                            <Select
                                                value={filterLocation}
                                                onChange={(e) => setFilterLocation(e.target.value)}
                                                displayEmpty
                                            >
                                                <MenuItem value="all">Todas as Localizações</MenuItem>
                                                {locations.map(l => (
                                                    <MenuItem key={l} value={l}>{l}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        {(filterManufacturer !== 'all' || filterLocation !== 'all' || searchTerm) && (
                                            <Button
                                                size="small"
                                                onClick={() => {
                                                    setFilterManufacturer('all')
                                                    setFilterLocation('all')
                                                    setSearchTerm('')
                                                }}
                                            >
                                                Limpar Filtros
                                            </Button>
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>

                            <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" color="text.secondary">
                                    Mostrando {filteredDevices.length} de {devices.length} dispositivos
                                </Typography>
                            </Box>
                        </Card>

                        {viewMode === 'table' ? (
                            <InventoryTable
                                devices={filteredDevices}
                                loading={loading}
                                onView={handleViewDevice}
                                onEdit={handleEditDevice}
                                onRefresh={loadData}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                            />
                        ) : (
                            <Grid container spacing={2.5}>
                                {filteredDevices.map((device) => {
                                    const isOnline = device.status === 'active';
                                    const statusColor = isOnline ? '#22c55e' :
                                        device.status === 'error' ? '#ef4444' :
                                            device.status === 'maintenance' ? '#f59e0b' : '#94a3b8';

                                    return (
                                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={device.id}>
                                            <Card
                                                elevation={0}
                                                sx={{
                                                    borderRadius: 4,
                                                    border: '1px solid',
                                                    borderColor: alpha(theme.palette.divider, 0.08),
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: `0 12px 24px ${alpha(theme.palette.common.black, 0.08)}`,
                                                        borderColor: alpha(statusColor, 0.3),
                                                        '& .device-actions': { opacity: 1 }
                                                    }
                                                }}
                                            >
                                                <Box sx={{
                                                    height: 4,
                                                    bgcolor: statusColor,
                                                    boxShadow: `0 2px 4px ${alpha(statusColor, 0.2)}`
                                                }} />

                                                <CardContent sx={{ p: 2.5 }}>
                                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                                        <Box sx={{
                                                            p: 1.2,
                                                            borderRadius: 3,
                                                            bgcolor: alpha(statusColor, 0.1),
                                                            color: statusColor,
                                                            display: 'flex'
                                                        }}>
                                                            <HardDrive size={20} />
                                                        </Box>

                                                        <Box className="device-actions" sx={{
                                                            opacity: 0,
                                                            transition: 'opacity 0.2s',
                                                            display: 'flex',
                                                            gap: 0.5
                                                        }}>
                                                            <Button size="small" sx={{ minWidth: 32, p: 0.5 }} onClick={() => handleViewDevice(device)}>
                                                                <Eye size={16} />
                                                            </Button>
                                                            <Button size="small" sx={{ minWidth: 32, p: 0.5 }} onClick={() => handleEditDevice(device)}>
                                                                <Edit size={16} />
                                                            </Button>
                                                        </Box>
                                                    </Box>

                                                    <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ mb: 0.5 }}>
                                                        {device.hostname || device.ip_address}
                                                    </Typography>

                                                    <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 2, fontSize: '0.8rem' }}>
                                                        {device.model} • {device.manufacturer}
                                                    </Typography>

                                                    <Divider sx={{ my: 1.5, opacity: 0.5 }} />

                                                    <Stack spacing={1}>
                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                            <Typography variant="caption" color="text.secondary">IP</Typography>
                                                            <Typography variant="caption" fontWeight={600}>{device.ip_address}</Typography>
                                                        </Box>
                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                            <Typography variant="caption" color="text.secondary">Local</Typography>
                                                            <Typography variant="caption" fontWeight={600}>{device.location || '-'}</Typography>
                                                        </Box>
                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                            <Typography variant="caption" color="text.secondary">Status</Typography>
                                                            <Chip
                                                                label={device.status === 'active' ? 'Online' : 'Offline'}
                                                                size="small"
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize: '0.65rem',
                                                                    bgcolor: alpha(statusColor, 0.1),
                                                                    color: statusColor,
                                                                    fontWeight: 700,
                                                                    border: `1px solid ${alpha(statusColor, 0.2)}`
                                                                }}
                                                            />
                                                        </Box>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        )}
                    </Box>
                </Fade>
            )}

            <Dialog
                open={showForm}
                onClose={handleFormClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 4, bgcolor: 'background.paper' }
                }}
            >
                <InventoryForm
                    device={editingDevice}
                    onClose={handleFormClose}
                />
            </Dialog>

            {showDetails && selectedDevice && (
                <DeviceDetailsSheet
                    device={selectedDevice}
                    onClose={handleDetailsClose}
                    onEdit={handleEditDevice}
                    onRefresh={loadData}
                />
            )}

            {showImport && (
                <ImportModal
                    onClose={() => setShowImport(false)}
                    onSuccess={() => {
                        setShowImport(false)
                        loadData()
                    }}
                />
            )}

            <SmartImportModal
                open={showSmartImport}
                onClose={() => setShowSmartImport(false)}
                onSuccess={() => {
                    setShowSmartImport(false)
                    loadData()
                }}
                projectId={currentProject?.id || ''}
            />
        </Box>
    )
}
