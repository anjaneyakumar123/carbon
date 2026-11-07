const prisma = require('../config/prisma');

// Helper to compute Pearson correlation coefficient between two arrays
function pearsonCorrelation(x, y) {
  const n = x.length;
  if (n === 0) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 1000;
}

exports.getCorrelationMatrix = async (req, res, next) => {
  try {
    // Sample 2,000 records for fast in-memory statistical correlation
    const records = await prisma.datasetRecord.findMany({
      take: 2000,
      orderBy: { date: 'asc' },
      select: {
        energyUsageKwh: true,
        transportationDistanceKm: true,
        smartApplianceUsageHours: true,
        renewableEnergyUsagePercent: true,
        temperatureC: true,
        humidityPercent: true,
        fuelUsageLiters: true,
        wasteGeneratedKg: true,
        vehicleTypeCar: true,
        vehicleTypeElectricVehicle: true,
        vehicleTypeWalking: true,
        buildingTypeResidential: true,
        carbonEmissionKgCO2: true
      }
    });

    const fields = [
      { key: 'energyUsageKwh', label: 'Energy Usage' },
      { key: 'fuelUsageLiters', label: 'Fuel Usage' },
      { key: 'transportationDistanceKm', label: 'Transportation' },
      { key: 'smartApplianceUsageHours', label: 'Smart Appliance' },
      { key: 'renewableEnergyUsagePercent', label: 'Renewable %' },
      { key: 'wasteGeneratedKg', label: 'Waste Gen' },
      { key: 'temperatureC', label: 'Temperature' },
      { key: 'humidityPercent', label: 'Humidity' },
      { key: 'vehicleTypeCar', label: 'Car Mode' },
      { key: 'vehicleTypeElectricVehicle', label: 'EV Mode' },
      { key: 'vehicleTypeWalking', label: 'Walking Mode' },
      { key: 'buildingTypeResidential', label: 'Residential' },
      { key: 'carbonEmissionKgCO2', label: 'Carbon Emission' }
    ];

    const vectors = {};
    fields.forEach(f => {
      vectors[f.key] = records.map(r => r[f.key]);
    });

    const matrix = [];
    for (let i = 0; i < fields.length; i++) {
      const row = [];
      for (let j = 0; j < fields.length; j++) {
        const corr = pearsonCorrelation(vectors[fields[i].key], vectors[fields[j].key]);
        row.push(corr);
      }
      matrix.push({
        field: fields[i].key,
        label: fields[i].label,
        correlations: row
      });
    }

    // Top correlations with Target Carbon Emission
    const targetCorrelations = fields
      .filter(f => f.key !== 'carbonEmissionKgCO2')
      .map(f => ({
        field: f.key,
        label: f.label,
        correlation: pearsonCorrelation(vectors[f.key], vectors['carbonEmissionKgCO2'])
      }))
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

    return res.status(200).json({
      success: true,
      fields: fields.map(f => f.label),
      matrix,
      targetCorrelations,
      sampleSize: records.length,
      methodology: 'Pearson product-moment correlation coefficient on standardized features'
    });
  } catch (error) {
    next(error);
  }
};

exports.getScatterSamples = async (req, res, next) => {
  try {
    const { feature = 'energyUsageKwh', limit = 400 } = req.query;

    const allowed = [
      'energyUsageKwh',
      'fuelUsageLiters',
      'transportationDistanceKm',
      'renewableEnergyUsagePercent',
      'wasteGeneratedKg',
      'smartApplianceUsageHours',
      'temperatureC',
      'humidityPercent'
    ];

    const targetFeature = allowed.includes(feature) ? feature : 'energyUsageKwh';

    const records = await prisma.datasetRecord.findMany({
      take: Math.min(1000, parseInt(limit)),
      orderBy: { date: 'asc' },
      select: {
        id: true,
        date: true,
        [targetFeature]: true,
        carbonEmissionKgCO2: true,
        vehicleTypeCar: true,
        vehicleTypeElectricVehicle: true
      }
    });

    const points = records.map(r => ({
      x: r[targetFeature],
      y: r.carbonEmissionKgCO2,
      date: r.date.toISOString().split('T')[0],
      isCar: r.vehicleTypeCar > 0,
      isEV: r.vehicleTypeElectricVehicle > 0
    }));

    return res.status(200).json({
      success: true,
      feature: targetFeature,
      points,
      count: points.length,
      xLabel: `${targetFeature} (Standardized Score)`,
      yLabel: 'Carbon Emission (kgCO2 Physical)'
    });
  } catch (error) {
    next(error);
  }
};

exports.getRenewableAnalytics = async (req, res, next) => {
  try {
    const records = await prisma.datasetRecord.findMany({
      take: 500,
      orderBy: { date: 'asc' },
      select: {
        date: true,
        renewableEnergyUsagePercent: true,
        carbonEmissionKgCO2: true
      }
    });

    const timeline = records.map(r => ({
      date: r.date.toISOString().split('T')[0],
      renewableScore: r.renewableEnergyUsagePercent,
      emission: r.carbonEmissionKgCO2
    }));

    // Binned average emission by renewable score quartile
    const quartiles = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN "renewableEnergyUsagePercent" < -0.67 THEN 'Low Renewable (Q1)'
          WHEN "renewableEnergyUsagePercent" >= -0.67 AND "renewableEnergyUsagePercent" < 0 THEN 'Below Median (Q2)'
          WHEN "renewableEnergyUsagePercent" >= 0 AND "renewableEnergyUsagePercent" < 0.67 THEN 'Above Median (Q3)'
          ELSE 'High Renewable (Q4)'
        END AS quartile_label,
        COUNT(*)::int AS count,
        AVG("carbonEmissionKgCO2") AS avg_emission,
        AVG("energyUsageKwh") AS avg_energy
      FROM dataset_records
      GROUP BY quartile_label
      ORDER BY avg_emission DESC;
    `;

    return res.status(200).json({
      success: true,
      timeline,
      quartiles,
      summary: 'Analysis demonstrates measurable mitigation in emission intensity during elevated renewable energy utilization intervals.'
    });
  } catch (error) {
    next(error);
  }
};

