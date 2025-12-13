import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabase'
import { NetworkDevice, DeviceMetrics, DeviceHistory } from '../../lib/supabase'

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

// Dados mockados para desenvolvimento local
const MOCK_DEVICES: NetworkDevice[] = [
  {
    id: 'dev1',
    vlan_id: 100,
    device_type: 'camera',
    model: 'Hikvision DS-2CD2385G1',
    manufacturer: 'Hikvision',
    ip_address: '192.168.100.10',
    mac_address: '00:11:22:33:44:55',
    hostname: 'camera-entrada-principal',
    location: 'Entrada Principal - Portão A',
    status: 'active',
    configuration: { resolution: '8MP', fps: 30, codec: 'H.265' },
    last_seen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'dev2',
    vlan_id: 100,
    device_type: 'camera',
    model: 'Dahua IPC-HFW5831E',
    manufacturer: 'Dahua',
    ip_address: '192.168.100.11',
    mac_address: '00:11:22:33:44:56',
    hostname: 'camera-estacionamento-01',
    location: 'Estacionamento - Setor Norte',
    status: 'active',
    configuration: { resolution: '4K', fps: 25, codec: 'H.264' },
    last_seen: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'dev3',
    vlan_id: 10,
    device_type: 'switch',
    model: 'Cisco Catalyst 2960X-24TS',
    manufacturer: 'Cisco',
    ip_address: '192.168.10.1',
    mac_address: 'A0:B1:C2:D3:E4:F5',
    hostname: 'sw-core-01',
    location: 'Rack Principal - Datacenter',
    status: 'active',
    configuration: { ports: 24, uplink: '1Gbps', managed: true },
    last_seen: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'dev4',
    vlan_id: 10,
    device_type: 'switch',
    model: 'TP-Link TL-SG1024DE',
    manufacturer: 'TP-Link',
    ip_address: '192.168.10.2',
    mac_address: 'A0:B1:C2:D3:E4:F6',
    hostname: 'sw-dist-01',
    location: 'Rack Distribuição - Andar 2',
    status: 'active',
    configuration: { ports: 24, uplink: '1Gbps', managed: true },
    last_seen: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'dev5',
    vlan_id: 100,
    device_type: 'nvr',
    model: 'Intelbras NVD 3132',
    manufacturer: 'Intelbras',
    ip_address: '192.168.100.5',
    mac_address: 'B0:C1:D2:E3:F4:05',
    hostname: 'nvr-principal',
    location: 'Sala de Segurança',
    status: 'active',
    configuration: { channels: 32, storage: '8TB', recording: '24/7' },
    last_seen: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'dev6',
    vlan_id: 20,
    device_type: 'router',
    model: 'MikroTik CCR1036',
    manufacturer: 'MikroTik',
    ip_address: '192.168.20.1',
    mac_address: 'C0:D1:E2:F3:04:15',
    hostname: 'router-edge-01',
    location: 'Datacenter - Gateway',
    status: 'active',
    configuration: { wan: 'fiber', firewall: 'enabled', vpn: 'active' },
    last_seen: new Date(Date.now() - 30 * 1000).toISOString(),
    created_at: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'dev7',
    vlan_id: 100,
    device_type: 'camera',
    model: 'Intelbras VIP 3220 D',
    manufacturer: 'Intelbras',
    ip_address: '192.168.100.12',
    mac_address: '00:11:22:33:44:57',
    hostname: 'camera-recepcao',
    location: 'Recepção Principal',
    status: 'inactive',
    configuration: { resolution: '2MP', fps: 30, codec: 'H.264' },
    last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'dev8',
    vlan_id: 30,
    device_type: 'router',
    model: 'Dell PowerEdge R740',
    manufacturer: 'Dell',
    ip_address: '192.168.30.10',
    mac_address: 'D0:E1:F2:03:14:25',
    hostname: 'srv-app-01',
    location: 'Datacenter - Rack 1',
    status: 'active',
    configuration: { cpu: 'Xeon Gold 6248', ram: '128GB', storage: 'RAID10 4TB' },
    last_seen: new Date(Date.now() - 10 * 1000).toISOString(),
    created_at: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
]

// Async thunks
export const fetchDevices = createAsyncThunk(
  'devices/fetchDevices',
  async (filters?: { vlanId?: number; deviceType?: string; status?: string; location?: string }) => {
    // Retornar dispositivos mockados
    await new Promise(resolve => setTimeout(resolve, 400))
    
    let devices = [...MOCK_DEVICES]
    
    // Aplicar filtros
    if (filters?.vlanId) devices = devices.filter(d => d.vlan_id === filters.vlanId)
    if (filters?.deviceType) devices = devices.filter(d => d.device_type === filters.deviceType)
    if (filters?.status) devices = devices.filter(d => d.status === filters.status)
    if (filters?.location) devices = devices.filter(d => d.location.toLowerCase().includes(filters.location!.toLowerCase()))
    
    return devices
  }
)

export const fetchDeviceById = createAsyncThunk(
  'devices/fetchDeviceById',
  async (deviceId: string) => {
    const { data, error } = await supabase
      .from('network_devices')
      .select('*')
      .eq('id', deviceId)
      .single()
    
    if (error) throw error
    return data as NetworkDevice
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