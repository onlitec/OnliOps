import { Card, CardContent, Typography, Box, alpha, useTheme, LinearProgress, Tooltip } from '@mui/material'
import {
    Users,
    Layers,
    HardDrive,
    AlertTriangle,
    ChevronRight,
    Activity
} from 'lucide-react'

interface ClientDetailedCardProps {
    client: {
        id: string
        name: string
        metrics: {
            projects: number
            devices: number
            onlineUsers: number
            alerts: number
        }
    }
    selected?: boolean
    onClick: () => void
}

export default function ClientDetailedCard({ client, selected, onClick }: ClientDetailedCardProps) {
    const theme = useTheme()

    return (
        <Card
            onClick={onClick}
            sx={{
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: (theme) => `1px solid ${selected ? theme.palette.primary.main : alpha(theme.palette.divider, 0.1)}`,
                background: (theme) =>
                    selected
                        ? alpha(theme.palette.primary.main, 0.05)
                        : theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.03)'
                            : '#fff',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => `0 12px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
                    borderColor: theme.palette.primary.main,
                    '& .expand-arrow': {
                        transform: selected ? 'rotate(90deg)' : 'translateX(4px)',
                        color: theme.palette.primary.main,
                    },
                    '& .client-glow': {
                        opacity: 1,
                    }
                }
            }}
        >
            {/* Glow effect */}
            <Box
                className="client-glow"
                sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 150,
                    height: 150,
                    background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
                    opacity: selected ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    pointerEvents: 'none',
                }}
            />

            <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Typography variant="h6" fontWeight={700} color="text.primary">
                                {client.name}
                            </Typography>
                            {client.metrics.alerts > 0 && (
                                <Tooltip title={`${client.metrics.alerts} alertas ativos`}>
                                    <Box sx={{ color: 'error.main', display: 'flex' }}>
                                        <AlertTriangle size={16} fill={alpha(theme.palette.error.main, 0.2)} />
                                    </Box>
                                </Tooltip>
                            )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Layers size={12} /> {client.metrics.projects} Projetos
                        </Typography>
                    </Box>
                    <ChevronRight
                        className="expand-arrow"
                        size={20}
                        style={{
                            transition: 'all 0.3s ease',
                            transform: selected ? 'rotate(90deg)' : 'none',
                            color: theme.palette.text.disabled
                        }}
                    />
                </Box>

                <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.05), border: `1px solid ${alpha(theme.palette.info.main, 0.1)}` }}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <HardDrive size={14} color={theme.palette.info.main} />
                            <Typography variant="caption" fontWeight={600} color="info.main">Dispositivos</Typography>
                        </Box>
                        <Typography variant="h5" fontWeight={700}>{client.metrics.devices}</Typography>
                    </Box>

                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.1)}` }}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Activity size={14} color={theme.palette.success.main} />
                            <Typography variant="caption" fontWeight={600} color="success.main">Online</Typography>
                        </Box>
                        <Typography variant="h5" fontWeight={700}>{client.metrics.onlineUsers}</Typography>
                    </Box>
                </Box>

                {/* Micro-progress indicator for health */}
                <Box sx={{ mt: 2.5 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>Status Geral</Typography>
                        <Typography variant="caption" fontWeight={700} color={client.metrics.alerts > 5 ? 'error.main' : 'success.main'}>
                            {client.metrics.alerts > 5 ? 'Crítico' : 'Saudável'}
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={100 - (Math.min(client.metrics.alerts * 10, 100))}
                        sx={{
                            height: 4,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.divider, 0.1),
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 2,
                                bgcolor: client.metrics.alerts > 5 ? 'error.main' : 'success.main',
                            }
                        }}
                    />
                </Box>
            </CardContent>
        </Card>
    )
}
