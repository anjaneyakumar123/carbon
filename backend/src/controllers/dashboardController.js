const prisma = require('../config/prisma');

exports.getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate, year, vehicleType, buildingType } = req.query;

    const where = {};

    // Date filtering
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    } else if (year) {
      const y = parseInt(year);
      where.date = {
        gte: new Date(`${y}-01-01T00:00:00.000Z`),
        lte: new Date(`${y}-12-31T23:59:59.999Z`)
      };
    }

    // Vehicle filtering
    if (vehicleType === 'car') {
      where.vehicleTypeCar = { gt: 0.0 };
    } else if (vehicleType === 'ev') {
      where.vehicleTypeElectricVehicle = { gt: 0.0 };
    } else if (vehicleType === 'walking') {
      where.vehicleTypeWalking = { gt: 0.0 };
    }

    // Building filtering
    if (buildingType === 'residential') {
      where.buildingTypeResidential = { gt: 0.0 };
    } else if (buildingType === 'commercial') {
      where.buildingTypeResidential = { lte: 0.0 };
    }

    const count = await prisma.datasetRecord.count({ where });

    if (count === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          totalRecords: 0,
          totalEmissionsKgCO2: 0,
          avgEmissionsKgCO2: 0,
          maxEmissionsKgCO2: 0,
          minEmissionsKgCO2: 0,
          standardizedFeatures: {
            avgEnergyUsage: 0,
            avgTransportation: 0,
            avgFuelUsage: 0,
            avgRenewableEnergy: 0,
            avgWasteGenerated: 0
          }
        }
      });
    }

    const agg = await prisma.datasetRecord.aggregate({
      where,
      _sum: {
        carbonEmissionKgCO2: true
      },
      _avg: {
        carbonEmissionKgCO2: true,
        energyUsageKwh: true,
        transportationDistanceKm: true,
        fuelUsageLiters: true,
        renewableEnergyUsagePercent: true,
        wasteGeneratedKg: true
      },
      _min: {
        carbonEmissionKgCO2: true,
        date: true
      },
      _max: {
        carbonEmissionKgCO2: true,
        date: true
      }
    });

    // Also fetch activity records summary (Mode B real-world activity data)
    const activityCount = await prisma.activityRecord.count();
    const activityAgg = await prisma.activityRecord.aggregate({
      _sum: {
        calculatedEmissionKgCO2: true
      }
    });

    return res.status(200).json({
      success: true,
      summary: {
        totalRecords: count,
        totalEmissionsKgCO2: agg._sum.carbonEmissionKgCO2 || 0,
        avgEmissionsKgCO2: agg._avg.carbonEmissionKgCO2 || 0,
        maxEmissionsKgCO2: agg._max.carbonEmissionKgCO2 || 0,
        minEmissionsKgCO2: agg._min.carbonEmissionKgCO2 || 0,
        dateRange: {
          start: agg._min.date,
          end: agg._max.date
        },
        standardizedFeatures: {
          avgEnergyUsage: agg._avg.energyUsageKwh || 0,
          avgTransportation: agg._avg.transportationDistanceKm || 0,
          avgFuelUsage: agg._avg.fuelUsageLiters || 0,
          avgRenewableEnergy: agg._avg.renewableEnergyUsagePercent || 0,
          avgWasteGenerated: agg._avg.wasteGeneratedKg || 0,
          isStandardized: true,
          notice: 'Feature values are z-score standardized (mean ~ 0, unit variance) and not raw kWh, Litres, or km.'
        },
        operationalActivities: {
          totalNewActivities: activityCount,
          totalCalculatedKgCO2: activityAgg._sum.calculatedEmissionKgCO2 || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTrends = async (req, res, next) => {
  try {
    const { groupBy = 'year', limit = 50 } = req.query;

    let query;
    if (groupBy === 'month') {
      query = prisma.$queryRaw`
        SELECT 
          TO_CHAR(date, 'YYYY-MM') AS period,
          COUNT(*)::int AS count,
          AVG("carbonEmissionKgCO2") AS avg_emission,
          SUM("carbonEmissionKgCO2") AS total_emission,
          AVG("energyUsageKwh") AS avg_energy_std,
          AVG("fuelUsageLiters") AS avg_fuel_std,
          AVG("renewableEnergyUsagePercent") AS avg_renewable_std
        FROM dataset_records
        GROUP BY TO_CHAR(date, 'YYYY-MM')
        ORDER BY period ASC
        LIMIT ${parseInt(limit)};
      `;
    } else {
      query = prisma.$queryRaw`
        SELECT 
          TO_CHAR(date, 'YYYY') AS period,
          COUNT(*)::int AS count,
          AVG("carbonEmissionKgCO2") AS avg_emission,
          SUM("carbonEmissionKgCO2") AS total_emission,
          AVG("energyUsageKwh") AS avg_energy_std,
          AVG("fuelUsageLiters") AS avg_fuel_std,
          AVG("renewableEnergyUsagePercent") AS avg_renewable_std
        FROM dataset_records
        GROUP BY TO_CHAR(date, 'YYYY')
        ORDER BY period ASC;
      `;
    }

    const trends = await query;
    return res.status(200).json({ success: true, trends });
  } catch (error) {
    next(error);
  }
};

exports.getDistribution = async (req, res, next) => {
  try {
    // Generate emission distribution histogram (bins of 5 kgCO2)
    const distribution = await prisma.$queryRaw`
      SELECT 
        floor("carbonEmissionKgCO2" / 5) * 5 AS bin_start,
        (floor("carbonEmissionKgCO2" / 5) * 5) + 5 AS bin_end,
        COUNT(*)::int AS count
      FROM dataset_records
      GROUP BY bin_start, bin_end
      ORDER BY bin_start ASC;
    `;

    return res.status(200).json({ success: true, distribution });
  } catch (error) {
    next(error);
  }
};

exports.getBreakdowns = async (req, res, next) => {
  try {
    // Vehicle breakdown
    const vehicleBreakdown = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN "vehicleTypeCar" > 0 THEN 'Car'
          WHEN "vehicleTypeElectricVehicle" > 0 THEN 'Electric Vehicle'
          WHEN "vehicleTypeWalking" > 0 THEN 'Walking / Non-motorized'
          ELSE 'Other'
        END AS vehicle_category,
        COUNT(*)::int AS record_count,
        AVG("carbonEmissionKgCO2") AS avg_emission,
        SUM("carbonEmissionKgCO2") AS total_emission
      FROM dataset_records
      GROUP BY vehicle_category
      ORDER BY total_emission DESC;
    `;

    // Building breakdown
    const buildingBreakdown = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN "buildingTypeResidential" > 0 THEN 'Residential'
          ELSE 'Non-Residential / Operational'
        END AS building_category,
        COUNT(*)::int AS record_count,
        AVG("carbonEmissionKgCO2") AS avg_emission,
        SUM("carbonEmissionKgCO2") AS total_emission
      FROM dataset_records
      GROUP BY building_category;
    `;

    // Top 10 emission periods
    const topPeriods = await prisma.datasetRecord.findMany({
      orderBy: { carbonEmissionKgCO2: 'desc' },
      take: 10,
      select: {
        id: true,
        date: true,
        carbonEmissionKgCO2: true,
        energyUsageKwh: true,
        fuelUsageLiters: true,
        transportationDistanceKm: true,
        renewableEnergyUsagePercent: true
      }
    });

    return res.status(200).json({
      success: true,
      vehicleBreakdown,
      buildingBreakdown,
      topPeriods
    });
  } catch (error) {
    next(error);
  }
};

