-- Simulation System Database Schema

-- Users table (extends existing users table if needed)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'analyst' CHECK (role IN ('analyst', 'admin', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Simulations table
CREATE TABLE simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    configuration JSONB NOT NULL,
    is_template BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false
);

-- Simulation Runs table
CREATE TABLE simulation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    parameters JSONB,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    error_message TEXT,
    resource_usage JSONB,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    estimated_duration INTEGER
);

-- Simulation Results table
CREATE TABLE simulation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES simulation_runs(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    result_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_path VARCHAR(500),
    file_size BIGINT
);

-- Performance Metrics table
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES simulation_runs(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    value FLOAT NOT NULL,
    unit VARCHAR(20),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Simulation Parameters table
CREATE TABLE simulation_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    parameter_name VARCHAR(100) NOT NULL,
    parameter_type VARCHAR(20) CHECK (parameter_type IN ('number', 'string', 'boolean', 'array', 'object')),
    value_range JSONB,
    default_value JSONB,
    description TEXT,
    validation_rules JSONB
);

-- Analytics Reports table
CREATE TABLE analytics_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    report_type VARCHAR(20) CHECK (report_type IN ('summary', 'detailed', 'comparative', 'trend')),
    filters JSONB,
    results JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    simulation_ids UUID[]
);

-- Visualization Configs table
CREATE TABLE visualization_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    chart_type VARCHAR(20) CHECK (chart_type IN ('line', 'bar', 'scatter', 'heatmap', '3d', 'custom')),
    config JSONB,
    data_mapping JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simulation Templates table
CREATE TABLE simulation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    model_type VARCHAR(100) NOT NULL,
    configuration JSONB NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0,
    rating FLOAT CHECK (rating >= 0 AND rating <= 5)
);

-- Create indexes for better performance
CREATE INDEX idx_simulations_created_by ON simulations(created_by);
CREATE INDEX idx_simulations_model_type ON simulations(model_type);
CREATE INDEX idx_simulations_created_at ON simulations(created_at DESC);
CREATE INDEX idx_simulations_is_template ON simulations(is_template);
CREATE INDEX idx_simulations_is_public ON simulations(is_public);

CREATE INDEX idx_simulation_runs_simulation_id ON simulation_runs(simulation_id);
CREATE INDEX idx_simulation_runs_status ON simulation_runs(status);
CREATE INDEX idx_simulation_runs_priority ON simulation_runs(priority);
CREATE INDEX idx_simulation_runs_start_time ON simulation_runs(start_time DESC);

CREATE INDEX idx_simulation_results_run_id ON simulation_results(run_id);
CREATE INDEX idx_simulation_results_result_type ON simulation_results(result_type);
CREATE INDEX idx_simulation_results_timestamp ON simulation_results(timestamp DESC);

CREATE INDEX idx_performance_metrics_run_id ON performance_metrics(run_id);
CREATE INDEX idx_performance_metrics_metric_name ON performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);

CREATE INDEX idx_simulation_parameters_simulation_id ON simulation_parameters(simulation_id);
CREATE INDEX idx_simulation_parameters_parameter_name ON simulation_parameters(parameter_name);

CREATE INDEX idx_analytics_reports_user_id ON analytics_reports(user_id);
CREATE INDEX idx_analytics_reports_generated_at ON analytics_reports(generated_at DESC);

CREATE INDEX idx_visualization_configs_simulation_id ON visualization_configs(simulation_id);
CREATE INDEX idx_visualization_configs_chart_type ON visualization_configs(chart_type);

CREATE INDEX idx_simulation_templates_created_by ON simulation_templates(created_by);
CREATE INDEX idx_simulation_templates_model_type ON simulation_templates(model_type);
CREATE INDEX idx_simulation_templates_category ON simulation_templates(category);
CREATE INDEX idx_simulation_templates_is_public ON simulation_templates(is_public);
CREATE INDEX idx_simulation_templates_usage_count ON simulation_templates(usage_count DESC);