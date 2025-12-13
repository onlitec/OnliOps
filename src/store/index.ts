import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import devicesSlice from './slices/devicesSlice'
import vlansSlice from './slices/vlansSlice'
import alertsSlice from './slices/alertsSlice'
import metricsSlice from './slices/metricsSlice'
import projectSlice from './slices/projectSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    devices: devicesSlice,
    vlans: vlansSlice,
    alerts: alertsSlice,
    metrics: metricsSlice,
    project: projectSlice,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch