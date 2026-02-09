import { Typography, Box, Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody, TextField, Select, MenuItem, Button, FormControl, InputLabel, Divider, CircularProgress } from '@mui/material'
import { Devices as DevicesIcon, Business as BusinessIcon, Folder as FolderIcon } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks/useApp'
import { fetchDevices, setFilters } from '../store/slices/devicesSlice'
import { fetchClients, fetchClientProjects, setCurrentClient, setCurrentProject } from '../store/slices/projectSlice'
import { useNavigate } from 'react-router-dom'

export default function Devices() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  // Redux state
  const { devices, loading: devicesLoading } = useAppSelector((s) => s.devices)
  const { clients, projects, currentClient, currentProject, loading: projectLoading } = useAppSelector((s) => s.project)

  // Local state for other filters
  const [deviceType, setDeviceType] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [location, setLocation] = useState<string>('')

  // Load clients on mount
  useEffect(() => {
    dispatch(fetchClients())
  }, [dispatch])

  // Load projects when currentClient changes
  useEffect(() => {
    if (currentClient) {
      dispatch(fetchClientProjects(currentClient.id))
    }
  }, [dispatch, currentClient])

  // Load devices when currentProject changes
  useEffect(() => {
    if (currentProject) {
      dispatch(fetchDevices(undefined))
    }
  }, [dispatch, currentProject])

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId) || null
    dispatch(setCurrentClient(client))
    dispatch(setCurrentProject(null)) // Reset project when client changes
  }

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId) || null
    dispatch(setCurrentProject(project))
  }

  const applyFilters = () => {
    const f = {
      deviceType: deviceType || undefined,
      status: status || undefined,
      location: location || undefined,
    }
    dispatch(setFilters(f))
    dispatch(fetchDevices(f))
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 2, display: 'flex' }}>
          <DevicesIcon sx={{ color: 'white' }} />
        </Box>
        <Typography variant="h4" fontWeight={800}>
          Gerenciamento de Dispositivos
        </Typography>
      </Box>

      {/* Hierarchy Selection - CRITICAL */}
      <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ mb: 2, display: 'block' }}>
            Hierarquia de Acesso
          </Typography>
          <Box display="flex" gap={3} flexWrap="wrap" alignItems="center">
            {/* Client Selection */}
            <FormControl size="small" sx={{ minWidth: 250 }}>
              <InputLabel id="client-select-label">Cliente</InputLabel>
              <Select
                labelId="client-select-label"
                value={currentClient?.id || ''}
                label="Cliente"
                onChange={(e) => handleClientChange(e.target.value)}
                startAdornment={<BusinessIcon sx={{ mr: 1, fontSize: 20, color: 'action.active' }} />}
              >
                <MenuItem value=""><em>Selecione um Cliente</em></MenuItem>
                {clients.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Project Selection */}
            <FormControl size="small" sx={{ minWidth: 250 }} disabled={!currentClient}>
              <InputLabel id="project-select-label">Projeto</InputLabel>
              <Select
                labelId="project-select-label"
                value={currentProject?.id || ''}
                label="Projeto"
                onChange={(e) => handleProjectChange(e.target.value)}
                startAdornment={<FolderIcon sx={{ mr: 1, fontSize: 20, color: 'action.active' }} />}
              >
                <MenuItem value=""><em>Selecione um Projeto</em></MenuItem>
                {projects.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {projectLoading && <CircularProgress size={20} />}
          </Box>
        </CardContent>
      </Card>

      {/* Main Content */}
      {currentProject ? (
        <>
          {/* Functional Filters */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select value={deviceType} onChange={(e) => setDeviceType(e.target.value)} label="Tipo">
                    <MenuItem value="">Todos os tipos</MenuItem>
                    {['camera', 'nvr', 'switch', 'router', 'firewall', 'access_point', 'reader', 'controller', 'converter'].map(t => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select value={status} onChange={(e) => setStatus(e.target.value)} label="Status">
                    <MenuItem value="">Todos os status</MenuItem>
                    {['active', 'inactive', 'maintenance', 'error'].map(s => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Local"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  size="small"
                  sx={{ width: 200 }}
                />

                <Button variant="contained" onClick={applyFilters} sx={{ fontWeight: 700 }}>
                  Aplicar Filtros
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box p={2} display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1}>
                  <DevicesIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight={700}>Dispositivos em {currentProject.name}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {devices.length} dispositivos encontrados
                </Typography>
              </Box>
              <Divider />
              {devicesLoading ? (
                <Box py={10} textAlign="center">
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Buscando dispositivos...</Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Hostname</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Modelo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>IP</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Local</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {devices.map((d) => (
                      <TableRow key={d.id} hover onClick={() => navigate(`/devices/${d.id}`)} sx={{ cursor: 'pointer' }}>
                        <TableCell sx={{ fontWeight: 500 }}>{d.hostname || '-'}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{d.device_type}</TableCell>
                        <TableCell>{d.model}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{d.ip_address}</TableCell>
                        <TableCell>
                          <Box component="span" sx={{
                            px: 1, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 700,
                            bgcolor: d.status === 'active' ? 'success.light' : 'action.disabledBackground',
                            color: d.status === 'active' ? 'success.dark' : 'text.disabled'
                          }}>
                            {d.status.toUpperCase()}
                          </Box>
                        </TableCell>
                        <TableCell>{d.location || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {devices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">Nenhum dispositivo cadastrado neste projeto.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Box
          sx={{
            py: 10, textAlign: 'center', bgcolor: 'action.hover',
            borderRadius: 2, border: '2px dashed', borderColor: 'divider'
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Selecione um Cliente e um Projeto
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Para visualizar os dispositivos, você deve primeiro definir o contexto hierárquico acima.
          </Typography>
        </Box>
      )}
    </Box>
  )
}
