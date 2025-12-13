import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { AppDispatch } from '../../store'
import { fetchSystemMetrics, selectSystemMetrics, selectAnalyticsLoading } from '../../store/slices/analyticsSlice'
import { Card, CardContent, Typography, Box, LinearProgress, Alert, Chip } from '@mui/material'
import { Speed as SpeedIcon, Memory as MemoryIcon, Storage as StorageIcon, NetworkCheck as NetworkIcon, CheckCircle as SuccessIcon, Warning as WarningIcon, Error as ErrorIcon } from '@mui/icons-material'
import type { ChartOptions } from 'chart.js'
const LineChart = React.lazy(() => import('../charts/RealLineChart'))

interface SystemMonitorProps { compact?: boolean }

const SystemMonitor: React.FC<SystemMonitorProps> = ({ compact = false }) => {
  const dispatch = useDispatch<AppDispatch>()
  const systemMetrics = useSelector(selectSystemMetrics)
  const loading = useSelector(selectAnalyticsLoading)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    dispatch(fetchSystemMetrics('realtime'))
    const interval = setInterval(() => { dispatch(fetchSystemMetrics('realtime')) }, 15000)
    setRefreshInterval(interval)
    return () => { if (refreshInterval) clearInterval(refreshInterval) }
  }, [dispatch])

  const getHealthStatus = (m: any) => { const v = m?.current_value || 0; const t = m?.threshold || 80; return v >= t * 0.9 ? 'critical' : v >= t * 0.7 ? 'warning' : 'healthy' }
  const getHealthColor = (s: string) => (s === 'critical' ? 'error' : s === 'warning' ? 'warning' : 'success')
  const getHealthIcon = (s: string) => s === 'critical' ? <ErrorIcon color="error"/> : s === 'warning' ? <WarningIcon color="secondary"/> : <SuccessIcon color="primary"/>

  const performanceData = {
    labels: systemMetrics?.cpu_usage?.timestamps?.slice(-12) || ['00:00','04:00','08:00','12:00','16:00','20:00'],
    datasets: [
      { label: 'Uso de CPU (%)', data: systemMetrics?.cpu_usage?.values?.slice(-12) || [45,52,48,65,58,42], borderColor: '#2196f3', backgroundColor: 'rgba(33,150,243,0.1)', tension: 0.4, fill: true },
      { label: 'Uso de Memória (%)', data: systemMetrics?.memory_usage?.values?.slice(-12) || [62,68,65,72,69,58], borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.1)', tension: 0.4, fill: true }
    ]
  }
  const chartOptions: ChartOptions<'line'> = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'top' } }, scales:{ y:{ beginAtZero:true, max:100 } }, elements:{ point:{ radius:2 }, line:{ borderWidth:2 } } }

  if (loading && !systemMetrics) {
    return (
      <Box sx={{ width:'100%', p:2 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt:1, textAlign:'center' }}>Loading system metrics...</Typography>
      </Box>
    )
  }

  if (compact) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight:'bold' }}>System Health</Typography>
          <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr 1fr', sm:'1fr 1fr' }, gap:2 }}>
            <Box sx={{ textAlign:'center' }}>
              <SpeedIcon color="primary" />
              <Typography variant="caption" display="block">CPU: {systemMetrics?.cpu_usage?.current_value || 65}%</Typography>
              <Chip size="small" label={getHealthStatus(systemMetrics?.cpu_usage)} color={getHealthColor(getHealthStatus(systemMetrics?.cpu_usage)) as any} />
            </Box>
            <Box sx={{ textAlign:'center' }}>
              <MemoryIcon color="primary" />
              <Typography variant="caption" display="block">RAM: {systemMetrics?.memory_usage?.current_value || 72}%</Typography>
              <Chip size="small" label={getHealthStatus(systemMetrics?.memory_usage)} color={getHealthColor(getHealthStatus(systemMetrics?.memory_usage)) as any} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box sx={{ width:'100%' }}>
      <Card sx={{ mb:3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight:'bold' }}>Real-time System Performance</Typography>
          <Box sx={{ height:250 }}>
            <React.Suspense fallback={<LinearProgress />}>
              <LineChart data={performanceData} options={chartOptions} />
            </React.Suspense>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display:'flex', flexDirection:'column', gap:3 }}>
        {[{label:'Uso de CPU', icon:<SpeedIcon color="primary"/>, metric:systemMetrics?.cpu_usage, extra: <><Typography variant="caption" color="text.secondary">Média: {systemMetrics?.cpu_usage?.average || 58}%</Typography><Typography variant="caption" color="text.secondary">Pico: {systemMetrics?.cpu_usage?.peak || 82}%</Typography></>},
          {label:'Uso de Memória', icon:<MemoryIcon color="primary"/>, metric:systemMetrics?.memory_usage, extra:<><Typography variant="caption" color="text.secondary">Usado: {systemMetrics?.memory_usage?.used_gb || 11.5} GB</Typography><Typography variant="caption" color="text.secondary">Total: {systemMetrics?.memory_usage?.total_gb || 16} GB</Typography></>},
          {label:'Uso de Armazenamento', icon:<StorageIcon color="primary"/>, metric:systemMetrics?.storage_usage, extra:<><Typography variant="caption" color="text.secondary">Usado: {systemMetrics?.storage_usage?.used_gb || 225} GB</Typography><Typography variant="caption" color="text.secondary">Total: {systemMetrics?.storage_usage?.total_gb || 500} GB</Typography></>}].map((row, idx)=> (
          <Card key={idx}>
            <CardContent>
              <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:2 }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>{row.icon}<Typography variant="h6" sx={{ fontWeight:'bold' }}>{row.label}</Typography></Box>
                {getHealthIcon(getHealthStatus(row.metric))}
              </Box>
              <Box sx={{ mb:2 }}>
                <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1 }}>
                  <Typography variant="body2" color="text.secondary">Current</Typography>
                  <Typography variant="body2" color="text.secondary">{row.metric?.current_value || 50}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={row.metric?.current_value || 50} sx={{ height:8, borderRadius:4 }} color={getHealthColor(getHealthStatus(row.metric)) as any} />
              </Box>
              <Box sx={{ display:'flex', justifyContent:'space-between' }}>{row.extra}</Box>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardContent>
            <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:2 }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <NetworkIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight:'bold' }}>Network Status</Typography>
              </Box>
              {getHealthIcon(getHealthStatus(systemMetrics?.network_status))}
            </Box>
            <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
              <Box><Typography variant="body2" color="text.secondary" gutterBottom>Latency</Typography><Typography variant="h6" component="div">{systemMetrics?.network_status?.latency_ms || 12} ms</Typography></Box>
              <Box><Typography variant="body2" color="text.secondary" gutterBottom>Throughput</Typography><Typography variant="h6" component="div">{systemMetrics?.network_status?.throughput_mbps || 125} Mbps</Typography></Box>
              <Box><Typography variant="body2" color="text.secondary" gutterBottom>Packet Loss</Typography><Typography variant="h6" component="div">{systemMetrics?.network_status?.packet_loss_percent || 0.1}%</Typography></Box>
              <Box><Typography variant="body2" color="text.secondary" gutterBottom>Connections</Typography><Typography variant="h6" component="div">{systemMetrics?.network_status?.active_connections || 24}</Typography></Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:2 }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <StorageIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight:'bold' }}>Database Status</Typography>
              </Box>
              {getHealthIcon(getHealthStatus(systemMetrics?.database_status))}
            </Box>
            <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
              <Box><Typography variant="body2" color="text.secondary" gutterBottom>Connections</Typography><Typography variant="h6" component="div">{systemMetrics?.database_status?.active_connections || 8}</Typography></Box>
              <Box><Typography variant="body2" color="text.secondary" gutterBottom>Query Time</Typography><Typography variant="h6" component="div">{systemMetrics?.database_status?.avg_query_time_ms || 45} ms</Typography></Box>
              <Box><Typography variant="body2" color="text.secondary" gutterBottom>Cache Hit Rate</Typography><Typography variant="h6" component="div">{systemMetrics?.database_status?.cache_hit_rate_percent || 94}%</Typography></Box>
              <Box><Typography variant="body2" color="text.secondary" gutterBottom>Replication Lag</Typography><Typography variant="h6" component="div">{systemMetrics?.database_status?.replication_lag_ms || 0} ms</Typography></Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight:'bold' }}>System Alerts</Typography>
            {systemMetrics?.alerts?.length > 0 ? (
              <Box sx={{ display:'flex', flexDirection:'column', gap:1 }}>
                {systemMetrics.alerts.map((alert, i) => (
                  <Alert key={i} severity={alert.severity as any} sx={{ '& .MuiAlert-message': { width:'100%' } }}>
                    <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <Typography variant="body2">{alert.message}</Typography>
                      <Typography variant="caption" color="text.secondary">{new Date(alert.timestamp).toLocaleTimeString()}</Typography>
                    </Box>
                  </Alert>
                ))}
              </Box>
            ) : (
              <Alert severity="success">All systems operational. No alerts at this time.</Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default SystemMonitor
