import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabase'
import { Simulation, SimulationRun, SimulationResult, PerformanceMetric } from '../../lib/simulation-types'

interface SimulationsState {
  simulations: Simulation[]
  currentSimulation: Simulation | null
  simulationRuns: Record<string, SimulationRun[]>
  simulationResults: Record<string, SimulationResult[]>
  performanceMetrics: Record<string, PerformanceMetric[]>
  loading: boolean
  error: string | null
  filters: {
    modelType?: string
    status?: string
    createdBy?: string
    isTemplate?: boolean
    isPublic?: boolean
  }
  realtimeData: Record<string, any>
  lastFetchedSimulations?: number
}

const initialState: SimulationsState = {
  simulations: [],
  currentSimulation: null,
  simulationRuns: {},
  simulationResults: {},
  performanceMetrics: {},
  loading: false,
  error: null,
  filters: {},
  realtimeData: {},
  lastFetchedSimulations: 0
}

// Dados mockados para desenvolvimento local
const MOCK_SIMULATIONS: Simulation[] = [
  {
    id: '1',
    name: 'Teste de Carga - Rede Principal',
    model_type: 'network_load',
    description: 'Simulação de carga pesada na rede principal para avaliar performance',
    created_by: '00000000-0000-0000-0000-000000000002',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    configuration: { nodes: 50, bandwidth: 1000, protocol: 'TCP' } as any,
    is_template: false,
    is_public: true
  },
  {
    id: '2',
    name: 'Simulação de Falha - Switch Core',
    model_type: 'failure_analysis',
    description: 'Analisa impacto da falha do switch core principal',
    created_by: '00000000-0000-0000-0000-000000000002',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    configuration: { target: 'core_switch_1', failover: 'auto' } as any,
    is_template: false,
    is_public: false
  },
  {
    id: '3',
    name: 'Expansão de Capacidade - VLAN 100',
    model_type: 'capacity_planning',
    description: 'Planeja expansão de 30% na VLAN 100',
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    configuration: { vlan_id: 100, growth_rate: 0.3 } as any,
    is_template: true,
    is_public: true
  }
]

const MOCK_SIMULATION_RUNS: Record<string, SimulationRun[]> = {
  '1': [
    {
      id: 'run1',
      simulation_id: '1',
      status: 'completed',
      start_time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      parameters: { duration: 3600 },
      priority: 'normal',
      progress: 100,
      estimated_duration: 3600
    },
    {
      id: 'run2',
      simulation_id: '1',
      status: 'running',
      start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      parameters: { duration: 1800 },
      priority: 'high',
      progress: 65,
      estimated_duration: 1800
    }
  ],
  '2': [
    {
      id: 'run3',
      simulation_id: '2',
      status: 'completed',
      start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
      parameters: { scenario: 'worst_case' },
      priority: 'urgent',
      progress: 100,
      estimated_duration: 2700
    }
  ],
  '3': [
    {
      id: 'run4',
      simulation_id: '3',
      status: 'pending',
      parameters: { incremental: true },
      priority: 'low',
      progress: 0
    }
  ]
}

// Async thunks - Retornar dados mockados para desenvolvimento local
export const fetchSimulations = createAsyncThunk(
  'simulations/fetchSimulations',
  async (filters?: { modelType?: string; status?: string; createdBy?: string; isTemplate?: boolean; isPublic?: boolean }) => {
    // Retornar simulações mockadas
    await new Promise(resolve => setTimeout(resolve, 300)) // Simular delay de rede
    return [...MOCK_SIMULATIONS] as Simulation[]
  },
  {
    condition: (filters, { getState }) => {
      const state = getState() as any
      const last = state.simulations?.lastFetchedSimulations || 0
      const now = Date.now()
      const ttlMs = 60000
      const noFilters = !filters || Object.keys(filters).length === 0
      if (noFilters && now - last < ttlMs) {
        return false
      }
      return true
    }
  }
)

export const fetchSimulationById = createAsyncThunk(
  'simulations/fetchSimulationById',
  async (simulationId: string) => {
    // Retornar simulação mockada
    await new Promise(resolve => setTimeout(resolve, 200))
    const simulation = MOCK_SIMULATIONS.find(s => s.id === simulationId)
    if (!simulation) throw new Error('Simulação não encontrada')
    return simulation
  }
)

export const createSimulation = createAsyncThunk(
  'simulations/createSimulation',
  async (simulation: Omit<Simulation, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('simulations')
      .insert(simulation)
      .select()
      .single()

    if (error) throw error
    return data as Simulation
  }
)

export const updateSimulation = createAsyncThunk(
  'simulations/updateSimulation',
  async ({ simulationId, updates }: { simulationId: string; updates: Partial<Simulation> }) => {
    const { data, error } = await supabase
      .from('simulations')
      .update(updates)
      .eq('id', simulationId)
      .select()
      .single()

    if (error) throw error
    return data as Simulation
  }
)

export const deleteSimulation = createAsyncThunk(
  'simulations/deleteSimulation',
  async (simulationId: string) => {
    const { error } = await supabase
      .from('simulations')
      .delete()
      .eq('id', simulationId)

    if (error) throw error
    return simulationId
  }
)

export const fetchSimulationRuns = createAsyncThunk(
  'simulations/fetchSimulationRuns',
  async (simulationId: string) => {
    // Retornar runs mockadas
    await new Promise(resolve => setTimeout(resolve, 200))
    return { simulationId, runs: MOCK_SIMULATION_RUNS[simulationId] || [] }
  }
)

export const createSimulationRun = createAsyncThunk(
  'simulations/createSimulationRun',
  async (run: Omit<SimulationRun, 'id'>) => {
    const { data, error } = await supabase
      .from('simulation_runs')
      .insert(run)
      .select()
      .single()

    if (error) throw error
    return data as SimulationRun
  }
)

export const updateSimulationRun = createAsyncThunk(
  'simulations/updateSimulationRun',
  async ({ runId, updates }: { runId: string; updates: Partial<SimulationRun> }) => {
    const { data, error } = await supabase
      .from('simulation_runs')
      .update(updates)
      .eq('id', runId)
      .select()
      .single()

    if (error) throw error
    return data as SimulationRun
  }
)

export const fetchSimulationResults = createAsyncThunk(
  'simulations/fetchSimulationResults',
  async (runId: string) => {
    const { data, error } = await supabase
      .from('simulation_results')
      .select('*')
      .eq('run_id', runId)
      .order('timestamp', { ascending: false })

    if (error) throw error
    return { runId, results: data as SimulationResult[] }
  }
)

export const fetchPerformanceMetrics = createAsyncThunk(
  'simulations/fetchPerformanceMetrics',
  async (runId: string) => {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('run_id', runId)
      .order('timestamp', { ascending: false })

    if (error) throw error
    return { runId, metrics: data as PerformanceMetric[] }
  }
)

export const startSimulationRun = createAsyncThunk(
  'simulations/startSimulationRun',
  async ({ simulationId, parameters, priority = 'normal', realTime = false }: {
    simulationId: string
    parameters: Record<string, any>
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    realTime?: boolean
  }) => {
    const run: Omit<SimulationRun, 'id'> = {
      simulation_id: simulationId,
      status: 'pending',
      parameters,
      priority,
      progress: 0
    }

    const { data, error } = await supabase
      .from('simulation_runs')
      .insert(run)
      .select()
      .single()

    if (error) throw error

    // In a real implementation, this would trigger the simulation engine
    // For now, we'll simulate the start process
    return data as SimulationRun
  }
)

const simulationsSlice = createSlice({
  name: 'simulations',
  initialState,
  reducers: {
    setCurrentSimulation: (state, action: PayloadAction<Simulation | null>) => {
      state.currentSimulation = action.payload
    },
    setFilters: (state, action: PayloadAction<SimulationsState['filters']>) => {
      state.filters = action.payload
    },
    clearFilters: (state) => {
      state.filters = {}
    },
    updateRealtimeData: (state, action: PayloadAction<{ simulationId: string; data: any }>) => {
      state.realtimeData[action.payload.simulationId] = action.payload.data
    },
    clearRealtimeData: (state, action: PayloadAction<string>) => {
      delete state.realtimeData[action.payload]
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch simulations
      .addCase(fetchSimulations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSimulations.fulfilled, (state, action: PayloadAction<Simulation[]>) => {
        state.loading = false
        state.simulations = action.payload
        state.lastFetchedSimulations = Date.now()
      })
      .addCase(fetchSimulations.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch simulations'
      })

      // Fetch simulation by ID
      .addCase(fetchSimulationById.fulfilled, (state, action: PayloadAction<Simulation>) => {
        state.currentSimulation = action.payload
      })

      // Create simulation
      .addCase(createSimulation.fulfilled, (state, action: PayloadAction<Simulation>) => {
        state.simulations.unshift(action.payload)
        state.currentSimulation = action.payload
      })

      // Update simulation
      .addCase(updateSimulation.fulfilled, (state, action: PayloadAction<Simulation>) => {
        const index = state.simulations.findIndex(s => s.id === action.payload.id)
        if (index !== -1) {
          state.simulations[index] = action.payload
        }
        if (state.currentSimulation?.id === action.payload.id) {
          state.currentSimulation = action.payload
        }
      })

      // Delete simulation
      .addCase(deleteSimulation.fulfilled, (state, action: PayloadAction<string>) => {
        state.simulations = state.simulations.filter(s => s.id !== action.payload)
        if (state.currentSimulation?.id === action.payload) {
          state.currentSimulation = null
        }
      })

      // Fetch simulation runs
      .addCase(fetchSimulationRuns.fulfilled, (state, action: PayloadAction<{ simulationId: string; runs: SimulationRun[] }>) => {
        state.simulationRuns[action.payload.simulationId] = action.payload.runs
      })

      // Create simulation run
      .addCase(createSimulationRun.fulfilled, (state, action: PayloadAction<SimulationRun>) => {
        const simulationId = action.payload.simulation_id
        if (!state.simulationRuns[simulationId]) {
          state.simulationRuns[simulationId] = []
        }
        state.simulationRuns[simulationId].unshift(action.payload)
      })

      // Update simulation run
      .addCase(updateSimulationRun.fulfilled, (state, action: PayloadAction<SimulationRun>) => {
        const run = action.payload
        const simulationId = run.simulation_id
        if (state.simulationRuns[simulationId]) {
          const index = state.simulationRuns[simulationId].findIndex(r => r.id === run.id)
          if (index !== -1) {
            state.simulationRuns[simulationId][index] = run
          }
        }
      })

      // Fetch simulation results
      .addCase(fetchSimulationResults.fulfilled, (state, action: PayloadAction<{ runId: string; results: SimulationResult[] }>) => {
        state.simulationResults[action.payload.runId] = action.payload.results
      })

      // Fetch performance metrics
      .addCase(fetchPerformanceMetrics.fulfilled, (state, action: PayloadAction<{ runId: string; metrics: PerformanceMetric[] }>) => {
        state.performanceMetrics[action.payload.runId] = action.payload.metrics
      })
  }
})

export const {
  setCurrentSimulation,
  setFilters,
  clearFilters,
  updateRealtimeData,
  clearRealtimeData,
  clearError
} = simulationsSlice.actions

export default simulationsSlice.reducer

// Selectors
export const selectAllSimulations = (state: any) => (state.simulations?.simulations ?? []) as Simulation[]
export const selectSimulationRuns = (state: any) => {
  const runsMaps = state.simulations?.simulationRuns ?? {}
  const all = Object.values(runsMaps).flat()
  return all as SimulationRun[]
}
export const selectSimulationsLoading = (state: any) => Boolean(state.simulations?.loading)
