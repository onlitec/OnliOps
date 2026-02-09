import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Settings } from 'lucide-react'
import { api } from '../services/api'
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    Button,
    CircularProgress
} from '@mui/material'
import { useAppDispatch, useAppSelector } from '../hooks/useApp'
import { setCurrentClient, setCurrentProject, fetchClientProjects } from '../store/slices/projectSlice'

interface VLAN {
    vlan_id: number
    name: string
    description: string
}

export default function VlanManager() {
    const dispatch = useAppDispatch()
    const { currentClient, currentProject, clients, projects } = useAppSelector((state) => state.project)

    const [vlans, setVlans] = useState<VLAN[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingVlan, setEditingVlan] = useState<VLAN | null>(null)
    const [formData, setFormData] = useState({ vlan_id: '', name: '', description: '' })

    useEffect(() => {
        if (currentProject) {
            fetchVlans()
        } else {
            setLoading(false)
            setVlans([])
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

    const fetchVlans = async () => {
        setLoading(true)
        try {
            const data = await api.getVlans()
            setVlans(data || [])
        } catch (error) {
            console.error('Error fetching VLANs:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (vlan: VLAN) => {
        setEditingVlan(vlan)
        setFormData({
            vlan_id: vlan.vlan_id.toString(),
            name: vlan.name,
            description: vlan.description || ''
        })
        setShowForm(true)
    }

    const handleDelete = async (vlan: VLAN) => {
        if (!confirm(`Are you sure you want to delete VLAN ${vlan.vlan_id} - ${vlan.name}?`)) return
        try {
            await api.deleteVlan(vlan.vlan_id)
            fetchVlans()
        } catch (error) {
            alert('Error deleting VLAN')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const payload = {
                vlan_id: parseInt(formData.vlan_id),
                name: formData.name,
                description: formData.description
            }

            if (editingVlan) {
                await api.updateVlan(editingVlan.vlan_id, payload)
            } else {
                await api.createVlan(payload)
            }
            setShowForm(false)
            setEditingVlan(null)
            setFormData({ vlan_id: '', name: '', description: '' })
            fetchVlans()
        } catch (error) {
            alert('Error saving VLAN')
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de VLANs</h1>
                    <Box display="flex" gap={2} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Cliente</InputLabel>
                            <Select
                                value={currentClient?.id || ''}
                                label="Cliente"
                                onChange={(e: SelectChangeEvent) => handleClientChange(e.target.value)}
                            >
                                {clients.map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {currentClient && (
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Projeto</InputLabel>
                                <Select
                                    value={currentProject?.id || ''}
                                    label="Projeto"
                                    onChange={(e: SelectChangeEvent) => handleProjectChange(e.target.value)}
                                >
                                    {projects.map(p => (
                                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                </div>
                <button
                    onClick={() => {
                        setEditingVlan(null)
                        setFormData({ vlan_id: '', name: '', description: '' })
                        setShowForm(true)
                    }}
                    disabled={!currentProject}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${!currentProject
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    <Plus size={20} />
                    Nova VLAN
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {vlans.map((vlan) => (
                            <tr key={vlan.vlan_id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vlan.vlan_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vlan.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vlan.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(vlan)} className="text-blue-600 hover:text-blue-900 mr-4">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(vlan)} className="text-red-600 hover:text-red-900">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingVlan ? 'Editar VLAN' : 'Nova VLAN'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">VLAN ID</label>
                                <input
                                    type="number"
                                    required
                                    disabled={!!editingVlan}
                                    value={formData.vlan_id}
                                    onChange={e => setFormData({ ...formData, vlan_id: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
