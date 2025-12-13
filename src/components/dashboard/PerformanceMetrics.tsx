import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { AppDispatch } from '../../store'
import {
  fetchSystemMetrics,
  selectSystemMetrics,
  selectAnalyticsLoading
} from '../../store/slices/analyticsSlice'
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  Alert
} from '@mui/material'
//
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Refresh as RefreshIcon,
  Assessment as MetricsIcon
} from '@mui/icons-material'
import type { ChartOptions } from 'chart.js'
const LineChart = React.lazy(() => import('../charts/RealLineChart'))
const BarChart = React.lazy(() => import('../charts/RealBarChart'))

interface PerformanceMetricsProps {
  compact?: boolean
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ compact = false }) => {
  const dispatch = useDispatch<AppDispatch>()
  const systemMetrics = useSelector(selectSystemMetrics)
  const loading = useSelector(selectAnalyticsLoading)

  useEffect(() => {
    dispatch(fetchSystemMetrics('24h'))

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchSystemMetrics('24h'))
    }, 30000)

    return () => clearInterval(interval)
  }, [dispatch])

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUpIcon color="error" />
    if (current < previous) return <TrendingDownIcon color="primary" />
    return null
  }

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'error'
    if (current < previous) return 'success'
    return 'default'
  }

  // Prepare performance trend data
  const performanceTrendData = React.useMemo(() => ({
    labels: systemMetrics?.performance_history?.timestamps?.slice(-24) ||
      Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Uso de CPU (%)',
        data: systemMetrics?.performance_history?.cpu_usage?.slice(-24) ||
          Array.from({ length: 24 }, () => Math.random() * 40 + 40),
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Uso de Memória (%)',
        data: systemMetrics?.performance_history?.memory_usage?.slice(-24) ||
          Array.from({ length: 24 }, () => Math.random() * 30 + 60),
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Tempo de Resposta (ms)',
        data: systemMetrics?.performance_history?.response_time?.slice(-24) ||
          Array.from({ length: 24 }, () => Math.random() * 100 + 50),
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  }), [systemMetrics])

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'System Performance Trends (24 Hours)',
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Usage (%)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Response Time (ms)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  // Resource utilization data
  const resourceUtilizationData = React.useMemo(() => ({
    labels: ['CPU', 'Memory', 'Storage', 'Network'],
    datasets: [
      {
        label: 'Uso Atual',
        data: [
          systemMetrics?.cpu_usage?.current_value || 65,
          systemMetrics?.memory_usage?.current_value || 72,
          systemMetrics?.storage_usage?.current_value || 45,
          systemMetrics?.network_usage?.current_value || 38,
        ],
        backgroundColor: [
          'rgba(33, 150, 243, 0.8)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(255, 152, 0, 0.8)',
          'rgba(156, 39, 176, 0.8)',
        ],
        borderColor: [
          '#2196f3',
          '#4caf50',
          '#ff9800',
          '#9c27b0',
        ],
        borderWidth: 1,
      },
      {
        label: 'Uso Médio',
        data: [
          systemMetrics?.cpu_usage?.average || 58,
          systemMetrics?.memory_usage?.average || 68,
          systemMetrics?.storage_usage?.average || 42,
          systemMetrics?.network_usage?.average || 35,
        ],
        backgroundColor: [
          'rgba(33, 150, 243, 0.4)',
          'rgba(76, 175, 80, 0.4)',
          'rgba(255, 152, 0, 0.4)',
          'rgba(156, 39, 176, 0.4)',
        ],
        borderColor: [
          '#2196f3',
          '#4caf50',
          '#ff9800',
          '#9c27b0',
        ],
        borderWidth: 1,
      },
    ],
  }), [systemMetrics])

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Resource Utilization Comparison',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Usage (%)',
        },
      },
    },
  }

  if (loading && !systemMetrics) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <LinearProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Performance Metrics
            </Typography>
            <IconButton size="small">
              <RefreshIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Box sx={{ textAlign: 'center' }}>
                <SpeedIcon color="primary" />
                <Typography variant="caption" display="block">
                  CPU: {systemMetrics?.cpu_usage?.current_value || 65}%
                </Typography>
                <Chip
                  size="small"
                  label={`${systemMetrics?.cpu_usage?.current_value || 65}%`}
                  color={(systemMetrics?.cpu_usage?.current_value > 80 ? 'error' : 'success') as any}
                />
              </Box>
            </Box>
            <Box>
              <Box sx={{ textAlign: 'center' }}>
                <MemoryIcon color="primary" />
                <Typography variant="caption" display="block">
                  RAM: {systemMetrics?.memory_usage?.current_value || 72}%
                </Typography>
                <Chip
                  size="small"
                  label={`${systemMetrics?.memory_usage?.current_value || 72}%`}
                  color={(systemMetrics?.memory_usage?.current_value > 85 ? 'error' : 'success') as any}
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Performance Trends */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Performance Trends
          </Typography>
          <Box sx={{ height: 300 }}>
            <React.Suspense fallback={<LinearProgress />}>
              <LineChart data={performanceTrendData} options={chartOptions} />
            </React.Suspense>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Resource Utilization */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Resource Utilization
              </Typography>
              <Box sx={{ height: 250 }}>
                <React.Suspense fallback={<LinearProgress />}>
                  <BarChart data={resourceUtilizationData} options={barChartOptions} />
                </React.Suspense>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Key Performance Indicators */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Key Performance Indicators
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Average Response Time
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      {systemMetrics?.response_time?.current_value || 125}ms
                    </Typography>
                    {getTrendIcon(
                      systemMetrics?.response_time?.current_value || 125,
                      systemMetrics?.response_time?.previous_value || 130
                    )}
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((systemMetrics?.response_time?.current_value || 125) / 2, 100)}
                  sx={{ height: 6, borderRadius: 3 }}
                  color={getTrendColor(
                    systemMetrics?.response_time?.current_value || 125,
                    systemMetrics?.response_time?.previous_value || 130
                  ) as any}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Throughput
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      {systemMetrics?.throughput?.current_value || 125} req/s
                    </Typography>
                    {getTrendIcon(
                      systemMetrics?.throughput?.current_value || 125,
                      systemMetrics?.throughput?.previous_value || 120
                    )}
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((systemMetrics?.throughput?.current_value || 125) / 2, 100)}
                  sx={{ height: 6, borderRadius: 3 }}
                  color={getTrendColor(
                    systemMetrics?.throughput?.current_value || 125,
                    systemMetrics?.throughput?.previous_value || 120
                  ) as any}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Error Rate
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      {systemMetrics?.error_rate?.current_value || 0.5}%
                    </Typography>
                    {getTrendIcon(
                      systemMetrics?.error_rate?.current_value || 0.5,
                      systemMetrics?.error_rate?.previous_value || 0.8
                    )}
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(systemMetrics?.error_rate?.current_value || 0.5) * 10}
                  sx={{ height: 6, borderRadius: 3 }}
                  color={getTrendColor(
                    systemMetrics?.error_rate?.current_value || 0.5,
                    systemMetrics?.error_rate?.previous_value || 0.8
                  ) as any}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Availability
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      {systemMetrics?.availability?.current_value || 99.9}%
                    </Typography>
                    {/* Availability trend not tracked; showing current value only */}
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={systemMetrics?.availability?.current_value || 99.9}
                  sx={{ height: 6, borderRadius: 3 }}
                  color="primary"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* System Health Summary */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                System Health
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SpeedIcon color="primary" />
                    <Typography variant="body2">
                      CPU Health
                    </Typography>
                  </Box>
                  <Chip
                    label={systemMetrics?.cpu_usage?.current_value > 80 ? 'Atenção' : 'Bom'}
                    size="small"
                    color={(systemMetrics?.cpu_usage?.current_value > 80 ? 'warning' : 'success') as any}
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MemoryIcon color="primary" />
                    <Typography variant="body2">
                      Memory Health
                    </Typography>
                  </Box>
                  <Chip
                    label={systemMetrics?.memory_usage?.current_value > 85 ? 'Atenção' : 'Bom'}
                    size="small"
                    color={(systemMetrics?.memory_usage?.current_value > 85 ? 'warning' : 'success') as any}
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorageIcon color="primary" />
                    <Typography variant="body2">
                      Storage Health
                    </Typography>
                  </Box>
                  <Chip
                    label={systemMetrics?.storage_usage?.current_value > 90 ? 'Crítico' : 'Bom'}
                    size="small"
                    color={(systemMetrics?.storage_usage?.current_value > 90 ? 'error' : 'success') as any}
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NetworkIcon color="primary" />
                    <Typography variant="body2">
                      Network Health
                    </Typography>
                  </Box>
                  <Chip
                    label={systemMetrics?.network_usage?.current_value > 80 ? 'Atenção' : 'Bom'}
                    size="small"
                    color={(systemMetrics?.network_usage?.current_value > 80 ? 'warning' : 'success') as any}
                  />
                </Box>
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Status Geral do Sistema
                </Typography>
                <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                  {systemMetrics?.overall_health || 'Excelente'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Performance Alerts */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Performance Alerts
              </Typography>

              {systemMetrics?.performance_alerts?.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {systemMetrics.performance_alerts.map((alert, index) => (
                    <Alert
                      key={index}
                      severity={alert.severity as any}
                      sx={{ '& .MuiAlert-message': { width: '100%' } }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">
                          {alert.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </Alert>
                  ))}
                </Box>
              ) : (
                <Alert severity="success">
                  No performance alerts. All systems operating within normal parameters.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Optimization Recommendations */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Optimization Recommendations
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {systemMetrics?.recommendations?.map((recommendation, index) => (
                  <Box key={index} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                      {recommendation.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {recommendation.description}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={recommendation.priority}
                        size="small"
                        color={(
                          recommendation.priority === 'high' ? 'error' :
                            recommendation.priority === 'medium' ? 'warning' : 'info'
                        ) as any}
                      />
                    </Box>
                  </Box>
                )) || (
                    <Alert severity="info">
                      No optimization recommendations at this time. System is performing optimally.
                    </Alert>
                  )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}

export default PerformanceMetrics
