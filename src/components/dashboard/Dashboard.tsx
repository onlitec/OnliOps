import React, { useEffect, useState } from 'react'
import {
  Typography,
  Box,
  CircularProgress,
  alpha,
  useTheme,
  Tabs,
  Tab,
  Paper,
  Grid,
  Divider
} from '@mui/material'
import {
  CameraAlt,
  Dvr,
  Router,
  Storage,
  Computer,
  Wifi,
  Face,
  DevicesOther,
  Dashboard as DashboardIcon
} from '@mui/icons-material'
import { api } from '../../services/api'
import { NetworkDevice } from '../../lib/supabase'
import DeviceList from '../../pages/DeviceList'
import { useAppSelector } from '../../hooks/useApp'
import {
  Info as InfoIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Language as LanguageIcon
} from '@mui/icons-material'

const iconMap: any = {
  CameraAlt: <CameraAlt sx={{ fontSize: 18 }} />,
  Dvr: <Dvr sx={{ fontSize: 18 }} />,
  Router: <Router sx={{ fontSize: 18 }} />,
  Storage: <Storage sx={{ fontSize: 18 }} />,
  Computer: <Computer sx={{ fontSize: 18 }} />,
  Wifi: <Wifi sx={{ fontSize: 18 }} />,
  Face: <Face sx={{ fontSize: 18 }} />,
  DevicesOther: <DevicesOther sx={{ fontSize: 18 }} />
}

export default function Dashboard() {
  const theme = useTheme()
  const { currentProject, currentClient } = useAppSelector((state) => state.project)
  const [devices, setDevices] = useState<NetworkDevice[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('all')
  const [hasIntegration, setHasIntegration] = useState(false)

  useEffect(() => {
    if (currentProject) {
      loadData()
    }
  }, [currentProject?.id])

  const loadData = async () => {
    try {
      const [devs, cats] = await Promise.all([
        api.getDevices(),
        api.getCategories()
      ])
      setDevices(devs || [])
      setCategories(cats || [])

      // Check for integration
      if (currentProject) {
        try {
          const config = await api.getIntegrationConfig(currentProject.id, 'hikcentral')
          setHasIntegration(!!config)
        } catch (e) {
          setHasIntegration(false)
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue)
  }

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={8}>
        <CircularProgress size={32} thickness={5} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontWeight: 600 }}>
          Sincronizando dispositivos...
        </Typography>
      </Box>
    )
  }

  // Define tabs: Start with "Todos", then categories
  const tabs = [
    { label: 'Visão Geral', value: 'all', icon: <DevicesOther /> },
    ...categories.map(cat => ({
      label: cat.name,
      value: cat.slug,
      icon: iconMap[cat.icon] || <DevicesOther />
    }))
  ]

  return (
    <Box>
      {/* Project Identity & Hero Section */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Box sx={{
            width: 48,
            height: 48,
            bgcolor: 'primary.main',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(230, 0, 18, 0.2)'
          }}>
            <DashboardIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.5px' }}>
              {currentProject?.name || 'Visão Geral do Projeto'}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {currentClient?.name} • ID: {currentProject?.id.slice(0, 8).toUpperCase()}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ mt: 2 }} />
      </Box>

      {/* Premium Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'TOTAL DISPOSITIVOS', value: devices.length, color: theme.palette.text.primary, icon: <DevicesOther /> },
          { label: 'DISPOSITIVOS ONLINE', value: devices.filter(d => d.status === 'active').length, color: theme.palette.success.main, icon: <CheckCircleIcon /> },
          { label: 'INTEGRAÇÕES', value: hasIntegration ? 1 : 0, color: '#6366f1', icon: <LanguageIcon /> },
          { label: 'ALERTAS RECENTES', value: 0, color: theme.palette.warning.main, icon: <WarningIcon /> }
        ].map((metric, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <Paper sx={{
              p: 3,
              borderRadius: 1.5,
              border: '2px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: metric.color,
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4]
              }
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ color: 'text.secondary' }}>{metric.icon}</Box>
                <Typography variant="h3" fontWeight={900} sx={{ color: metric.color }}>
                  {metric.value}
                </Typography>
              </Box>
              <Typography variant="caption" fontWeight={800} sx={{ color: 'text.secondary', letterSpacing: '1px' }}>
                {metric.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Tabs Navigation */}
      <Paper sx={{ mb: 3, borderRadius: 1.5, border: '2px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 800,
              minHeight: 64,
              fontSize: '0.9rem',
              px: 4,
              gap: 1.5,
              '&.Mui-selected': {
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.03),
              }
            },
            '& .MuiTabs-indicator': {
              height: 4,
              borderRadius: '4px 4px 0 0'
            }
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              label={tab.label}
              value={tab.value}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>

        <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            Mostrando <strong style={{ color: theme.palette.text.primary }}>
              {selectedTab === 'all' ? devices.length : devices.filter(d => d.device_type === selectedTab).length}
            </strong> dispositivos na categoria <strong>{tabs.find(t => t.value === selectedTab)?.label}</strong>
          </Typography>
        </Box>
      </Paper>

      {/* Device List with filtered context */}
      <Box mt={4}>
        <DeviceList categoryOverride={selectedTab} />
      </Box>
    </Box>
  )
}
