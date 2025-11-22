-- Create tables for energy orchestration system

-- Energy readings table (time-series data)
CREATE TABLE IF NOT EXISTS public.energy_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  solar_power_watts DECIMAL(10, 2) NOT NULL DEFAULT 0,
  wind_power_watts DECIMAL(10, 2) NOT NULL DEFAULT 0,
  battery_soc_percentage DECIMAL(5, 2) NOT NULL DEFAULT 50,
  battery_voltage DECIMAL(6, 2) NOT NULL DEFAULT 48,
  grid_power_watts DECIMAL(10, 2) NOT NULL DEFAULT 0,
  demand_watts DECIMAL(10, 2) NOT NULL DEFAULT 0,
  temperature_celsius DECIMAL(5, 2),
  cloud_cover_percentage DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Weather forecasts table
CREATE TABLE IF NOT EXISTS public.weather_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forecast_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  temperature_celsius DECIMAL(5, 2),
  cloud_cover_percentage DECIMAL(5, 2),
  irradiance_w_per_m2 DECIMAL(8, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Energy forecasts table
CREATE TABLE IF NOT EXISTS public.energy_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forecast_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  predicted_solar_watts DECIMAL(10, 2),
  predicted_wind_watts DECIMAL(10, 2),
  predicted_demand_watts DECIMAL(10, 2),
  confidence_level DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Optimization schedules table
CREATE TABLE IF NOT EXISTS public.optimization_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  battery_action VARCHAR(20) NOT NULL, -- 'charge', 'discharge', 'idle'
  grid_import_kw DECIMAL(10, 2) NOT NULL DEFAULT 0,
  grid_export_kw DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cost_rupees DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Device data table (vendor-specific raw data)
CREATE TABLE IF NOT EXISTS public.device_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_name VARCHAR(100) NOT NULL,
  device_type VARCHAR(100) NOT NULL,
  raw_data TEXT NOT NULL,
  data_format VARCHAR(20) NOT NULL, -- 'xml', 'csv', 'custom', 'json'
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type VARCHAR(20) NOT NULL, -- 'info', 'warning', 'critical'
  message TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_energy_readings_timestamp ON public.energy_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_weather_forecasts_timestamp ON public.weather_forecasts(forecast_timestamp);
CREATE INDEX IF NOT EXISTS idx_energy_forecasts_timestamp ON public.energy_forecasts(forecast_timestamp);
CREATE INDEX IF NOT EXISTS idx_optimization_schedules_timestamp ON public.optimization_schedules(schedule_timestamp);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created ON public.system_alerts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.energy_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required for this demo)
CREATE POLICY "Allow public read access to energy_readings" ON public.energy_readings FOR SELECT USING (true);
CREATE POLICY "Allow public insert to energy_readings" ON public.energy_readings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to weather_forecasts" ON public.weather_forecasts FOR SELECT USING (true);
CREATE POLICY "Allow public insert to weather_forecasts" ON public.weather_forecasts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to energy_forecasts" ON public.energy_forecasts FOR SELECT USING (true);
CREATE POLICY "Allow public insert to energy_forecasts" ON public.energy_forecasts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to optimization_schedules" ON public.optimization_schedules FOR SELECT USING (true);
CREATE POLICY "Allow public insert to optimization_schedules" ON public.optimization_schedules FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to device_data" ON public.device_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert to device_data" ON public.device_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to device_data" ON public.device_data FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to system_alerts" ON public.system_alerts FOR SELECT USING (true);
CREATE POLICY "Allow public insert to system_alerts" ON public.system_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to system_alerts" ON public.system_alerts FOR UPDATE USING (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.energy_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_alerts;