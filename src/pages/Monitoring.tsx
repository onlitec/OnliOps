import { useEffect, useState } from 'react'
import {
  Box, Typography, Card, CardContent, Chip,
  Table, TableBody, TableCell, TableHead, TableRow, Paper,
  CircularProgress, Alert, alpha
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Activity, HardDrive, AlertTriangle, Clock, Users, Settings } from 'lucide-react'
import { api } from '../services/api'

interface PlatformMetrics {
  totalClients: number
  totalProjects: number
  totalDevices: number
  activeAlerts: number
  uptime: string
  lastUpdate: string
}

interface ProjectSummary {
  id: string
  name: string
  client: { id: string; name: string }
  status: string
  metrics: {
    devices: number
    alerts: number
    lastActivity: string | null
  }
}

export default function Monitoring() {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [metricsData, projectsData] = await Promise.all([
        api.getPlatformMetrics(),
        api.getProjectsSummary()
      ])
      setMetrics(metricsData)
      setProjects(projectsData)
    } catch (err) {
      setError('Erro ao carregar dados de monitoramento')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatLastActivity = (date: string | null) => {
    if (!date) return 'Sem atividade'
    const d = new Date(date)
    return d.toLocaleString('pt-BR')
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  // Metric cards config with navigation links
  const metricCards = [
    {
      label: 'Clientes',
      value: metrics?.totalClients || 0,
      icon: Users,
      color: '#3b82f6',
      path: '/clients'
    },
    {
      label: 'Projetos',
      value: metrics?.totalProjects || 0,
      icon: Activity,
      color: '#22c55e',
      path: '/settings/projects'
    },
    {
      label: 'Dispositivos',
      value: metrics?.totalDevices || 0,
      icon: HardDrive,
      color: '#f97316',
      path: '/' // Global dashboard
    },
    {
      label: 'Alertas',
      value: metrics?.activeAlerts || 0,
      icon: AlertTriangle,
      color: metrics?.activeAlerts && metrics.activeAlerts > 0 ? '#ef4444' : '#6b7280',
      path: '/'
    },
    {
      label: 'Uptime',
      value: metrics?.uptime || '-',
      icon: Clock,
      color: '#06b6d4',
      path: null
    },
    {
      label: 'Configurações',
      value: '',
      icon: Settings,
      color: '#8b5cf6',
      path: '/settings'
    },
  ]

  return (
    <Box sx={{ px: 2, py: 2 }}>
      {/* Header */}
      <Box mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Monitoramento da Plataforma
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Métricas gerais e status de todos os projetos
        </Typography>
      </Box>

      {/* Metric Cards - Clickable */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' },
        gap: 1,
        mb: 3
      }}>
        {metricCards.map((card) => {
          const Icon = card.icon
          const isClickable = !!card.path
          return (
            <Card
              key={card.label}
              onClick={() => card.path && navigate(card.path)}
              sx={{
                cursor: isClickable ? 'pointer' : 'default',
                bgcolor: alpha(card.color, 0.08),
                border: `1px solid ${alpha(card.color, 0.2)}`,
                transition: 'all 0.15s ease',
                '&:hover': isClickable ? {
                  borderColor: alpha(card.color, 0.5),
                  bgcolor: alpha(card.color, 0.12),
                  transform: 'translateY(-2px)'
                } : {}
              }}
            >
              <CardContent sx={{ py: 1.5, px: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Icon size={14} color={card.color} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontSize: '0.65rem'
                    }}
                  >
                    {card.label}
                  </Typography>
                </Box>
                <Typography
                  variant="h5"
                  fontWeight={600}
                  sx={{ color: card.color }}
                >
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          )
        })}
      </Box>

      {/* Projects Table */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
          Status por Projeto ({projects.length})
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Projeto</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell align="center">Dispositivos</TableCell>
              <TableCell align="center">Alertas</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Última Atividade</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Nenhum projeto cadastrado
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow
                  key={project.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/clients`)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{project.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{project.client.name}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={project.metrics.devices}
                      size="small"
                      color={project.metrics.devices > 0 ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={project.metrics.alerts}
                      size="small"
                      color={project.metrics.alerts > 0 ? 'error' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={project.status === 'active' ? 'Ativo' : project.status}
                      size="small"
                      color={project.status === 'active' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {formatLastActivity(project.metrics.lastActivity)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}