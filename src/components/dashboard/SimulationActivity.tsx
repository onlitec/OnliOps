import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { AppDispatch } from '../../store'
import {
  fetchSimulationRuns,
  fetchSimulations,
  selectAllSimulations,
  selectSimulationRuns,
  selectSimulationsLoading
} from '../../store/slices/simulationsSlice'
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  Avatar,
  IconButton,
  LinearProgress,
  Alert
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Science as SimulationIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'

interface SimulationActivityProps {
  maxItems?: number
  showControls?: boolean
}

const SimulationActivity: React.FC<SimulationActivityProps> = ({
  maxItems = 10,
  showControls = true
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const simulations = useSelector(selectAllSimulations)
  const simulationRuns = useSelector(selectSimulationRuns)
  const loading = useSelector(selectSimulationsLoading)

  useEffect(() => {
    dispatch(fetchSimulations(undefined))
  }, [dispatch])

  useEffect(() => {
    if (simulations && simulations.length > 0) {
      simulations.forEach(sim => dispatch(fetchSimulationRuns(sim.id)))
      const interval = setInterval(() => {
        simulations.forEach(sim => dispatch(fetchSimulationRuns(sim.id)))
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [dispatch, simulations])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'running': return 'primary'
      case 'failed': return 'error'
      case 'pending': return 'warning'
      case 'cancelled': return 'default'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <SuccessIcon color="success" />
      case 'running': return <PlayIcon color="primary" />
      case 'failed': return <ErrorIcon color="error" />
      case 'pending': return <ScheduleIcon color="warning" />
      case 'cancelled': return <StopIcon color="disabled" />
      default: return <ScheduleIcon />
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'primary'
    if (progress >= 50) return 'warning'
    return 'inherit'
  }

  const recentRuns = (simulationRuns || [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, maxItems)

  const runningRuns = (simulationRuns || []).filter(run => run.status === 'running')
  const completedToday = (simulationRuns || []).filter(run => {
    const today = new Date()
    const runDate = new Date(run.created_at)
    return run.status === 'completed' &&
      runDate.toDateString() === today.toDateString()
  })

  const handleRefresh = () => {
    simulations.forEach(sim => dispatch(fetchSimulationRuns(sim.id)))
  }

  const handleViewRun = (runId: string, simulationId: string) => {
    navigate(`/simulations/${simulationId}/runs/${runId}`)
  }

  const handleViewSimulation = (simulationId: string) => {
    navigate(`/simulations/${simulationId}`)
  }

  if (loading && recentRuns.length === 0) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Loading simulation activity...
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Simulation Activity
          </Typography>
          {showControls && (
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          )}
        </Box>

        {/* Quick Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip
            icon={<PlayIcon />}
            label={`${runningRuns.length} Running`}
            color="primary"
            size="small"
          />
          <Chip
            icon={<SuccessIcon />}
            label={`${completedToday.length} Completed Today`}
            color="success"
            size="small"
          />
        </Box>

        {recentRuns.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No simulation activity found. Create your first simulation to get started!
          </Alert>
        ) : (
          <List sx={{ p: 0 }}>
            {recentRuns.map((run) => {
              const simulation = simulations.find(s => s.id === run.simulation_id)
              const timeAgo = formatDistanceToNow(new Date(run.created_at), { addSuffix: true })

              return (
                <ListItem
                  key={run.id}
                  divider
                  disablePadding
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleViewRun(run.id, run.simulation_id)}
                      title="View Run Details"
                    >
                      <ViewIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton onClick={() => handleViewSimulation(run.simulation_id)}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        <SimulationIcon fontSize="small" />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {simulation?.name || 'Unknown Simulation'}
                          </Typography>
                          <Chip
                            label={run.status}
                            size="small"
                            color={getStatusColor(run.status) as any}
                            icon={getStatusIcon(run.status)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {timeAgo}
                          </Typography>
                          {run.status === 'running' && run.progress !== undefined && (
                            <Box sx={{ mt: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Progress
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {run.progress}%
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={run.progress}
                                sx={{ height: 4, borderRadius: 2 }}
                                color={getProgressColor(run.progress) as any}
                              />
                            </Box>
                          )}
                          {run.duration_seconds && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                              Duration: {Math.round(run.duration_seconds)}s
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>
        )}

        {showControls && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => navigate('/simulations')}
            >
              View All Activity
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default SimulationActivity
