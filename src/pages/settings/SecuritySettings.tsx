import React, { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    FormControlLabel,
    Switch,
    Alert
} from '@mui/material'
import { Save as SaveIcon } from '@mui/icons-material'
import { api } from '../../services/api'

export default function SecuritySettings() {
    const [settings, setSettings] = useState({
        min_password_length: 8,
        session_timeout: 3600,
        mfa_enabled: false
    })
    const [loading, setLoading] = useState(true)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const data = await api.getSetting('security_policy')
            setSettings(data)
        } catch (error) {
            console.error('Error loading security settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            await api.updateSetting('security_policy', settings)
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (error) {
            console.error('Error saving settings:', error)
            alert('Erro ao salvar configurações')
        }
    }

    if (loading) {
        return <Box p={3}><Typography>Carregando...</Typography></Box>
    }

    return (
        <Box>
            <Box mb={4}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Segurança e Autenticação
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Configure políticas de senha e autenticação
                </Typography>
            </Box>

            {saved && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    Configurações salvas com sucesso!
                </Alert>
            )}

            <Card>
                <CardContent>
                    <Box display="flex" flexDirection="column" gap={3}>
                        <TextField
                            label="Comprimento Mínimo da Senha"
                            type="number"
                            value={settings.min_password_length}
                            onChange={(e) => setSettings({ ...settings, min_password_length: parseInt(e.target.value) })}
                            helperText="Número mínimo de caracteres para senhas"
                            fullWidth
                        />

                        <TextField
                            label="Timeout de Sessão (segundos)"
                            type="number"
                            value={settings.session_timeout}
                            onChange={(e) => setSettings({ ...settings, session_timeout: parseInt(e.target.value) })}
                            helperText="Tempo de inatividade antes do logout automático"
                            fullWidth
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.mfa_enabled}
                                    onChange={(e) => setSettings({ ...settings, mfa_enabled: e.target.checked })}
                                />
                            }
                            label="Habilitar Autenticação Multi-Fator (MFA)"
                        />

                        <Box mt={2}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSave}
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
