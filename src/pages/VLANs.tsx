import { Typography, Box, Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody, TextField, Button } from '@mui/material'
import { SettingsEthernet as VLANIcon } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks/useApp'
import { fetchVLANs, createVLAN, updateVLAN, deleteVLAN } from '../store/slices/vlansSlice'

export default function VLANs() {
  const dispatch = useAppDispatch()
  const { vlans, loading } = useAppSelector(s => s.vlans)
  const [form, setForm] = useState({ vlan_id: '', name: '', subnet: '', gateway: '' })

  useEffect(() => {
    dispatch(fetchVLANs())
  }, [dispatch])

  const create = async () => {
    const payload = { vlan_id: parseInt(form.vlan_id), name: form.name, subnet: form.subnet, gateway: form.gateway, description: '' }
    await dispatch(createVLAN(payload as any))
    setForm({ vlan_id: '', name: '', subnet: '', gateway: '' })
  }

  const update = async (vlanId: number) => {
    await dispatch(updateVLAN({ vlanId, updates: { name: form.name || undefined, subnet: form.subnet || undefined, gateway: form.gateway || undefined } }))
    setForm({ vlan_id: '', name: '', subnet: '', gateway: '' })
  }

  const remove = async (vlanId: number) => {
    await dispatch(deleteVLAN(vlanId))
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Configuração de VLANs
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
            <VLANIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h6">Gerenciamento de VLANs</Typography>
          </Box>
          <Box display="flex" gap={2} flexWrap="wrap" sx={{ mb: 2 }}>
            <TextField label="VLAN ID" value={form.vlan_id} onChange={(e)=>setForm(f=>({ ...f, vlan_id: e.target.value }))} size="small" sx={{ width: 120 }} />
            <TextField label="Nome" value={form.name} onChange={(e)=>setForm(f=>({ ...f, name: e.target.value }))} size="small" sx={{ width: 180 }} />
            <TextField label="Sub-rede" value={form.subnet} onChange={(e)=>setForm(f=>({ ...f, subnet: e.target.value }))} size="small" sx={{ width: 200 }} />
            <TextField label="Gateway" value={form.gateway} onChange={(e)=>setForm(f=>({ ...f, gateway: e.target.value }))} size="small" sx={{ width: 160 }} />
            <Button variant="contained" onClick={create}>Criar</Button>
          </Box>
          {loading ? (
            <Typography variant="body2" color="text.secondary">Carregando...</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>VLAN</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Sub-rede</TableCell>
                  <TableCell>Gateway</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vlans.map(v => (
                  <TableRow key={v.vlan_id} hover>
                    <TableCell>{v.vlan_id}</TableCell>
                    <TableCell>{v.name}</TableCell>
                    <TableCell>{v.subnet}</TableCell>
                    <TableCell>{v.gateway}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={()=>update(v.vlan_id)}>Atualizar</Button>
                      <Button size="small" color="error" onClick={()=>remove(v.vlan_id)}>Excluir</Button>
                    </TableCell>
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
