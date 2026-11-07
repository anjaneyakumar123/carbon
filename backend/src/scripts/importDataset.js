const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importDataset(filePathOverride) {
  const filePath = filePathOverride || path.join(__dirname, '../../../data/Preprocessed_Carbon_Footprint_Dataset.csv');
  console.log(`Starting dataset import from: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Dataset file not found at ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');

  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: async (results) => {
        try {
          const rows = results.data;
          console.log(`Parsed ${rows.length} rows from CSV`);

          if (rows.length === 0) {
            throw new Error('CSV is empty');
          }

          // Expected columns verification
          const expectedColumns = [
            'Date',
            'Energy_Usage_kWh',
            'Transportation_Distance_km',
            'Smart_Appliance_Usage_hours',
            'Renewable_Energy_Usage_percent',
            'Temperature_C',
            'Humidity_percent',
            'Fuel_Usage_Liters',
            'Waste_Generated_kg',
            'Vehicle_Type_Car',
            'Vehicle_Type_Electric Vehicle',
            'Vehicle_Type_Walking',
            'Building_Type_Residential',
            'Carbon_Emission_kgCO2'
          ];

          const firstRow = rows[0];
          for (const col of expectedColumns) {
            if (!(col in firstRow)) {
              throw new Error(`Missing expected column: ${col}`);
            }
          }

          // Check if dataset record already exists
          const existingCount = await prisma.datasetRecord.count();
          if (existingCount >= 10000) {
            console.log(`Dataset already contains ${existingCount} records. Skipping re-import to avoid duplicates.`);
            const dataset = await prisma.uploadedDataset.findFirst({
              orderBy: { createdAt: 'desc' }
            });
            resolve({ count: existingCount, datasetId: dataset?.id });
            return;
          }

          // Sort or calculate date range
          const dates = rows.map(r => new Date(r.Date)).filter(d => !isNaN(d.getTime()));
          const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
          const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

          // Create dataset record
          const uploadedDataset = await prisma.uploadedDataset.create({
            data: {
              filename: path.basename(filePath),
              originalName: 'Preprocessed_Carbon_Footprint_Dataset.csv',
              rowCount: rows.length,
              columnCount: expectedColumns.length,
              dateRangeStart: minDate,
              dateRangeEnd: maxDate,
              status: 'COMPLETED',
              uploadedBy: 'System Preprocessed Loader'
            }
          });

          console.log(`Created UploadedDataset ID: ${uploadedDataset.id}`);

          // Transform rows into Prisma model structure
          const formattedRecords = rows.map((r) => ({
            datasetId: uploadedDataset.id,
            date: new Date(r.Date),
            energyUsageKwh: Number(r.Energy_Usage_kWh),
            transportationDistanceKm: Number(r.Transportation_Distance_km),
            smartApplianceUsageHours: Number(r.Smart_Appliance_Usage_hours),
            renewableEnergyUsagePercent: Number(r.Renewable_Energy_Usage_percent),
            temperatureC: Number(r.Temperature_C),
            humidityPercent: Number(r.Humidity_percent),
            fuelUsageLiters: Number(r.Fuel_Usage_Liters),
            wasteGeneratedKg: Number(r.Waste_Generated_kg),
            vehicleTypeCar: Number(r.Vehicle_Type_Car),
            vehicleTypeElectricVehicle: Number(r['Vehicle_Type_Electric Vehicle']),
            vehicleTypeWalking: Number(r.Vehicle_Type_Walking),
            buildingTypeResidential: Number(r.Building_Type_Residential),
            carbonEmissionKgCO2: Number(r.Carbon_Emission_kgCO2),
            isOriginal: true
          }));

          // Batch insert in chunks of 1000
          const chunkSize = 1000;
          let insertedCount = 0;
          for (let i = 0; i < formattedRecords.length; i += chunkSize) {
            const chunk = formattedRecords.slice(i, i + chunkSize);
            await prisma.datasetRecord.createMany({
              data: chunk
            });
            insertedCount += chunk.length;
            console.log(`Inserted ${insertedCount}/${formattedRecords.length} records...`);
          }

          // Log in ImportLog
          await prisma.importLog.create({
            data: {
              filename: path.basename(filePath),
              totalRows: rows.length,
              successfulRows: insertedCount,
              failedRows: 0,
              importedBy: 'System Initializer'
            }
          });

          console.log(`✓ Successfully imported ${insertedCount} records into PostgreSQL.`);
          resolve({ count: insertedCount, datasetId: uploadedDataset.id });
        } catch (err) {
          console.error('Import processing error:', err);
          reject(err);
        }
      },
      error: (err) => {
        console.error('CSV Parsing error:', err);
        reject(err);
      }
    });
  });
}

if (require.main === module) {
  importDataset()
    .catch((err) => {
      console.error('Fatal import error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { importDataset };

