const prisma = require('../config/prisma');
const ExcelJS = require('exceljs');
const Papa = require('papaparse');
const path = require('path');
const fs = require('fs');

const DATA_DICTIONARY = [
  {
    name: 'Date',
    type: 'Date (ISO 8601)',
    nature: 'Temporal identifier',
    standardized: false,
    description: 'Timestamp for the recorded observation period (approx. 2024 to 2051 in research projection).'
  },
  {
    name: 'Energy_Usage_kWh',
    type: 'Float',
    nature: 'Standardized Feature (Z-score)',
    standardized: true,
    description: 'Standardized electricity consumption feature (zero mean, unit variance). Negative values reflect below-average consumption, NOT negative power.'
  },
  {
    name: 'Transportation_Distance_km',
    type: 'Float',
    nature: 'Standardized Feature (Z-score)',
    standardized: true,
    description: 'Standardized travel distance feature for transportation activities.'
  },
  {
    name: 'Smart_Appliance_Usage_hours',
    type: 'Float',
    nature: 'Standardized Feature (Z-score)',
    standardized: true,
    description: 'Standardized duration of automated/smart energy appliance operations.'
  },
  {
    name: 'Renewable_Energy_Usage_percent',
    type: 'Float',
    nature: 'Standardized Feature (Z-score)',
    standardized: true,
    description: 'Standardized proportion of renewable generation in total energy mix.'
  },
  {
    name: 'Temperature_C',
    type: 'Float',
    nature: 'Standardized Feature (Z-score)',
    standardized: true,
    description: 'Standardized ambient outdoor temperature measurement.'
  },
  {
    name: 'Humidity_percent',
    type: 'Float',
    nature: 'Standardized Feature (Z-score)',
    standardized: true,
    description: 'Standardized relative atmospheric humidity score.'
  },
  {
    name: 'Fuel_Usage_Liters',
    type: 'Float',
    nature: 'Standardized Feature (Z-score)',
    standardized: true,
    description: 'Standardized liquid fuel volume (diesel/petrol stationary & mobile equipment).'
  },
  {
    name: 'Waste_Generated_kg',
    type: 'Float',
    nature: 'Standardized Feature (Z-score)',
    standardized: true,
    description: 'Standardized total solid/liquid waste mass generated.'
  },
  {
    name: 'Vehicle_Type_Car',
    type: 'Float',
    nature: 'Standardized One-Hot Encoded',
    standardized: true,
    description: 'Binary indicator for Car presence, standardized (~1.69 if active, ~-0.59 if inactive).'
  },
  {
    name: 'Vehicle_Type_Electric Vehicle',
    type: 'Float',
    nature: 'Standardized One-Hot Encoded',
    standardized: true,
    description: 'Binary indicator for Electric Vehicle presence, standardized (~1.73 if active, ~-0.58 if inactive).'
  },
  {
    name: 'Vehicle_Type_Walking',
    type: 'Float',
    nature: 'Standardized One-Hot Encoded',
    standardized: true,
    description: 'Binary indicator for Walking/Non-motorized mobility, standardized (~1.74 if active, ~-0.57 if inactive).'
  },
  {
    name: 'Building_Type_Residential',
    type: 'Float',
    nature: 'Standardized Encoded',
    standardized: true,
    description: 'Binary indicator for Residential building category (~1.00 for residential, ~-0.99 for non-residential/commercial).'
  },
  {
    name: 'Carbon_Emission_kgCO2',
    type: 'Float',
    nature: 'Physical Target Variable',
    standardized: false,
    description: 'Actual unstandardized carbon footprint target variable measured in kilograms of CO2 (kgCO2).'
  }
];

exports.getDataDictionary = (req, res) => {
  return res.status(200).json({
    success: true,
    dataDictionary: DATA_DICTIONARY,
    notes: [
      'Numerical input features are standardized (Z-scores). Never treat negative values as negative physical energy or fuel.',
      'Only Carbon_Emission_kgCO2 represents actual physical kilograms of carbon dioxide.',
      'Dataset represents preprocessed research baseline (RES-IPRC-2025-003).'
    ]
  });
};

exports.getRecords = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 25,
      sortBy = 'date',
      sortOrder = 'asc',
      startDate,
      endDate,
      minEmission,
      maxEmission,
      vehicleType,
      buildingType
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(500, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * pageSize;

    const where = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (minEmission || maxEmission) {
      where.carbonEmissionKgCO2 = {};
      if (minEmission) where.carbonEmissionKgCO2.gte = parseFloat(minEmission);
      if (maxEmission) where.carbonEmissionKgCO2.lte = parseFloat(maxEmission);
    }

    if (vehicleType === 'car') {
      where.vehicleTypeCar = { gt: 0.0 };
    } else if (vehicleType === 'ev') {
      where.vehicleTypeElectricVehicle = { gt: 0.0 };
    } else if (vehicleType === 'walking') {
      where.vehicleTypeWalking = { gt: 0.0 };
    }

    if (buildingType === 'residential') {
      where.buildingTypeResidential = { gt: 0.0 };
    } else if (buildingType === 'commercial') {
      where.buildingTypeResidential = { lte: 0.0 };
    }

    const validSortFields = [
      'date',
      'carbonEmissionKgCO2',
      'energyUsageKwh',
      'transportationDistanceKm',
      'fuelUsageLiters',
      'wasteGeneratedKg',
      'renewableEnergyUsagePercent'
    ];

    const sortField = validSortFields.includes(sortBy) ? sortBy : 'date';
    const direction = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';

    const [totalRecords, records] = await Promise.all([
      prisma.datasetRecord.count({ where }),
      prisma.datasetRecord.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortField]: direction }
      })
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        totalRecords,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(totalRecords / pageSize)
      },
      records
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await prisma.datasetRecord.findUnique({
      where: { id },
      include: { dataset: true }
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    return res.status(200).json({ success: true, record });
  } catch (error) {
    next(error);
  }
};

exports.getDatasetSummary = async (req, res, next) => {
  try {
    const dataset = await prisma.uploadedDataset.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    const totalRecords = await prisma.datasetRecord.count();
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*)::int AS count,
        AVG("carbonEmissionKgCO2") AS avg_carbon,
        STDDEV("carbonEmissionKgCO2") AS std_carbon,
        MIN("carbonEmissionKgCO2") AS min_carbon,
        MAX("carbonEmissionKgCO2") AS max_carbon,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY "carbonEmissionKgCO2") AS p25_carbon,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY "carbonEmissionKgCO2") AS p50_carbon,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY "carbonEmissionKgCO2") AS p75_carbon,
        
        AVG("energyUsageKwh") AS avg_energy,
        MIN("energyUsageKwh") AS min_energy,
        MAX("energyUsageKwh") AS max_energy,

        AVG("fuelUsageLiters") AS avg_fuel,
        MIN("fuelUsageLiters") AS min_fuel,
        MAX("fuelUsageLiters") AS max_fuel,

        AVG("transportationDistanceKm") AS avg_transport,
        MIN("transportationDistanceKm") AS min_transport,
        MAX("transportationDistanceKm") AS max_transport,

        AVG("renewableEnergyUsagePercent") AS avg_renewable,
        MIN("renewableEnergyUsagePercent") AS min_renewable,
        MAX("renewableEnergyUsagePercent") AS max_renewable,

        MIN("date") AS min_date,
        MAX("date") AS max_date
      FROM dataset_records;
    `;

    return res.status(200).json({
      success: true,
      dataset,
      statistics: stats[0],
      totalRecords,
      totalColumns: 14,
      missingValues: 0,
      duplicateRows: 0,
      targetVariable: 'Carbon_Emission_kgCO2',
      preprocessingNote: 'Features are standardized (mean=0, std=1). Negative feature values are standardized scores.'
    });
  } catch (error) {
    next(error);
  }
};

exports.exportData = async (req, res, next) => {
  try {
    const { format = 'csv', limit = 2000 } = req.query;

    const records = await prisma.datasetRecord.findMany({
      take: Math.min(10000, parseInt(limit)),
      orderBy: { date: 'asc' }
    });

    const formatted = records.map(r => ({
      Date: r.date.toISOString().split('T')[0],
      Energy_Usage_kWh_Standardized: r.energyUsageKwh,
      Transportation_Distance_km_Standardized: r.transportationDistanceKm,
      Smart_Appliance_Usage_hours_Standardized: r.smartApplianceUsageHours,
      Renewable_Energy_Usage_percent_Standardized: r.renewableEnergyUsagePercent,
      Temperature_C_Standardized: r.temperatureC,
      Humidity_percent_Standardized: r.humidityPercent,
      Fuel_Usage_Liters_Standardized: r.fuelUsageLiters,
      Waste_Generated_kg_Standardized: r.wasteGeneratedKg,
      Vehicle_Type_Car_Encoded: r.vehicleTypeCar,
      Vehicle_Type_EV_Encoded: r.vehicleTypeElectricVehicle,
      Vehicle_Type_Walking_Encoded: r.vehicleTypeWalking,
      Building_Type_Residential_Encoded: r.buildingTypeResidential,
      Carbon_Emission_kgCO2_Target: r.carbonEmissionKgCO2
    }));

    if (format === 'excel' || format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Dataset Records');

      worksheet.columns = Object.keys(formatted[0]).map(key => ({
        header: key,
        key: key,
        width: 20
      }));

      worksheet.addRows(formatted);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="IPRC_CarbonTrack_Export.xlsx"');

      await workbook.xlsx.write(res);
      return res.end();
    } else {
      const csv = Papa.unparse(formatted);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="IPRC_CarbonTrack_Export.csv"');
      return res.status(200).send(csv);
    }
  } catch (error) {
    next(error);
  }
};

exports.uploadAndImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { originalname, buffer } = req.file;
    const content = buffer.toString('utf8');

    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: async (results) => {
        try {
          const rows = results.data;
          if (!rows || rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Uploaded file is empty or has no records' });
          }

          const detectedCols = Object.keys(rows[0]);
          let minDate = null;
          let maxDate = null;

          // Prepare records for database insertion
          const recordsToInsert = [];
          for (const row of rows) {
            // Find date field
            const dateVal = row['Date'] || row['date'];
            if (!dateVal) continue;

            const parsedDate = new Date(dateVal);
            if (isNaN(parsedDate.getTime())) continue;

            if (!minDate || parsedDate < minDate) minDate = parsedDate;
            if (!maxDate || parsedDate > maxDate) maxDate = parsedDate;

            recordsToInsert.push({
              date: parsedDate,
              energyUsageKwh: Number(row['Energy_Usage_kWh'] ?? 0),
              transportationDistanceKm: Number(row['Transportation_Distance_km'] ?? 0),
              smartApplianceUsageHours: Number(row['Smart_Appliance_Usage_hours'] ?? 0),
              renewableEnergyUsagePercent: Number(row['Renewable_Energy_Usage_percent'] ?? 0),
              temperatureC: Number(row['Temperature_C'] ?? 0),
              humidityPercent: Number(row['Humidity_percent'] ?? 0),
              fuelUsageLiters: Number(row['Fuel_Usage_Liters'] ?? 0),
              wasteGeneratedKg: Number(row['Waste_Generated_kg'] ?? 0),
              vehicleTypeCar: Number(row['Vehicle_Type_Car'] ?? 0),
              vehicleTypeElectricVehicle: Number(row['Vehicle_Type_Electric Vehicle'] ?? row['Vehicle_Type_Electric_Vehicle'] ?? 0),
              vehicleTypeWalking: Number(row['Vehicle_Type_Walking'] ?? 0),
              buildingTypeResidential: Number(row['Building_Type_Residential'] ?? 0),
              carbonEmissionKgCO2: Number(row['Carbon_Emission_kgCO2'] ?? 0),
              isOriginal: false
            });
          }

          if (recordsToInsert.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'No valid records could be extracted from dataset. Please ensure required schema and valid dates.'
            });
          }

          // Create dataset record
          const uploadedDataset = await prisma.uploadedDataset.create({
            data: {
              filename: originalname,
              originalName: originalname,
              rowCount: recordsToInsert.length,
              columnCount: detectedCols.length,
              dateRangeStart: minDate,
              dateRangeEnd: maxDate,
              status: 'COMPLETED',
              uploadedBy: req.user ? req.user.name : 'Authorized Officer'
            }
          });

          // Associate datasetId and batch insert in chunks of 500
          const chunkSize = 500;
          for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
            const chunk = recordsToInsert.slice(i, i + chunkSize).map(r => ({
              ...r,
              datasetId: uploadedDataset.id
            }));
            await prisma.datasetRecord.createMany({
              data: chunk
            });
          }

          // Create audit import log
          await prisma.importLog.create({
            data: {
              filename: originalname,
              totalRows: rows.length,
              successfulRows: recordsToInsert.length,
              failedRows: rows.length - recordsToInsert.length,
              importedBy: req.user ? req.user.name : 'Authorized Officer'
            }
          });

          return res.status(200).json({
            success: true,
            message: `Successfully validated and ingested ${recordsToInsert.length} records into PostgreSQL`,
            datasetId: uploadedDataset.id,
            rowCount: recordsToInsert.length,
            columnCount: detectedCols.length,
            columnsDetected: detectedCols,
            dateRange: {
              start: minDate?.toISOString().split('T')[0],
              end: maxDate?.toISOString().split('T')[0]
            }
          });
        } catch (err) {
          next(err);
        }
      },
      error: (err) => {
        return res.status(400).json({ success: false, message: 'CSV parsing error', error: err.message });
      }
    });
  } catch (error) {
    next(error);
  }
};

