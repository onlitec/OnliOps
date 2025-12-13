import { Card, CardContent, Typography, Box, alpha, useTheme } from '@mui/material'
import { Users, Folder, HardDrive, AlertTriangle, Clock } from 'lucide-react'

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

    const metrics = [
        {
            label: 'Clientes',
            value: data.totalClients,
            icon: Users,
            color: '#3b82f6',
        },
        {
            label: 'Projetos',
            value: data.totalProjects,
            icon: Folder,
            color: '#22c55e',
        },
        {
            label: 'Dispositivos',
            value: data.totalDevices,
            icon: HardDrive,
            color: '#f97316',
        },
        {
            label: 'Alertas',
            value: data.activeAlerts,
            icon: AlertTriangle,
            color: data.activeAlerts > 0 ? '#ef4444' : '#6b7280',
        },
        {
            label: 'Uptime',
            value: data.uptime,
            icon: Clock,
            color: '#06b6d4',
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
                return (
                    <Card
                        key={metric.label}
                        sx={{
                            bgcolor: alpha(metric.color, 0.08),
                            border: `1px solid ${alpha(metric.color, 0.2)}`,
                            '&:hover': { borderColor: alpha(metric.color, 0.4) }
                        }}
                    >
                        <CardContent sx={{ py: 1.5, px: 2 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
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
