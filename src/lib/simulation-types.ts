// Simulation System Types

export interface Simulation {
  id: string
  name: string
  model_type: string
  description?: string
  created_by: string
  created_at: string
  updated_at: string
  configuration: SimulationConfiguration
  is_template: boolean
  is_public: boolean
}

export interface SimulationConfiguration {
  parameters: Record<string, any>
  initial_conditions?: Record<string, any>
  boundary_conditions?: Record<string, any>
  model_specific?: Record<string, any>
}

export interface SimulationRun {
  id: string
  simulation_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  start_time?: string
  end_time?: string
  created_at?: string
  parameters: Record<string, any>
  priority: 'low' | 'normal' | 'high' | 'urgent'
  error_message?: string
  resource_usage?: ResourceUsage
  progress?: number
  estimated_duration?: number
  duration_seconds?: number
}

export interface ResourceUsage {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  network_io: number
}

export interface SimulationResult {
  id: string
  run_id: string
  data: Record<string, any>
  result_type: string
  timestamp: string
  file_path?: string
  file_size?: number
}

export interface PerformanceMetric {
  id: string
  run_id: string
  metric_name: string
  value: number
  unit?: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface SimulationParameter {
  id: string
  simulation_id: string
  parameter_name: string
  parameter_type: 'number' | 'string' | 'boolean' | 'array' | 'object'
  value_range?: {
    min?: number
    max?: number
    step?: number
    options?: string[]
  }
  default_value: any
  description?: string
  validation_rules?: Record<string, any>
}

export interface AnalyticsReport {
  id: string
  user_id: string
  report_type: 'summary' | 'detailed' | 'comparative' | 'trend'
  filters: Record<string, any>
  results: Record<string, any>
  generated_at: string
  simulation_ids?: string[]
}

export interface SimulationTemplate {
  id: string
  name: string
  description?: string
  model_type: string
  configuration: SimulationConfiguration
  category: string
  tags: string[]
  is_public: boolean
  created_by: string
  created_at: string
  usage_count: number
  rating?: number
}

export interface VisualizationConfig {
  id: string
  simulation_id: string
  chart_type: 'line' | 'bar' | 'scatter' | 'heatmap' | '3d' | 'custom'
  config: {
    title?: string
    x_axis?: Record<string, any>
    y_axis?: Record<string, any>
    z_axis?: Record<string, any>
    colors?: string[]
    animations?: boolean
    real_time?: boolean
  }
  data_mapping: Record<string, string>
  created_at: string
}

export interface RealTimeData {
  simulation_id: string
  run_id: string
  timestamp: string
  data: Record<string, any>
  metrics?: Record<string, number>
  status: 'active' | 'completed' | 'error'
}
