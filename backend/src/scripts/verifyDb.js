const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.datasetRecord.count();
  const agg = await prisma.datasetRecord.aggregate({
    _avg: {
      carbonEmissionKgCO2: true,
      energyUsageKwh: true,
      fuelUsageLiters: true,
      transportationDistanceKm: true,
      renewableEnergyUsagePercent: true
    },
    _min: { carbonEmissionKgCO2: true, date: true },
    _max: { carbonEmissionKgCO2: true, date: true }
  });

  const dataset = await prisma.uploadedDataset.findFirst();

  console.log('--- DATABASE VERIFICATION ---');
  console.log(`Total Dataset Records: ${count}`);
  console.log(`Uploaded Dataset ID: ${dataset?.id}, Name: ${dataset?.filename}`);
  console.log(`Date Range: ${agg._min.date.toISOString().split('T')[0]} to ${agg._max.date.toISOString().split('T')[0]}`);
  console.log(`Carbon Emission Target (kgCO2): Min=${agg._min.carbonEmissionKgCO2.toFixed(3)}, Avg=${agg._avg.carbonEmissionKgCO2.toFixed(3)}, Max=${agg._max.carbonEmissionKgCO2.toFixed(3)}`);
  console.log(`Standardized Feature Means: Energy=${agg._avg.energyUsageKwh.toFixed(4)}, Fuel=${agg._avg.fuelUsageLiters.toFixed(4)}, Transport=${agg._avg.transportationDistanceKm.toFixed(4)}, Renewable=${agg._avg.renewableEnergyUsagePercent.toFixed(4)}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

