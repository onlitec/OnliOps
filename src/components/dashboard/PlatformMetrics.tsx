import { Card, CardContent, Typography, Box, alpha, useTheme } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Users, Folder, HardDrive, AlertTriangle, Clock, ChevronRight } from 'lucide-react'

interface PlatformMetricsProps {
    data: {
        totalClients: number
        totalProjects: number
        totalDevices: number
        activeAlerts: number
        uptime: string
    }
}

export default function PlatformMetrics({ data }: PlatformMetricsProps) {
    const theme = useTheme()
    const navigate = useNavigate()

    const metrics = [
        {
            label: 'Clientes',
            value: data.totalClients,
            icon: Users,
            color: '#3b82f6',
            link: '/clients',
        },
        {
            label: 'Projetos',
            value: data.totalProjects,
            icon: Folder,
            color: '#22c55e',
            link: '/settings/projects',
        },
        {
            label: 'Dispositivos',
            value: data.totalDevices,
            icon: HardDrive,
            color: '#f97316',
            link: '/devices/all',
        },
        {
            label: 'Alertas',
            value: data.activeAlerts,
            icon: AlertTriangle,
            color: data.activeAlerts > 0 ? '#ef4444' : '#6b7280',
            link: '/dashboard',
        },
        {
            label: 'Uptime',
            value: data.uptime,
            icon: Clock,
            color: '#06b6d4',
            link: null, // No link for uptime
        },
    ]

    return (
        <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
            gap: 1
        }}>
            {metrics.map((metric) => {
                const Icon = metric.icon
                const isClickable = !!metric.link
                return (
                    <Card
                        key={metric.label}
                        onClick={isClickable ? () => navigate(metric.link!) : undefined}
                        sx={{
                            bgcolor: alpha(metric.color, 0.08),
                            border: `1px solid ${alpha(metric.color, 0.2)}`,
                            cursor: isClickable ? 'pointer' : 'default',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: alpha(metric.color, 0.4),
                                transform: isClickable ? 'translateY(-2px)' : 'none',
                                boxShadow: isClickable ? `0 4px 12px ${alpha(metric.color, 0.2)}` : 'none',
                                '& .metric-arrow': {
                                    opacity: 1,
                                    transform: 'translateX(0)',
                                },
                            }
                        }}
                    >
                        <CardContent sx={{ py: 1.5, px: 2 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Icon size={14} color={metric.color} />
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: 'text.secondary',
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            fontSize: '0.65rem'
                                        }}
                                    >
                                        {metric.label}
                                    </Typography>
                                </Box>
                                {isClickable && (
                                    <ChevronRight
                                        className="metric-arrow"
                                        size={14}
                                        color={metric.color}
                                        style={{
                                            opacity: 0,
                                            transform: 'translateX(-4px)',
                                            transition: 'all 0.2s ease',
                                        }}
                                    />
                                )}
                            </Box>
                            <Typography
                                variant="h5"
                                fontWeight={600}
                                sx={{ color: metric.color }}
                            >
                                {metric.value}
                            </Typography>
                        </CardContent>
                    </Card>
                )
            })}
        </Box>
    )
}
