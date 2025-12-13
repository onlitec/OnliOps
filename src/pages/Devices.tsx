import { Typography, Box, Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody, TextField, Select, MenuItem, Button } from '@mui/material'
import { Devices as DevicesIcon } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks/useApp'
import { fetchDevices, setFilters } from '../store/slices/devicesSlice'
import { useNavigate } from 'react-router-dom'

export default function Devices() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { devices, loading } = useAppSelector((s) => s.devices)
  const [vlanId, setVlanId] = useState<string>('')
  const [deviceType, setDeviceType] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [location, setLocation] = useState<string>('')

  useEffect(() => {
    dispatch(fetchDevices(undefined))
  }, [dispatch])

  const applyFilters = () => {
    const f = {
      vlanId: vlanId ? parseInt(vlanId) : undefined,
      deviceType: deviceType || undefined,
      status: status || undefined,
      location: location || undefined,
    }
    dispatch(setFilters(f))
    dispatch(fetchDevices(f))
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gerenciamento de Dispositivos
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField label="VLAN" value={vlanId} onChange={(e) => setVlanId(e.target.value)} size="small" sx={{ width: 120 }} />
            <Select value={deviceType} onChange={(e)=>setDeviceType(e.target.value)} displayEmpty size="small" sx={{ width: 180 }}>
              <MenuItem value="">Todos os tipos</MenuItem>
              {['camera','nvr','switch','router','firewall','access_point','reader','controller','converter'].map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
            <Select value={status} onChange={(e)=>setStatus(e.target.value)} displayEmpty size="small" sx={{ width: 180 }}>
              <MenuItem value="">Todos os status</MenuItem>
              {['active','inactive','maintenance','error'].map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
            <TextField label="Local" value={location} onChange={(e) => setLocation(e.target.value)} size="small" sx={{ width: 200 }} />
            <Button variant="contained" onClick={applyFilters}>Aplicar Filtros</Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
            <DevicesIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h6">Lista de Dispositivos</Typography>
          </Box>
          {loading ? (
            <Typography variant="body2" color="text.secondary">Carregando...</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Hostname</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Modelo</TableCell>
                  <TableCell>Fabricante</TableCell>
                  <TableCell>IP</TableCell>
                  <TableCell>VLAN</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Local</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {devices.map((d) => (
                  <TableRow key={d.id} hover onClick={() => navigate(`/devices/${d.id}`)} sx={{ cursor: 'pointer' }}>
                    <TableCell>{d.hostname || '-'}</TableCell>
                    <TableCell>{d.device_type}</TableCell>
                    <TableCell>{d.model}</TableCell>
                    <TableCell>{d.manufacturer}</TableCell>
                    <TableCell>{d.ip_address}</TableCell>
                    <TableCell>{d.vlan_id}</TableCell>
                    <TableCell>{d.status}</TableCell>
                    <TableCell>{d.location || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
