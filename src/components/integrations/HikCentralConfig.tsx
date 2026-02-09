import React, { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    Divider,
    IconButton,
    LinearProgress,
    Grid
} from '@mui/material'
import {
    Save as SaveIcon,
    Sync as SyncIcon,
    Link as LinkIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon
} from '@mui/icons-material'
import { api } from '../../services/api'

interface HikCentralConfigProps {
    projectId: string
    projectName: string
    onClose?: () => void
}

export default function HikCentralConfig({ projectId, projectName, onClose }: HikCentralConfigProps) {
    const [config, setConfig] = useState({
        host: '',
        appKey: '',
        appSecret: '',
        username: '',
        password: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [testing, setTesting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [syncResult, setSyncResult] = useState<any>(null)

    useEffect(() => {
        loadConfig()
    }, [projectId])

    const loadConfig = async () => {
        setLoading(true)
        try {
            const data = await api.getIntegrationConfig(projectId, 'hikcentral')
            if (data && data.config) {
                setConfig(data.config)
            }
        } catch (error: any) {
            console.error('Error loading config:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setMessage(null)
        try {
            await api.saveIntegrationConfig(projectId, 'hikcentral', config)
            setMessage({ type: 'success', text: 'Configuração salva com sucesso!' })
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Erro ao salvar configuração' })
        } finally {
            setSaving(false)
        }
    }

    const handleTest = async () => {
        setTesting(true)
        setMessage(null)
        try {
            const result = await api.testIntegration(projectId, 'hikcentral', config)
            if (result.success) {
                setMessage({ type: 'success', text: 'Conexão estabelecida com sucesso!' })
            } else {
                setMessage({ type: 'error', text: result.error || 'Falha na conexão' })
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Erro ao testar conexão' })
        } finally {
            setTesting(false)
        }
    }

    const handleSync = async () => {
        setSyncing(true)
        setMessage(null)
        setSyncResult(null)
        try {
            const result = await api.syncIntegration(projectId, 'hikcentral')
            setSyncResult(result)
            setMessage({ type: 'success', text: `Sincronização concluída! ${result.imported} dispositivos processados.` })
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Erro durante a sincronização' })
        } finally {
            setSyncing(false)
        }
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box sx={{ p: 1 }}>
            <Box mb={3}>
                <Typography variant="h6" fontWeight={800} gutterBottom>
                    Integração HikCentral Professional
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Configure os parâmetros do Artemis OpenAPI para importar dispositivos do projeto <strong>{projectName}</strong>.
                </Typography>
            </Box>

            {message && (
                <Alert severity={message.type} sx={{ mb: 3, borderRadius: 2 }}>
                    {message.text}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        label="Endpoint API (Host)"
                        placeholder="https://192.168.1.100:443"
                        fullWidth
                        value={config.host}
                        onChange={(e) => setConfig({ ...config, host: e.target.value })}
                        variant="outlined"
                        helperText="Endereço IP/Domínio e porta do servidor HikCentral"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="App Key (AK)"
                        fullWidth
                        value={config.appKey}
                        onChange={(e) => setConfig({ ...config, appKey: e.target.value })}
                        variant="outlined"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="App Secret (SK)"
                        type="password"
                        fullWidth
                        value={config.appSecret}
                        onChange={(e) => setConfig({ ...config, appSecret: e.target.value })}
                        variant="outlined"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Usuário HikCentral"
                        fullWidth
                        value={config.username}
                        onChange={(e) => setConfig({ ...config, username: e.target.value })}
                        variant="outlined"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Senha HikCentral"
                        type="password"
                        fullWidth
                        value={config.password}
                        onChange={(e) => setConfig({ ...config, password: e.target.value })}
                        variant="outlined"
                    />
                </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                <Box display="flex" gap={2}>
                    <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={saving || !config.host || !config.appKey}
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                    >
                        Salvar Configuração
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={testing ? <CircularProgress size={20} color="inherit" /> : <LinkIcon />}
                        onClick={handleTest}
                        disabled={testing || saving || !config.host}
                        sx={{ fontWeight: 700, borderRadius: 2, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                    >
                        Testar Conexão
                    </Button>
                </Box>

                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={syncing ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
                    onClick={handleSync}
                    disabled={syncing || saving || testing || !config.host}
                    sx={{
                        fontWeight: 700,
                        borderRadius: 2,
                        bgcolor: 'primary.dark',
                        '&:hover': { bgcolor: 'black' }
                    }}
                >
                    Sincronizar Dispositivos agora
                </Button>
            </Box>

            {syncing && (
                <Box mt={4}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                        Sincronizando com HikCentral... isso pode levar alguns segundos.
                    </Typography>
                    <LinearProgress sx={{ borderRadius: 1, height: 8 }} />
                </Box>
            )}
        </Box>
    )
}
