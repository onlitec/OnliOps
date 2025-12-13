import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Settings } from 'lucide-react'
import { api } from '../services/api'
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
    Box
} from '@mui/material'

interface Category {
    slug: string;
    name: string;
    icon: string;
}

export default function CategoryManager() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [formData, setFormData] = useState({ slug: '', name: '', icon: '' })

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        setLoading(true)
        try {
            const data = await api.getCategories()
            setCategories(data || [])
        } catch (error) {
            console.error('Error fetching categories:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingCategory) {
                await api.updateCategory(editingCategory.slug, formData)
            } else {
                await api.createCategory(formData)
            }
            setShowForm(false)
            fetchCategories()
            setFormData({ slug: '', name: '', icon: '' })
            setEditingCategory(null)
        } catch (error) {
            console.error('Error saving category:', error)
            alert('Erro ao salvar categoria. Verifique se o Slug é único.')
        }
    }

    const handleEdit = (category: Category) => {
        setEditingCategory(category)
        setFormData({ slug: category.slug, name: category.name, icon: category.icon })
        setShowForm(true)
    }

    const handleDelete = async (slug: string) => {
        if (!confirm('Tem certeza que deseja excluir esta categoria? Dispositivos associados podem ficar órfãos.')) return
        try {
            await api.deleteCategory(slug)
            fetchCategories()
        } catch (error) {
            console.error('Error deleting category:', error)
        }
    }

    const openNewForm = () => {
        setEditingCategory(null)
        setFormData({ slug: '', name: '', icon: '' })
        setShowForm(true)
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Typography variant="h4" fontWeight="bold">Gerenciar Categorias</Typography>
                    <Typography variant="body2" color="textSecondary">Crie e edite as categorias de dispositivos do sistema</Typography>
                </div>
                <Button
                    variant="contained"
                    startIcon={<Plus size={20} />}
                    onClick={openNewForm}
                >
                    Nova Categoria
                </Button>
            </div>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Slug (ID)</TableCell>
                            <TableCell>Nome</TableCell>
                            <TableCell>Ícone (MUI Name)</TableCell>
                            <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {categories.map((category) => (
                            <TableRow key={category.slug}>
                                <TableCell>{category.slug}</TableCell>
                                <TableCell>{category.name}</TableCell>
                                <TableCell>{category.icon}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleEdit(category)} size="small" color="primary">
                                        <Edit size={18} />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(category.slug)} size="small" color="error">
                                        <Trash2 size={18} />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {categories.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={4} align="center">Nenhuma categoria encontrada.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={showForm} onClose={() => setShowForm(false)}>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                    <DialogContent>
                        <Box display="flex" flexDirection="column" gap={2} mt={1} minWidth={300}>
                            <TextField
                                label="Slug (Identificador Único)"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                disabled={!!editingCategory}
                                fullWidth
                                helperText="Ex: 'camera', 'switch'. Não pode ser alterado depois."
                            />
                            <TextField
                                label="Nome"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Ícone (Nome Material UI)"
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                fullWidth
                                helperText="Ex: 'CameraAlt', 'Router', 'Dvr'"
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowForm(false)}>Cancelar</Button>
                        <Button type="submit" variant="contained">Salvar</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </div>
    )
}
