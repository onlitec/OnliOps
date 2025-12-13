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

export default function NotificationSettings() {
    const [settings, setSettings] = useState({
        email_enabled: false,
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_pass: ''
    })
    const [loading, setLoading] = useState(true)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const data = await api.getSetting('notification_config')
            setSettings(data)
        } catch (error) {
            console.error('Error loading notification settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            await api.updateSetting('notification_config', settings)
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
                    Notificações
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Configure alertas e notificações do sistema
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
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.email_enabled}
                                    onChange={(e) => setSettings({ ...settings, email_enabled: e.target.checked })}
                                />
                            }
                            label="Habilitar Notificações por Email"
                        />

                        <TextField
                            label="Servidor SMTP"
                            value={settings.smtp_host}
                            onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                            disabled={!settings.email_enabled}
                            fullWidth
                        />

                        <TextField
                            label="Porta SMTP"
                            type="number"
                            value={settings.smtp_port}
                            onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })}
                            disabled={!settings.email_enabled}
                            fullWidth
                        />

                        <TextField
                            label="Usuário SMTP"
                            value={settings.smtp_user}
                            onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                            disabled={!settings.email_enabled}
                            fullWidth
                        />

                        <TextField
                            label="Senha SMTP"
                            type="password"
                            value={settings.smtp_pass}
                            onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                            disabled={!settings.email_enabled}
                            fullWidth
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
