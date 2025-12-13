import React, { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Card,
    CardContent,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip
} from '@mui/material'
import { api } from '../../services/api'

interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    )
}

export default function SystemLogs() {
    const [tabValue, setTabValue] = useState(0)
    const [auditLogs, setAuditLogs] = useState<any[]>([])
    const [loginLogs, setLoginLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadLogs()
    }, [])

    const loadLogs = async () => {
        try {
            const [audit, login] = await Promise.all([
                api.getAuditLogs(100, 0),
                api.getLoginLogs(100, 0)
            ])
            setAuditLogs(audit)
            setLoginLogs(login)
        } catch (error) {
            console.error('Error loading logs:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        return date.toLocaleString('pt-BR')
    }

    if (loading) {
        return <Box p={3}><Typography>Carregando...</Typography></Box>
    }

    return (
        <Box>
            <Box mb={4}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Logs e Auditoria
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Visualize logs de sistema e auditoria de ações
                </Typography>
            </Box>

            <Card>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                    <Tab label="Logs de Auditoria" />
                    <Tab label="Logs de Login" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Data/Hora</strong></TableCell>
                                    <TableCell><strong>Usuário</strong></TableCell>
                                    <TableCell><strong>Ação</strong></TableCell>
                                    <TableCell><strong>Entidade</strong></TableCell>
                                    <TableCell><strong>IP</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {auditLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Typography color="text.secondary">Nenhum log de auditoria encontrado</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    auditLogs.map((log) => (
                                        <TableRow key={log.id} hover>
                                            <TableCell>{formatDate(log.created_at)}</TableCell>
                                            <TableCell>{log.user_name || log.user_email || '-'}</TableCell>
                                            <TableCell>
                                                <Chip label={log.action} size="small" color="primary" />
                                            </TableCell>
                                            <TableCell>
                                                {log.entity_type ? `${log.entity_type}: ${log.entity_id}` : '-'}
                                            </TableCell>
                                            <TableCell>{log.ip_address || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Data/Hora</strong></TableCell>
                                    <TableCell><strong>Usuário</strong></TableCell>
                                    <TableCell><strong>Provedor</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell><strong>IP</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loginLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Typography color="text.secondary">Nenhum log de login encontrado</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    loginLogs.map((log) => (
                                        <TableRow key={log.id} hover>
                                            <TableCell>{formatDate(log.created_at)}</TableCell>
                                            <TableCell>{log.full_name || log.email || '-'}</TableCell>
                                            <TableCell>{log.provider || '-'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.status || 'unknown'}
                                                    size="small"
                                                    color={log.status === 'success' ? 'success' : 'error'}
                                                />
                                            </TableCell>
                                            <TableCell>{log.ip_address || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>
            </Card>
        </Box>
    )
}
