const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedActivities() {
  console.log('Seeding initial Mode B operational activity records...');

  const existing = await prisma.activityRecord.count();
  if (existing > 0) {
    console.log(`Activity records already present (${existing} records).`);
    return;
  }

  const depts = await prisma.department.findMany();
  const factors = await prisma.emissionFactor.findMany();

  const deptMap = {};
  depts.forEach(d => { deptMap[d.code] = d.id; });

  const factorMap = {};
  factors.forEach(f => { factorMap[f.fuelOrActivityType] = f; });

  const sampleActivities = [
    {
      date: new Date('2025-01-15'),
      category: 'ENERGY',
      activityName: 'Cryogenic Engine High-Pressure Substation Draw',
      quantity: 14500, // kWh
      unit: 'kWh',
      scope: 'SCOPE_2',
      factorName: 'Grid Electricity (CEA India v19)',
      deptCode: 'CEP'
    },
    {
      date: new Date('2025-01-20'),
      category: 'FUEL',
      activityName: 'Auxiliary Diesel Generator Hot-Fire Standby Run',
      quantity: 850, // Litres
      unit: 'Litre',
      scope: 'SCOPE_1',
      factorName: 'Diesel (HSD)',
      deptCode: 'PTF'
    },
    {
      date: new Date('2025-02-05'),
      category: 'TRANSPORTATION',
      activityName: 'Inter-complex Propulsion Subsystem Transfer',
      quantity: 1250, // tonne-km
      unit: 'tonne-km',
      scope: 'SCOPE_3',
      factorName: 'Heavy Commercial Truck (Diesel)',
      deptCode: 'FIU'
    },
    {
      date: new Date('2025-02-14'),
      category: 'WASTE',
      activityName: 'Propulsion Testing Facility Solid Residue Disposal',
      quantity: 340, // kg
      unit: 'kg',
      scope: 'SCOPE_3',
      factorName: 'General Municipal Solid Waste',
      deptCode: 'SQA'
    },
    {
      date: new Date('2025-03-01'),
      category: 'WATER',
      activityName: 'Engine Test Stand Flame Deflector Water Deluge Pumping',
      quantity: 450, // kL
      unit: 'kL',
      scope: 'SCOPE_3',
      factorName: 'Potable Water Supply & Distribution',
      deptCode: 'FIU'
    },
    {
      date: new Date('2025-03-10'),
      category: 'MATERIAL',
      activityName: 'Propellant Chill-down Auxiliary Cryogenic Fluid Supply',
      quantity: 2800, // kg
      unit: 'kg',
      scope: 'SCOPE_3',
      factorName: 'Liquid Nitrogen (Cryogenic Propellant Auxiliary)',
      deptCode: 'CEP'
    },
    {
      date: new Date('2025-03-18'),
      category: 'TRANSPORTATION',
      activityName: 'Administrative Electric Buggy Transit Operations',
      quantity: 620, // km
      unit: 'km',
      scope: 'SCOPE_2',
      factorName: 'Electric Vehicle (Powered by CEA Grid)',
      deptCode: 'EMD'
    }
  ];

  for (const act of sampleActivities) {
    const factor = factorMap[act.factorName];
    const deptId = deptMap[act.deptCode];
    const calc = factor ? act.quantity * factor.factor : null;

    const created = await prisma.activityRecord.create({
      data: {
        date: act.date,
        category: act.category,
        activityName: act.activityName,
        quantity: act.quantity,
        unit: act.unit,
        scope: act.scope,
        emissionFactorId: factor ? factor.id : null,
        calculatedEmissionKgCO2: calc,
        calculationStatus: 'COMPLETED',
        departmentId: deptId || null,
        createdBy: 'Senior Environmental Officer'
      }
    });

    if (calc && factor) {
      await prisma.emissionResult.create({
        data: {
          activityRecordId: created.id,
          emissionKgCO2: calc,
          emissionKgCO2e: calc * (factor.co2eMultiplier || 1.0),
          factorUsed: factor.factor,
          factorSource: factor.source,
          notes: `${factor.methodology} (${factor.version})`
        }
      });
    }
  }

  console.log(`✓ Seeded ${sampleActivities.length} operational Mode B activity records.`);
}

seedActivities()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
