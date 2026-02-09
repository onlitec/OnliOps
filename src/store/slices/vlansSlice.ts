import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { VLAN } from '../../lib/supabase'
import { api } from '../../services/api'

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

// Async thunks

// Async thunks
export const fetchVLANs = createAsyncThunk(
  'vlans/fetchVLANs',
  async () => {
    return await api.getVlans()
  }
)

export const createVLAN = createAsyncThunk(
  'vlans/createVLAN',
  async (vlan: Omit<VLAN, 'created_at' | 'updated_at'>) => {
    return await api.createVlan(vlan)
  }
)

export const updateVLAN = createAsyncThunk(
  'vlans/updateVLAN',
  async ({ vlanId, updates }: { vlanId: number; updates: Partial<VLAN> }) => {
    return await api.updateVlan(vlanId, updates)
  }
)

export const deleteVLAN = createAsyncThunk(
  'vlans/deleteVLAN',
  async (vlanId: number) => {
    await api.deleteVlan(vlanId)
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