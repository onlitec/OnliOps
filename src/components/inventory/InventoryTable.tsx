import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    IconButton,
    Tooltip,
    alpha,
    useTheme,
    Chip,
    Avatar
} from '@mui/material'
import { Eye, Edit, Trash2, ChevronUp, ChevronDown, HardDrive, Monitor, Cpu } from 'lucide-react'
import { NetworkDevice } from '../../lib/supabase'
import { api } from '../../services/api'

interface InventoryTableProps {
    devices: NetworkDevice[]
    loading: boolean
    onView: (device: NetworkDevice) => void
    onEdit: (device: NetworkDevice) => void
    onRefresh: () => void
    sortConfig: { key: string, direction: 'asc' | 'desc' | null }
    onSort: (key: string) => void
}

const InventoryTable: React.FC<InventoryTableProps> = ({
    devices,
    loading,
    onView,
    onEdit,
    onRefresh,
    sortConfig,
    onSort
}) => {
    const theme = useTheme()

    const handleDelete = async (device: NetworkDevice) => {
        if (!confirm(`Tem certeza que deseja excluir o dispositivo ${device.hostname || device.ip_address}?`)) {
            return
        }

        try {
            if (device.id) {
                await api.deleteDevice(device.id)
                alert('Dispositivo excluído com sucesso!')
                onRefresh()
            }
        } catch (error) {
            console.error('Error deleting device:', error)
            alert('Erro ao excluir dispositivo')
        }
    }

    const getDeviceTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            camera: 'Câmera',
            nvr: 'NVR',
            dvr: 'DVR',
            switch: 'Switch',
            router: 'Roteador',
            firewall: 'Firewall',
            access_point: 'Access Point',
            reader: 'Leitor',
            controller: 'Controladora',
            converter: 'Conversor',
            patch_panel: 'Patch Panel',
            server: 'Servidor',
            pc: 'PC',
            ap_wifi: 'AP Wi-Fi',
            intercom: 'Interfone',
            elevator_recorder: 'Gravador de Elevador',
            other: 'Outro'
        }
        return labels[type] || type
    }

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { color: string, label: string }> = {
            active: { color: '#22c55e', label: 'Online' },
            inactive: { color: '#94a3b8', label: 'Offline' },
            maintenance: { color: '#f59e0b', label: 'Manutenção' },
            error: { color: '#ef4444', label: 'Erro' }
        }
        return configs[status] || configs.inactive
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <Typography sx={{ mt: 2, color: 'text.secondary' }}>Carregando dispositivos...</Typography>
            </Box>
        )
    }

    if (devices.length === 0) {
        return (
            <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 4, bgcolor: alpha(theme.palette.background.paper, 0.5), border: '1px solid', borderColor: alpha(theme.palette.divider, 0.08) }}>
                <Typography color="text.secondary">Nenhum dispositivo encontrado</Typography>
            </Paper>
        )
    }

    return (
        <TableContainer
            component={Paper}
            elevation={0}
            sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.08),
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(12px)',
                overflow: 'hidden'
            }}
        >
            <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                    <TableRow>
                        {[
                            { key: 'ip_address', label: 'Equipamento' },
                            { key: 'serial_number', label: 'N/S' },
                            { key: 'device_type', label: 'Tipo' },
                            { key: 'model', label: 'Especificação' },
                            { key: 'location', label: 'Ambiente' },
                            { key: 'status', label: 'Status' }
                        ].map((col) => (
                            <TableCell
                                key={col.key}
                                onClick={() => onSort(col.key)}
                                sx={{
                                    py: 2,
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: 'text.secondary',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    cursor: 'pointer',
                                    '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.02) }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {col.label}
                                    {sortConfig.key === col.key && (
                                        sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                    )}
                                </Box>
                            </TableCell>
                        ))}
                        <TableCell align="right" sx={{ py: 2, fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                            Ações
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {devices.map((device) => {
                        const { color, label } = getStatusConfig(device.status)
                        return (
                            <TableRow
                                key={device.id}
                                sx={{
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.01),
                                        '& .row-actions': { opacity: 1 }
                                    },
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <TableCell sx={{ py: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{
                                            width: 40,
                                            height: 40,
                                            bgcolor: alpha(color, 0.1),
                                            color: color,
                                            borderRadius: 2.5
                                        }}>
                                            {device.device_type === 'camera' ? <Eye size={20} /> :
                                                device.device_type === 'switch' ? <Cpu size={20} /> :
                                                    <HardDrive size={20} />}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={700} color="text.primary">
                                                {device.hostname || device.ip_address}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {device.ip_address}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
                                    <Typography variant="body2" fontWeight={500} color="text.secondary">
                                        {device.serial_number || '-'}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
                                    <Chip
                                        label={getDeviceTypeLabel(device.device_type)}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 1.5,
                                            height: 24,
                                            fontSize: '0.7rem',
                                            fontWeight: 500,
                                            borderColor: alpha(theme.palette.divider, 0.1)
                                        }}
                                    />
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
                                    <Box>
                                        <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 200 }}>
                                            {device.model}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {device.manufacturer}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {device.location || 'Não definido'}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
                                        <Typography variant="caption" fontWeight={600} color={color}>
                                            {label}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align="right" sx={{ py: 2 }}>
                                    <Box className="row-actions" sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        gap: 0.5,
                                        opacity: 0.6,
                                        transition: 'opacity 0.2s'
                                    }}>
                                        <Tooltip title="Visualizar">
                                            <IconButton size="small" onClick={() => onView(device)} sx={{ color: 'info.main', '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) } }}>
                                                <Eye size={18} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Editar">
                                            <IconButton size="small" onClick={() => onEdit(device)} sx={{ color: 'success.main', '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) } }}>
                                                <Edit size={18} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir">
                                            <IconButton size="small" onClick={() => handleDelete(device)} sx={{ color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}>
                                                <Trash2 size={18} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default InventoryTable
