import React, { useState, useEffect } from 'react'
import {
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    IconButton,
    CircularProgress,
    alpha,
    useTheme,
    Divider
} from '@mui/material'
import { X, Save, HardDrive, Info, Settings, MapPin, Shield } from 'lucide-react'
import { NetworkDevice } from '../../lib/supabase'
import { api } from '../../services/api'

interface InventoryFormProps {
    device: NetworkDevice | null
    onClose: () => void
}

const InventoryForm: React.FC<InventoryFormProps> = ({ device, onClose }) => {
    const theme = useTheme()
    const [loading, setLoading] = useState(false)
    const [nvrs, setNvrs] = useState<NetworkDevice[]>([])
    const [vlans, setVlans] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])

    const [formData, setFormData] = useState({
        device_type: device?.device_type || 'camera',
        serial_number: device?.serial_number || '',
        ip_address: device?.ip_address || '',
        model: device?.model || '',
        manufacturer: device?.manufacturer || '',
        mac_address: device?.mac_address || '',
        hostname: device?.hostname || '',
        location: device?.location || '',
        firmware_version: device?.firmware_version || '',
        admin_username: device?.admin_username || '',
        admin_password_enc: device?.admin_password_enc || '',
        photo_url: device?.photo_url || '',
        install_date: device?.install_date || '',
        last_maintenance_date: device?.last_maintenance_date || '',
        notes: device?.notes || '',
        patch_panel: device?.patch_panel || '',
        patch_panel_port: device?.patch_panel_port || '',
        switch_port: device?.switch_port || '',
        connected_nvr_id: device?.connected_nvr_id || '',
        status: device?.status || 'active',
        vlan_id: device?.vlan_id || ''
    })

    useEffect(() => {
        fetchNVRs()
        fetchVLANs()
        fetchCategories()
    }, [])

    const fetchNVRs = async () => {
        try {
            const devices = await api.getDevices()
            const nvrs = devices.filter(d => ['nvr', 'dvr'].includes(d.device_type))
            setNvrs(nvrs)
        } catch (error) {
            console.error('Error fetching NVRs:', error)
        }
    }

    const fetchVLANs = async () => {
        try {
            const data = await api.getVlans()
            setVlans(data || [])
        } catch (error) {
            console.error('Error fetching VLANs:', error)
        }
    }

    const fetchCategories = async () => {
        try {
            const data = await api.getCategories()
            setCategories(data || [])
        } catch (error) {
            console.error('Error fetching Categories:', error)
        }
    }

    const handleChange = (e: any) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!formData.serial_number || !formData.ip_address || !formData.model) {
                alert('Preencha os campos obrigatórios: Serial, IP e Modelo')
                setLoading(false)
                return
            }

            const payload: any = {
                ...formData,
                vlan_id: formData.vlan_id ? parseInt(formData.vlan_id.toString()) : null,
                connected_nvr_id: formData.connected_nvr_id || null
            }

            if (device && device.id) {
                await api.updateDevice(device.id, payload)
                alert('Dispositivo atualizado com sucesso!')
            } else {
                await api.createDevice(payload)
                alert('Dispositivo criado com sucesso!')
            }

            onClose()
        } catch (error: any) {
            console.error('Error saving device:', error)
            alert(`Erro ao salvar dispositivo: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <DialogTitle sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.08)
            }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        display: 'flex'
                    }}>
                        <HardDrive size={24} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>
                            {device ? 'Editar Dispositivo' : 'Adicionar Novo Dispositivo'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {device ? 'Atualize as informações do equipamento' : 'Cadastre um novo equipamento na rede'}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <X size={20} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.3) }}>
                <Grid container spacing={3} sx={{ mt: 0.5 }}>
                    {/* Seção: Informações Básicas */}
                    <Grid size={{ xs: 12 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Info size={16} color={theme.palette.primary.main} />
                            <Typography variant="subtitle2" fontWeight={700} color="primary">
                                Informações Básicas
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Tipo de Dispositivo *</InputLabel>
                            <Select
                                name="device_type"
                                value={formData.device_type}
                                onChange={handleChange}
                                label="Tipo de Dispositivo *"
                                required
                            >
                                {categories.map(cat => (
                                    <MenuItem key={cat.slug} value={cat.slug}>{cat.name}</MenuItem>
                                ))}
                                {!categories.find(c => c.slug === 'other') && <MenuItem value="other">Outro</MenuItem>}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Número de Série *"
                            name="serial_number"
                            value={formData.serial_number}
                            onChange={handleChange}
                            required
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Endereço IP *"
                            name="ip_address"
                            value={formData.ip_address}
                            onChange={handleChange}
                            required
                            placeholder="192.168.1.100"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="MAC Address"
                            name="mac_address"
                            value={formData.mac_address}
                            onChange={handleChange}
                            placeholder="00:11:22:33:44:55"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Modelo *"
                            name="model"
                            value={formData.model}
                            onChange={handleChange}
                            required
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Fabricante"
                            name="manufacturer"
                            value={formData.manufacturer}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                    </Grid>

                    {/* Seção: Configuração e Identificação */}
                    <Grid size={{ xs: 12 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Settings size={16} color={theme.palette.primary.main} />
                            <Typography variant="subtitle2" fontWeight={700} color="primary">
                                Configuração e Identificação
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Hostname / Nome Amigável"
                            name="hostname"
                            value={formData.hostname}
                            onChange={handleChange}
                            placeholder="Ex: CAM-ENTRADA-01"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Versão do Firmware"
                            name="firmware_version"
                            value={formData.firmware_version}
                            onChange={handleChange}
                        />
                    </Grid>

                    {/* Infraestrutura de Rede */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Patch Panel"
                            name="patch_panel"
                            value={formData.patch_panel}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Porta P. Panel"
                            name="patch_panel_port"
                            value={formData.patch_panel_port}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Porta do Switch"
                            name="switch_port"
                            value={formData.switch_port}
                            onChange={handleChange}
                        />
                    </Grid>

                    {formData.device_type === 'camera' && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>NVR Conectado</InputLabel>
                                <Select
                                    name="connected_nvr_id"
                                    value={formData.connected_nvr_id}
                                    onChange={handleChange}
                                    label="NVR Conectado"
                                >
                                    <MenuItem value="">Nenhum</MenuItem>
                                    {nvrs.map(nvr => (
                                        <MenuItem key={nvr.id} value={nvr.id}>
                                            {nvr.hostname || nvr.ip_address} - {nvr.model}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}

                    <Grid size={{ xs: 12, md: formData.device_type === 'camera' ? 6 : 12 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>VLAN</InputLabel>
                            <Select
                                name="vlan_id"
                                value={formData.vlan_id}
                                onChange={handleChange}
                                label="VLAN"
                            >
                                <MenuItem value="">Nenhuma</MenuItem>
                                {vlans.map(vlan => (
                                    <MenuItem key={vlan.vlan_id} value={vlan.vlan_id}>
                                        VLAN {vlan.vlan_id} - {vlan.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                    </Grid>

                    {/* Seção: Localização e Status */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                            <MapPin size={16} color={theme.palette.primary.main} />
                            <Typography variant="subtitle2" fontWeight={700} color="primary">
                                Localização e Observações
                            </Typography>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Localização Física Detalhada"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="Ex: Torre A, 3º andar, Hall"
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Observações"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                            <Shield size={16} color={theme.palette.primary.main} />
                            <Typography variant="subtitle2" fontWeight={700} color="primary">
                                Status e Segurança
                            </Typography>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        label="Status"
                                    >
                                        <MenuItem value="active">Ativo</MenuItem>
                                        <MenuItem value="inactive">Inativo</MenuItem>
                                        <MenuItem value="maintenance">Manutenção</MenuItem>
                                        <MenuItem value="error">Erro</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Usuário Admin"
                                    name="admin_username"
                                    value={formData.admin_username}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="password"
                                    label="Senha Admin"
                                    name="admin_password_enc"
                                    value={formData.admin_password_enc}
                                    onChange={handleChange}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: alpha(theme.palette.divider, 0.08) }}>
                <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: 2 }}>
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
                    sx={{ borderRadius: 2, px: 4 }}
                >
                    {device ? 'Salvar Alterações' : 'Cadastrar Dispositivo'}
                </Button>
            </DialogActions>
        </Box>
    )
}

export default InventoryForm
