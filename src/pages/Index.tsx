import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import EnergyFlowDiagram from "@/components/dashboard/EnergyFlowDiagram";
import MetricsCard from "@/components/dashboard/MetricsCard";
import ForecastChart from "@/components/dashboard/ForecastChart";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import { Button } from "@/components/ui/button";
import { Play, Pause, FastForward } from "lucide-react";
import { Battery, Zap, Sun, TrendingUp } from "lucide-react";
import { generateCurrentReading, generate24HourForecast, updateBatterySoc } from "@/lib/simulationEngine";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [currentData, setCurrentData] = useState(() => generateCurrentReading());
  const [forecastData, setForecastData] = useState(() => generate24HourForecast());
  const [alerts, setAlerts] = useState<any[]>([]);
  const [batterySoc, setBatterySoc] = useState(65);

  // Simulation loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const reading = generateCurrentReading(batterySoc);
      setCurrentData(reading);

      // Update battery SOC
      const newSoc = updateBatterySoc(
        batterySoc,
        reading.solarPowerWatts + reading.windPowerWatts,
        reading.demandWatts,
        reading.gridPowerWatts,
        5000 / speed
      );
      setBatterySoc(newSoc);

      // Generate alerts
      const now = new Date().toLocaleTimeString();
      if (newSoc < 30 && !alerts.some(a => a.message.includes("Battery SOC low"))) {
        const newAlert = {
          id: `alert-${Date.now()}`,
          type: "critical" as const,
          message: "Battery SOC below 30% - Critical level reached",
          timestamp: now,
        };
        setAlerts(prev => [newAlert, ...prev]);
        toast({
          title: "Critical Alert",
          description: newAlert.message,
          variant: "destructive",
        });
      } else if (newSoc > 60) {
        // Clear low battery alerts
        setAlerts(prev => prev.filter(a => !a.message.includes("Battery SOC low")));
      }

      // Save to database
      supabase.from("energy_readings").insert({
        solar_power_watts: reading.solarPowerWatts,
        wind_power_watts: reading.windPowerWatts,
        battery_soc_percentage: newSoc,
        battery_voltage: reading.batteryVoltage,
        grid_power_watts: reading.gridPowerWatts,
        demand_watts: reading.demandWatts,
        temperature_celsius: reading.temperatureCelsius,
        cloud_cover_percentage: reading.cloudCoverPercentage,
      }).then(({ error }) => {
        if (error) console.error("Error saving reading:", error);
      });
    }, 5000 / speed);

    return () => clearInterval(interval);
  }, [isRunning, speed, batterySoc, alerts, toast]);

  // Update forecast every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setForecastData(generate24HourForecast());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleSimulation = () => setIsRunning(!isRunning);
  
  const cycleSpeed = () => {
    const speeds = [1, 10, 100];
    const currentIndex = speeds.indexOf(speed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setSpeed(nextSpeed);
    toast({
      title: "Simulation Speed",
      description: `Speed set to ${nextSpeed}x`,
    });
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const totalGeneration = currentData.solarPowerWatts + currentData.windPowerWatts;
  const efficiency = ((totalGeneration / currentData.demandWatts) * 100).toFixed(0);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      
      <main className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Live Energy Dashboard</h2>
            <p className="text-muted-foreground">Real-time monitoring and AI optimization</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleSimulation}
              variant={isRunning ? "default" : "outline"}
              className="shadow-glow"
            >
              {isRunning ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </>
              )}
            </Button>
            <Button onClick={cycleSpeed} variant="outline">
              <FastForward className="mr-2 h-4 w-4" />
              {speed}x Speed
            </Button>
          </div>
        </div>

        {/* Energy Flow Diagram */}
        <EnergyFlowDiagram
          solarPower={currentData.solarPowerWatts}
          windPower={currentData.windPowerWatts}
          batterySoc={batterySoc}
          gridPower={currentData.gridPowerWatts}
          demand={currentData.demandWatts}
        />

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            title="Solar Generation"
            value={Math.round(currentData.solarPowerWatts)}
            unit="W"
            icon={Sun}
            variant="success"
          />
          <MetricsCard
            title="Battery Charge"
            value={Math.round(batterySoc)}
            unit="%"
            icon={Battery}
            variant={batterySoc < 30 ? "danger" : batterySoc < 60 ? "warning" : "success"}
          />
          <MetricsCard
            title="Grid Power"
            value={Math.abs(Math.round(currentData.gridPowerWatts))}
            unit="W"
            icon={Zap}
            variant={currentData.gridPowerWatts > 0 ? "warning" : "success"}
          />
          <MetricsCard
            title="System Efficiency"
            value={efficiency}
            unit="%"
            icon={TrendingUp}
            variant={parseInt(efficiency) > 80 ? "success" : "warning"}
          />
        </div>

        {/* Forecast and Alerts */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ForecastChart data={forecastData} />
          </div>
          <div>
            <AlertsPanel alerts={alerts} onDismiss={dismissAlert} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
