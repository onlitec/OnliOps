import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

function isValidHttpUrl(u: string) {
  try {
    const url = new URL(u)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

class NoopBuilder {
  private _resolve = { data: [], error: null }
  
  eq() { return this }
  neq() { return this }
  gt() { return this }
  gte() { return this }
  lt() { return this }
  lte() { return this }
  like() { return this }
  ilike() { return this }
  is() { return this }
  in() { return this }
  contains() { return this }
  containedBy() { return this }
  rangeLt() { return this }
  rangeGt() { return this }
  rangeGte() { return this }
  rangeLte() { return this }
  rangeAdjacent() { return this }
  overlaps() { return this }
  textSearch() { return this }
  match() { return this }
  not() { return this }
  or() { return this }
  filter() { return this }
  order() { return this }
  limit() { return this }
  range() { return this }
  abortSignal() { return this }
  select() { return this }
  insert() { return this }
  upsert() { return this }
  update() { return this }
  delete() { return this }
  
  single() { 
    this._resolve = { data: null, error: null }
    return this 
  }
  
  maybeSingle() { 
    this._resolve = { data: null, error: null }
    return this 
  }
  
  // Make it thenable so it works with await
  then(resolve: any, reject?: any) {
    return Promise.resolve(this._resolve).then(resolve, reject)
  }
  
  catch(reject: any) {
    return Promise.resolve(this._resolve).catch(reject)
  }
}

const noopSupabase: any = {
  from() { return new NoopBuilder() },
  channel() { return { on() { return this }, subscribe() { return {} } } },
  removeChannel() { /* no-op */ },
  auth: {
    signInWithPassword: () => Promise.reject(new Error('Supabase não configurado')),
    signInWithOAuth: () => Promise.reject(new Error('Supabase não configurado')),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: (cb: (event: string, session: any) => void) => ({ data: { subscription: { unsubscribe() { /* no-op */ } } }, error: null }),
  },
}

export const supabase = (isValidHttpUrl(supabaseUrl) && !!supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : noopSupabase

export const supabaseConfigured = isValidHttpUrl(supabaseUrl) && !!supabaseAnonKey

// Database types
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'security_operator' | 'technical_viewer' | 'guest' | 'simulation_admin' | 'simulation_analyst' | 'simulation_viewer'
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
  department?: string
  permissions?: string[]
}

export interface VLAN {
  vlan_id: number
  name: string
  subnet: string
  gateway: string
  description?: string
  firewall_rules?: any
  created_at: string
  updated_at: string
}

export interface NetworkDevice {
  id: string
  vlan_id: number
  managed_by?: string
  device_type: 'camera' | 'nvr' | 'dvr' | 'switch' | 'router' | 'firewall' | 'access_point' | 'reader' | 'controller' | 'converter' | 'patch_panel' | 'server' | 'pc' | 'ap_wifi' | 'intercom' | 'elevator_recorder' | 'other'
  model: string
  manufacturer: string
  ip_address: string
  mac_address?: string
  hostname?: string
  location?: string
  status: 'active' | 'inactive' | 'maintenance' | 'error'
  configuration?: any
  last_seen?: string
  created_at: string
  updated_at: string
  // Inventory fields
  serial_number?: string
  tag?: string
  firmware_version?: string
  admin_username?: string
  admin_password_enc?: string
  photo_url?: string
  install_date?: string
  last_maintenance_date?: string
  notes?: string
  patch_panel?: string
  patch_panel_port?: string
  switch_port?: string
  connected_nvr_id?: string
  custom_fields?: any
}

export interface DeviceMetrics {
  id: string
  device_id: string
  timestamp: string
  cpu_usage: number
  memory_usage: number
  network_in: number
  network_out: number
  active_connections: number
  custom_metrics?: any
}

export interface DeviceConnection {
  id: string
  from_device_id: string
  to_device_id: string
  connection_type: string
  port_from?: string
  port_to?: string
  bandwidth?: number
  status: string
  established_at?: string
}

export interface DeviceHistory {
  id: string
  device_id: string
  user_id?: string
  action_type: string
  old_values?: any
  new_values?: any
  notes?: string
  ip_address?: string
  created_at: string
}

export interface Alert {
  id: string
  device_id?: string
  alert_type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  description?: string
  metadata?: any
  is_resolved: boolean
  created_at: string
  resolved_at?: string
}

export interface MaintenanceLog {
  id: string
  device_id: string
  technician_name: string
  description: string
  service_date: string
  attachments_url?: string[]
  created_at: string
  updated_at: string
}
