import React, { useState, useEffect } from 'react'
import { X, Loader } from 'lucide-react'
import { NetworkDevice } from '../../lib/supabase'
import { api } from '../../services/api'

interface InventoryFormProps {
    device: NetworkDevice | null
    onClose: () => void
}

const InventoryForm: React.FC<InventoryFormProps> = ({ device, onClose }) => {
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {device ? 'Editar Dispositivo' : 'Adicionar Dispositivo'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Device Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Dispositivo <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="device_type"
                                value={formData.device_type}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {categories.map(cat => (
                                    <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                                ))}
                                {/* Fallback or 'Other' if needed manually, though categories should cover it */}
                                {!categories.find(c => c.slug === 'other') && <option value="other">Outro</option>}
                            </select>
                        </div>

                        {/* Serial Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Número de Série <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="serial_number"
                                value={formData.serial_number}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* IP Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Endereço IP <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="ip_address"
                                value={formData.ip_address}
                                onChange={handleChange}
                                required
                                placeholder="192.168.1.100"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* MAC Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                MAC Address
                            </label>
                            <input
                                type="text"
                                name="mac_address"
                                value={formData.mac_address}
                                onChange={handleChange}
                                placeholder="00:11:22:33:44:55"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Model */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Modelo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="model"
                                value={formData.model}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Manufacturer */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fabricante
                            </label>
                            <input
                                type="text"
                                name="manufacturer"
                                value={formData.manufacturer}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Hostname */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nome Amigável / Hostname
                            </label>
                            <input
                                type="text"
                                name="hostname"
                                value={formData.hostname}
                                onChange={handleChange}
                                placeholder="CAM-ENTRADA-01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Firmware */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Versão do Firmware
                            </label>
                            <input
                                type="text"
                                name="firmware_version"
                                value={formData.firmware_version}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Location */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Localização Física Detalhada
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Torre A, 3º andar, Hall dos elevadores"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Patch Panel */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Patch Panel
                            </label>
                            <input
                                type="text"
                                name="patch_panel"
                                value={formData.patch_panel}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Patch Panel Port */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Porta do Patch Panel
                            </label>
                            <input
                                type="text"
                                name="patch_panel_port"
                                value={formData.patch_panel_port}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Switch Port */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Porta do Switch
                            </label>
                            <input
                                type="text"
                                name="switch_port"
                                value={formData.switch_port}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Connected NVR (only for cameras) */}
                        {formData.device_type === 'camera' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    NVR Conectado
                                </label>
                                <select
                                    name="connected_nvr_id"
                                    value={formData.connected_nvr_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Nenhum</option>
                                    {nvrs.map(nvr => (
                                        <option key={nvr.id} value={nvr.id}>
                                            {nvr.hostname || nvr.ip_address} - {nvr.model}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* VLAN */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                VLAN
                            </label>
                            <select
                                name="vlan_id"
                                value={formData.vlan_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Nenhuma</option>
                                {vlans.map(vlan => (
                                    <option key={vlan.vlan_id} value={vlan.vlan_id}>
                                        VLAN {vlan.vlan_id} - {vlan.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="active">Ativo</option>
                                <option value="inactive">Inativo</option>
                                <option value="maintenance">Manutenção</option>
                                <option value="error">Erro</option>
                            </select>
                        </div>

                        {/* Admin Username */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Usuário Admin
                            </label>
                            <input
                                type="text"
                                name="admin_username"
                                value={formData.admin_username}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Admin Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Senha Admin
                            </label>
                            <input
                                type="password"
                                name="admin_password_enc"
                                value={formData.admin_password_enc}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Notes */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Observações
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </form>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && <Loader className="animate-spin" size={18} />}
                        {device ? 'Atualizar' : 'Criar'} Dispositivo
                    </button>
                </div>
            </div>
        </div>
    )
}

export default InventoryForm
