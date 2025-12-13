import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabase'

interface NetworkStatistics {
  total_devices: number
  active_devices: number
  total_vlans: number
  total_alerts: number
  critical_alerts: number
  network_in: number
  network_out: number
  timestamp: string
}

interface MetricsState {
  networkStats: NetworkStatistics | null
  loading: boolean
  error: string | null
  lastUpdated: string | null
}

const initialState: MetricsState = {
  networkStats: null,
  loading: false,
  error: null,
  lastUpdated: null,
}

// Async thunks
export const fetchNetworkStatistics = createAsyncThunk(
  'metrics/fetchNetworkStatistics',
  async () => {
    const { data, error } = await supabase
      .from('network_statistics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()
    
    if (error) throw error
    return data as NetworkStatistics
  }
)

export const fetchDeviceCounts = createAsyncThunk(
  'metrics/fetchDeviceCounts',
  async () => {
    // Get total devices count
    const { count: totalDevices } = await supabase
      .from('network_devices')
      .select('*', { count: 'exact', head: true })
    
    // Get active devices count
    const { count: activeDevices } = await supabase
      .from('network_devices')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    
    // Get VLANs count
    const { count: totalVLANs } = await supabase
      .from('vlans')
      .select('*', { count: 'exact', head: true })
    
    // Get alerts count
    const { count: totalAlerts } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
    
    // Get critical alerts count
    const { count: criticalAlerts } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('severity', 'critical')
      .eq('is_resolved', false)
    
    return {
      total_devices: totalDevices || 0,
      active_devices: activeDevices || 0,
      total_vlans: totalVLANs || 0,
      total_alerts: totalAlerts || 0,
      critical_alerts: criticalAlerts || 0,
      network_in: 0,
      network_out: 0,
      timestamp: new Date().toISOString(),
    } as NetworkStatistics
  }
)

const metricsSlice = createSlice({
  name: 'metrics',
  initialState,
  reducers: {
    updateNetworkStats: (state, action: PayloadAction<Partial<NetworkStatistics>>) => {
      if (state.networkStats) {
        state.networkStats = { ...state.networkStats, ...action.payload }
      }
      state.lastUpdated = new Date().toISOString()
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch network statistics
      .addCase(fetchNetworkStatistics.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNetworkStatistics.fulfilled, (state, action: PayloadAction<NetworkStatistics>) => {
        state.loading = false
        state.networkStats = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchNetworkStatistics.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch network statistics'
      })
      // Fetch device counts
      .addCase(fetchDeviceCounts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDeviceCounts.fulfilled, (state, action: PayloadAction<NetworkStatistics>) => {
        state.loading = false
        state.networkStats = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchDeviceCounts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch device counts'
      })
  },
})

export const { updateNetworkStats, clearError } = metricsSlice.actions
export default metricsSlice.reducer