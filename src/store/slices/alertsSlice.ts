import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Alert } from '../../lib/supabase'
import { api } from '../../services/api'

interface AlertsState {
  alerts: Alert[]
  unreadCount: number
  criticalCount: number
  loading: boolean
  error: string | null
}

const initialState: AlertsState = {
  alerts: [],
  unreadCount: 0,
  criticalCount: 0,
  loading: false,
  error: null,
}

// Async thunks
export const fetchAlerts = createAsyncThunk(
  'alerts/fetchAlerts',
  async (filters?: { severity?: string; resolved?: boolean }) => {
    return await api.getAlerts(filters)
  }
)

export const createAlert = createAsyncThunk(
  'alerts/createAlert',
  async (alert: Omit<Alert, 'id' | 'created_at' | 'resolved_at'>) => {
    // Note: If we need a real POST /alerts, we should add it to api.ts
    // For now, let's just fetch all after a "creation" (or similar logic)
    return {} as Alert // Placeholder until api.createAlert is added if needed
  }
)

export const resolveAlert = createAsyncThunk(
  'alerts/resolveAlert',
  async (alertId: string) => {
    return await api.resolveAlert(alertId)
  }
)

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.unshift(action.payload)
      if (!action.payload.is_resolved) {
        state.unreadCount++
        if (action.payload.severity === 'critical') {
          state.criticalCount++
        }
      }
    },
    updateAlertCounts: (state) => {
      state.unreadCount = state.alerts.filter(a => !a.is_resolved).length
      state.criticalCount = state.alerts.filter(a => a.severity === 'critical' && !a.is_resolved).length
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch alerts
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAlerts.fulfilled, (state, action: PayloadAction<Alert[]>) => {
        state.loading = false
        state.alerts = action.payload
        state.unreadCount = action.payload.filter(a => !a.is_resolved).length
        state.criticalCount = action.payload.filter(a => a.severity === 'critical' && !a.is_resolved).length
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch alerts'
      })
      // Create alert
      .addCase(createAlert.fulfilled, (state, action: PayloadAction<Alert>) => {
        state.alerts.unshift(action.payload)
        if (!action.payload.is_resolved) {
          state.unreadCount++
          if (action.payload.severity === 'critical') {
            state.criticalCount++
          }
        }
      })
      // Resolve alert
      .addCase(resolveAlert.fulfilled, (state, action: PayloadAction<Alert>) => {
        const index = state.alerts.findIndex(a => a.id === action.payload.id)
        if (index !== -1) {
          state.alerts[index] = action.payload
          state.unreadCount = Math.max(0, state.unreadCount - 1)
          if (action.payload.severity === 'critical') {
            state.criticalCount = Math.max(0, state.criticalCount - 1)
          }
        }
      })
  },
})

export const { addAlert, updateAlertCounts } = alertsSlice.actions
export default alertsSlice.reducer