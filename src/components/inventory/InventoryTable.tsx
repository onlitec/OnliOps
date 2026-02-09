import React from 'react'
import { Eye, Edit, Trash2, Wifi, WifiOff, ArrowUp, ArrowDown, ChevronUp, ChevronDown } from 'lucide-react'
import { NetworkDevice } from '../../lib/supabase'
import { api } from '../../services/api'

interface InventoryTableProps {
    devices: NetworkDevice[]
    loading: boolean
    onView: (device: NetworkDevice) => void
    onEdit: (device: NetworkDevice) => void
    onRefresh: () => void
    sortConfig: { key: string, direction: 'asc' | 'desc' | null }
    onSort: (key: string) => void
}

const InventoryTable: React.FC<InventoryTableProps> = ({
    devices,
    loading,
    onView,
    onEdit,
    onRefresh,
    sortConfig,
    onSort
}) => {
    const handleDelete = async (device: NetworkDevice) => {
        if (!confirm(`Tem certeza que deseja excluir o dispositivo ${device.hostname || device.ip_address}?`)) {
            return
        }

        try {
            if (device.id) {
                await api.deleteDevice(device.id)
                alert('Dispositivo excluído com sucesso!')
                onRefresh()
            }
        } catch (error) {
            console.error('Error deleting device:', error)
            alert('Erro ao excluir dispositivo')
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

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            maintenance: 'bg-yellow-100 text-yellow-800',
            error: 'bg-red-100 text-red-800'
        }
        const labels: Record<string, string> = {
            active: 'Ativo',
            inactive: 'Inativo',
            maintenance: 'Manutenção',
            error: 'Erro'
        }
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.inactive}`}>
                {labels[status] || status}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Carregando dispositivos...</p>
            </div>
        )
    }

    if (devices.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-600">Nenhum dispositivo encontrado</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {[
                                { key: 'serial_number', label: 'Serial' },
                                { key: 'ip_address', label: 'IP / Hostname' },
                                { key: 'device_type', label: 'Tipo' },
                                { key: 'model', label: 'Modelo' },
                                { key: 'manufacturer', label: 'Fabricante' },
                                { key: 'location', label: 'Localização' },
                                { key: 'status', label: 'Status' }
                            ].map((col) => (
                                <th
                                    key={col.key}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => onSort(col.key)}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.label}
                                        {sortConfig.key === col.key && (
                                            sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                        )}
                                    </div>
                                </th>
                            ))}
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {devices.map((device) => (
                            <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {device.serial_number || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{device.ip_address}</div>
                                    {device.hostname && (
                                        <div className="text-sm text-gray-500">{device.hostname}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {getDeviceTypeLabel(device.device_type)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {device.model}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {device.manufacturer}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {device.location || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(device.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onView(device)}
                                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                            title="Visualizar"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => onEdit(device)}
                                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                            title="Editar"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(device)}
                                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default InventoryTable
