// Simulation engine for generating realistic energy data

export interface EnergyReading {
  timestamp: Date;
  solarPowerWatts: number;
  windPowerWatts: number;
  batterySocPercentage: number;
  batteryVoltage: number;
  gridPowerWatts: number;
  demandWatts: number;
  temperatureCelsius: number;
  cloudCoverPercentage: number;
}

export interface ForecastPoint {
  hour: string;
  solar: number;
  demand: number;
  confidence: number;
}

export interface OptimizationResult {
  timestamp: string;
  hour: number;
  batteryAction: string;
  gridImportKw: number;
  gridExportKw: number;
  costRupees: number;
}

// Generate realistic solar power based on time of day
function getSolarPower(hour: number, cloudCover: number): number {
  if (hour < 6 || hour > 18) return 0;
  
  // Peak at noon (hour 12)
  const peakPower = 3500;
  const normalizedHour = hour - 12;
  const solarCurve = peakPower * Math.exp(-(normalizedHour * normalizedHour) / 18);
  
  // Reduce by cloud cover
  const cloudReduction = 1 - (cloudCover / 100) * 0.6;
  return Math.max(0, solarCurve * cloudReduction);
}

// Generate realistic demand based on time of day
function getDemand(hour: number, isWeekend: boolean): number {
  const baseDemand = 800;
  let demandMultiplier = 1;
  
  // Morning peak (7-9 AM)
  if (hour >= 7 && hour <= 9) {
    demandMultiplier = 2.5;
  }
  // Evening peak (5-8 PM)
  else if (hour >= 17 && hour <= 20) {
    demandMultiplier = 2.8;
  }
  // Daytime (10 AM - 4 PM)
  else if (hour >= 10 && hour <= 16) {
    demandMultiplier = 1.8;
  }
  // Night (9 PM - 6 AM)
  else {
    demandMultiplier = 0.8;
  }
  
  // Weekend reduction
  if (isWeekend) {
    demandMultiplier *= 0.7;
  }
  
  // Add some randomness
  const noise = 0.9 + Math.random() * 0.2;
  return baseDemand * demandMultiplier * noise;
}

// Generate wind power (simplified model)
function getWindPower(): number {
  // Random wind with average around 500W
  return 300 + Math.random() * 400;
}

// Generate current energy reading
export function generateCurrentReading(batterySoc: number = 65): EnergyReading {
  const now = new Date();
  const hour = now.getHours();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  
  const cloudCover = 20 + Math.random() * 40;
  const temperature = 25 + Math.random() * 10;
  
  const solarPower = getSolarPower(hour, cloudCover);
  const windPower = getWindPower();
  const demand = getDemand(hour, isWeekend);
  
  const totalGeneration = solarPower + windPower;
  const batteryVoltage = 48 + (batterySoc - 50) * 0.05;
  
  // Grid import/export calculation
  let gridPower = 0;
  if (totalGeneration < demand) {
    // Need to import from grid or use battery
    if (batterySoc > 30) {
      gridPower = (demand - totalGeneration) * 0.5; // Battery covers some
    } else {
      gridPower = demand - totalGeneration; // Import all from grid
    }
  } else {
    // Excess power - charge battery or export
    if (batterySoc < 85) {
      gridPower = 0; // Charge battery
    } else {
      gridPower = -(totalGeneration - demand); // Export to grid
    }
  }
  
  return {
    timestamp: now,
    solarPowerWatts: solarPower,
    windPowerWatts: windPower,
    batterySocPercentage: batterySoc,
    batteryVoltage,
    gridPowerWatts: gridPower,
    demandWatts: demand,
    temperatureCelsius: temperature,
    cloudCoverPercentage: cloudCover,
  };
}

// Generate 24-hour forecast
export function generate24HourForecast(): ForecastPoint[] {
  const forecast: ForecastPoint[] = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const futureHour = (now.getHours() + i) % 24;
    const futureDate = new Date(now.getTime() + i * 3600000);
    const isWeekend = futureDate.getDay() === 0 || futureDate.getDay() === 6;
    
    const cloudCover = 20 + Math.random() * 30;
    const solar = getSolarPower(futureHour, cloudCover);
    const demand = getDemand(futureHour, isWeekend);
    
    // Confidence decreases with time
    const confidence = Math.max(60, 95 - i * 1.5);
    
    forecast.push({
      hour: `${futureHour}:00`,
      solar: Math.round(solar),
      demand: Math.round(demand),
      confidence: Math.round(confidence),
    });
  }
  
  return forecast;
}

// MILP Optimization (simplified heuristic)
export function runMILPOptimization(forecast: ForecastPoint[]): OptimizationResult[] {
  const results: OptimizationResult[] = [];
  let batterySoc = 65; // Starting SOC
  const batteryCapacityKwh = 100;
  const maxChargeRate = 25; // kW
  const maxDischargeRate = 25; // kW
  
  // Grid tariffs (Rs/kWh)
  const peakTariff = 8;
  const offPeakTariff = 5;
  const batteryDegradationCost = 0.75;
  
  forecast.forEach((point, index) => {
    const hour = parseInt(point.hour.split(':')[0]);
    const isPeak = (hour >= 7 && hour <= 11) || (hour >= 17 && hour <= 21);
    const tariff = isPeak ? peakTariff : offPeakTariff;
    
    const solarKw = point.solar / 1000;
    const demandKw = point.demand / 1000;
    const surplus = solarKw - demandKw;
    
    let batteryAction = "idle";
    let gridImport = 0;
    let gridExport = 0;
    let cost = 0;
    
    if (surplus > 0) {
      // Excess generation
      if (batterySoc < 85) {
        // Charge battery
        const chargeAmount = Math.min(surplus, maxChargeRate, (85 - batterySoc) * batteryCapacityKwh / 100);
        batterySoc += (chargeAmount / batteryCapacityKwh) * 100;
        batteryAction = "charge";
        cost = chargeAmount * batteryDegradationCost;
        
        if (surplus - chargeAmount > 0.1) {
          gridExport = surplus - chargeAmount;
          cost -= gridExport * offPeakTariff * 0.8; // Export at lower rate
        }
      } else {
        // Battery full, export
        gridExport = surplus;
        cost = -gridExport * offPeakTariff * 0.8;
      }
    } else {
      // Deficit
      const deficit = Math.abs(surplus);
      
      if (!isPeak && batterySoc > 30) {
        // Off-peak or enough battery - use battery
        const dischargeAmount = Math.min(deficit, maxDischargeRate, (batterySoc - 20) * batteryCapacityKwh / 100);
        batterySoc -= (dischargeAmount / batteryCapacityKwh) * 100;
        batteryAction = "discharge";
        cost = dischargeAmount * batteryDegradationCost;
        
        if (deficit - dischargeAmount > 0.1) {
          gridImport = deficit - dischargeAmount;
          cost += gridImport * tariff;
        }
      } else {
        // Peak time or low battery - import from grid
        gridImport = deficit;
        cost = gridImport * tariff;
      }
    }
    
    results.push({
      timestamp: point.hour,
      hour,
      batteryAction,
      gridImportKw: Math.round(gridImport * 100) / 100,
      gridExportKw: Math.round(gridExport * 100) / 100,
      costRupees: Math.round(cost * 100) / 100,
    });
  });
  
  return results;
}

// Update battery SOC based on energy flow
export function updateBatterySoc(
  currentSoc: number,
  totalGeneration: number,
  demand: number,
  gridPower: number,
  deltaTime: number = 5000 // 5 seconds in ms
): number {
  const batteryCapacityWh = 100000; // 100 kWh in Wh
  const energyBalance = totalGeneration - demand - gridPower;
  
  // Convert to Wh (deltaTime in ms, divide by 3600000 for hours)
  const energyChangeWh = energyBalance * (deltaTime / 3600000);
  const socChange = (energyChangeWh / batteryCapacityWh) * 100;
  
  // Clamp between 20% and 90%
  return Math.max(20, Math.min(90, currentSoc + socChange));
}
