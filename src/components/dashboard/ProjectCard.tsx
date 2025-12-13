import { Card, CardContent, Typography, Box, Chip, alpha, useTheme } from '@mui/material'
import { Folder, AlertCircle, HardDrive, ArrowRight } from 'lucide-react'

interface ProjectCardProps {
    project: {
        id: string
        name: string
        client: { name: string }
        status: string
        metrics: {
            devices: number
            alerts: number
            lastActivity: string | null
        }
    }
    onSelect: () => void
}

export default function ProjectCard({ project, onSelect }: ProjectCardProps) {
    const theme = useTheme()

    const statusColors: Record<string, string> = {
        active: '#22c55e',
        inactive: '#6b7280',
        maintenance: '#f97316'
    }

    const statusLabels: Record<string, string> = {
        active: 'Ativo',
        inactive: 'Inativo',
        maintenance: 'Manutenção'
    }

    const color = statusColors[project.status] || statusColors.inactive

    return (
        <Card
            sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                }
            }}
            onClick={onSelect}
        >
            <CardContent sx={{ p: 1.5 }}>
                {/* Header Row */}
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box
                            sx={{
                                p: 0.5,
                                borderRadius: 0.5,
                                bgcolor: alpha('#3b82f6', 0.15),
                                display: 'flex',
                            }}
                        >
                            <Folder size={14} color="#3b82f6" />
                        </Box>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 120 }}>
                            {project.name}
                        </Typography>
                    </Box>
                    <Chip
                        label={statusLabels[project.status]}
                        size="small"
                        sx={{
                            height: 18,
                            fontSize: '0.625rem',
                            bgcolor: alpha(color, 0.15),
                            color: color,
                            fontWeight: 600,
                        }}
                    />
                </Box>

                {/* Client */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {project.client.name}
                </Typography>

                {/* Metrics Row */}
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <HardDrive size={12} color={theme.palette.info.main} />
                        <Typography variant="caption" fontWeight={500}>
                            {project.metrics.devices}
                        </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <AlertCircle
                            size={12}
                            color={project.metrics.alerts > 0 ? theme.palette.error.main : theme.palette.text.secondary}
                        />
                        <Typography
                            variant="caption"
                            fontWeight={500}
                            sx={{ color: project.metrics.alerts > 0 ? 'error.main' : 'text.secondary' }}
                        >
                            {project.metrics.alerts}
                        </Typography>
                    </Box>
                </Box>

                {/* Access Link */}
                <Box
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    sx={{
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline' }
                    }}
                >
                    <Typography variant="caption" fontWeight={500}>
                        Acessar
                    </Typography>
                    <ArrowRight size={12} />
                </Box>
            </CardContent>
        </Card>
    )
}
