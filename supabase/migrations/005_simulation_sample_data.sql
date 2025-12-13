-- Sample data for simulation system

-- Insert sample users
INSERT INTO users (email, name, role, is_active) VALUES
('admin@simulationsystem.com', 'System Administrator', 'admin', true),
('analyst1@simulationsystem.com', 'John Analyst', 'analyst', true),
('analyst2@simulationsystem.com', 'Jane Researcher', 'analyst', true),
('viewer@simulationsystem.com', 'Bob Viewer', 'viewer', true);

-- Insert sample simulation templates
INSERT INTO simulation_templates (name, description, model_type, configuration, category, tags, is_public, created_by, usage_count, rating) VALUES
('Traffic Flow Analysis', 'Simulates vehicle traffic flow in urban environments', 'traffic_simulation', 
'{"parameters": {"vehicleCount": {"min": 100, "max": 10000, "default": 1000}, "roadLength": {"min": 1000, "max": 50000, "default": 5000}, "speedLimit": {"min": 20, "max": 120, "default": 60}}, "initial_conditions": {"trafficDensity": 0.3, "weather": "clear"}, "boundary_conditions": {"entryRate": 0.5, "exitRate": 0.5}}', 
'transportation', ARRAY['traffic', 'urban', 'transportation'], true, 
(SELECT id FROM users WHERE email = 'admin@simulationsystem.com'), 25, 4.5),

('Epidemiological Model', 'SIR model for disease spread simulation', 'epidemiological_model',
'{"parameters": {"population": {"min": 1000, "max": 10000000, "default": 100000}, "infectionRate": {"min": 0.1, "max": 0.9, "default": 0.3}, "recoveryRate": {"min": 0.01, "max": 0.5, "default": 0.1}}, "initial_conditions": {"infected": 10, "recovered": 0, "susceptible": 99990}, "boundary_conditions": {"vaccinationRate": 0.0, "quarantineEffectiveness": 0.8}}',
'healthcare', ARRAY['epidemiology', 'disease', 'public-health'], true,
(SELECT id FROM users WHERE email = 'admin@simulationsystem.com'), 18, 4.2),

('Climate Change Impact', 'Simulates environmental changes over time', 'climate_model',
'{"parameters": {"temperatureIncrease": {"min": 0.5, "max": 5.0, "default": 2.0}, "co2Levels": {"min": 400, "max": 800, "default": 450}, "timeHorizon": {"min": 10, "max": 100, "default": 50}}, "initial_conditions": {"currentTemp": 15.0, "seaLevel": 0}, "boundary_conditions": {"emissionScenario": "moderate", "adaptationMeasures": true}}',
'environmental', ARRAY['climate', 'environment', 'sustainability'], true,
(SELECT id FROM users WHERE email = 'admin@simulationsystem.com'), 12, 4.7),

('Supply Chain Optimization', 'Models logistics and supply chain networks', 'supply_chain',
'{"parameters": {"warehouseCount": {"min": 1, "max": 50, "default": 5}, "demandVariance": {"min": 0.1, "max": 0.5, "default": 0.2}, "transportCost": {"min": 0.5, "max": 5.0, "default": 1.5}}, "initial_conditions": {"inventory": 1000, "orders": 100}, "boundary_conditions": {"leadTime": 7, "serviceLevel": 0.95}}',
'business', ARRAY['logistics', 'optimization', 'operations'], true,
(SELECT id FROM users WHERE email = 'admin@simulationsystem.com'), 8, 4.1),

('Financial Market Simulation', 'Models stock market behavior and trading strategies', 'financial_model',
'{"parameters": {"initialPrice": {"min": 10, "max": 1000, "default": 100}, "volatility": {"min": 0.05, "max": 0.5, "default": 0.2}, "tradingVolume": {"min": 1000, "max": 1000000, "default": 100000}}, "initial_conditions": {"marketSentiment": "neutral", "economicIndicators": "stable"}, "boundary_conditions": {"regulatoryChanges": false, "externalShocks": false}}',
'finance', ARRAY['stocks', 'trading', 'markets'], false,
(SELECT id FROM users WHERE email = 'analyst1@simulationsystem.com'), 3, 4.3);

-- Insert sample simulations
INSERT INTO simulations (name, model_type, description, created_by, configuration, is_template, is_public) VALUES
('Downtown Traffic Study 2024', 'traffic_simulation', 'Analysis of traffic patterns in downtown area during peak hours', 
(SELECT id FROM users WHERE email = 'analyst1@simulationsystem.com'),
'{"parameters": {"vehicleCount": 2500, "roadLength": 8000, "speedLimit": 45, "intersectionCount": 12}, "initial_conditions": {"trafficDensity": 0.4, "weather": "rainy", "timeOfDay": "rush-hour"}, "boundary_conditions": {"signalTiming": "adaptive", "parkingAvailability": 0.7}}',
false, false),

('COVID-19 Variant Analysis', 'epidemiological_model', 'Modeling spread of new COVID variant in urban population',
(SELECT id FROM users WHERE email = 'analyst2@simulationsystem.com'),
'{"parameters": {"population": 500000, "infectionRate": 0.25, "recoveryRate": 0.08, "incubationPeriod": 5}, "initial_conditions": {"infected": 50, "exposed": 200, "recovered": 1500, "deceased": 25}, "boundary_conditions": {"vaccinationRate": 0.65, "publicHealthMeasures": "moderate", "variantTransmissibility": 1.5}}',
false, false),

('Global Warming Scenario A1', 'climate_model', 'Business-as-usual climate scenario for next 50 years',
(SELECT id FROM users WHERE email = 'analyst1@simulationsystem.com'),
'{"parameters": {"temperatureIncrease": 3.2, "co2Levels": 550, "timeHorizon": 50, "methaneLevels": 2.5}, "initial_conditions": {"currentTemp": 14.8, "seaLevel": 3.2, "iceSheetMass": 100}, "boundary_conditions": {"emissionScenario": "high", "carbonCapture": false, "renewableAdoption": 0.3}}',
false, true);

-- Insert sample simulation runs
INSERT INTO simulation_runs (simulation_id, status, start_time, end_time, parameters, priority, progress, estimated_duration, resource_usage) VALUES
((SELECT id FROM simulations WHERE name = 'Downtown Traffic Study 2024'), 'completed', 
 NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour',
'{"vehicleCount": 2500, "roadLength": 8000, "speedLimit": 45}',
'normal', 100, 3600,
'{"cpu_usage": 45.2, "memory_usage": 2.1, "disk_usage": 0.5, "network_io": 12.3}'),

((SELECT id FROM simulations WHERE name = 'COVID-19 Variant Analysis'), 'running',
 NOW() - INTERVAL '30 minutes', NULL,
'{"population": 500000, "infectionRate": 0.25, "recoveryRate": 0.08}',
'high', 65, 7200,
'{"cpu_usage": 78.5, "memory_usage": 4.2, "disk_usage": 1.1, "network_io": 5.7}'),

((SELECT id FROM simulations WHERE name = 'Global Warming Scenario A1'), 'pending',
 NULL, NULL,
'{"temperatureIncrease": 3.2, "co2Levels": 550, "timeHorizon": 50}',
'normal', 0, 10800, NULL);

-- Insert sample simulation results
INSERT INTO simulation_results (run_id, data, result_type, file_path, file_size) VALUES
((SELECT id FROM simulation_runs WHERE simulation_id = (SELECT id FROM simulations WHERE name = 'Downtown Traffic Study 2024') LIMIT 1),
'{"averageSpeed": 32.5, "travelTime": 18.7, "congestionIndex": 0.73, "throughput": 2150, "emissions": {"co2": 125.3, "nox": 2.1}, "safetyMetrics": {"accidents": 0.02, "nearMisses": 12}}',
'traffic_analysis', '/results/traffic_study_2024.json', 15420),

((SELECT id FROM simulation_runs WHERE simulation_id = (SELECT id FROM simulations WHERE name = 'COVID-19 Variant Analysis') LIMIT 1),
'{"currentInfected": 3250, "totalInfected": 8750, "peakInfections": 4500, "rEffective": 1.2, "hospitalizations": 180, "icuBeds": 45, "deaths": 15, "vaccinationProgress": 0.68}',
'epidemiological_data', '/results/covid_variant_analysis.json', 8750);

-- Insert sample performance metrics
INSERT INTO performance_metrics (run_id, metric_name, value, unit, metadata) VALUES
((SELECT id FROM simulation_runs WHERE simulation_id = (SELECT id FROM simulations WHERE name = 'Downtown Traffic Study 2024') LIMIT 1),
'execution_time', 3600, 'seconds', '{"phase": "total"}'),

((SELECT id FROM simulation_runs WHERE simulation_id = (SELECT id FROM simulations WHERE name = 'Downtown Traffic Study 2024') LIMIT 1),
'memory_peak', 4.2, 'GB', '{"phase": "simulation"}'),

((SELECT id FROM simulation_runs WHERE simulation_id = (SELECT id FROM simulations WHERE name = 'Downtown Traffic Study 2024') LIMIT 1),
'cpu_utilization', 68.5, 'percent', '{"average": true}'),

((SELECT id FROM simulation_runs WHERE simulation_id = (SELECT id FROM simulations WHERE name = 'COVID-19 Variant Analysis') LIMIT 1),
'convergence_rate', 0.92, 'ratio', '{"tolerance": 0.001}'),

((SELECT id FROM simulation_runs WHERE simulation_id = (SELECT id FROM simulations WHERE name = 'COVID-19 Variant Analysis') LIMIT 1),
'accuracy_score', 0.87, 'score', '{"validation_method": "cross_validation"}');

-- Insert sample analytics reports
INSERT INTO analytics_reports (user_id, report_type, filters, results, simulation_ids) VALUES
((SELECT id FROM users WHERE email = 'analyst1@simulationsystem.com'),
'summary',
'{"dateRange": "last_30_days", "modelTypes": ["traffic_simulation"], "status": ["completed"]}',
'{"totalSimulations": 15, "averageExecutionTime": 3420, "successRate": 0.93, "mostPopularModel": "traffic_simulation", "resourceUtilization": {"cpu": 58.2, "memory": 3.1}}',
ARRAY[(SELECT id FROM simulations WHERE name = 'Downtown Traffic Study 2024')]),

((SELECT id FROM users WHERE email = 'analyst2@simulationsystem.com'),
'detailed',
'{"dateRange": "last_7_days", "modelTypes": ["epidemiological_model"], "includeMetrics": true}',
'{"simulations": [{"id": "covid_analysis", "status": "running", "progress": 65, "estimatedCompletion": "2024-01-15T14:30:00Z", "currentMetrics": {"rEffective": 1.2, "peakInfections": 4500}}], "performance": {"averageCPU": 78.5, "peakMemory": 4.2}, "recommendations": ["Increase simulation resolution", "Add more demographic data"]}',
ARRAY[(SELECT id FROM simulations WHERE name = 'COVID-19 Variant Analysis')]);