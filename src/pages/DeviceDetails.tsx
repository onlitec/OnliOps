import { Typography, Box, Card, CardContent, Grid, TextField, Select, MenuItem, Button } from '@mui/material'
import { DeviceHub as DeviceIcon } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/useApp'
import { fetchDeviceById, fetchDeviceMetrics, fetchDeviceHistory, updateDevice } from '../store/slices/devicesSlice'
import { supabase, NetworkDevice } from '../lib/supabase'

export default function DeviceDetails() {
  const { id } = useParams()
  const dispatch = useAppDispatch()
  const { selectedDevice, deviceMetrics, deviceHistory } = useAppSelector(s => s.devices)
  const [ip, setIp] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState<NetworkDevice['status']>('active')

  useEffect(() => {
    if (!id) return
    dispatch(fetchDeviceById(id))
    dispatch(fetchDeviceMetrics(id))
    dispatch(fetchDeviceHistory(id))
  }, [dispatch, id])

  useEffect(() => {
    if (selectedDevice) {
      setIp(selectedDevice.ip_address)
      setLocation(selectedDevice.location || '')
      setStatus(selectedDevice.status)
    }
  }, [selectedDevice])

  const save = async () => {
    if (!id) return
    const oldValues = selectedDevice ? { ip_address: selectedDevice.ip_address, location: selectedDevice.location, status: selectedDevice.status } : {}
    const updates: Partial<NetworkDevice> = { ip_address: ip, location, status }
    await dispatch(updateDevice({ deviceId: id, updates }))
    await supabase.from('device_history').insert({ device_id: id, action_type: 'update', old_values: oldValues, new_values: updates })
    dispatch(fetchDeviceHistory(id))
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Detalhes do Dispositivo
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {!selectedDevice ? (
            <Typography variant="body2" color="text.secondary">Carregando...</Typography>
          ) : (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                  <DeviceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                  <Typography variant="h6">Informações</Typography>
                </Box>
                <TextField label="Hostname" value={selectedDevice.hostname || ''} disabled fullWidth sx={{ mb: 2 }} />
                <TextField label="Modelo" value={selectedDevice.model} disabled fullWidth sx={{ mb: 2 }} />
                <TextField label="Fabricante" value={selectedDevice.manufacturer} disabled fullWidth sx={{ mb: 2 }} />
                <TextField label="VLAN" value={selectedDevice.vlan_id} disabled fullWidth sx={{ mb: 2 }} />
                <TextField label="IP" value={ip} onChange={(e)=>setIp(e.target.value)} fullWidth sx={{ mb: 2 }} />
                <TextField label="Local" value={location} onChange={(e)=>setLocation(e.target.value)} fullWidth sx={{ mb: 2 }} />
                <Select value={status} onChange={(e)=>setStatus(e.target.value as NetworkDevice['status'])} fullWidth sx={{ mb: 2 }}>
                  {['active','inactive','maintenance','error'].map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
                <Button variant="contained" onClick={save}>Salvar alterações</Button>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Métricas recentes</Typography>
                <Box sx={{ maxHeight: 220, overflow: 'auto', border: '1px solid #eee', borderRadius: 1, p: 1 }}>
                  {(deviceMetrics[id || ''] || []).map(m => (
                    <Box key={m.id} display="flex" justifyContent="space-between">
                      <Typography variant="caption">{new Date(m.timestamp).toLocaleString('pt-BR')}</Typography>
                      <Typography variant="caption">In {m.network_in} Mbps • Out {m.network_out} Mbps</Typography>
                    </Box>
                  ))}
                </Box>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Histórico</Typography>
                <Box sx={{ maxHeight: 220, overflow: 'auto', border: '1px solid #eee', borderRadius: 1, p: 1 }}>
                  {(deviceHistory[id || ''] || []).map(h => (
                    <Box key={h.id} sx={{ mb: 1 }}>
                      <Typography variant="caption">{h.action_type}</Typography>
                      <Typography variant="caption" color="text.secondary"> {new Date(h.created_at).toLocaleString('pt-BR')}</Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
