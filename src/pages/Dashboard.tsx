import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  CardActionArea,
} from '@mui/material'
import { supabase } from '../lib/supabase'
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend } from 'chart.js'
import {
  Devices as DevicesIcon,
  NetworkCheck as NetworkIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Router as RouterIcon,
  CameraAlt as CameraIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../hooks/useApp'
import { fetchDevices } from '../store/slices/devicesSlice'
import { fetchVLANs } from '../store/slices/vlansSlice'
import { fetchAlerts } from '../store/slices/alertsSlice'
import { fetchDeviceCounts } from '../store/slices/metricsSlice'

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  color: 'primary' | 'secondary' | 'error' | 'warning'
  subtitle?: string
  link?: string
  onClick?: () => void
}

const gradientConfigs = {
  primary: {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    shadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
    glowColor: 'rgba(99, 102, 241, 0.15)',
  },
  secondary: {
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    shadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
    glowColor: 'rgba(16, 185, 129, 0.15)',
  },
  error: {
    gradient: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
    shadow: '0 4px 14px rgba(239, 68, 68, 0.25)',
    glowColor: 'rgba(239, 68, 68, 0.15)',
  },
  warning: {
    gradient: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)',
    shadow: '0 4px 14px rgba(245, 158, 11, 0.25)',
    glowColor: 'rgba(245, 158, 11, 0.15)',
  },
}

function StatCard({ title, value, icon, color, subtitle, link, onClick }: StatCardProps) {
  const navigate = useNavigate()
  const config = gradientConfigs[color]

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (link) {
      navigate(link)
    }
  }

  const isClickable = !!(link || onClick)

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(22, 33, 62, 0.6)'
            : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        border: (theme) =>
          `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        transition: 'all 0.3s ease',
        cursor: isClickable ? 'pointer' : 'default',
        '&:hover': {
          transform: isClickable ? 'translateY(-4px)' : 'none',
          boxShadow: config.shadow,
          borderColor: (theme) => theme.palette[color].main,
          '& .stat-icon-box': {
            transform: 'scale(1.05)',
          },
          '& .stat-glow': {
            opacity: 1,
          },
          '& .stat-arrow': {
            opacity: 1,
            transform: 'translateX(0)',
          },
        },
      }}
      onClick={isClickable ? handleClick : undefined}
    >
      {/* Gradient glow effect on hover */}
      <Box
        className="stat-glow"
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 120,
          height: 120,
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        }}
      />
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{
                fontWeight: 500,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                mb: 1,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                background: config.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Typography
                  color="text.secondary"
                  variant="caption"
                >
                  {subtitle}
                </Typography>
                {isClickable && (
                  <ArrowForwardIcon
                    className="stat-arrow"
                    sx={{
                      fontSize: 14,
                      color: 'text.secondary',
                      opacity: 0,
                      transform: 'translateX(-4px)',
                      transition: 'all 0.3s ease',
                    }}
                  />
                )}
              </Box>
            )}
          </Box>
          <Box
            className="stat-icon-box"
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: config.gradient,
              boxShadow: config.shadow,
              transition: 'transform 0.3s ease',
              '& .MuiSvgIcon-root': {
                color: 'white',
                fontSize: 28,
              },
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const dispatch = useAppDispatch()
  const { devices, loading: devicesLoading } = useAppSelector((state) => state.devices)
  const { vlans, loading: vlansLoading } = useAppSelector((state) => state.vlans)
  const { alerts, criticalCount, unreadCount } = useAppSelector((state) => state.alerts)
  const { networkStats, loading: statsLoading } = useAppSelector((state) => state.metrics)
  const [segmentByVLAN, setSegmentByVLAN] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    dispatch(fetchDevices(undefined))
    dispatch(fetchVLANs())
    dispatch(fetchAlerts(undefined))
    dispatch(fetchDeviceCounts())
  }, [dispatch])

  useEffect(() => {
    const channel = supabase
      .channel('network_devices_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'network_devices' }, payload => {
        dispatch(fetchDeviceCounts())
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch])

  useEffect(() => {
    Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend)
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    const labels = Array.from({ length: 12 }).map((_, i) => `${i + 1}`)
    const inData = Array.from({ length: 12 }).map(() => Math.floor(Math.random() * 100))
    const outData = Array.from({ length: 12 }).map(() => Math.floor(Math.random() * 100))
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Entrada de Rede (Mbps)', data: inData, borderColor: '#1e3a8a', backgroundColor: 'rgba(30,58,138,0.2)' },
          { label: 'Saída de Rede (Mbps)', data: outData, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.2)' },
        ],
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
    })
    return () => { chart.destroy() }
  }, [networkStats])

  // Calculate statistics
  const activeDevices = devices.filter(d => d.status === 'active').length
  const inactiveDevices = devices.filter(d => d.status === 'inactive').length
  const maintenanceDevices = devices.filter(d => d.status === 'maintenance').length
  const errorDevices = devices.filter(d => d.status === 'error').length

  const cameras = devices.filter(d => d.device_type === 'camera')
  const switches = devices.filter(d => d.device_type === 'switch')
  const routers = devices.filter(d => d.device_type === 'router')

  const recentAlerts = alerts.slice(0, 5)

  if (devicesLoading || vlansLoading || statsLoading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
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
          Dashboard Principal
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitoramento em tempo real do seu projeto
        </Typography>
      </Box>

      <Box display="flex" alignItems="center" gap={2} sx={{ mb: 3 }}>
        <Chip
          label={segmentByVLAN ? 'Visualização por VLAN' : 'Visualização geral'}
          color={segmentByVLAN ? 'primary' : 'default'}
          onClick={() => setSegmentByVLAN(v => !v)}
          sx={{
            fontWeight: 600,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'scale(1.02)',
            },
          }}
        />
      </Box>

      {/* Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total de Dispositivos"
            value={devices.length}
            icon={<DevicesIcon sx={{ fontSize: 40 }} />}
            color="primary"
            subtitle={`${activeDevices} ativos`}
            link="/devices"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="VLANs"
            value={vlans.length}
            icon={<NetworkIcon sx={{ fontSize: 40 }} />}
            color="secondary"
            subtitle="Gerenciar VLANs"
            link="/vlans"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Alertas Críticos"
            value={criticalCount}
            icon={<WarningIcon sx={{ fontSize: 40 }} />}
            color="error"
            subtitle={`${unreadCount} não lidos`}
            link="/alerts"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Dispositivos Ativos"
            value={`${devices.length > 0 ? Math.round((activeDevices / devices.length) * 100) : 0}%`}
            icon={<CheckCircleIcon sx={{ fontSize: 40 }} />}
            color="secondary"
            subtitle={`${activeDevices} de ${devices.length}`}
            link="/devices?status=active"
          />
        </Grid>
      </Grid>

      {/* Device Status Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              height: '100%',
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
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
                  <DevicesIcon sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Typography variant="h6" fontWeight={600}>
                  Status dos Dispositivos
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Active devices */}
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }} />
                      <Typography variant="body2">Ativos</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600} color="success.main">{activeDevices}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={devices.length > 0 ? (activeDevices / devices.length) * 100 : 0}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                        borderRadius: 3,
                      }
                    }}
                  />
                </Box>

                {/* Inactive devices */}
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)' }} />
                      <Typography variant="body2">Inativos</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">{inactiveDevices}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={devices.length > 0 ? (inactiveDevices / devices.length) * 100 : 0}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(107, 114, 128, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
                        borderRadius: 3,
                      }
                    }}
                  />
                </Box>

                {/* Maintenance devices */}
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)' }} />
                      <Typography variant="body2">Manutenção</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600} color="warning.main">{maintenanceDevices}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={devices.length > 0 ? (maintenanceDevices / devices.length) * 100 : 0}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)',
                        borderRadius: 3,
                      }
                    }}
                  />
                </Box>

                {/* Error devices */}
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' }} />
                      <Typography variant="body2">Erro</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600} color="error.main">{errorDevices}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={devices.length > 0 ? (errorDevices / devices.length) * 100 : 0}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                        borderRadius: 3,
                      }
                    }}
                  />
                </Box>
              </Box>

              {segmentByVLAN && (
                <Box sx={{ mt: 3, pt: 2, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Por VLAN
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    {vlans.map(v => (
                      <Box key={v.vlan_id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Chip
                          label={`VLAN ${v.vlan_id}`}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                          }}
                        />
                        <Typography variant="body2" fontWeight={600}>{devices.filter(d => d.vlan_id === v.vlan_id).length}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              height: '100%',
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <NetworkIcon sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Typography variant="h6" fontWeight={600}>
                  Tráfego de Rede
                </Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <canvas ref={canvasRef} height={220} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Alerts */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)',
                  }}
                >
                  <WarningIcon sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Typography variant="h6" fontWeight={600}>
                  Alertas Recentes
                </Typography>
              </Box>
              {recentAlerts.length === 0 ? (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 4,
                    background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderRadius: 2,
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    Nenhum alerta recente
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Todos os sistemas estão funcionando normalmente
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recentAlerts.map((alert) => {
                    const severityConfig: Record<string, { gradient: string; bgColor: string }> = {
                      critical: {
                        gradient: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                        bgColor: 'rgba(239, 68, 68, 0.08)',
                      },
                      warning: {
                        gradient: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)',
                        bgColor: 'rgba(245, 158, 11, 0.08)',
                      },
                      info: {
                        gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
                        bgColor: 'rgba(33, 147, 176, 0.08)',
                      },
                    }
                    const config = severityConfig[alert.severity] || severityConfig.info

                    return (
                      <Box
                        key={alert.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.03)'
                            : config.bgColor,
                          border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateX(4px)',
                            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                          },
                        }}
                      >
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <Typography variant="subtitle2" fontWeight={600}>{alert.title}</Typography>
                          <Chip
                            label={alert.severity === 'critical' ? 'Crítico' : alert.severity === 'warning' ? 'Aviso' : 'Info'}
                            size="small"
                            sx={{
                              background: config.gradient,
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {alert.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          {new Date(alert.created_at).toLocaleString('pt-BR')}
                        </Typography>
                      </Box>
                    )
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
