import {
    Typography,
    Box,
    Card,
    CardContent,
    Select,
    MenuItem,
    CircularProgress,
    FormControl,
    InputLabel,
    SelectChangeEvent
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { NetworkDevice, DeviceConnection } from '../lib/supabase'
import { api } from '../services/api'
import { useAppDispatch, useAppSelector } from '../hooks/useApp'
import { setCurrentClient, setCurrentProject, fetchClientProjects } from '../store/slices/projectSlice'

export default function Topology() {
  const dispatch = useAppDispatch()
  const { currentClient, currentProject, clients, projects } = useAppSelector((state) => state.project)

  const [devices, setDevices] = useState<NetworkDevice[]>([])
  const [connections, setConnections] = useState<DeviceConnection[]>([])
  const [vlanFilter, setVlanFilter] = useState<number | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (currentProject) {
      loadData()
    } else {
        setLoading(false)
        setDevices([])
        setConnections([])
    }
  }, [currentProject])

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId) || null
    dispatch(setCurrentClient(client))
    if (client) dispatch(fetchClientProjects(client.id))
    dispatch(setCurrentProject(null))
  }

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId) || null
    dispatch(setCurrentProject(project))
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [devs, conns] = await Promise.all([
        api.getDevices(),
        api.getConnections()
      ])
      setDevices(devs || [])
      setConnections(conns || [])
    } catch (error) {
      console.error('Error loading topology data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDevices = vlanFilter === 'all' ? devices : devices.filter(d => d.vlan_id === vlanFilter)

  // Only show connections where both devices are visible after filtering
  const filteredConnections = connections.filter(c =>
    filteredDevices.find(d => d.id === c.from_device_id) &&
    filteredDevices.find(d => d.id === c.to_device_id)
  )

  // Simple layout algorithm: Grid based on device type or VLAN?
  // Let's try to group by VLAN for Y axis, and spread by type/index for X axis
  const vlans = [...new Set(filteredDevices.map(d => d.vlan_id || 0))].sort((a, b) => a - b)

  const nodes = filteredDevices.map((d, i) => {
    const vlanIndex = vlans.indexOf(d.vlan_id || 0)
    // Devices in the same VLAN on same row
    // Calculate X based on index within that vlan
    const devicesInVlan = filteredDevices.filter(dev => (dev.vlan_id || 0) === (d.vlan_id || 0))
    const indexInVlan = devicesInVlan.indexOf(d)

    return {
      id: d.id,
      x: 100 + (indexInVlan * 150),
      y: 100 + (vlanIndex * 180),
      label: d.hostname || d.model,
      vlan: d.vlan_id,
      type: d.device_type,
      ip: d.ip_address
    }
  })

  interface Node {
    id: string;
    x: number;
    y: number;
    label: string | null;
    vlan: number | null;
    type: string;
    ip: string;
  }

  interface Edge {
    from: Node;
    to: Node;
    status: string;
  }

  const edges = filteredConnections.map(c => ({
    from: nodes.find(n => n.id === c.from_device_id),
    to: nodes.find(n => n.id === c.to_device_id),
    status: c.status,
  })).filter(e => e.from && e.to) as Edge[]

  const getDeviceColor = (type: string) => {
    switch (type) {
      case 'switch': return '#1e3a8a' // Dark Blue
      case 'router': return '#0f172a' // Slate 900
      case 'camera': return '#0ea5e9' // Sky 500
      case 'nvr': return '#10b981' // Emerald 500
      case 'server': return '#8b5cf6' // Violet 500
      default: return '#6b7280' // Gray 500
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Topologia de Rede
      </Typography>
      <Box display="flex" gap={2} sx={{ mb: 2 }}>
        <Select
          value={vlanFilter}
          onChange={(e) => setVlanFilter(e.target.value as any)}
          size="small"
          sx={{ minWidth: 200, bgcolor: 'white' }}
        >
          <MenuItem value="all">Todas as VLANs</MenuItem>
          {[...new Set(devices.map(d => d.vlan_id))].sort((a, b) => a - b).map(v => (
            <MenuItem key={v || 0} value={v}>VLAN {v}</MenuItem>
          ))}
        </Select>
      </Box>

      <Card sx={{ overflow: 'auto' }}>
        <CardContent>
          {nodes.length === 0 ? (
            <Box p={4} textAlign="center" color="gray">
              Nenhum dispositivo encontrado para exibir na topologia.
            </Box>
          ) : (
            <Box sx={{ overflow: 'auto', minHeight: 600 }}>
              <svg ref={svgRef} width={Math.max(1000, nodes.length * 50)} height={Math.max(600, vlans.length * 200)}>
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7"
                    refX="28" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
                  </marker>
                </defs>

                {/* Draw VLAN Groups/Backgrounds if needed */}

                {/* Edges */}
                {edges.map((e, i) => (
                  <g key={`e-${i}`}>
                    <line
                      x1={e.from.x} y1={e.from.y}
                      x2={e.to.x} y2={e.to.y}
                      stroke={e.status === 'active' ? '#10b981' : '#ef4444'}
                      strokeWidth={2}
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                ))}

                {/* Nodes */}
                {nodes.map((n) => (
                  <g key={n.id} style={{ cursor: 'pointer' }}>
                    <circle
                      cx={n.x} cy={n.y}
                      r={25}
                      fill={getDeviceColor(n.type)}
                      stroke="#fff"
                      strokeWidth={2}
                      filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.3))"
                    />
                    {/* Device Icon placeholder - stick to color for now */}

                    <text x={n.x} y={n.y - 35} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#374151">
                      {n.label}
                    </text>
                    <text x={n.x} y={n.y + 45} textAnchor="middle" fontSize={11} fill="#6b7280">
                      {n.ip}
                    </text>
                    <text x={n.x} y={n.y + 60} textAnchor="middle" fontSize={10} fill="#9ca3af">
                      VLAN {n.vlan}
                    </text>
                  </g>
                ))}
              </svg>
            </Box>
          )}
        </CardContent>
      </Card>

      <Box mt={2}>
        <Typography variant="caption" color="textSecondary">
          * A visualização agrupa dispositivos por VLAN (verticalmente) e os distribui horizontalmente.
        </Typography>
      </Box>
    </Box>
  )
}
