import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabase'
import { VLAN } from '../../lib/supabase'

interface VLANsState {
  vlans: VLAN[]
  selectedVLAN: VLAN | null
  loading: boolean
  error: string | null
}

const initialState: VLANsState = {
  vlans: [],
  selectedVLAN: null,
  loading: false,
  error: null,
}

// Dados mockados para desenvolvimento local
const MOCK_VLANS: VLAN[] = [
  {
    vlan_id: 10,
    name: 'VLAN Gerenciamento',
    description: 'VLAN para gerenciamento de switches e routers',
    subnet: '192.168.10.0/24',
    gateway: '192.168.10.1',
    created_at: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    vlan_id: 20,
    name: 'VLAN Servidores',
    description: 'VLAN para servidores de aplicação e banco de dados',
    subnet: '192.168.20.0/24',
    gateway: '192.168.20.1',
    created_at: new Date(Date.now() - 450 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    vlan_id: 30,
    name: 'VLAN Usuários',
    description: 'VLAN para estações de trabalho',
    subnet: '192.168.30.0/23',
    gateway: '192.168.30.1',
    created_at: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    vlan_id: 100,
    name: 'VLAN Câmeras e Segurança',
    description: 'VLAN isolada para câmeras IP, NVRs e sistema de segurança',
    subnet: '192.168.100.0/24',
    gateway: '192.168.100.1',
    created_at: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    vlan_id: 200,
    name: 'VLAN Convidados',
    description: 'VLAN para acesso de convidados (isolada)',
    subnet: '192.168.200.0/24',
    gateway: '192.168.200.1',
    created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
]

// Async thunks
export const fetchVLANs = createAsyncThunk(
  'vlans/fetchVLANs',
  async () => {
    // Retornar VLANs mockadas
    await new Promise(resolve => setTimeout(resolve, 300))
    return [...MOCK_VLANS]
  }
)

export const createVLAN = createAsyncThunk(
  'vlans/createVLAN',
  async (vlan: Omit<VLAN, 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('vlans')
      .insert(vlan)
      .select()
      .single()
    
    if (error) throw error
    return data as VLAN
  }
)

export const updateVLAN = createAsyncThunk(
  'vlans/updateVLAN',
  async ({ vlanId, updates }: { vlanId: number; updates: Partial<VLAN> }) => {
    const { data, error } = await supabase
      .from('vlans')
      .update(updates)
      .eq('vlan_id', vlanId)
      .select()
      .single()
    
    if (error) throw error
    return data as VLAN
  }
)

export const deleteVLAN = createAsyncThunk(
  'vlans/deleteVLAN',
  async (vlanId: number) => {
    const { error } = await supabase
      .from('vlans')
      .delete()
      .eq('vlan_id', vlanId)
    
    if (error) throw error
    return vlanId
  }
)

const vlansSlice = createSlice({
  name: 'vlans',
  initialState,
  reducers: {
    setSelectedVLAN: (state, action: PayloadAction<VLAN | null>) => {
      state.selectedVLAN = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch VLANs
      .addCase(fetchVLANs.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchVLANs.fulfilled, (state, action: PayloadAction<VLAN[]>) => {
        state.loading = false
        state.vlans = action.payload
      })
      .addCase(fetchVLANs.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch VLANs'
      })
      // Create VLAN
      .addCase(createVLAN.fulfilled, (state, action: PayloadAction<VLAN>) => {
        state.vlans.push(action.payload)
      })
      // Update VLAN
      .addCase(updateVLAN.fulfilled, (state, action: PayloadAction<VLAN>) => {
        const index = state.vlans.findIndex(v => v.vlan_id === action.payload.vlan_id)
        if (index !== -1) {
          state.vlans[index] = action.payload
        }
        if (state.selectedVLAN?.vlan_id === action.payload.vlan_id) {
          state.selectedVLAN = action.payload
        }
      })
      // Delete VLAN
      .addCase(deleteVLAN.fulfilled, (state, action: PayloadAction<number>) => {
        state.vlans = state.vlans.filter(v => v.vlan_id !== action.payload)
        if (state.selectedVLAN?.vlan_id === action.payload) {
          state.selectedVLAN = null
        }
      })
  },
})

export const { setSelectedVLAN } = vlansSlice.actions
export default vlansSlice.reducer