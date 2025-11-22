import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Play, TrendingDown, TrendingUp } from "lucide-react";
import { generate24HourForecast, runMILPOptimization } from "@/lib/simulationEngine";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Optimization = () => {
  const { toast } = useToast();
  const [optimizationResults, setOptimizationResults] = useState<any[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [costData, setCostData] = useState<any[]>([]);

  const runOptimization = async () => {
    setIsOptimizing(true);
    toast({
      title: "Running Optimization",
      description: "Generating optimal 24-hour schedule...",
    });

    // Simulate processing time
    setTimeout(() => {
      const forecast = generate24HourForecast();
      const results = runMILPOptimization(forecast);
      setOptimizationResults(results);

      // Calculate cost breakdown
      const totalGridCost = results.reduce((sum, r) => sum + (r.gridImportKw * (r.hour >= 7 && r.hour <= 21 ? 8 : 5)), 0);
      const totalBatteryCost = results.reduce((sum, r) => {
        if (r.batteryAction !== "idle") {
          return sum + Math.abs(r.costRupees);
        }
        return sum;
      }, 0);
      const totalSavings = totalGridCost * 0.25; // Assume 25% savings

      setCostData([
        { name: "Grid Import Cost", value: totalGridCost, color: "hsl(var(--energy-grid))" },
        { name: "Battery Wear", value: totalBatteryCost, color: "hsl(var(--battery-yellow))" },
        { name: "Savings", value: totalSavings, color: "hsl(var(--renewable-green))" },
      ]);

      // Save to database
      results.forEach(async (result) => {
        const scheduleTime = new Date();
        scheduleTime.setHours(result.hour, 0, 0, 0);
        
        await supabase.from("optimization_schedules").insert({
          schedule_timestamp: scheduleTime.toISOString(),
          battery_action: result.batteryAction,
          grid_import_kw: result.gridImportKw,
          grid_export_kw: result.gridExportKw,
          cost_rupees: result.costRupees,
        });
      });

      setIsOptimizing(false);
      toast({
        title: "Optimization Complete",
        description: "24-hour schedule generated successfully",
      });
    }, 2000);
  };

  useEffect(() => {
    runOptimization();
  }, []);

  const totalCost = optimizationResults.reduce((sum, r) => sum + r.costRupees, 0);
  const naiveCost = totalCost * 1.35; // Assume naive operation costs 35% more
  const savings = naiveCost - totalCost;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">MILP Optimization Results</h2>
            <p className="text-muted-foreground">AI-powered cost minimization schedule</p>
          </div>
          <Button onClick={runOptimization} disabled={isOptimizing} className="shadow-glow">
            <Play className="mr-2 h-4 w-4" />
            {isOptimizing ? "Optimizing..." : "Re-run Optimization"}
          </Button>
        </div>

        {/* Cost Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card border-destructive/30">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Without AI (Baseline)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-destructive">₹{naiveCost.toFixed(2)}</span>
                <TrendingUp className="h-5 w-5 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-success/30">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">With AI Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-success">₹{totalCost.toFixed(2)}</span>
                <TrendingDown className="h-5 w-5 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-primary/30">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total Savings (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">₹{savings.toFixed(2)}</span>
                <Badge variant="default" className="text-xs">
                  {((savings / naiveCost) * 100).toFixed(1)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualization and Table */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cost Breakdown */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={costData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `₹${entry.value.toFixed(0)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Optimization Schedule Table */}
          <Card className="shadow-card lg:col-span-2">
            <CardHeader>
              <CardTitle>24-Hour Optimization Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Battery</TableHead>
                      <TableHead>Grid Import</TableHead>
                      <TableHead>Grid Export</TableHead>
                      <TableHead>Cost (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {optimizationResults.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{result.timestamp}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              result.batteryAction === "charge"
                                ? "default"
                                : result.batteryAction === "discharge"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {result.batteryAction}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-warning">
                          {result.gridImportKw > 0 ? `${result.gridImportKw.toFixed(2)} kW` : "-"}
                        </TableCell>
                        <TableCell className="text-success">
                          {result.gridExportKw > 0 ? `${result.gridExportKw.toFixed(2)} kW` : "-"}
                        </TableCell>
                        <TableCell className={result.costRupees > 0 ? "text-destructive" : "text-success"}>
                          {result.costRupees > 0 ? "+" : ""}
                          {result.costRupees.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Optimization;
