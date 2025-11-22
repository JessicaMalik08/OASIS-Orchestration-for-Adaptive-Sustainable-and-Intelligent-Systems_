import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, Leaf, TrendingUp, Battery, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Reports = () => {
  const { toast } = useToast();
  const [reportData] = useState({
    co2Saved: 2845,
    monthlySavings: 3240,
    gridUsageReduced: 35,
    batteryHealth: 92,
    totalEnergyGenerated: 12500,
    peakDemandReduction: 28,
  });

  const [monthlyData] = useState([
    { month: "Jan", savings: 2800, generation: 11200 },
    { month: "Feb", savings: 3100, generation: 12800 },
    { month: "Mar", savings: 3400, generation: 13500 },
    { month: "Apr", savings: 3240, generation: 12500 },
  ]);

  const downloadPDF = () => {
    toast({
      title: "Generating Report",
      description: "Your PDF report will download shortly",
    });
    // In a real app, this would generate and download a PDF
    setTimeout(() => {
      toast({
        title: "Report Downloaded",
        description: "Energy_Report_2025.pdf",
      });
    }, 1500);
  };

  const estimatedYearsRemaining = ((reportData.batteryHealth / 100) * 10).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Reports & Analytics</h2>
            <p className="text-muted-foreground">Environmental impact and financial insights</p>
          </div>
          <Button onClick={downloadPDF} className="shadow-glow">
            <Download className="mr-2 h-4 w-4" />
            Download PDF Report
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-card border-success/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                CO₂ Savings
              </CardTitle>
              <Leaf className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-success">{reportData.co2Saved}</span>
                <span className="text-lg text-muted-foreground">kg</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Equivalent to planting {Math.round(reportData.co2Saved / 20)} trees
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Savings
              </CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">₹{reportData.monthlySavings}</span>
              </div>
              <p className="mt-1 text-xs text-success">
                ↑ {reportData.gridUsageReduced}% reduction in grid usage
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-warning/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Battery Health
              </CardTitle>
              <Battery className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-warning">{reportData.batteryHealth}</span>
                <span className="text-lg text-muted-foreground">%</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                ~{estimatedYearsRemaining} years remaining
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-energy-green/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Generation
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-energy-green" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-energy-green">
                  {reportData.totalEnergyGenerated}
                </span>
                <span className="text-lg text-muted-foreground">kWh</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Peak demand reduced by {reportData.peakDemandReduction}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Monthly Savings Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="savings" 
                    fill="hsl(var(--primary))" 
                    name="Savings (₹)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Monthly Energy Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="generation" 
                    fill="hsl(var(--renewable-green))" 
                    name="Generation (kWh)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ROI Analysis */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Return on Investment (ROI) Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Monthly Savings</p>
                <p className="text-2xl font-bold text-success">₹{reportData.monthlySavings}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Annual Savings</p>
                <p className="text-2xl font-bold text-primary">₹{reportData.monthlySavings * 12}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">System Payback</p>
                <p className="text-2xl font-bold text-foreground">~4.2 years</p>
              </div>
            </div>

            <div className="rounded-lg bg-gradient-energy/10 border border-primary/20 p-4">
              <h4 className="font-semibold text-foreground mb-2">Environmental Impact</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Grid emissions avoided: {reportData.co2Saved} kg CO₂</li>
                <li>• Renewable energy utilization: 87%</li>
                <li>• Peak demand reduction: {reportData.peakDemandReduction}%</li>
                <li>• Energy efficiency improvement: 23%</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reports;
