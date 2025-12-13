import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Download, Upload } from 'lucide-react'
import { supabase, NetworkDevice } from '../lib/supabase'
import { api } from '../services/api'
import InventoryTable from '../components/inventory/InventoryTable'
import InventoryForm from '../components/inventory/InventoryForm'
import DeviceDetailsSheet from '../components/inventory/DeviceDetailsSheet'
import ImportModal from '../components/inventory/ImportModal'

const Inventory: React.FC = () => {
    const [devices, setDevices] = useState<NetworkDevice[]>([])
    const [filteredDevices, setFilteredDevices] = useState<NetworkDevice[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null)
    const [showDetails, setShowDetails] = useState(false)
    const [editingDevice, setEditingDevice] = useState<NetworkDevice | null>(null)
    const [showImport, setShowImport] = useState(false)

    // Filters
    const [filterType, setFilterType] = useState<string>('all')
    const [filterManufacturer, setFilterManufacturer] = useState<string>('all')
    const [filterLocation, setFilterLocation] = useState<string>('all')

    useEffect(() => {
        fetchDevices()
    }, [])

    useEffect(() => {
        applyFilters()
    }, [devices, searchTerm, filterType, filterManufacturer, filterLocation])

    const fetchDevices = async () => {
        setLoading(true)
        try {
            const data = await api.getDevices()
            setDevices(data || [])
        } catch (error) {
            console.error('Error fetching devices:', error)
        } finally {
            setLoading(false)
        }
    }

    const applyFilters = () => {
        let filtered = [...devices]

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(device =>
                device.ip_address?.toLowerCase().includes(term) ||
                device.mac_address?.toLowerCase().includes(term) ||
                device.serial_number?.toLowerCase().includes(term) ||
                device.model?.toLowerCase().includes(term) ||
                device.hostname?.toLowerCase().includes(term) ||
                device.location?.toLowerCase().includes(term) ||
                device.manufacturer?.toLowerCase().includes(term)
            )
        }

        // Type filter
        if (filterType !== 'all') {
            filtered = filtered.filter(device => device.device_type === filterType)
        }

        // Manufacturer filter
        if (filterManufacturer !== 'all') {
            filtered = filtered.filter(device => device.manufacturer === filterManufacturer)
        }

        // Location filter
        if (filterLocation !== 'all') {
            filtered = filtered.filter(device => device.location === filterLocation)
        }

        setFilteredDevices(filtered)
    }

    const handleAddDevice = () => {
        setEditingDevice(null)
        setShowForm(true)
    }

    const handleEditDevice = (device: NetworkDevice) => {
        setEditingDevice(device)
        setShowForm(true)
    }

    const handleViewDevice = (device: NetworkDevice) => {
        setSelectedDevice(device)
        setShowDetails(true)
    }

    const handleFormClose = () => {
        setShowForm(false)
        setEditingDevice(null)
        fetchDevices()
    }

    const handleDetailsClose = () => {
        setShowDetails(false)
        setSelectedDevice(null)
    }

    const handleExportCSV = () => {
        const headers = ['Serial', 'IP', 'Tipo', 'Modelo', 'Fabricante', 'Localização', 'Status']
        const rows = filteredDevices.map(d => [
            d.serial_number || '',
            d.ip_address,
            d.device_type,
            d.model,
            d.manufacturer,
            d.location || '',
            d.status
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }

    // Get unique values for filters
    const manufacturers = Array.from(new Set(devices.map(d => d.manufacturer).filter(Boolean)))
    const locations = Array.from(new Set(devices.map(d => d.location).filter(Boolean)))

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Inventário de Equipamentos</h1>
                    <p className="text-gray-600 mt-1">Gerencie todos os dispositivos da infraestrutura</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowImport(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        <Upload size={20} />
                        Importar Planilha
                    </button>
                    <button
                        onClick={handleAddDevice}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Adicionar Dispositivo
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
                <div className="flex gap-4 flex-wrap">
                    {/* Search */}
                    <div className="flex-1 min-w-[300px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por IP, MAC, Serial, Modelo, Local..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Download size={20} />
                        Exportar CSV
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-4 flex-wrap items-center">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Filtros:</span>
                    </div>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todos os Tipos</option>
                        <option value="camera">Câmera</option>
                        <option value="nvr">NVR</option>
                        <option value="dvr">DVR</option>
                        <option value="switch">Switch</option>
                        <option value="patch_panel">Patch Panel</option>
                        <option value="controller">Controladora de Acesso</option>
                        <option value="server">Servidor</option>
                        <option value="pc">PC</option>
                        <option value="ap_wifi">AP Wi-Fi</option>
                        <option value="intercom">Interfone</option>
                        <option value="elevator_recorder">Gravador de Elevador</option>
                        <option value="other">Outros</option>
                    </select>

                    <select
                        value={filterManufacturer}
                        onChange={(e) => setFilterManufacturer(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todos os Fabricantes</option>
                        {manufacturers.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>

                    <select
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todas as Localizações</option>
                        {locations.map(l => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>

                    {(filterType !== 'all' || filterManufacturer !== 'all' || filterLocation !== 'all' || searchTerm) && (
                        <button
                            onClick={() => {
                                setFilterType('all')
                                setFilterManufacturer('all')
                                setFilterLocation('all')
                                setSearchTerm('')
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>

                <div className="text-sm text-gray-600">
                    Mostrando {filteredDevices.length} de {devices.length} dispositivos
                </div>
            </div>

            {/* Table */}
            <InventoryTable
                devices={filteredDevices}
                loading={loading}
                onView={handleViewDevice}
                onEdit={handleEditDevice}
                onRefresh={fetchDevices}
            />

            {/* Form Modal */}
            {showForm && (
                <InventoryForm
                    device={editingDevice}
                    onClose={handleFormClose}
                />
            )}

            {/* Details Sheet */}
            {showDetails && selectedDevice && (
                <DeviceDetailsSheet
                    device={selectedDevice}
                    onClose={handleDetailsClose}
                    onEdit={handleEditDevice}
                    onRefresh={fetchDevices}
                />
            )}

            {/* Import Modal */}
            {showImport && (
                <ImportModal
                    onClose={() => setShowImport(false)}
                    onSuccess={() => {
                        setShowImport(false)
                        fetchDevices()
                    }}
                />
            )}
        </div>
    )
}

export default Inventory
