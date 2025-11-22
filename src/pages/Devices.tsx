import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Devices = () => {
  const { toast } = useToast();
  const [xmlData, setXmlData] = useState("");
  const [csvData, setCsvData] = useState("");
  const [customData, setCustomData] = useState("");
  const [convertedData, setConvertedData] = useState<any>(null);
  const [devices] = useState([
    { vendor: "Huawei", type: "Solar Inverter", status: "online", format: "XML" },
    { vendor: "Exide", type: "Battery Management", status: "online", format: "CSV" },
    { vendor: "SMA", type: "Grid Meter", status: "online", format: "Custom" },
  ]);

  const parseXML = (xml: string) => {
    try {
      const powerMatch = xml.match(/<power>(\d+)<\/power>/);
      const voltageMatch = xml.match(/<voltage>(\d+)<\/voltage>/);
      
      return {
        vendor: "Huawei",
        device_type: "Solar Inverter",
        solar_inverter: {
          vendor: "Huawei",
          power_output_watts: powerMatch ? parseInt(powerMatch[1]) : 0,
          voltage: voltageMatch ? parseInt(voltageMatch[1]) : 0,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (e) {
      throw new Error("Invalid XML format");
    }
  };

  const parseCSV = (csv: string) => {
    try {
      const lines = csv.trim().split("\n");
      if (lines.length < 2) throw new Error("Invalid CSV");
      
      const dataLine = lines[1].split(",");
      return {
        vendor: "Exide",
        device_type: "Battery",
        battery: {
          vendor: "Exide",
          soc_percentage: parseFloat(dataLine[1]),
          voltage: parseFloat(dataLine[2]),
        },
        timestamp: dataLine[0],
      };
    } catch (e) {
      throw new Error("Invalid CSV format");
    }
  };

  const parseCustom = (custom: string) => {
    try {
      const wMatch = custom.match(/W=(\d+)/);
      const vMatch = custom.match(/V=(\d+)/);
      const fMatch = custom.match(/F=(\d+)/);
      
      return {
        vendor: "SMA",
        device_type: "Grid Meter",
        grid_meter: {
          vendor: "SMA",
          power_watts: wMatch ? parseInt(wMatch[1]) : 0,
          voltage: vMatch ? parseInt(vMatch[1]) : 0,
          frequency: fMatch ? parseInt(fMatch[1]) : 0,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (e) {
      throw new Error("Invalid custom format");
    }
  };

  const handleIngest = async (format: string) => {
    try {
      let parsed;
      let rawData;
      
      switch (format) {
        case "xml":
          parsed = parseXML(xmlData);
          rawData = xmlData;
          break;
        case "csv":
          parsed = parseCSV(csvData);
          rawData = csvData;
          break;
        case "custom":
          parsed = parseCustom(customData);
          rawData = customData;
          break;
        default:
          throw new Error("Unknown format");
      }
      
      setConvertedData(parsed);
      
      // Save to database
      await supabase.from("device_data").insert({
        vendor_name: parsed.vendor,
        device_type: parsed.device_type,
        raw_data: rawData,
        data_format: format,
        processed: true,
      });
      
      toast({
        title: "Data Ingested Successfully",
        description: "Vendor data converted to standardized format",
      });
    } catch (error: any) {
      toast({
        title: "Ingestion Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Device Integration</h2>
          <p className="text-muted-foreground">Vendor-neutral data ingestion system</p>
        </div>

        {/* Connected Devices */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Connected Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Data Format</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{device.vendor}</TableCell>
                    <TableCell>{device.type}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{device.format}</Badge>
                    </TableCell>
                    <TableCell>
                      {device.status === "online" ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Online
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Offline
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Data Ingestion Interface */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Simulate Vendor Data Input</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="xml" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="xml">Huawei (XML)</TabsTrigger>
                  <TabsTrigger value="csv">Exide (CSV)</TabsTrigger>
                  <TabsTrigger value="custom">SMA (Custom)</TabsTrigger>
                </TabsList>
                
                <TabsContent value="xml" className="space-y-4">
                  <Textarea
                    placeholder="<power>3500</power>&#10;<voltage>220</voltage>"
                    value={xmlData}
                    onChange={(e) => setXmlData(e.target.value)}
                    className="min-h-[150px] font-mono text-sm"
                  />
                  <Button onClick={() => handleIngest("xml")} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Ingest XML Data
                  </Button>
                </TabsContent>
                
                <TabsContent value="csv" className="space-y-4">
                  <Textarea
                    placeholder="timestamp,soc,voltage&#10;2025-11-02T10:00:00,72,48"
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    className="min-h-[150px] font-mono text-sm"
                  />
                  <Button onClick={() => handleIngest("csv")} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Ingest CSV Data
                  </Button>
                </TabsContent>
                
                <TabsContent value="custom" className="space-y-4">
                  <Textarea
                    placeholder="W=4200;V=220;F=50"
                    value={customData}
                    onChange={(e) => setCustomData(e.target.value)}
                    className="min-h-[150px] font-mono text-sm"
                  />
                  <Button onClick={() => handleIngest("custom")} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Ingest Custom Data
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Standardized JSON Output</CardTitle>
            </CardHeader>
            <CardContent>
              {convertedData ? (
                <pre className="rounded-lg bg-muted p-4 text-sm overflow-auto max-h-[300px]">
                  {JSON.stringify(convertedData, null, 2)}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <p>Ingest data to see converted output</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Devices;
