import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Download, Upload, Sparkles, ChevronDown } from 'lucide-react'
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
    CardActionArea,
    Button,
    useTheme,
    CircularProgress,
    Divider
} from '@mui/material'
import {
    Business as BusinessIcon,
    ChevronRight as ChevronRightIcon,
    ArrowBack as ArrowBackIcon,
    Dashboard as DashboardIcon
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../hooks/useApp'
import { setCurrentClient, setCurrentProject, fetchClients, fetchClientProjects } from '../store/slices/projectSlice'

interface DeviceListProps {
    categoryOverride?: string
}

export default function DeviceList({ categoryOverride }: DeviceListProps) {
    const navigate = useNavigate()
    const theme = useTheme()
    const dispatch = useAppDispatch()
    const { currentClient, currentProject, clients, projects } = useAppSelector((state) => state.project)

    const [devices, setDevices] = useState<NetworkDevice[]>([])
    const [filteredDevices, setFilteredDevices] = useState<NetworkDevice[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
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

    // Filters
    const [filterManufacturer, setFilterManufacturer] = useState<string>('all')
    const [filterLocation, setFilterLocation] = useState<string>('all')

    useEffect(() => {
        if (!categoryOverride && clients.length === 0) {
            dispatch(fetchClients())
        }
    }, [dispatch, clients.length, categoryOverride])

    useEffect(() => {
        if (!categoryOverride && currentClient && projects.length === 0) {
            dispatch(fetchClientProjects(currentClient.id))
        }
    }, [dispatch, currentClient, projects.length, categoryOverride])

    useEffect(() => {
        if (categoryOverride || (currentClient && currentProject)) {
            loadData()
        } else if (!categoryOverride) {
            setLoading(false)
        }
    }, [categoryOverride, currentClient, currentProject])

    useEffect(() => {
        applyFilters()
    }, [devices, categories, searchTerm, filterManufacturer, filterLocation, category, sortConfig])

    const loadData = async () => {
        setLoading(true)
        try {
            const [devs, cats] = await Promise.all([
                api.getDevices(),
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
        dispatch(fetchClientProjects(client.id))
    }

    const handleProjectSelect = (project: any) => {
        dispatch(setCurrentProject(project))
    }

    // Hierarchy Selection View (only when accessed directly)
    if (!categoryOverride) {
        if (!currentClient) {
            return (
                <Box sx={{ p: 4 }}>
                    <Box mb={6} textAlign="center">
                        <Typography variant="h4" fontWeight={900} gutterBottom sx={{ letterSpacing: '-0.5px' }}>
                            Inventário de Dispositivos
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Selecione um cliente para visualizar seu inventário de dispositivos.
                        </Typography>
                    </Box>

                    <Grid container spacing={2} justifyContent="center" sx={{ maxWidth: 1000, mx: 'auto' }}>
                        {clients.map(client => (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={client.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        border: '2px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            transform: 'translateY(-2px)',
                                            boxShadow: theme.shadows[4]
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
                                                <BusinessIcon fontSize="small" />
                                            </Box>
                                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                <Typography variant="subtitle2" fontWeight={700} noWrap>
                                                    {client.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Selecionar Cliente
                                                </Typography>
                                            </Box>
                                            <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                                        </Box>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                        {clients.length === 0 && (
                            <Grid size={{ xs: 12 }}>
                                <Box textAlign="center" py={8} bgcolor="rgba(0,0,0,0.02)" borderRadius={2} border="2px dashed" borderColor="divider">
                                    <Typography color="text.secondary">Nenhum cliente disponível.</Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            )
        }

        if (!currentProject) {
            return (
                <Box sx={{ p: 4 }}>
                    <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h4" fontWeight={900} gutterBottom sx={{ letterSpacing: '-0.5px' }}>
                                Selecionar Projeto
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Cliente: <strong>{currentClient.name}</strong>
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => dispatch(setCurrentClient(null))}
                            sx={{ fontWeight: 700, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                        >
                            Trocar Cliente
                        </Button>
                    </Box>

                    <Grid container spacing={2} sx={{ maxWidth: 1000 }}>
                        {projects.map(project => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        border: '2px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            transform: 'translateY(-2px)',
                                            boxShadow: theme.shadows[4]
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
                                                bgcolor: 'primary.main',
                                                borderRadius: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white'
                                            }}>
                                                <DashboardIcon fontSize="small" />
                                            </Box>
                                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                <Typography variant="subtitle2" fontWeight={700} noWrap>
                                                    {project.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Abrir Inventário
                                                </Typography>
                                            </Box>
                                            <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                                        </Box>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                        {projects.length === 0 && !loading && (
                            <Grid size={{ xs: 12 }}>
                                <Box textAlign="center" py={8} bgcolor="rgba(0,0,0,0.02)" borderRadius={2} border="2px dashed" borderColor="divider">
                                    <Typography color="text.secondary">Este cliente não possui projetos cadastrados.</Typography>
                                </Box>
                            </Grid>
                        )}
                        {loading && (
                            <Grid size={{ xs: 12 }}>
                                <Box textAlign="center" py={8}>
                                    <CircularProgress />
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            )
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                        {!categoryOverride && (
                            <Box sx={{ width: 32, height: 32, bgcolor: 'primary.main', borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <DashboardIcon sx={{ color: 'white', fontSize: 18 }} />
                            </Box>
                        )}
                        <h1 className="text-3xl font-bold text-gray-900">{getTitle()}</h1>
                    </Box>
                    <p className="text-gray-600">
                        {categoryOverride
                            ? 'Gerencie os dispositivos desta categoria'
                            : `Projeto: ${currentProject?.name} (${currentClient?.name})`}
                    </p>
                </div>
                <div className="flex gap-3">
                    {!categoryOverride && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => dispatch(setCurrentProject(null))}
                            sx={{ fontWeight: 700, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                        >
                            Trocar Projeto
                        </Button>
                    )}
                    <button
                        onClick={(e) => setImportMenuAnchor(e.currentTarget)}
                        className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        <Upload size={20} />
                        Importar
                        <ChevronDown size={16} />
                    </button>
                    <Menu
                        anchorEl={importMenuAnchor}
                        open={Boolean(importMenuAnchor)}
                        onClose={() => setImportMenuAnchor(null)}
                    >
                        <MenuItem onClick={() => { setImportMenuAnchor(null); setShowSmartImport(true); }}>
                            <ListItemIcon><Sparkles size={18} className="text-purple-600" /></ListItemIcon>
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
                    <button
                        onClick={handleAddDevice}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Adicionar Dispositivo
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
                <div className="flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[300px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Download size={20} />
                        Exportar CSV
                    </button>
                </div>

                <div className="flex gap-4 flex-wrap items-center">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Filtros:</span>
                    </div>

                    <select
                        value={filterManufacturer}
                        onChange={(e) => setFilterManufacturer(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todos os Fabricantes</option>
                        {manufacturers.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>

                    <select
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todas as Localizações</option>
                        {locations.map(l => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>

                    {(filterManufacturer !== 'all' || filterLocation !== 'all' || searchTerm) && (
                        <button
                            onClick={() => {
                                setFilterManufacturer('all')
                                setFilterLocation('all')
                                setSearchTerm('')
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>

                <div className="text-sm text-gray-600">
                    Mostrando {filteredDevices.length} de {devices.length} dispositivos
                </div>
            </div>

            <InventoryTable
                devices={filteredDevices}
                loading={loading}
                onView={handleViewDevice}
                onEdit={handleEditDevice}
                onRefresh={loadData}
                sortConfig={sortConfig}
                onSort={handleSort}
            />

            {showForm && (
                <InventoryForm
                    device={editingDevice}
                    onClose={handleFormClose}
                />
            )}

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
                projectId={localStorage.getItem('currentProjectId') || ''}
            />
        </div>
    )
}
