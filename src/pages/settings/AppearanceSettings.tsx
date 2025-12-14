import React, { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    TextField,
    Slider,
    IconButton,
    Divider
} from '@mui/material'
import {
    Save as SaveIcon,
    Palette as PaletteIcon,
    TextFields as TextFieldsIcon,
    Add as AddIcon,
    Remove as RemoveIcon
} from '@mui/icons-material'
import { api } from '../../services/api'
import { useThemeMode } from '../../context/ThemeContext'

const THEME_COLORS = [
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Roxo', value: '#8b5cf6' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Laranja', value: '#f59e0b' },
    { name: 'Vermelho', value: '#ef4444' },
    { name: 'Índigo', value: '#6366f1' }
]

const FONT_SCALE_OPTIONS = [
    { value: 'small', label: 'Pequeno', description: 'Textos compactos' },
    { value: 'medium', label: 'Médio', description: 'Tamanho padrão' },
    { value: 'large', label: 'Grande', description: 'Textos maiores' },
    { value: 'xlarge', label: 'Extra Grande', description: 'Máxima legibilidade' }
]

export default function AppearanceSettings() {
    const { mode, setMode, fontScale, setFontScale } = useThemeMode()
    const [settings, setSettings] = useState({
        theme_mode: mode,
        primary_color: '#3b82f6',
        logo_url: ''
    })
    const [loading, setLoading] = useState(true)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const data = await api.getSetting('appearance')
            if (data) {
                setSettings({
                    ...data,
                    theme_mode: data.theme_mode || mode
                })
                // Sync with context
                if (data.theme_mode && ['light', 'dark', 'auto'].includes(data.theme_mode)) {
                    setMode(data.theme_mode as 'light' | 'dark' | 'auto')
                }
            }
        } catch (error) {
            console.error('Error loading appearance settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleThemeChange = (newMode: 'light' | 'dark' | 'auto') => {
        setSettings({ ...settings, theme_mode: newMode })
        // Apply immediately
        setMode(newMode)
    }

    const handleFontScaleChange = (newScale: 'small' | 'medium' | 'large' | 'xlarge') => {
        setFontScale(newScale)
    }

    const fontScaleIndex = FONT_SCALE_OPTIONS.findIndex(opt => opt.value === fontScale)

    const handleFontSizeIncrease = () => {
        if (fontScaleIndex < FONT_SCALE_OPTIONS.length - 1) {
            handleFontScaleChange(FONT_SCALE_OPTIONS[fontScaleIndex + 1].value as any)
        }
    }

    const handleFontSizeDecrease = () => {
        if (fontScaleIndex > 0) {
            handleFontScaleChange(FONT_SCALE_OPTIONS[fontScaleIndex - 1].value as any)
        }
    }

    const handleSave = async () => {
        try {
            await api.updateSetting('appearance', settings)
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (error) {
            console.error('Error saving settings:', error)
        }
    }

    if (loading) {
        return <Box p={3}><Typography>Carregando...</Typography></Box>
    }

    return (
        <Box>
            <Box mb={4}>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        mb: 1,
                    }}
                >
                    Aparência
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Personalize tema, cores e layout do sistema
                </Typography>
            </Box>

            {saved && (
                <Alert
                    severity="success"
                    sx={{
                        mb: 3,
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(56, 239, 125, 0.1) 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        '& .MuiAlert-icon': {
                            color: '#10B981',
                        },
                    }}
                >
                    Configurações salvas com sucesso!
                </Alert>
            )}

            <Card
                sx={{
                    background: (theme) =>
                        theme.palette.mode === 'dark'
                            ? 'rgba(22, 33, 62, 0.6)'
                            : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: (theme) =>
                        `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                }}
            >
                <CardContent>
                    <Box display="flex" flexDirection="column" gap={3}>
                        <FormControl fullWidth>
                            <InputLabel>Modo do Tema</InputLabel>
                            <Select
                                value={settings.theme_mode}
                                onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'auto')}
                                label="Modo do Tema"
                            >
                                <MenuItem value="light">Claro</MenuItem>
                                <MenuItem value="dark">Escuro</MenuItem>
                                <MenuItem value="auto">Automático</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Cor Primária</InputLabel>
                            <Select
                                value={settings.primary_color}
                                onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                label="Cor Primária"
                            >
                                {THEME_COLORS.map((color) => (
                                    <MenuItem key={color.value} value={color.value}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Box
                                                sx={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: 1,
                                                    bgcolor: color.value,
                                                    border: '1px solid #ccc'
                                                }}
                                            />
                                            {color.name}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box display="flex" alignItems="center" gap={2}>
                            <Box
                                sx={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 2,
                                    bgcolor: settings.primary_color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <PaletteIcon sx={{ color: 'white', fontSize: 32 }} />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Pré-visualização da cor primária
                            </Typography>
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        {/* Font Size Control */}
                        <Box>
                            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
                                    }}
                                >
                                    <TextFieldsIcon sx={{ color: 'white', fontSize: 20 }} />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        Tamanho da Fonte
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Ajuste o tamanho dos textos da plataforma
                                    </Typography>
                                </Box>
                            </Box>

                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                    border: (theme) => `1px solid ${theme.palette.divider}`,
                                }}
                            >
                                <IconButton
                                    onClick={handleFontSizeDecrease}
                                    disabled={fontScaleIndex === 0}
                                    sx={{
                                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                        '&:hover': {
                                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                        },
                                    }}
                                >
                                    <RemoveIcon />
                                </IconButton>

                                <Box sx={{ flex: 1, px: 2 }}>
                                    <Slider
                                        value={fontScaleIndex}
                                        min={0}
                                        max={FONT_SCALE_OPTIONS.length - 1}
                                        step={1}
                                        marks={FONT_SCALE_OPTIONS.map((opt, i) => ({
                                            value: i,
                                            label: opt.label
                                        }))}
                                        onChange={(_, value) => handleFontScaleChange(FONT_SCALE_OPTIONS[value as number].value as any)}
                                        sx={{
                                            '& .MuiSlider-markLabel': {
                                                fontSize: '0.7rem',
                                            },
                                        }}
                                    />
                                </Box>

                                <IconButton
                                    onClick={handleFontSizeIncrease}
                                    disabled={fontScaleIndex === FONT_SCALE_OPTIONS.length - 1}
                                    sx={{
                                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                        '&:hover': {
                                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                        },
                                    }}
                                >
                                    <AddIcon />
                                </IconButton>
                            </Box>

                            <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                    Pré-visualização:
                                </Typography>
                                <Typography variant="body1">
                                    Este é um exemplo de texto com o tamanho "{FONT_SCALE_OPTIONS[fontScaleIndex]?.label}".
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mt={0.5}>
                                    {FONT_SCALE_OPTIONS[fontScaleIndex]?.description}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        <TextField
                            label="URL do Logo (opcional)"
                            value={settings.logo_url}
                            onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                            helperText="URL de uma imagem para usar como logo do sistema"
                            fullWidth
                        />

                        <Box mt={2}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSave}
                                sx={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
                                    fontWeight: 600,
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                                        boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)',
                                    },
                                }}
                            >
                                Salvar Configurações
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    )
}

