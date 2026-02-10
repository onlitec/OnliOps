import React, { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Divider,
    Alert
} from '@mui/material'
import {
    Settings as SettingsIcon,
    Sync as SyncIcon,
    Link as LinkIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    History as HistoryIcon,
    ChevronRight as DetailsIcon,
    Refresh as RefreshIcon,
    Add as AddIcon,
} from '@mui/icons-material'
import { api } from '../../services/api'
import HikCentralConfig from '../../components/integrations/HikCentralConfig'

interface Project {
    id: string
    name: string
}

interface Integration {
    project_id: string
    provider: string
    project_name: string
    sync_status: string
    last_sync: string | null
    config: any
}

export default function Integrations() {
    const [integrations, setIntegrations] = useState<Integration[]>([])
    const [loading, setLoading] = useState(true)
    const [projects, setProjects] = useState<Project[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadIntegrations()
    }, [])

    const loadIntegrations = async () => {
        setLoading(true)
        setError(null)
        try {
            const [data, projectsSummary] = await Promise.all([
                api.getAllIntegrations(),
                api.getProjectsSummary()
            ])
            setIntegrations(data)
            setProjects(projectsSummary.map((p: any) => ({ id: p.id, name: p.name })))
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar integrações')
        } finally {
            setLoading(false)
        }
    }

    const handleAddIntegration = () => {
        setSelectedIntegration(null)
        setDialogOpen(true)
    }

    const getStatusChip = (status: string) => {
        switch (status) {
            case 'idle':
                return <Chip icon={<CheckCircleIcon />} label="Ativo" color="success" size="small" variant="outlined" />
            case 'syncing':
                return <Chip icon={<CircularProgress size={16} />} label="Sincronizando" color="primary" size="small" variant="outlined" />
            case 'failed':
                return <Chip icon={<ErrorIcon />} label="Falha" color="error" size="small" variant="outlined" />
            default:
                return <Chip label={status} size="small" variant="outlined" />
        }
    }

    const handleConfigure = (integration: Integration) => {
        setSelectedIntegration(integration)
        setDialogOpen(true)
    }

    return (
        <Box>
            <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Central de Integrações
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Gerenciamento global de conexões externas e monitoramento de sincronização
                    </Typography>
                </Box>
                <Box display="flex" gap={2}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddIntegration}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                        Nova Integração
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadIntegrations}
                        sx={{ borderRadius: 2 }}
                    >
                        Atualizar
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Projeto</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Provedor</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status de Sincronização</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Última Sincronização</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                        <CircularProgress />
                                        <Typography sx={{ mt: 2 }} color="text.secondary">Carregando integrações...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : integrations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                        <Typography color="text.secondary">Nenhuma integração configurada ainda.</Typography>
                                        <Typography variant="body2" color="text.secondary">Vá em Gerenciamento de Projetos para configurar uma nova integração.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : integrations.map((int) => (
                                <TableRow key={`${int.project_id}-${int.provider}`} hover>
                                    <TableCell>
                                        <Typography fontWeight={600}>{int.project_name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{int.project_id}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Box
                                                component="span"
                                                sx={{
                                                    px: 1.5,
                                                    py: 0.8,
                                                    bgcolor: int.provider === 'hikcentral' ? 'rgba(230, 0, 18, 0.1)' : 'primary.light',
                                                    color: int.provider === 'hikcentral' ? '#E60012' : 'primary.dark',
                                                    borderRadius: 1.5,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 800,
                                                    textTransform: 'uppercase',
                                                    border: int.provider === 'hikcentral' ? '1px solid rgba(230, 0, 18, 0.2)' : 'none'
                                                }}
                                            >
                                                {int.provider === 'hikcentral' ? 'HikCentral Professional' : int.provider}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{getStatusChip(int.sync_status)}</TableCell>
                                    <TableCell>
                                        {int.last_sync ? (
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <HistoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="body2">
                                                    {new Date(int.last_sync).toLocaleString('pt-BR')}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">Nunca</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Configurações">
                                            <IconButton onClick={() => handleConfigure(int)} color="primary">
                                                <SettingsIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Ver Devices">
                                            <IconButton color="secondary">
                                                <DetailsIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, bgcolor: 'grey.50', pb: 2 }}>
                    {selectedIntegration ? 'Configurações de Integração' : 'Adicionar Nova Integração'}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {!selectedIntegration ? (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom fontWeight={700}>
                                Selecione um Projeto
                            </Typography>
                            <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={2} mb={4}>
                                {projects.map(p => (
                                    <Card
                                        key={p.id}
                                        variant="outlined"
                                        sx={{
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.light', color: 'primary.dark' }
                                        }}
                                        onClick={() => setSelectedIntegration({ project_id: p.id, project_name: p.name, provider: 'hikcentral' })}
                                    >
                                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                            <Typography variant="body2" fontWeight={700}>{p.name}</Typography>
                                            <Typography variant="caption" color="inherit" sx={{ opacity: 0.7 }}>Clique para configurar HikCentral</Typography>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Box>
                    ) : (
                        <HikCentralConfig
                            projectId={selectedIntegration.project_id}
                            projectName={selectedIntegration.project_name}
                            onClose={() => {
                                setDialogOpen(false)
                                loadIntegrations()
                            }}
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
                    <Button onClick={() => setDialogOpen(false)} variant="contained" sx={{ fontWeight: 700, borderRadius: 2 }}>
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
