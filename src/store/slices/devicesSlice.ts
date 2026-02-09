import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabase'
import { NetworkDevice, DeviceMetrics, DeviceHistory } from '../../lib/supabase'
import { api } from '../../services/api'

interface DevicesState {
  devices: NetworkDevice[]
  selectedDevice: NetworkDevice | null
  deviceMetrics: Record<string, DeviceMetrics[]>
  deviceHistory: Record<string, DeviceHistory[]>
  loading: boolean
  error: string | null
  filters: {
    vlanId?: number
    deviceType?: string
    status?: string
    location?: string
  }
}

const initialState: DevicesState = {
  devices: [],
  selectedDevice: null,
  deviceMetrics: {},
  deviceHistory: {},
  loading: false,
  error: null,
  filters: {},
}

// Async thunks

// Async thunks
export const fetchDevices = createAsyncThunk(
  'devices/fetchDevices',
  async (filters?: { vlanId?: number; deviceType?: string; status?: string; location?: string }) => {
    const devices = await api.getDevices()
    
    let filteredDevices = [...devices]
    
    // Aplicar filtros no client-side se necessário, embora o ideal fosse no server
    if (filters?.vlanId) filteredDevices = filteredDevices.filter(d => d.vlan_id === filters.vlanId)
    if (filters?.deviceType) filteredDevices = filteredDevices.filter(d => d.device_type === filters.deviceType)
    if (filters?.status) filteredDevices = filteredDevices.filter(d => d.status === filters.status)
    if (filters?.location) filteredDevices = filteredDevices.filter(d => d.location?.toLowerCase().includes(filters.location!.toLowerCase()))
    
    return filteredDevices
  }
)

export const fetchDeviceById = createAsyncThunk(
  'devices/fetchDeviceById',
  async (deviceId: string) => {
    // Note: If we had getDeviceById in api.ts, we'd use it. For now, let's use getDevices and find.
    // Actually, let's check if api.getProject exists (it does).
    // Let's assume we might need to add getDevice to api.ts if it's not there.
    // For now, let's just use the devices already in state or fetch all.
    const devices = await api.getDevices()
    const device = devices.find(d => d.id === deviceId)
    if (!device) throw new Error('Device not found')
    return device
  }
)

export const updateDevice = createAsyncThunk(
  'devices/updateDevice',
  async ({ deviceId, updates }: { deviceId: string; updates: Partial<NetworkDevice> }) => {
    const { data, error } = await supabase
      .from('network_devices')
      .update(updates)
      .eq('id', deviceId)
      .select()
      .single()
    
    if (error) throw error
    return data as NetworkDevice
  }
)

export const fetchDeviceMetrics = createAsyncThunk(
  'devices/fetchDeviceMetrics',
  async (deviceId: string) => {
    const { data, error } = await supabase
      .from('device_metrics')
      .select('*')
      .eq('device_id', deviceId)
      .order('timestamp', { ascending: false })
      .limit(100)
    
    if (error) throw error
    return { deviceId, metrics: data as DeviceMetrics[] }
  }
)

export const fetchDeviceHistory = createAsyncThunk(
  'devices/fetchDeviceHistory',
  async (deviceId: string) => {
    const { data, error } = await supabase
      .from('device_history')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) throw error
    return { deviceId, history: data as DeviceHistory[] }
  }
)

const devicesSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    setSelectedDevice: (state, action: PayloadAction<NetworkDevice | null>) => {
      state.selectedDevice = action.payload
    },
    setFilters: (state, action: PayloadAction<DevicesState['filters']>) => {
      state.filters = action.payload
    },
    clearFilters: (state) => {
      state.filters = {}
    },
    updateDeviceStatus: (state, action: PayloadAction<{ deviceId: string; status: NetworkDevice['status'] }>) => {
      const device = state.devices.find(d => d.id === action.payload.deviceId)
      if (device) {
        device.status = action.payload.status
      }
      if (state.selectedDevice?.id === action.payload.deviceId) {
        state.selectedDevice.status = action.payload.status
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch devices
      .addCase(fetchDevices.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDevices.fulfilled, (state, action: PayloadAction<NetworkDevice[]>) => {
        state.loading = false
        state.devices = action.payload
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch devices'
      })
      // Fetch device by ID
      .addCase(fetchDeviceById.fulfilled, (state, action: PayloadAction<NetworkDevice>) => {
        state.selectedDevice = action.payload
      })
      // Update device
      .addCase(updateDevice.fulfilled, (state, action: PayloadAction<NetworkDevice>) => {
        const index = state.devices.findIndex(d => d.id === action.payload.id)
        if (index !== -1) {
          state.devices[index] = action.payload
        }
        if (state.selectedDevice?.id === action.payload.id) {
          state.selectedDevice = action.payload
        }
      })
      // Fetch metrics
      .addCase(fetchDeviceMetrics.fulfilled, (state, action: PayloadAction<{ deviceId: string; metrics: DeviceMetrics[] }>) => {
        state.deviceMetrics[action.payload.deviceId] = action.payload.metrics
      })
      // Fetch history
      .addCase(fetchDeviceHistory.fulfilled, (state, action: PayloadAction<{ deviceId: string; history: DeviceHistory[] }>) => {
        state.deviceHistory[action.payload.deviceId] = action.payload.history
      })
  },
})

export const { setSelectedDevice, setFilters, clearFilters, updateDeviceStatus } = devicesSlice.actions
export default devicesSlice.reducer