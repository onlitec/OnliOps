import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabase'
import { AnalyticsReport, PerformanceMetric } from '../../lib/simulation-types'

interface AnalyticsState {
  reports: AnalyticsReport[]
  currentReport: AnalyticsReport | null
  systemMetrics: {
    totalSimulations: number
    activeSimulations: number
    completedSimulations: number
    failedSimulations: number
    averageExecutionTime: number
    successRate: number
    resourceUtilization: { cpu: number; memory: number; disk: number }
    performance_history?: {
      timestamps?: string[]
      cpu_usage?: number[]
      memory_usage?: number[]
      response_time?: number[]
    }
    cpu_usage?: { current_value?: number; average?: number; peak?: number; timestamps?: string[]; values?: number[]; threshold?: number; previous_value?: number }
    memory_usage?: { current_value?: number; average?: number; used_gb?: number; total_gb?: number; values?: number[]; timestamps?: string[]; threshold?: number; previous_value?: number }
    storage_usage?: { current_value?: number; average?: number; used_gb?: number; total_gb?: number }
    network_usage?: { current_value?: number; average?: number }
    response_time?: { current_value?: number; previous_value?: number }
    throughput?: { current_value?: number; previous_value?: number }
    error_rate?: { current_value?: number; previous_value?: number }
    availability?: { current_value?: number }
    overall_health?: string
    network_status?: { latency_ms?: number; throughput_mbps?: number; packet_loss_percent?: number; active_connections?: number }
    database_status?: { active_connections?: number; avg_query_time_ms?: number; cache_hit_rate_percent?: number; replication_lag_ms?: number }
    alerts?: { severity: 'info' | 'warning' | 'error' | 'success'; message: string; timestamp: string }[]
    performance_alerts?: { severity: 'info' | 'warning' | 'error' | 'success'; message: string; timestamp: string }[]
    recommendations?: { title: string; description: string; priority: 'low' | 'medium' | 'high' }[]
  }
  performanceData: Record<string, PerformanceMetric[]>
  loading: boolean
  error: string | null
  filters: {
    dateRange?: string
    modelTypes?: string[]
    status?: string[]
    userId?: string
  }
  timeRange: '1h' | '24h' | '7d' | '30d' | '90d' | '1y'
  lastFetchedSystemMetrics?: number
}

const initialState: AnalyticsState = {
  reports: [],
  currentReport: null,
  systemMetrics: {
    totalSimulations: 0,
    activeSimulations: 0,
    completedSimulations: 0,
    failedSimulations: 0,
    averageExecutionTime: 0,
    successRate: 0,
    resourceUtilization: {
      cpu: 0,
      memory: 0,
      disk: 0
    },
    performance_history: { timestamps: [], cpu_usage: [], memory_usage: [], response_time: [] },
    cpu_usage: { current_value: 0, average: 0, peak: 0, values: [], timestamps: [], threshold: 80, previous_value: 0 },
    memory_usage: { current_value: 0, average: 0, used_gb: 0, total_gb: 0, values: [], timestamps: [], threshold: 85, previous_value: 0 },
    storage_usage: { current_value: 0, average: 0, used_gb: 0, total_gb: 0 },
    network_usage: { current_value: 0, average: 0 },
    response_time: { current_value: 0, previous_value: 0 },
    throughput: { current_value: 0, previous_value: 0 },
    error_rate: { current_value: 0, previous_value: 0 },
    availability: { current_value: 99.9 },
    overall_health: 'Excellent',
    network_status: { latency_ms: 0, throughput_mbps: 0, packet_loss_percent: 0, active_connections: 0 },
    database_status: { active_connections: 0, avg_query_time_ms: 0, cache_hit_rate_percent: 0, replication_lag_ms: 0 },
    alerts: [],
    performance_alerts: [],
    recommendations: []
  },
  performanceData: {},
  loading: false,
  error: null,
  filters: {},
  timeRange: '24h'
  ,
  lastFetchedSystemMetrics: 0
}

// Async thunks
export const fetchAnalyticsReports = createAsyncThunk(
  'analytics/fetchAnalyticsReports',
  async (filters?: { dateRange?: string; modelTypes?: string[]; status?: string[]; userId?: string }) => {
    let query = supabase.from('analytics_reports').select('*')

    if (filters?.dateRange) query = query.gte('generated_at', getDateRangeFilter(filters.dateRange))
    if (filters?.userId) query = query.eq('user_id', filters.userId)
    if (filters?.modelTypes && filters.modelTypes.length > 0) {
      query = query.contains('filters', { modelTypes: filters.modelTypes })
    }
    if (filters?.status && filters.status.length > 0) {
      query = query.contains('filters', { status: filters.status })
    }

    const { data, error } = await query.order('generated_at', { ascending: false })

    if (error) throw error
    return data as AnalyticsReport[]
  }
)

export const fetchAnalyticsReportById = createAsyncThunk(
  'analytics/fetchAnalyticsReportById',
  async (reportId: string) => {
    const { data, error } = await supabase
      .from('analytics_reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (error) throw error
    return data as AnalyticsReport
  }
)

export const createAnalyticsReport = createAsyncThunk(
  'analytics/createAnalyticsReport',
  async (report: Omit<AnalyticsReport, 'id' | 'generated_at'>) => {
    const { data, error } = await supabase
      .from('analytics_reports')
      .insert(report)
      .select()
      .single()

    if (error) throw error
    return data as AnalyticsReport
  }
)

export const deleteAnalyticsReport = createAsyncThunk(
  'analytics/deleteAnalyticsReport',
  async (reportId: string) => {
    const { error } = await supabase
      .from('analytics_reports')
      .delete()
      .eq('id', reportId)

    if (error) throw error
    return reportId
  }
)

export const fetchSystemMetrics = createAsyncThunk(
  'analytics/fetchSystemMetrics',
  async (timeRange: string = '24h') => {
    // Retornar métricas mockadas para desenvolvimento local
    const timestamps = Array.from({ length: 24 }, (_, i) => `${i}:00`)
    const cpuSeries = Array.from({ length: 24 }, () => Math.floor(Math.random() * 40) + 40)
    const memSeries = Array.from({ length: 24 }, () => Math.floor(Math.random() * 30) + 60)
    const respSeries = Array.from({ length: 24 }, () => Math.floor(Math.random() * 120) + 30)

    const cpuCurrent = cpuSeries[cpuSeries.length - 1]
    const memCurrent = memSeries[memSeries.length - 1]
    const respCurrent = respSeries[respSeries.length - 1]

    // Valores mockados
    const totalSimulations = 15
    const activeSimulations = 3
    const completedSimulations = 10
    const failedSimulations = 2
    const avgTime = 120
    const successRate = 83.33

    return {
      totalSimulations,
      activeSimulations,
      completedSimulations,
      failedSimulations,
      averageExecutionTime: Math.round(avgTime),
      successRate: Math.round(successRate * 100) / 100,
      resourceUtilization: {
        cpu: cpuCurrent,
        memory: memCurrent,
        disk: Math.round(Math.random() * 100)
      },
      performance_history: {
        timestamps,
        cpu_usage: cpuSeries,
        memory_usage: memSeries,
        response_time: respSeries
      },
      cpu_usage: { current_value: cpuCurrent, average: Math.round(cpuSeries.reduce((s, v) => s + v, 0) / cpuSeries.length), peak: Math.max(...cpuSeries), values: cpuSeries, timestamps, threshold: 80, previous_value: cpuSeries[cpuSeries.length - 2] },
      memory_usage: { current_value: memCurrent, average: Math.round(memSeries.reduce((s, v) => s + v, 0) / memSeries.length), used_gb: 12, total_gb: 16, values: memSeries, timestamps, threshold: 85, previous_value: memSeries[memSeries.length - 2] },
      storage_usage: { current_value: 45, average: 42, used_gb: 225, total_gb: 500 },
      network_usage: { current_value: 38, average: 35 },
      response_time: { current_value: respCurrent, previous_value: respSeries[respSeries.length - 2] },
      throughput: { current_value: 125, previous_value: 120 },
      error_rate: { current_value: 0.5, previous_value: 0.8 },
      availability: { current_value: 99.9 },
      overall_health: 'Excelente',
      network_status: { latency_ms: 12, throughput_mbps: 125, packet_loss_percent: 0.1, active_connections: 24 },
      database_status: { active_connections: 8, avg_query_time_ms: 45, cache_hit_rate_percent: 94, replication_lag_ms: 0 },
      alerts: [],
      performance_alerts: [],
      recommendations: []
    }
  },
  {
    condition: (timeRange, { getState }) => {
      const state = getState() as any
      const last = state.analytics?.lastFetchedSystemMetrics || 0
      const now = Date.now()
      const ttlMs = 15000
      if (now - last < ttlMs) {
        return false
      }
      return true
    }
  }
)

export const fetchPerformanceMetrics = createAsyncThunk(
  'analytics/fetchPerformanceMetrics',
  async ({ runIds, metricNames }: { runIds: string[]; metricNames?: string[] }) => {
    let query = supabase
      .from('performance_metrics')
      .select('*')
      .in('run_id', runIds)

    if (metricNames && metricNames.length > 0) {
      query = query.in('metric_name', metricNames)
    }

    const { data, error } = await query.order('timestamp', { ascending: true })

    if (error) throw error

    // Group metrics by run_id
    const groupedMetrics = data?.reduce((acc: Record<string, PerformanceMetric[]>, metric) => {
      if (!acc[metric.run_id]) {
        acc[metric.run_id] = []
      }
      acc[metric.run_id].push(metric)
      return acc
    }, {}) || {}

    return groupedMetrics
  }
)

export const generateSystemReport = createAsyncThunk(
  'analytics/generateSystemReport',
  async ({ userId, timeRange = '24h', reportType = 'summary' }: {
    userId: string
    timeRange?: string
    reportType?: 'summary' | 'detailed' | 'comparative'
  }) => {
    const dateFilter = getDateRangeFilter(timeRange)

    // Fetch comprehensive system data
    const [
      { data: simulations },
      { data: runs },
      { data: results },
      { data: metrics }
    ] = await Promise.all([
      supabase.from('simulations').select('*').gte('created_at', dateFilter),
      supabase.from('simulation_runs').select('*').gte('created_at', dateFilter),
      supabase.from('simulation_results').select('*').gte('timestamp', dateFilter),
      supabase.from('performance_metrics').select('*').gte('timestamp', dateFilter)
    ])

    // Generate report based on type
    let reportResults = {}

    if (reportType === 'summary') {
      const statusCounts = runs?.reduce((acc: Record<string, number>, run: any) => {
        acc[run.status] = (acc[run.status] || 0) + 1
        return acc
      }, {}) || {}

      const totalRuns = runs?.length || 0
      const successRate = totalRuns > 0 ? ((statusCounts['completed'] || 0) / totalRuns) * 100 : 0

      reportResults = {
        totalSimulations: simulations?.length || 0,
        totalRuns,
        statusBreakdown: statusCounts,
        successRate: Math.round(successRate * 100) / 100,
        averageExecutionTime: calculateAverageExecutionTime(runs),
        mostPopularModel: findMostPopularModel(simulations),
        resourceUtilization: calculateResourceUtilization(metrics)
      }
    } else if (reportType === 'detailed') {
      reportResults = {
        simulations: simulations?.map(sim => ({
          id: sim.id,
          name: sim.name,
          modelType: sim.model_type,
          createdAt: sim.created_at,
          runs: runs?.filter(run => run.simulation_id === sim.id).length || 0
        })),
        performanceMetrics: aggregatePerformanceMetrics(metrics),
        trends: calculateTrends(runs, timeRange),
        recommendations: generateRecommendations(simulations, runs, metrics)
      }
    }

    // Create the report
    const report: Omit<AnalyticsReport, 'id' | 'generated_at'> = {
      user_id: userId,
      report_type: reportType,
      filters: {
        dateRange: timeRange,
        includeMetrics: true,
        includeTrends: reportType !== 'summary'
      },
      results: reportResults,
      simulation_ids: simulations?.map(sim => sim.id) || []
    }

    // Save the report
    const { data: savedReport, error } = await supabase
      .from('analytics_reports')
      .insert(report)
      .select()
      .single()

    if (error) throw error
    return savedReport as AnalyticsReport
  }
)

// Helper functions
function getDateRangeFilter(timeRange: string): string {
  const now = new Date()
  const date = new Date(now)

  switch (timeRange) {
    case '1h':
      date.setHours(now.getHours() - 1)
      break
    case '24h':
      date.setDate(now.getDate() - 1)
      break
    case '7d':
      date.setDate(now.getDate() - 7)
      break
    case '30d':
      date.setDate(now.getDate() - 30)
      break
    case '90d':
      date.setDate(now.getDate() - 90)
      break
    case '1y':
      date.setFullYear(now.getFullYear() - 1)
      break
    default:
      date.setDate(now.getDate() - 1)
  }

  return date.toISOString()
}

function calculateAverageExecutionTime(runs: any[] | null): number {
  if (!runs || runs.length === 0) return 0

  const completedRuns = runs.filter(run => run.status === 'completed' && run.estimated_duration)
  if (completedRuns.length === 0) return 0

  const totalTime = completedRuns.reduce((sum, run) => sum + run.estimated_duration, 0)
  return Math.round(totalTime / completedRuns.length)
}

function findMostPopularModel(simulations: any[] | null): string {
  if (!simulations || simulations.length === 0) return 'N/A'

  const modelCounts = simulations.reduce((acc: Record<string, number>, sim) => {
    acc[sim.model_type] = (acc[sim.model_type] || 0) + 1
    return acc
  }, {})

  return Object.keys(modelCounts).reduce((a, b) =>
    modelCounts[a] > modelCounts[b] ? a : b, Object.keys(modelCounts)[0] || 'N/A'
  )
}

function calculateResourceUtilization(metrics: any[] | null): { cpu: number; memory: number; disk: number } {
  if (!metrics || metrics.length === 0) {
    return { cpu: 0, memory: 0, disk: 0 }
  }

  const cpuMetrics = metrics.filter(m => m.metric_name.includes('cpu'))
  const memoryMetrics = metrics.filter(m => m.metric_name.includes('memory'))
  const diskMetrics = metrics.filter(m => m.metric_name.includes('disk'))

  const avgCpu = cpuMetrics.length > 0 ? cpuMetrics.reduce((sum, m) => sum + m.value, 0) / cpuMetrics.length : 0
  const avgMemory = memoryMetrics.length > 0 ? memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length : 0
  const avgDisk = diskMetrics.length > 0 ? diskMetrics.reduce((sum, m) => sum + m.value, 0) / diskMetrics.length : 0

  return {
    cpu: Math.round(avgCpu * 100) / 100,
    memory: Math.round(avgMemory * 100) / 100,
    disk: Math.round(avgDisk * 100) / 100
  }
}

function aggregatePerformanceMetrics(metrics: any[] | null): Record<string, any> {
  if (!metrics || metrics.length === 0) return {}

  const grouped = metrics.reduce((acc: Record<string, number[]>, metric) => {
    if (!acc[metric.metric_name]) {
      acc[metric.metric_name] = []
    }
    acc[metric.metric_name].push(metric.value)
    return acc
  }, {})

  return Object.keys(grouped).reduce((acc: Record<string, any>, key) => {
    const values = grouped[key]
    acc[key] = {
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    }
    return acc
  }, {})
}

function calculateTrends(runs: any[] | null, timeRange: string): Record<string, any> {
  if (!runs || runs.length === 0) return {}

  // Simple trend calculation - in a real system, this would be more sophisticated
  const recentRuns = runs.slice(-10) // Last 10 runs

  return {
    executionTime: recentRuns.length > 1 ? {
      trend: recentRuns[recentRuns.length - 1].estimated_duration > recentRuns[0].estimated_duration ? 'increasing' : 'decreasing',
      change: Math.abs(recentRuns[recentRuns.length - 1].estimated_duration - recentRuns[0].estimated_duration)
    } : { trend: 'stable', change: 0 },
    successRate: {
      recent: (recentRuns.filter(run => run.status === 'completed').length / recentRuns.length) * 100
    }
  }
}

function generateRecommendations(simulations: any[] | null, runs: any[] | null, metrics: any[] | null): string[] {
  const recommendations: string[] = []

  if (!runs || runs.length === 0) {
    return ['No simulation data available for recommendations']
  }

  const failedRuns = runs.filter(run => run.status === 'failed').length
  const totalRuns = runs.length
  const failureRate = (failedRuns / totalRuns) * 100

  if (failureRate > 20) {
    recommendations.push('High failure rate detected. Review simulation parameters and system resources.')
  }

  if (metrics && metrics.length > 0) {
    const highCpuMetrics = metrics.filter(m => m.metric_name.includes('cpu') && m.value > 80)
    if (highCpuMetrics.length > metrics.length * 0.3) {
      recommendations.push('High CPU utilization detected. Consider optimizing simulation algorithms or increasing computational resources.')
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('System performance is within normal parameters.')
  }

  return recommendations
}

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setCurrentReport: (state, action: PayloadAction<AnalyticsReport | null>) => {
      state.currentReport = action.payload
    },
    setFilters: (state, action: PayloadAction<AnalyticsState['filters']>) => {
      state.filters = action.payload
    },
    clearFilters: (state) => {
      state.filters = {}
    },
    setTimeRange: (state, action: PayloadAction<AnalyticsState['timeRange']>) => {
      state.timeRange = action.payload
    },
    updateSystemMetrics: (state, action: PayloadAction<Partial<AnalyticsState['systemMetrics']>>) => {
      state.systemMetrics = { ...state.systemMetrics, ...action.payload }
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch analytics reports
      .addCase(fetchAnalyticsReports.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAnalyticsReports.fulfilled, (state, action: PayloadAction<AnalyticsReport[]>) => {
        state.loading = false
        state.reports = action.payload
      })
      .addCase(fetchAnalyticsReports.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch analytics reports'
      })

      // Fetch analytics report by ID
      .addCase(fetchAnalyticsReportById.fulfilled, (state, action: PayloadAction<AnalyticsReport>) => {
        state.currentReport = action.payload
      })

      // Create analytics report
      .addCase(createAnalyticsReport.fulfilled, (state, action: PayloadAction<AnalyticsReport>) => {
        state.reports.unshift(action.payload)
        state.currentReport = action.payload
      })

      // Delete analytics report
      .addCase(deleteAnalyticsReport.fulfilled, (state, action: PayloadAction<string>) => {
        state.reports = state.reports.filter(report => report.id !== action.payload)
        if (state.currentReport?.id === action.payload) {
          state.currentReport = null
        }
      })

      // Fetch system metrics
      .addCase(fetchSystemMetrics.fulfilled, (state, action) => {
        state.systemMetrics = action.payload
        state.lastFetchedSystemMetrics = Date.now()
      })

      // Fetch performance metrics
      .addCase(fetchPerformanceMetrics.fulfilled, (state, action) => {
        state.performanceData = { ...state.performanceData, ...action.payload }
      })

      // Generate system report
      .addCase(generateSystemReport.fulfilled, (state, action: PayloadAction<AnalyticsReport>) => {
        state.reports.unshift(action.payload)
        state.currentReport = action.payload
      })
  }
})

export const {
  setCurrentReport,
  setFilters,
  clearFilters,
  setTimeRange,
  updateSystemMetrics,
  clearError
} = analyticsSlice.actions

export default analyticsSlice.reducer

// Selectors
export const selectSystemMetrics = (state: any) => state.analytics?.systemMetrics as AnalyticsState['systemMetrics']
export const selectAnalyticsLoading = (state: any) => Boolean(state.analytics?.loading)
