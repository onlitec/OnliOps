import React, { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    TextField,
    Alert,
    CircularProgress,
    FormControlLabel,
    Checkbox,
    Tooltip
} from '@mui/material'
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    Business as BusinessIcon,
    Layers as ProjectIcon,
    Devices as DeviceIcon,
    Warning as WarningIcon
} from '@mui/icons-material'
import { api } from '../../services/api'
import { useAppSelector } from '../../store/hooks'
import { selectUserRole } from '../../store/slices/authSlice'

interface Client {
    id: string
    name: string
    metrics?: {
        projects: number
        devices: number
        alerts: number
    }
}

export default function ClientManagement() {
    const userRole = useAppSelector(selectUserRole)
    const isAdmin = userRole === 'admin'
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Delete Confirmation Dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
    const [confirmName, setConfirmName] = useState('')
    const [confirmCheck, setConfirmCheck] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Edit Dialog
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null)
    const [editName, setEditName] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            // Get raw clients
            const clientsData = await api.getClients()
            // Get projects to calculate metrics
            const projects = await api.getProjectsSummary()

            // Merge metrics
            const mergedClients = clientsData.map((client: any) => {
                const clientProjects = projects.filter((p: any) => p.client.id === client.id)
                return {
                    ...client,
                    metrics: {
                        projects: clientProjects.length,
                        devices: clientProjects.reduce((sum: number, p: any) => sum + (p.metrics?.devices || 0), 0),
                        alerts: clientProjects.reduce((sum: number, p: any) => sum + (p.metrics?.alerts || 0), 0)
                    }
                }
            })

            setClients(mergedClients)
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar clientes')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteClick = (client: Client) => {
        if (!isAdmin) return
        setClientToDelete(client)
        setConfirmName('')
        setConfirmCheck(false)
        setDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!clientToDelete || confirmName !== clientToDelete.name || !confirmCheck) return

        setIsDeleting(true)
        try {
            await api.deleteClient(clientToDelete.id)
            setDeleteDialogOpen(false)
            setClientToDelete(null)
            setConfirmName('')
            setConfirmCheck(false)
            loadData()
        } catch (err: any) {
            setError(err.message || 'Erro ao excluir cliente')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleEditClick = (client: Client) => {
        setClientToEdit(client)
        setEditName(client.name)
        setEditDialogOpen(true)
    }

    const handleSaveEdit = async () => {
        if (!clientToEdit || !editName.trim()) return

        setIsSaving(true)
        try {
            await api.updateClient(clientToEdit.id, { name: editName.trim() })
            setEditDialogOpen(false)
            setClientToEdit(null)
            setEditName('')
            loadData()
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar cliente')
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box>
            <Box mb={4}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Gerenciamento de Clientes
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Administre os clientes da plataforma e realize exclusões seguras
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {!isAdmin && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    Apenas administradores podem realizar exclusões de clientes.
                </Alert>
            )}

            <Card>
                <CardContent>
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Cliente</strong></TableCell>
                                    <TableCell align="center"><strong>Projetos</strong></TableCell>
                                    <TableCell align="center"><strong>Dispositivos</strong></TableCell>
                                    <TableCell align="center"><strong>Alertas</strong></TableCell>
                                    <TableCell align="right"><strong>Ações</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {clients.map((client) => (
                                    <TableRow key={client.id} hover>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'primary.light', color: 'primary.main', display: 'flex' }}>
                                                    <BusinessIcon />
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={600}>{client.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{client.id}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                icon={<ProjectIcon sx={{ fontSize: '1rem !important' }} />}
                                                label={client.metrics?.projects || 0}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                icon={<DeviceIcon sx={{ fontSize: '1rem !important' }} />}
                                                label={client.metrics?.devices || 0}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={client.metrics?.alerts || 0}
                                                size="small"
                                                color={(client.metrics?.alerts || 0) > 0 ? 'error' : 'default'}
                                                variant={(client.metrics?.alerts || 0) > 0 ? 'filled' : 'outlined'}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box display="flex" justifyContent="flex-end" gap={1}>
                                                <Tooltip title="Editar Cliente">
                                                    <IconButton
                                                        onClick={() => handleEditClick(client)}
                                                        size="small"
                                                        color="primary"
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={isAdmin ? "Excluir Cliente" : "Apenas Admin"}>
                                                    <span>
                                                        <IconButton
                                                            onClick={() => handleDeleteClick(client)}
                                                            size="small"
                                                            color="error"
                                                            disabled={!isAdmin}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {clients.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Typography variant="body2" color="text.secondary" py={4}>
                                                Nenhum cliente encontrado.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => !isDeleting && setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: { borderRadius: 3, p: 1, maxWidth: '450px' }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, color: 'error.main', pb: 1 }}>
                    Confirmar Exclusão de Cliente
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Esta ação é <strong>irreversível</strong> e excluirá permanentemente o cliente
                        <Typography component="span" fontWeight={700} color="text.primary"> "{clientToDelete?.name}" </Typography>
                        e todos os seus projetos, dispositivos e dados associados.
                    </DialogContentText>

                    <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
                        Todos os dados subordinados serão perdidos para sempre.
                    </Alert>

                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                        Para confirmar, digite o nome do cliente abaixo:
                    </Typography>

                    <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        placeholder={clientToDelete?.name}
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        disabled={isDeleting}
                        autoFocus
                        autoComplete="off"
                        sx={{ mb: 2 }}
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={confirmCheck}
                                onChange={(e) => setConfirmCheck(e.target.checked)}
                                disabled={isDeleting}
                            />
                        }
                        label={
                            <Typography variant="caption" color="text.secondary">
                                Eu entendo que esta ação excluirá permanentemente todos os dados deste cliente.
                            </Typography>
                        }
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={isDeleting}
                        sx={{ color: 'text.secondary', textTransform: 'none' }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant="contained"
                        color="error"
                        disabled={isDeleting || confirmName !== clientToDelete?.name || !confirmCheck}
                        startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            textTransform: 'none',
                            fontWeight: 600
                        }}
                    >
                        {isDeleting ? 'Excluindo...' : 'Sim, Excluir Cadastro'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Client Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={() => !isSaving && setEditDialogOpen(false)}
                PaperProps={{
                    sx: { borderRadius: 3, p: 1, minWidth: '400px' }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Editar Cliente
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        Altere o nome do cadastro do cliente
                    </Typography>
                    <TextField
                        fullWidth
                        label="Nome do Cliente"
                        variant="outlined"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={isSaving}
                        autoFocus
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setEditDialogOpen(false)}
                        disabled={isSaving}
                        sx={{ color: 'text.secondary', textTransform: 'none' }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSaveEdit}
                        variant="contained"
                        disabled={isSaving || !editName.trim() || editName === clientToEdit?.name}
                        startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : null}
                        sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 600 }}
                    >
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
