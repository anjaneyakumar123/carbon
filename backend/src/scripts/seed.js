const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING IPRC CARBONTRACK DATABASE ---');

  // 1. Departments
  const departmentsData = [
    { name: 'Propulsion Testing Facility', code: 'PTF', description: 'Rocket and engine hot-test observation & test stands' },
    { name: 'Cryogenic Engine Plant', code: 'CEP', description: 'Cryogenic upper stage manufacturing and propellant loading' },
    { name: 'Environmental Management Division', code: 'EMD', description: 'Station-wide emission monitoring, waste & ecological audit' },
    { name: 'Facility Infrastructure & Utilities', code: 'FIU', description: 'Grid substations, water supply, auxiliary generators' },
    { name: 'Safety & Quality Assurance', code: 'SQA', description: 'Hazardous materials handling and safety compliance' }
  ];

  const deptMap = {};
  for (const dept of departmentsData) {
    const created = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept
    });
    deptMap[dept.code] = created.id;
  }
  console.log('✓ Departments created/verified');

  // 2. Users
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123', salt);
  const officerPassword = await bcrypt.hash('Officer@123', salt);
  const analystPassword = await bcrypt.hash('Analyst@123', salt);

  const usersData = [
    {
      email: 'admin@iprc.isro.gov.in',
      name: 'Dr. R. Ramanathan',
      passwordHash: adminPassword,
      role: 'ADMIN',
      designation: 'Head, Environmental Safety Group',
      departmentId: deptMap['EMD']
    },
    {
      email: 'officer@iprc.isro.gov.in',
      name: 'S. Meenakshi',
      passwordHash: officerPassword,
      role: 'OFFICER',
      designation: 'Senior Environmental Officer',
      departmentId: deptMap['EMD']
    },
    {
      email: 'analyst@iprc.isro.gov.in',
      name: 'K. Vignesh',
      passwordHash: analystPassword,
      role: 'ANALYST',
      designation: 'Data Analyst & Research Scholar (RES-IPRC-2025-003)',
      departmentId: deptMap['PTF']
    }
  ];

  for (const user of usersData) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash: user.passwordHash,
        role: user.role,
        designation: user.designation,
        name: user.name
      },
      create: user
    });
  }
  console.log('✓ Users created: admin, officer, analyst');

  // 3. Official Emission Factors
  const emissionFactorsData = [
    {
      category: 'ENERGY',
      fuelOrActivityType: 'Grid Electricity (CEA India v19)',
      factor: 0.82,
      unit: 'kg CO2 / kWh',
      source: 'Central Electricity Authority (CEA) CO2 Baseline Database India v19',
      version: '2023.2',
      methodology: 'Combined Margin (CM) Tier 1 Emission Factor',
      co2eMultiplier: 1.0,
      isActive: true,
      isVerified: true
    },
    {
      category: 'FUEL',
      fuelOrActivityType: 'Diesel (HSD)',
      factor: 2.68,
      unit: 'kg CO2 / Litre',
      source: 'IPCC 2019 Refinement to 2006 Guidelines for National GHG Inventories',
      version: '2023.1',
      methodology: 'Tier 1 Stationary / Mobile Combustion',
      co2eMultiplier: 1.01,
      isActive: true,
      isVerified: true
    },
    {
      category: 'FUEL',
      fuelOrActivityType: 'Petrol (Motor Gasoline)',
      factor: 2.31,
      unit: 'kg CO2 / Litre',
      source: 'IPCC 2019 Guidelines for National GHG Inventories',
      version: '2023.1',
      methodology: 'Tier 1 Mobile Combustion',
      co2eMultiplier: 1.01,
      isActive: true,
      isVerified: true
    },
    {
      category: 'FUEL',
      fuelOrActivityType: 'Compressed Natural Gas (CNG)',
      factor: 2.75,
      unit: 'kg CO2 / kg',
      source: 'Ministry of Petroleum & Natural Gas, India / IPCC',
      version: '2022.1',
      methodology: 'Mass combustion stoichiometric calculation',
      co2eMultiplier: 1.02,
      isActive: true,
      isVerified: true
    },
    {
      category: 'TRANSPORTATION',
      fuelOrActivityType: 'Passenger Car (Mid-size Fleet Petrol)',
      factor: 0.171,
      unit: 'kg CO2 / km',
      source: 'BEE India / GHG Protocol Transport Tool',
      version: '2023.1',
      methodology: 'Distance-based Tier 2 fleet emission model',
      co2eMultiplier: 1.0,
      isActive: true,
      isVerified: true
    },
    {
      category: 'TRANSPORTATION',
      fuelOrActivityType: 'Electric Vehicle (Powered by CEA Grid)',
      factor: 0.053,
      unit: 'kg CO2 / km',
      source: 'Calculated from 15 kWh/100km efficiency @ CEA Grid Baseline',
      version: '2023.1',
      methodology: 'Well-to-Wheel (WTW) grid-charged calculation',
      co2eMultiplier: 1.0,
      isActive: true,
      isVerified: true
    },
    {
      category: 'TRANSPORTATION',
      fuelOrActivityType: 'Heavy Commercial Truck (Diesel)',
      factor: 0.297,
      unit: 'kg CO2 / tonne-km',
      source: 'GHG Protocol Freight Transport Tool',
      version: '2022.1',
      methodology: 'Freight freight-km intensity',
      co2eMultiplier: 1.02,
      isActive: true,
      isVerified: true
    },
    {
      category: 'WASTE',
      fuelOrActivityType: 'General Municipal Solid Waste',
      factor: 0.58,
      unit: 'kg CO2 / kg',
      source: 'IPCC Waste Model (First Order Decay Default)',
      version: '2021.1',
      methodology: 'Tier 1 solid waste disposal on land',
      co2eMultiplier: 1.15,
      isActive: true,
      isVerified: true
    },
    {
      category: 'WATER',
      fuelOrActivityType: 'Potable Water Supply & Distribution',
      factor: 0.35,
      unit: 'kg CO2 / kL',
      source: 'CPHEEO Water Supply Guidelines / BEE India',
      version: '2022.1',
      methodology: 'Pumping and chlorination energy intensity',
      co2eMultiplier: 1.0,
      isActive: true,
      isVerified: true
    },
    {
      category: 'MATERIAL',
      fuelOrActivityType: 'Liquid Nitrogen (Cryogenic Propellant Auxiliary)',
      factor: 0.45,
      unit: 'kg CO2 / kg',
      source: 'Industrial Gas Association Life Cycle Assessment',
      version: '2023.1',
      methodology: 'Air Separation Unit (ASU) specific electricity consumption',
      co2eMultiplier: 1.0,
      isActive: true,
      isVerified: true
    }
  ];

  for (const ef of emissionFactorsData) {
    await prisma.emissionFactor.upsert({
      where: { fuelOrActivityType: ef.fuelOrActivityType },
      update: ef,
      create: ef
    });
  }
  console.log('✓ Standard Emission Factors populated (CEA, IPCC, GHG Protocol)');

  // 4. Initial Rule-based Recommendations
  const recommendationsData = [
    {
      title: 'Investigate High Carbon Emission Spikes (>35 kgCO2)',
      description: 'Historical records show recurring cluster emissions exceeding 35 kgCO2 associated with peak simultaneous energy and fuel usage features.',
      priority: 'HIGH',
      category: 'ENERGY',
      supportingData: '95th percentile emission threshold is 34.8 kgCO2 across dataset records.',
      relatedFeature: 'Energy_Usage_kWh & Fuel_Usage_Liters',
      suggestedAction: 'Perform thermal audit and evaluate time-of-day peak load shifting across stationary power generation systems.'
    },
    {
      title: 'Expand Captive Solar Integration for Clean Base-load',
      description: 'Data analytics indicate inverse correlation between renewable energy percentage and net emission intensity.',
      priority: 'MEDIUM',
      category: 'RENEWABLE',
      supportingData: 'Feature correlation of Renewable_Energy_Usage_percent demonstrates negative coefficient with Carbon_Emission_kgCO2.',
      relatedFeature: 'Renewable_Energy_Usage_percent',
      suggestedAction: 'Increase rooftop and ground-mounted solar PV capacity at administrative and residential quarters.'
    },
    {
      title: 'Transition Intra-Campus Utility Vehicles to Electric Mobility',
      description: 'Vehicle type encoded features demonstrate distinctly elevated emissions during high traditional car usage intervals compared to EV mode.',
      priority: 'MEDIUM',
      category: 'TRANSPORT',
      supportingData: 'Car usage feature correlates positively with higher daily emission footprint.',
      relatedFeature: 'Vehicle_Type_Car vs Vehicle_Type_Electric Vehicle',
      suggestedAction: 'Mandate electric buggies and EVs for inter-complex transfers and staff transit.'
    },
    {
      title: 'Establish Segregated Recycling & Organic Composting Protocols',
      description: 'Waste generation feature indicates proportional impact on lifecycle footprint.',
      priority: 'LOW',
      category: 'WASTE',
      supportingData: 'Waste generation feature mean standardized score matches overall activity volume.',
      relatedFeature: 'Waste_Generated_kg',
      suggestedAction: 'Enhance solid waste segregation at source and commission biogas digestors for canteen organic waste.'
    }
  ];

  for (const rec of recommendationsData) {
    await prisma.recommendation.create({
      data: rec
    });
  }
  console.log('✓ Initial Recommendations populated');

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

