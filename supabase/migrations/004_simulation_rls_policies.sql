-- Row Level Security Policies for Simulation System

-- Enable RLS on all simulation tables
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE visualization_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_templates ENABLE ROW LEVEL SECURITY;

-- Grant basic read access to anon role
GRANT SELECT ON simulations TO anon;
GRANT SELECT ON simulation_runs TO anon;
GRANT SELECT ON simulation_results TO anon;
GRANT SELECT ON performance_metrics TO anon;
GRANT SELECT ON simulation_parameters TO anon;
GRANT SELECT ON analytics_reports TO anon;
GRANT SELECT ON visualization_configs TO anon;
GRANT SELECT ON simulation_templates TO anon;

-- Grant full access to authenticated role
GRANT ALL PRIVILEGES ON simulations TO authenticated;
GRANT ALL PRIVILEGES ON simulation_runs TO authenticated;
GRANT ALL PRIVILEGES ON simulation_results TO authenticated;
GRANT ALL PRIVILEGES ON performance_metrics TO authenticated;
GRANT ALL PRIVILEGES ON simulation_parameters TO authenticated;
GRANT ALL PRIVILEGES ON analytics_reports TO authenticated;
GRANT ALL PRIVILEGES ON visualization_configs TO authenticated;
GRANT ALL PRIVILEGES ON simulation_templates TO authenticated;

-- RLS Policies for Simulations
CREATE POLICY "Users can view their own simulations" ON simulations
    FOR SELECT USING (auth.uid() = created_by OR is_public = true);

CREATE POLICY "Users can create simulations" ON simulations
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own simulations" ON simulations
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own simulations" ON simulations
    FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for Simulation Runs
CREATE POLICY "Users can view runs of their simulations" ON simulation_runs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM simulations 
            WHERE simulations.id = simulation_runs.simulation_id 
            AND (simulations.created_by = auth.uid() OR simulations.is_public = true)
        )
    );

CREATE POLICY "Users can create simulation runs" ON simulation_runs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM simulations 
            WHERE simulations.id = simulation_runs.simulation_id 
            AND simulations.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update runs of their simulations" ON simulation_runs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM simulations 
            WHERE simulations.id = simulation_runs.simulation_id 
            AND simulations.created_by = auth.uid()
        )
    );

-- RLS Policies for Simulation Results
CREATE POLICY "Users can view results of their simulations" ON simulation_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM simulations 
            JOIN simulation_runs ON simulation_runs.simulation_id = simulations.id
            WHERE simulation_runs.id = simulation_results.run_id 
            AND (simulations.created_by = auth.uid() OR simulations.is_public = true)
        )
    );

CREATE POLICY "Users can create simulation results" ON simulation_results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM simulations 
            JOIN simulation_runs ON simulation_runs.simulation_id = simulations.id
            WHERE simulation_runs.id = simulation_results.run_id 
            AND simulations.created_by = auth.uid()
        )
    );

-- RLS Policies for Performance Metrics
CREATE POLICY "Users can view metrics of their simulations" ON performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM simulations 
            JOIN simulation_runs ON simulation_runs.simulation_id = simulations.id
            WHERE simulation_runs.id = performance_metrics.run_id 
            AND (simulations.created_by = auth.uid() OR simulations.is_public = true)
        )
    );

CREATE POLICY "Users can create performance metrics" ON performance_metrics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM simulations 
            JOIN simulation_runs ON simulation_runs.simulation_id = simulations.id
            WHERE simulation_runs.id = performance_metrics.run_id 
            AND simulations.created_by = auth.uid()
        )
    );

-- RLS Policies for Simulation Parameters
CREATE POLICY "Users can view parameters of their simulations" ON simulation_parameters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM simulations 
            WHERE simulations.id = simulation_parameters.simulation_id 
            AND (simulations.created_by = auth.uid() OR simulations.is_public = true)
        )
    );

CREATE POLICY "Users can manage parameters of their simulations" ON simulation_parameters
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM simulations 
            WHERE simulations.id = simulation_parameters.simulation_id 
            AND simulations.created_by = auth.uid()
        )
    );

-- RLS Policies for Analytics Reports
CREATE POLICY "Users can view their own reports" ON analytics_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create analytics reports" ON analytics_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" ON analytics_reports
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Visualization Configs
CREATE POLICY "Users can view configs of their simulations" ON visualization_configs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM simulations 
            WHERE simulations.id = visualization_configs.simulation_id 
            AND (simulations.created_by = auth.uid() OR simulations.is_public = true)
        )
    );

CREATE POLICY "Users can manage configs of their simulations" ON visualization_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM simulations 
            WHERE simulations.id = visualization_configs.simulation_id 
            AND simulations.created_by = auth.uid()
        )
    );

-- RLS Policies for Simulation Templates
CREATE POLICY "Users can view public templates and their own" ON simulation_templates
    FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create simulation templates" ON simulation_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" ON simulation_templates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates" ON simulation_templates
    FOR DELETE USING (auth.uid() = created_by);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_simulations_updated_at BEFORE UPDATE ON simulations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();