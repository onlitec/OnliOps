import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabase'
import { SimulationTemplate } from '../../lib/simulation-types'

interface TemplatesState {
  templates: SimulationTemplate[]
  currentTemplate: SimulationTemplate | null
  loading: boolean
  error: string | null
  filters: {
    modelType?: string
    category?: string
    isPublic?: boolean
    createdBy?: string
    tags?: string[]
  }
  categories: string[]
  modelTypes: string[]
}

const initialState: TemplatesState = {
  templates: [],
  currentTemplate: null,
  loading: false,
  error: null,
  filters: {},
  categories: ['transportation', 'healthcare', 'environmental', 'business', 'finance', 'education', 'research'],
  modelTypes: ['traffic_simulation', 'epidemiological_model', 'climate_model', 'supply_chain', 'financial_model', 'custom']
}

// Async thunks
export const fetchTemplates = createAsyncThunk(
  'templates/fetchTemplates',
  async (filters?: { modelType?: string; category?: string; isPublic?: boolean; createdBy?: string; tags?: string[] }) => {
    let query = supabase.from('simulation_templates').select('*')

    if (filters?.modelType) query = query.eq('model_type', filters.modelType)
    if (filters?.category) query = query.eq('category', filters.category)
    if (filters?.isPublic !== undefined) query = query.eq('is_public', filters.isPublic)
    if (filters?.createdBy) query = query.eq('created_by', filters.createdBy)
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags)
    }

    const { data, error } = await query.order('usage_count', { ascending: false })

    if (error) throw error
    return data as SimulationTemplate[]
  }
)

export const fetchTemplateById = createAsyncThunk(
  'templates/fetchTemplateById',
  async (templateId: string) => {
    const { data, error } = await supabase
      .from('simulation_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error) throw error
    return data as SimulationTemplate
  }
)

export const createTemplate = createAsyncThunk(
  'templates/createTemplate',
  async (template: Omit<SimulationTemplate, 'id' | 'created_at' | 'usage_count' | 'rating'>) => {
    const templateWithDefaults = {
      ...template,
      usage_count: 0,
      rating: null
    }

    const { data, error } = await supabase
      .from('simulation_templates')
      .insert(templateWithDefaults)
      .select()
      .single()

    if (error) throw error
    return data as SimulationTemplate
  }
)

export const updateTemplate = createAsyncThunk(
  'templates/updateTemplate',
  async ({ templateId, updates }: { templateId: string; updates: Partial<SimulationTemplate> }) => {
    const { data, error } = await supabase
      .from('simulation_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single()

    if (error) throw error
    return data as SimulationTemplate
  }
)

export const deleteTemplate = createAsyncThunk(
  'templates/deleteTemplate',
  async (templateId: string) => {
    const { error } = await supabase
      .from('simulation_templates')
      .delete()
      .eq('id', templateId)

    if (error) throw error
    return templateId
  }
)

export const incrementTemplateUsage = createAsyncThunk(
  'templates/incrementTemplateUsage',
  async (templateId: string) => {
    const { data, error } = await supabase
      .from('simulation_templates')
      .select('usage_count')
      .eq('id', templateId)
      .single()

    if (error) throw error

    const newUsageCount = (data?.usage_count || 0) + 1

    const { data: updatedData, error: updateError } = await supabase
      .from('simulation_templates')
      .update({ usage_count: newUsageCount })
      .eq('id', templateId)
      .select()
      .single()

    if (updateError) throw updateError
    return updatedData as SimulationTemplate
  }
)

export const rateTemplate = createAsyncThunk(
  'templates/rateTemplate',
  async ({ templateId, rating }: { templateId: string; rating: number }) => {
    if (rating < 0 || rating > 5) {
      throw new Error('Rating must be between 0 and 5')
    }

    const { data, error } = await supabase
      .from('simulation_templates')
      .update({ rating })
      .eq('id', templateId)
      .select()
      .single()

    if (error) throw error
    return data as SimulationTemplate
  }
)

export const createSimulationFromTemplate = createAsyncThunk(
  'templates/createSimulationFromTemplate',
  async ({ templateId, name, description, userId }: {
    templateId: string
    name: string
    description?: string
    userId: string
  }) => {
    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('simulation_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError) throw templateError

    // Create simulation from template
    const simulation = {
      name,
      model_type: template.model_type,
      description: description || template.description,
      created_by: userId,
      configuration: template.configuration,
      is_template: false,
      is_public: false
    }

    const { data: newSimulation, error: simulationError } = await supabase
      .from('simulations')
      .insert(simulation)
      .select()
      .single()

    if (simulationError) throw simulationError

    // Increment template usage
    await supabase
      .from('simulation_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', templateId)

    return newSimulation
  }
)

const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    setCurrentTemplate: (state, action: PayloadAction<SimulationTemplate | null>) => {
      state.currentTemplate = action.payload
    },
    setFilters: (state, action: PayloadAction<TemplatesState['filters']>) => {
      state.filters = action.payload
    },
    clearFilters: (state) => {
      state.filters = {}
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch templates
      .addCase(fetchTemplates.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTemplates.fulfilled, (state, action: PayloadAction<SimulationTemplate[]>) => {
        state.loading = false
        state.templates = action.payload
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch templates'
      })

      // Fetch template by ID
      .addCase(fetchTemplateById.fulfilled, (state, action: PayloadAction<SimulationTemplate>) => {
        state.currentTemplate = action.payload
      })

      // Create template
      .addCase(createTemplate.fulfilled, (state, action: PayloadAction<SimulationTemplate>) => {
        state.templates.unshift(action.payload)
        state.currentTemplate = action.payload
      })

      // Update template
      .addCase(updateTemplate.fulfilled, (state, action: PayloadAction<SimulationTemplate>) => {
        const index = state.templates.findIndex(t => t.id === action.payload.id)
        if (index !== -1) {
          state.templates[index] = action.payload
        }
        if (state.currentTemplate?.id === action.payload.id) {
          state.currentTemplate = action.payload
        }
      })

      // Delete template
      .addCase(deleteTemplate.fulfilled, (state, action: PayloadAction<string>) => {
        state.templates = state.templates.filter(t => t.id !== action.payload)
        if (state.currentTemplate?.id === action.payload) {
          state.currentTemplate = null
        }
      })

      // Increment template usage
      .addCase(incrementTemplateUsage.fulfilled, (state, action: PayloadAction<SimulationTemplate>) => {
        const index = state.templates.findIndex(t => t.id === action.payload.id)
        if (index !== -1) {
          state.templates[index] = action.payload
        }
        if (state.currentTemplate?.id === action.payload.id) {
          state.currentTemplate = action.payload
        }
      })

      // Rate template
      .addCase(rateTemplate.fulfilled, (state, action: PayloadAction<SimulationTemplate>) => {
        const index = state.templates.findIndex(t => t.id === action.payload.id)
        if (index !== -1) {
          state.templates[index] = action.payload
        }
        if (state.currentTemplate?.id === action.payload.id) {
          state.currentTemplate = action.payload
        }
      })
  }
})

export const {
  setCurrentTemplate,
  setFilters,
  clearFilters,
  clearError
} = templatesSlice.actions

export default templatesSlice.reducer