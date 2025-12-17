import React, { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    TextField,
    Alert,
    Snackbar,
    CircularProgress,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    alpha,
    useTheme,
    IconButton,
    Tooltip,
} from '@mui/material'
import {
    SmartToy,
    Code,
    Save,
    Refresh,
    CheckCircle,
    Error as ErrorIcon,
    Description,
    RestoreFromTrash,
    Psychology,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

interface PromptInfo {
    name: string
    filename: string
    size: number
    modified: string
    metadata: {
        name?: string
        version?: string
        temperature?: string
        description?: string
    }
}

interface OllamaStatus {
    available: boolean
    model: string
    models: string[]
}

export default function AISettings() {
    const theme = useTheme()
    const navigate = useNavigate()

    const [prompts, setPrompts] = useState<PromptInfo[]>([])
    const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
    const [promptContent, setPromptContent] = useState('')
    const [originalContent, setOriginalContent] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Fetch prompts list
    const fetchPrompts = async () => {
        try {
            const response = await fetch('/api/prompts')
            if (!response.ok) throw new Error('Failed to fetch prompts')
            const data = await response.json()
            setPrompts(data.prompts || [])
        } catch (err: any) {
            setError(err.message)
        }
    }

    // Fetch Ollama status
    const fetchOllamaStatus = async () => {
        try {
            const response = await fetch('/api/ai/status')
            if (response.ok) {
                const data = await response.json()
                setOllamaStatus({
                    available: data.available,
                    model: data.defaultModel || 'phi3',
                    models: data.models?.map((m: any) => m.name) || []
                })
            }
        } catch (err) {
            setOllamaStatus({ available: false, model: '', models: [] })
        }
    }

    // Load prompt content
    const loadPrompt = async (name: string) => {
        try {
            setLoading(true)
            const response = await fetch(`/api/prompts/${name}`)
            if (!response.ok) throw new Error('Failed to load prompt')
            const data = await response.json()
            setPromptContent(data.content)
            setOriginalContent(data.content)
            setSelectedPrompt(name)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Save prompt
    const savePrompt = async () => {
        if (!selectedPrompt) return

        try {
            setSaving(true)
            const response = await fetch(`/api/prompts/${selectedPrompt}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: promptContent })
            })

            if (!response.ok) throw new Error('Failed to save prompt')

            const data = await response.json()
            setOriginalContent(promptContent)
            setSuccess(data.message || 'Prompt salvo com sucesso!')
            fetchPrompts() // Refresh list
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    // Restore from backup
    const restorePrompt = async () => {
        if (!selectedPrompt) return

        try {
            setLoading(true)
            const response = await fetch(`/api/prompts/${selectedPrompt}/restore`, {
                method: 'POST'
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to restore')
            }

            const data = await response.json()
            setPromptContent(data.content)
            setOriginalContent(data.content)
            setSuccess('Prompt restaurado do backup!')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPrompts()
        fetchOllamaStatus()
        setLoading(false)
    }, [])

    const hasChanges = promptContent !== originalContent

    const getPromptDisplayName = (name: string) => {
        const names: Record<string, string> = {
            'identify_hikvision': '🎥 Identificação Hikvision',
            'categorize_devices': '📦 Categorização de Dispositivos',
            'analyze_spreadsheet': '📊 Análise de Planilhas'
        }
        return names[name] || name
    }

    return (
        <Box>
            {/* Header */}
            <Box mb={4}>
                <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Psychology sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                    Configurações de IA
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Gerencie os prompts de inteligência artificial para importação inteligente
                </Typography>
            </Box>

            {/* Ollama Status Card */}
            <Card sx={{ mb: 3, background: alpha(theme.palette.primary.main, 0.05) }}>
                <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={2}>
                            <SmartToy sx={{ fontSize: 32, color: ollamaStatus?.available ? 'success.main' : 'error.main' }} />
                            <Box>
                                <Typography variant="h6" fontWeight="bold">
                                    Ollama AI Engine
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Modelo de IA local para análise inteligente
                                </Typography>
                            </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                            {ollamaStatus?.available ? (
                                <>
                                    <Chip
                                        icon={<CheckCircle />}
                                        label="Online"
                                        color="success"
                                        variant="filled"
                                    />
                                    <Chip
                                        label={`Modelo: ${ollamaStatus.model}`}
                                        variant="outlined"
                                        color="primary"
                                    />
                                </>
                            ) : (
                                <Chip
                                    icon={<ErrorIcon />}
                                    label="Offline"
                                    color="error"
                                    variant="filled"
                                />
                            )}
                            <IconButton onClick={fetchOllamaStatus} size="small">
                                <Refresh />
                            </IconButton>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Main Content */}
            <Box display="flex" gap={3}>
                {/* Prompts List */}
                <Paper sx={{ width: 300, flexShrink: 0 }}>
                    <Box p={2} borderBottom={1} borderColor="divider">
                        <Typography variant="subtitle1" fontWeight="bold">
                            📝 Prompts Disponíveis
                        </Typography>
                    </Box>
                    <List>
                        {prompts.map((prompt) => (
                            <ListItem key={prompt.name} disablePadding>
                                <ListItemButton
                                    selected={selectedPrompt === prompt.name}
                                    onClick={() => loadPrompt(prompt.name)}
                                >
                                    <ListItemIcon>
                                        <Description color={selectedPrompt === prompt.name ? 'primary' : 'inherit'} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={getPromptDisplayName(prompt.name)}
                                        secondary={`v${prompt.metadata.version || '1.0.0'}`}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Paper>

                {/* Editor */}
                <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {selectedPrompt ? (
                        <>
                            <Box p={2} borderBottom={1} borderColor="divider" display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="h6" fontWeight="bold">
                                        {getPromptDisplayName(selectedPrompt)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {selectedPrompt}.md
                                    </Typography>
                                </Box>
                                <Box display="flex" gap={1}>
                                    <Tooltip title="Restaurar do backup">
                                        <IconButton onClick={restorePrompt} disabled={loading}>
                                            <RestoreFromTrash />
                                        </IconButton>
                                    </Tooltip>
                                    <Button
                                        variant="contained"
                                        startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                                        onClick={savePrompt}
                                        disabled={!hasChanges || saving}
                                    >
                                        {saving ? 'Salvando...' : 'Salvar'}
                                    </Button>
                                </Box>
                            </Box>
                            <Box p={2} flex={1}>
                                {hasChanges && (
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                        Você tem alterações não salvas
                                    </Alert>
                                )}
                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={20}
                                    maxRows={35}
                                    value={promptContent}
                                    onChange={(e) => setPromptContent(e.target.value)}
                                    placeholder="Conteúdo do prompt..."
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            fontFamily: 'monospace',
                                            fontSize: '0.9rem',
                                            lineHeight: 1.5
                                        }
                                    }}
                                />
                            </Box>
                        </>
                    ) : (
                        <Box p={4} display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                            <Code sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">
                                Selecione um prompt para editar
                            </Typography>
                            <Typography variant="body2" color="text.disabled">
                                Clique em um prompt na lista à esquerda
                            </Typography>
                        </Box>
                    )}
                </Paper>
            </Box>

            {/* Info Card */}
            <Card sx={{ mt: 3, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        ℹ️ Sobre os Prompts
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Os prompts de IA são instruções que guiam o modelo na análise de dispositivos e planilhas.
                        Após salvar alterações, elas serão aplicadas automaticamente nas próximas importações.
                        Use variáveis como <code>{'{{DEVICES}}'}</code> e <code>{'{{CATEGORIES}}'}</code> para dados dinâmicos.
                    </Typography>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Snackbar
                open={!!error}
                autoHideDuration={5000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={3000}
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success" onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            </Snackbar>
        </Box>
    )
}
