import React, { useState } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    FormControl,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Alert,
    alpha,
    useTheme,
    Tooltip,
} from '@mui/material'
import {
    Warning,
    Update,
    Block,
    MergeType,
    CheckCircle,
} from '@mui/icons-material'
import { DuplicateItem } from '../../services/aiService'

interface DuplicateReviewDialogProps {
    open: boolean
    duplicates: DuplicateItem[]
    onConfirm: (decisions: DuplicateItem[]) => void
    onClose: () => void
}

type ActionType = 'update' | 'skip' | 'merge'

const actionLabels: Record<ActionType, { label: string; icon: React.ReactNode; color: 'warning' | 'error' | 'info' }> = {
    update: { label: 'Atualizar', icon: <Update fontSize="small" />, color: 'warning' },
    skip: { label: 'Ignorar', icon: <Block fontSize="small" />, color: 'error' },
    merge: { label: 'Mesclar', icon: <MergeType fontSize="small" />, color: 'info' },
}

export default function DuplicateReviewDialog({
    open,
    duplicates,
    onConfirm,
    onClose,
}: DuplicateReviewDialogProps) {
    const theme = useTheme()
    const [decisions, setDecisions] = useState<DuplicateItem[]>(duplicates)
    const [applyToAll, setApplyToAll] = useState(false)
    const [globalAction, setGlobalAction] = useState<ActionType>('update')

    // Update decisions when duplicates change
    React.useEffect(() => {
        setDecisions(duplicates)
    }, [duplicates])

    const handleActionChange = (index: number, action: ActionType) => {
        setDecisions(prev =>
            prev.map((item, i) =>
                i === index ? { ...item, action } : item
            )
        )
    }

    const handleApplyToAll = (action: ActionType) => {
        setGlobalAction(action)
        setDecisions(prev =>
            prev.map(item => ({ ...item, action }))
        )
    }

    const handleConfirm = () => {
        onConfirm(decisions)
    }

    const getMatchBadge = (matchedBy: string) => {
        return matchedBy === 'ip_address' ? (
            <Chip label="IP" size="small" color="primary" variant="outlined" />
        ) : (
            <Chip label="Serial" size="small" color="secondary" variant="outlined" />
        )
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    background: theme.palette.mode === 'dark'
                        ? 'rgba(22, 33, 62, 0.98)'
                        : 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(10px)',
                }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.25)',
                        }}
                    >
                        <Warning sx={{ color: 'white' }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>
                            Dispositivos Duplicados Encontrados
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {duplicates.length} dispositivo(s) já existem no banco de dados
                        </Typography>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                        Esses dispositivos já estão cadastrados. Escolha uma ação para cada um:
                        <br />
                        <strong>Atualizar:</strong> Sobrescreve os dados existentes com os novos
                        <br />
                        <strong>Ignorar:</strong> Mantém o cadastro atual e não importa
                        <br />
                        <strong>Mesclar:</strong> Combina os dados (prioriza valores não-vazios dos novos)
                    </Typography>
                </Alert>

                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={applyToAll}
                                onChange={(e) => setApplyToAll(e.target.checked)}
                            />
                        }
                        label="Aplicar mesma ação a todos"
                    />
                    {applyToAll && (
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <Select
                                value={globalAction}
                                onChange={(e) => handleApplyToAll(e.target.value as ActionType)}
                            >
                                <MenuItem value="update">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Update fontSize="small" /> Atualizar todos
                                    </Box>
                                </MenuItem>
                                <MenuItem value="skip">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Block fontSize="small" /> Ignorar todos
                                    </Box>
                                </MenuItem>
                                <MenuItem value="merge">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <MergeType fontSize="small" /> Mesclar todos
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>
                    )}
                </Box>

                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Correspondência</TableCell>
                                <TableCell>Novo (Planilha)</TableCell>
                                <TableCell>Existente (Banco)</TableCell>
                                <TableCell align="center">Ação</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {decisions.map((item, index) => (
                                <TableRow
                                    key={index}
                                    sx={{
                                        background: item.action === 'skip'
                                            ? alpha(theme.palette.error.main, 0.05)
                                            : item.action === 'update'
                                                ? alpha(theme.palette.warning.main, 0.05)
                                                : alpha(theme.palette.info.main, 0.05)
                                    }}
                                >
                                    <TableCell>
                                        {getMatchBadge(item.matchedBy)}
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" fontFamily="monospace">
                                                {item.incoming.ip_address}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {item.incoming.model || '-'} • {item.incoming.hostname || '-'}
                                            </Typography>
                                            {item.incoming.tag && (
                                                <Chip label={item.incoming.tag} size="small" sx={{ ml: 1 }} />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" fontFamily="monospace">
                                                {item.existing.ip_address}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {item.existing.model || '-'} • {item.existing.hostname || '-'}
                                            </Typography>
                                            {item.existing.tag && (
                                                <Chip label={item.existing.tag} size="small" sx={{ ml: 1 }} />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        {!applyToAll ? (
                                            <FormControl size="small" sx={{ minWidth: 130 }}>
                                                <Select
                                                    value={item.action}
                                                    onChange={(e) => handleActionChange(index, e.target.value as ActionType)}
                                                >
                                                    <MenuItem value="update">
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Update fontSize="small" color="warning" />
                                                            Atualizar
                                                        </Box>
                                                    </MenuItem>
                                                    <MenuItem value="skip">
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Block fontSize="small" color="error" />
                                                            Ignorar
                                                        </Box>
                                                    </MenuItem>
                                                    <MenuItem value="merge">
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <MergeType fontSize="small" color="info" />
                                                            Mesclar
                                                        </Box>
                                                    </MenuItem>
                                                </Select>
                                            </FormControl>
                                        ) : (
                                            <Chip
                                                label={actionLabels[item.action].label}
                                                icon={actionLabels[item.action].icon as React.ReactElement}
                                                color={actionLabels[item.action].color}
                                                size="small"
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight={700} color="warning.main">
                            {decisions.filter(d => d.action === 'update').length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Serão atualizados</Typography>
                    </Paper>
                    <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight={700} color="error.main">
                            {decisions.filter(d => d.action === 'skip').length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Serão ignorados</Typography>
                    </Paper>
                    <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight={700} color="info.main">
                            {decisions.filter(d => d.action === 'merge').length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Serão mesclados</Typography>
                    </Paper>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Cancelar</Button>
                <Button
                    variant="contained"
                    onClick={handleConfirm}
                    startIcon={<CheckCircle />}
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                >
                    Confirmar e Continuar
                </Button>
            </DialogActions>
        </Dialog>
    )
}
