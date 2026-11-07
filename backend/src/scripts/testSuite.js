const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BACKEND_URL = 'http://127.0.0.1:5000/api';
const ML_URL = 'http://127.0.0.1:8000';

async function runTestSuite() {
  console.log('===============================================================');
  console.log('🧪 RUNNING COMPREHENSIVE INTEGRATION TEST SUITE');
  console.log('   IPRC CarbonTrack (Research Ref: RES-IPRC-2025-003)');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health Checks
    console.log('1. Service Health & Connectivity:');
    const healthRes = await axios.get(`${BACKEND_URL}/health`);
    assert(healthRes.status === 200 && healthRes.data.status === 'ONLINE', 'Express Backend Health Endpoint');

    const mlHealthRes = await axios.get(`${ML_URL}/health`);
    assert(mlHealthRes.status === 200 && mlHealthRes.data.status === 'healthy', 'Python ML Service Health Endpoint');

    // 2. Authentication & Roles
    console.log('\n2. Authentication & JWT RBAC:');
    const loginRes = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: 'admin@iprc.isro.gov.in',
      password: 'Admin@123'
    });
    assert(loginRes.data.success && !!loginRes.data.token, 'Admin Login and JWT Token Generation');
    const token = loginRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    const officerLogin = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: 'officer@iprc.isro.gov.in',
      password: 'Officer@123'
    });
    assert(officerLogin.data.success && officerLogin.data.user.role === 'OFFICER', 'Environmental Officer Authentication');

    const meRes = await axios.get(`${BACKEND_URL}/auth/me`, { headers: authHeaders });
    assert(meRes.data.user.email === 'admin@iprc.isro.gov.in', 'Verify /auth/me Profile Extraction');

    // 3. PostgreSQL Database Dataset Characteristics
    console.log('\n3. Database Verification & Dataset Characteristics:');
    const count = await prisma.datasetRecord.count();
    assert(count === 10000, `Exact 10,000 dataset records imported in PostgreSQL (Actual: ${count})`);

    const agg = await prisma.datasetRecord.aggregate({
      _avg: { carbonEmissionKgCO2: true, energyUsageKwh: true, fuelUsageLiters: true },
      _min: { carbonEmissionKgCO2: true, date: true },
      _max: { carbonEmissionKgCO2: true, date: true }
    });
    assert(agg._min.carbonEmissionKgCO2 > 0 && agg._max.carbonEmissionKgCO2 > 50, `Physical target Carbon_Emission_kgCO2 valid (Min: ${agg._min.carbonEmissionKgCO2.toFixed(2)}, Max: ${agg._max.carbonEmissionKgCO2.toFixed(2)})`);
    assert(Math.abs(agg._avg.energyUsageKwh) < 0.01, 'Energy_Usage_kWh standardized mean is ~0.0');
    assert(Math.abs(agg._avg.fuelUsageLiters) < 0.01, 'Fuel_Usage_Liters standardized mean is ~0.0');

    // 4. Dashboard APIs & Filters
    console.log('\n4. Dashboard Aggregations & Interactive Filters:');
    const summaryRes = await axios.get(`${BACKEND_URL}/dashboard/summary`, { headers: authHeaders });
    assert(summaryRes.data.summary.totalRecords === 10000, 'Dashboard Summary Total Records');
    assert(summaryRes.data.summary.totalEmissionsKgCO2 > 200000, 'Cumulative Target Carbon Footprint Calculation');

    const yearFiltered = await axios.get(`${BACKEND_URL}/dashboard/summary?year=2024`, { headers: authHeaders });
    assert(yearFiltered.data.summary.totalRecords > 0 && yearFiltered.data.summary.totalRecords < 10000, `Year filter (2024 records: ${yearFiltered.data.summary.totalRecords})`);

    const vehicleFiltered = await axios.get(`${BACKEND_URL}/dashboard/summary?vehicleType=ev`, { headers: authHeaders });
    assert(vehicleFiltered.data.summary.totalRecords > 0, `Vehicle mode filter (EV observations: ${vehicleFiltered.data.summary.totalRecords})`);

    const trendsRes = await axios.get(`${BACKEND_URL}/dashboard/trends?groupBy=year`, { headers: authHeaders });
    assert(trendsRes.data.trends.length > 5, `Yearly trends returned (${trendsRes.data.trends.length} periods)`);

    const distRes = await axios.get(`${BACKEND_URL}/dashboard/distribution`, { headers: authHeaders });
    assert(distRes.data.distribution.length > 5, `Carbon emission distribution histogram (${distRes.data.distribution.length} bins)`);

    // 5. Dataset Explorer & Data Dictionary
    console.log('\n5. Dataset Explorer & Dictionary:');
    const dictRes = await axios.get(`${BACKEND_URL}/dataset/dictionary`, { headers: authHeaders });
    assert(dictRes.data.dataDictionary.length === 14, 'Data Dictionary covers all 14 dataset columns');

    const recsRes = await axios.get(`${BACKEND_URL}/dataset?page=1&limit=10&sortBy=carbonEmissionKgCO2&sortOrder=desc`, { headers: authHeaders });
    assert(recsRes.data.records.length === 10, 'Dataset Explorer pagination and sorting');
    assert(recsRes.data.records[0].carbonEmissionKgCO2 >= recsRes.data.records[1].carbonEmissionKgCO2, 'Descending emission sorting verified');

    // 6. Analytics & Correlation Matrix
    console.log('\n6. Analytics & Statistical Matrices:');
    const corrRes = await axios.get(`${BACKEND_URL}/analytics/correlation`, { headers: authHeaders });
    assert(corrRes.data.matrix.length === 13, 'Correlation matrix contains all 13 numerical feature rows');
    assert(corrRes.data.targetCorrelations.length === 12, 'Target correlation ranking covers 12 input features');

    const scatRes = await axios.get(`${BACKEND_URL}/analytics/scatter?feature=energyUsageKwh&limit=50`, { headers: authHeaders });
    assert(scatRes.data.points.length === 50, 'Scatter analysis returns requested sample points');

    const renewRes = await axios.get(`${BACKEND_URL}/analytics/renewable`, { headers: authHeaders });
    assert(renewRes.data.quartiles.length === 4, 'Renewable energy quartile analysis computed');

    // 7. Mode B: Operational Activities (Activity-Based Carbon Measurement)
    console.log('\n7. Mode B Activity-Based Real-World Measurement:');
    const factorsRes = await axios.get(`${BACKEND_URL}/emission-factors`, { headers: authHeaders });
    assert(factorsRes.data.factors.length >= 8, `Official emission factors loaded (${factorsRes.data.factors.length} factors)`);

    const electricityFactor = factorsRes.data.factors.find(f => f.category === 'ENERGY');
    assert(!!electricityFactor, 'Found CEA Indian Grid Electricity Emission Factor');

    // Create new operational activity: 2000 kWh electricity
    const newActRes = await axios.post(`${BACKEND_URL}/activities`, {
      date: '2026-11-07',
      category: 'ENERGY',
      activityName: 'CEP Auxiliary Compressor Stage 1 Test',
      quantity: 2000,
      unit: 'kWh',
      scope: 'SCOPE_2',
      emissionFactorId: electricityFactor.id
    }, { headers: authHeaders });

    assert(newActRes.data.success, 'Create Operational Activity Record');
    const createdAct = newActRes.data.activity;
    const expectedEmission = 2000 * electricityFactor.factor;
    assert(Math.abs(createdAct.calculatedEmissionKgCO2 - expectedEmission) < 0.01, `Emission = Quantity × Factor calculation (${createdAct.calculatedEmissionKgCO2} kg CO2)`);

    // Clean up created activity
    await axios.delete(`${BACKEND_URL}/activities/${createdAct.id}`, { headers: authHeaders });
    console.log('  ✓ Cleaned up test activity record');

    // 8. Machine Learning & Prediction
    console.log('\n8. Machine Learning & Prediction Engine:');
    const mlModelsRes = await axios.get(`${BACKEND_URL}/predictions/models`, { headers: authHeaders });
    assert(mlModelsRes.data.data.models.length === 4, 'All 4 ML regression models benchmarked');

    const linReg = mlModelsRes.data.data.models.find(m => m.modelName === 'Linear Regression');
    assert(linReg && linReg.r2Score > 0.80, `Linear Regression test R² > 0.80 (Actual: ${linReg.r2Score.toFixed(4)})`);

    const predRes = await axios.post(`${BACKEND_URL}/predictions/predict`, {
      Energy_Usage_kWh: 1.2,
      Transportation_Distance_km: 0.5,
      Smart_Appliance_Usage_hours: -0.2,
      Renewable_Energy_Usage_percent: -0.8,
      Temperature_C: 0.1,
      Humidity_percent: 0.3,
      Fuel_Usage_Liters: 1.4,
      Waste_Generated_kg: 0.6,
      Vehicle_Type_Car: 1.69,
      Vehicle_Type_Electric_Vehicle: -0.58,
      Vehicle_Type_Walking: -0.57,
      Building_Type_Residential: 1.0,
      model_name: 'active_model'
    }, { headers: authHeaders });

    assert(predRes.data.success && predRes.data.result.predicted_emission_kgCO2 > 0, `Prediction inference valid (${predRes.data.result.predicted_emission_kgCO2} kg CO2)`);
    assert(!!predRes.data.result.feature_contributions, 'Feature importance contributions computed');

    // 9. Report Generation
    console.log('\n9. Reports & Document Exports:');
    const pdfRes = await axios.get(`${BACKEND_URL}/reports/pdf?reportType=dataset_summary`, {
      headers: authHeaders,
      responseType: 'arraybuffer'
    });
    const pdfHeader = Buffer.from(pdfRes.data.slice(0, 4)).toString();
    assert(pdfHeader === '%PDF', `PDF Report Generation returned valid PDF stream (${pdfRes.data.byteLength} bytes)`);

    const excelRes = await axios.get(`${BACKEND_URL}/reports/excel`, {
      headers: authHeaders,
      responseType: 'arraybuffer'
    });
    const zipHeader = Buffer.from(excelRes.data.slice(0, 2)).toString();
    assert(zipHeader === 'PK', `Excel Report Generation returned valid XLSX package (${excelRes.data.byteLength} bytes)`);

    console.log('\n===============================================================');
    console.log(`🎉 TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

  } catch (err) {
    console.error('Fatal test execution error:', err.response?.data || err.message);
    failed++;
  } finally {
    await prisma.$disconnect();
  }
}

runTestSuite();

