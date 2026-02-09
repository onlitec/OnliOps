import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { api } from '../../services/api'

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
    const metrics = await api.getPlatformMetrics()
    return {
      total_devices: metrics.totalDevices || 0,
      active_devices: metrics.totalDevices || 0, // Placeholder
      total_vlans: 0,
      total_alerts: metrics.activeAlerts || 0,
      critical_alerts: metrics.activeAlerts || 0,
      network_in: 0,
      network_out: 0,
      timestamp: metrics.lastUpdate || new Date().toISOString(),
    } as NetworkStatistics
  }
)

export const fetchDeviceCounts = createAsyncThunk(
  'metrics/fetchDeviceCounts',
  async () => {
    const metrics = await api.getPlatformMetrics()
    return {
      total_devices: metrics.totalDevices || 0,
      active_devices: metrics.totalDevices || 0,
      total_vlans: 0,
      total_alerts: metrics.activeAlerts || 0,
      critical_alerts: metrics.activeAlerts || 0,
      network_in: 0,
      network_out: 0,
      timestamp: metrics.lastUpdate || new Date().toISOString(),
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