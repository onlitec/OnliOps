import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  alpha,
  useTheme
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
  CheckCircle,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { api } from '../../services/api'
import { NetworkDevice } from '../../lib/supabase'

const iconMap: any = {
  CameraAlt: <CameraAlt sx={{ fontSize: 20 }} />,
  Dvr: <Dvr sx={{ fontSize: 20 }} />,
  Router: <Router sx={{ fontSize: 20 }} />,
  Storage: <Storage sx={{ fontSize: 20 }} />,
  Computer: <Computer sx={{ fontSize: 20 }} />,
  Wifi: <Wifi sx={{ fontSize: 20 }} />,
  Face: <Face sx={{ fontSize: 20 }} />,
  DevicesOther: <DevicesOther sx={{ fontSize: 20 }} />
}

const colors = ['#3b82f6', '#22c55e', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#ef4444', '#6b7280']

export default function Dashboard() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [devices, setDevices] = useState<NetworkDevice[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [devs, cats] = await Promise.all([
        api.getDevices(),
        api.getCategories()
      ])
      setDevices(devs || [])
      setCategories(cats || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getStats = () => {
    return {
      active: devices.filter(d => d.status === 'active').length,
      offline: devices.filter(d => d.status !== 'active').length
    }
  }

  const stats = getStats()

  const cards = categories.map((cat, index) => {
    const count = devices.filter(d => d.device_type === cat.slug).length
    return {
      title: cat.name,
      count,
      icon: iconMap[cat.icon] || <DevicesOther sx={{ fontSize: 20 }} />,
      path: `/devices/${cat.slug}`,
      color: colors[index % colors.length]
    }
  })

  const categorySlugs = categories.map(c => c.slug)
  const otherCount = devices.filter(d => !categorySlugs.includes(d.device_type)).length
  if (otherCount > 0) {
    cards.push({
      title: 'Outros',
      count: otherCount,
      icon: <DevicesOther sx={{ fontSize: 20 }} />,
      path: '/devices/other',
      color: '#6b7280'
    })
  }

  if (loading) {
    return <Box display="flex" justifyContent="center" p={4}><CircularProgress size={24} /></Box>
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Dashboard Geral
        </Typography>
      </Box>

      {/* Status Summary - Grafana Single Stat Style */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: 1,
        mb: 2
      }}>
        {/* Online */}
        <Card sx={{
          bgcolor: alpha('#22c55e', 0.08),
          border: `1px solid ${alpha('#22c55e', 0.2)}`,
          '&:hover': { borderColor: alpha('#22c55e', 0.4) }
        }}>
          <CardContent sx={{ py: 1.5, px: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#22c55e',
                  boxShadow: '0 0 8px #22c55e'
                }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Online
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={600} sx={{ color: '#22c55e' }}>
              {stats.active}
            </Typography>
          </CardContent>
        </Card>

        {/* Offline */}
        <Card sx={{
          bgcolor: alpha('#ef4444', 0.08),
          border: `1px solid ${alpha('#ef4444', 0.2)}`,
          '&:hover': { borderColor: alpha('#ef4444', 0.4) }
        }}>
          <CardContent sx={{ py: 1.5, px: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#ef4444'
                }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Offline
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={600} sx={{ color: '#ef4444' }}>
              {stats.offline}
            </Typography>
          </CardContent>
        </Card>

        {/* Total */}
        <Card sx={{
          bgcolor: alpha('#3b82f6', 0.08),
          border: `1px solid ${alpha('#3b82f6', 0.2)}`,
          '&:hover': { borderColor: alpha('#3b82f6', 0.4) }
        }}>
          <CardContent sx={{ py: 1.5, px: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Total
            </Typography>
            <Typography variant="h4" fontWeight={600} sx={{ color: '#3b82f6' }}>
              {devices.length}
            </Typography>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card sx={{
          bgcolor: alpha('#8b5cf6', 0.08),
          border: `1px solid ${alpha('#8b5cf6', 0.2)}`,
          '&:hover': { borderColor: alpha('#8b5cf6', 0.4) }
        }}>
          <CardContent sx={{ py: 1.5, px: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Categorias
            </Typography>
            <Typography variant="h4" fontWeight={600} sx={{ color: '#8b5cf6' }}>
              {categories.length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Categories Section Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5} mt={3}>
        <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
          Categorias de Dispositivos
        </Typography>
      </Box>

      {/* Category Cards - Compact Grid */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)',
          lg: 'repeat(5, 1fr)'
        },
        gap: 1
      }}>
        {cards.map((card, index) => (
          <Card
            key={index}
            sx={{
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              '&:hover': {
                borderColor: alpha(card.color, 0.5),
                bgcolor: alpha(card.color, 0.04)
              }
            }}
            onClick={() => navigate(card.path)}
          >
            <CardContent sx={{ py: 1.5, px: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box
                  sx={{
                    p: 0.75,
                    borderRadius: 1,
                    bgcolor: alpha(card.color, 0.15),
                    color: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {card.icon}
                </Box>
                <Typography variant="h5" fontWeight={600}>
                  {card.count}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  mt: 1,
                  display: 'block',
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {card.title}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}
