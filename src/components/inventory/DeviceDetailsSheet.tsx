import React, { useState, useEffect } from 'react'
import { X, Edit, Calendar, User, MapPin, HardDrive, Wifi, Plus } from 'lucide-react'
import { NetworkDevice, MaintenanceLog, supabase } from '../../lib/supabase'

interface DeviceDetailsSheetProps {
    device: NetworkDevice
    onClose: () => void
    onEdit: (device: NetworkDevice) => void
    onRefresh: () => void
}

const DeviceDetailsSheet: React.FC<DeviceDetailsSheetProps> = ({
    device,
    onClose,
    onEdit,
    onRefresh
}) => {
    const [activeTab, setActiveTab] = useState<'info' | 'maintenance' | 'connections'>('info')
    const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
    const [connectedDevices, setConnectedDevices] = useState<NetworkDevice[]>([])
    const [showMaintenanceForm, setShowMaintenanceForm] = useState(false)
    const [maintenanceForm, setMaintenanceForm] = useState({
        technician_name: '',
        description: '',
        service_date: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        if (activeTab === 'maintenance') {
            fetchMaintenanceLogs()
        } else if (activeTab === 'connections') {
            fetchConnectedDevices()
        }
    }, [activeTab, device.id])

    const fetchMaintenanceLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('maintenance_logs')
                .select('*')
                .eq('device_id', device.id)
                .order('service_date', { ascending: false })

            if (error) throw error
            setMaintenanceLogs(data || [])
        } catch (error) {
            console.error('Error fetching maintenance logs:', error)
        }
    }

    const fetchConnectedDevices = async () => {
        try {
            // If this is an NVR, find cameras connected to it
            if (device.device_type === 'nvr' || device.device_type === 'dvr') {
                const { data, error } = await supabase
                    .from('network_devices')
                    .select('*')
                    .eq('connected_nvr_id', device.id)

                if (error) throw error
                setConnectedDevices(data || [])
            }
            // If this is a camera, find the NVR it's connected to
            else if (device.device_type === 'camera' && device.connected_nvr_id) {
                const { data, error } = await supabase
                    .from('network_devices')
                    .select('*')
                    .eq('id', device.connected_nvr_id)
                    .single()

                if (error) throw error
                setConnectedDevices(data ? [data] : [])
            }
        } catch (error) {
            console.error('Error fetching connected devices:', error)
        }
    }

    const handleAddMaintenance = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const { error } = await supabase
                .from('maintenance_logs')
                .insert([{
                    device_id: device.id,
                    ...maintenanceForm
                }])

            if (error) throw error

            alert('Manutenção registrada com sucesso!')
            setShowMaintenanceForm(false)
            setMaintenanceForm({
                technician_name: '',
                description: '',
                service_date: new Date().toISOString().split('T')[0]
            })
            fetchMaintenanceLogs()
            onRefresh()
        } catch (error: any) {
            console.error('Error adding maintenance log:', error)
            alert(`Erro ao registrar manutenção: ${error.message}`)
        }
    }

    const getDeviceTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            camera: 'Câmera',
            nvr: 'NVR',
            dvr: 'DVR',
            switch: 'Switch',
            router: 'Roteador',
            firewall: 'Firewall',
            access_point: 'Access Point',
            reader: 'Leitor',
            controller: 'Controladora',
            converter: 'Conversor',
            patch_panel: 'Patch Panel',
            server: 'Servidor',
            pc: 'PC',
            ap_wifi: 'AP Wi-Fi',
            intercom: 'Interfone',
            elevator_recorder: 'Gravador de Elevador',
            other: 'Outro'
        }
        return labels[type] || type
    }

    const InfoField: React.FC<{ label: string; value: string | undefined; icon?: React.ReactNode }> = ({ label, value, icon }) => (
        <div className="flex items-start gap-3 py-3 border-b border-gray-100">
            {icon && <div className="text-gray-400 mt-1">{icon}</div>}
            <div className="flex-1">
                <div className="text-sm text-gray-500">{label}</div>
                <div className="text-base font-medium text-gray-900 mt-1">{value || '-'}</div>
            </div>
        </div>
    )

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
            <div className="bg-white w-full sm:max-w-3xl sm:rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {device.hostname || device.ip_address}
                        </h2>
                        <p className="text-gray-600 mt-1">{getDeviceTypeLabel(device.device_type)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onEdit(device)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                        >
                            <Edit size={20} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 px-6">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'info'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Informações
                    </button>
                    <button
                        onClick={() => setActiveTab('maintenance')}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'maintenance'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Histórico de Manutenção
                    </button>
                    <button
                        onClick={() => setActiveTab('connections')}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'connections'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Conexões
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'info' && (
                        <div className="space-y-1">
                            <InfoField label="Número de Série" value={device.serial_number} icon={<HardDrive size={18} />} />
                            <InfoField label="Endereço IP" value={device.ip_address} icon={<Wifi size={18} />} />
                            <InfoField label="MAC Address" value={device.mac_address} />
                            <InfoField label="Modelo" value={device.model} />
                            <InfoField label="Fabricante" value={device.manufacturer} />
                            <InfoField label="Firmware" value={device.firmware_version} />
                            <InfoField label="Localização" value={device.location} icon={<MapPin size={18} />} />
                            <InfoField label="Patch Panel" value={device.patch_panel} />
                            <InfoField label="Porta do Patch Panel" value={device.patch_panel_port} />
                            <InfoField label="Porta do Switch" value={device.switch_port} />
                            <InfoField label="Data de Instalação" value={device.install_date} icon={<Calendar size={18} />} />
                            <InfoField label="Última Manutenção" value={device.last_maintenance_date} />
                            <InfoField label="Usuário Admin" value={device.admin_username} icon={<User size={18} />} />

                            {device.photo_url && (
                                <div className="py-3">
                                    <div className="text-sm text-gray-500 mb-2">Foto do Equipamento</div>
                                    <img src={device.photo_url} alt="Device" className="max-w-full h-auto rounded-lg border border-gray-200" />
                                </div>
                            )}

                            {device.notes && (
                                <div className="py-3">
                                    <div className="text-sm text-gray-500 mb-2">Observações</div>
                                    <div className="text-base text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                                        {device.notes}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'maintenance' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Histórico de Manutenção</h3>
                                <button
                                    onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                    <Plus size={16} />
                                    Adicionar
                                </button>
                            </div>

                            {showMaintenanceForm && (
                                <form onSubmit={handleAddMaintenance} className="bg-gray-50 p-4 rounded-lg space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Técnico
                                        </label>
                                        <input
                                            type="text"
                                            value={maintenanceForm.technician_name}
                                            onChange={(e) => setMaintenanceForm({ ...maintenanceForm, technician_name: e.target.value })}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Data do Serviço
                                        </label>
                                        <input
                                            type="date"
                                            value={maintenanceForm.service_date}
                                            onChange={(e) => setMaintenanceForm({ ...maintenanceForm, service_date: e.target.value })}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Descrição
                                        </label>
                                        <textarea
                                            value={maintenanceForm.description}
                                            onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                                            required
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Salvar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowMaintenanceForm(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="space-y-3">
                                {maintenanceLogs.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">Nenhuma manutenção registrada</p>
                                ) : (
                                    maintenanceLogs.map((log) => (
                                        <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <div className="font-medium text-gray-900">{log.technician_name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {new Date(log.service_date).toLocaleDateString('pt-BR')}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-gray-700">{log.description}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'connections' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {device.device_type === 'nvr' || device.device_type === 'dvr'
                                    ? 'Câmeras Conectadas'
                                    : 'Dispositivos Relacionados'}
                            </h3>

                            {connectedDevices.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">Nenhum dispositivo conectado</p>
                            ) : (
                                <div className="space-y-2">
                                    {connectedDevices.map((dev) => (
                                        <div key={dev.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {dev.hostname || dev.ip_address}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {getDeviceTypeLabel(dev.device_type)} - {dev.model}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600">{dev.location}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DeviceDetailsSheet
