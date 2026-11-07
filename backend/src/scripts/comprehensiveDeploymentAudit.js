const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BACKEND_URL = 'http://127.0.0.1:5000/api';
const ML_URL = 'http://127.0.0.1:8000';
const FRONTEND_URL = 'http://127.0.0.1:3000';

async function runAudit() {
  console.log('========================================================================');
  console.log('🔍 PRE-DEPLOYMENT COMPREHENSIVE FEATURE-BY-FEATURE VERIFICATION AUDIT');
  console.log('   IPRC CarbonTrack — System Reference: RES-IPRC-2025-003');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;
  const auditReport = [];

  function record(section, feature, success, details) {
    if (success) {
      passed++;
      console.log(`  ✓ [${section}] ${feature}: PASS (${details || 'OK'})`);
      auditReport.push({ section, feature, status: 'PASS', details });
    } else {
      failed++;
      console.error(`  ✗ [${section}] ${feature}: FAIL (${details || 'Error'})`);
      auditReport.push({ section, feature, status: 'FAIL', details });
    }
  }

  try {
    // ----------------------------------------------------
    // SECTION 1: Service Heartbeats & Ports
    // ----------------------------------------------------
    console.log('--- SECTION 1: SYSTEM AVAILABILITY & CONNECTIVITY ---');
    try {
      const feRes = await axios.get(FRONTEND_URL, { timeout: 3000 });
      record('INFRASTRUCTURE', 'Frontend Web Server (Port 3000)', feRes.status === 200, `HTTP ${feRes.status}`);
    } catch (e) {
      record('INFRASTRUCTURE', 'Frontend Web Server (Port 3000)', false, e.message);
    }

    try {
      const beRes = await axios.get(`${BACKEND_URL}/health`, { timeout: 3000 });
      record('INFRASTRUCTURE', 'Backend REST API (Port 5000)', beRes.status === 200 && beRes.data.status === 'ONLINE', beRes.data.organization);
    } catch (e) {
      record('INFRASTRUCTURE', 'Backend REST API (Port 5000)', false, e.message);
    }

    try {
      const mlRes = await axios.get(`${ML_URL}/health`, { timeout: 3000 });
      record('INFRASTRUCTURE', 'Machine Learning Engine (Port 8000)', mlRes.status === 200 && mlRes.data.status === 'healthy', `Best Model: ${mlRes.data.bestModel}`);
    } catch (e) {
      record('INFRASTRUCTURE', 'Machine Learning Engine (Port 8000)', false, e.message);
    }

    // ----------------------------------------------------
    // SECTION 2: Database Schema & Dataset Integrity
    // ----------------------------------------------------
    console.log('\n--- SECTION 2: DATABASE INTEGRITY & DATASET SPECS ---');
    const dbRecordCount = await prisma.datasetRecord.count();
    record('DATABASE', '10,000 Dataset Records Stored', dbRecordCount === 10000, `Actual rows: ${dbRecordCount}`);

    const dbStats = await prisma.datasetRecord.aggregate({
      _avg: { carbonEmissionKgCO2: true, energyUsageKwh: true, fuelUsageLiters: true, transportationDistanceKm: true, renewableEnergyUsagePercent: true },
      _min: { carbonEmissionKgCO2: true, date: true },
      _max: { carbonEmissionKgCO2: true, date: true }
    });

    record('DATASET_SPEC', 'Target Variable Physical Range', dbStats._min.carbonEmissionKgCO2 > 1.0 && dbStats._max.carbonEmissionKgCO2 > 50.0, `Min: ${dbStats._min.carbonEmissionKgCO2.toFixed(2)}, Max: ${dbStats._max.carbonEmissionKgCO2.toFixed(2)} kgCO2`);
    record('DATASET_SPEC', 'Date Horizon Extent', dbStats._min.date.getFullYear() === 2024 && dbStats._max.date.getFullYear() === 2051, `${dbStats._min.date.toISOString().split('T')[0]} to ${dbStats._max.date.toISOString().split('T')[0]}`);
    record('DATASET_SPEC', 'Standardized Feature Zero-Mean Verification', Math.abs(dbStats._avg.energyUsageKwh) < 0.001 && Math.abs(dbStats._avg.fuelUsageLiters) < 0.001, `Energy: ${dbStats._avg.energyUsageKwh.toFixed(4)}, Fuel: ${dbStats._avg.fuelUsageLiters.toFixed(4)}`);

    // ----------------------------------------------------
    // SECTION 3: Authentication & Multi-Role Permissions
    // ----------------------------------------------------
    console.log('\n--- SECTION 3: AUTHENTICATION & MULTI-ROLE RBAC ---');
    let adminToken, officerToken, analystToken;

    const adminLogin = await axios.post(`${BACKEND_URL}/auth/login`, { email: 'admin@iprc.isro.gov.in', password: 'Admin@123' });
    adminToken = adminLogin.data.token;
    record('AUTH', 'Admin Login & Token Generation', !!adminToken, `Role: ${adminLogin.data.user.role}`);

    const officerLogin = await axios.post(`${BACKEND_URL}/auth/login`, { email: 'officer@iprc.isro.gov.in', password: 'Officer@123' });
    officerToken = officerLogin.data.token;
    record('AUTH', 'Environmental Officer Login', !!officerToken, `Role: ${officerLogin.data.user.role}`);

    const analystLogin = await axios.post(`${BACKEND_URL}/auth/login`, { email: 'analyst@iprc.isro.gov.in', password: 'Analyst@123' });
    analystToken = analystLogin.data.token;
    record('AUTH', 'Research Analyst Login', !!analystToken, `Role: ${analystLogin.data.user.role}`);

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const officerHeaders = { Authorization: `Bearer ${officerToken}` };
    const analystHeaders = { Authorization: `Bearer ${analystToken}` };

    // RBAC check: Analyst shouldn't access admin users endpoint
    try {
      await axios.get(`${BACKEND_URL}/users`, { headers: analystHeaders });
      record('SECURITY', 'RBAC Enforcement on Admin Route', false, 'Analyst should have been blocked');
    } catch (err) {
      record('SECURITY', 'RBAC Enforcement on Admin Route', err.response?.status === 403, 'Analyst correctly denied access (403 Forbidden)');
    }

    // ----------------------------------------------------
    // SECTION 4: Dashboard Aggregations & Filter Engine
    // ----------------------------------------------------
    console.log('\n--- SECTION 4: DASHBOARD & FILTER ENGINE ---');
    const summaryRes = await axios.get(`${BACKEND_URL}/dashboard/summary`, { headers: adminHeaders });
    record('DASHBOARD', 'Summary Aggregations', summaryRes.data.success && summaryRes.data.summary.totalRecords === 10000, `Total Emissions: ${summaryRes.data.summary.totalEmissionsKgCO2.toFixed(0)} kg`);

    const yearRes = await axios.get(`${BACKEND_URL}/dashboard/summary?year=2024`, { headers: adminHeaders });
    record('DASHBOARD', 'Year Filter (2024)', yearRes.data.summary.totalRecords === 366, `Records: ${yearRes.data.summary.totalRecords}`);

    const carRes = await axios.get(`${BACKEND_URL}/dashboard/summary?vehicleType=car`, { headers: adminHeaders });
    record('DASHBOARD', 'Vehicle Filter (Car Fleet)', carRes.data.summary.totalRecords > 0, `Records: ${carRes.data.summary.totalRecords}`);

    const evRes = await axios.get(`${BACKEND_URL}/dashboard/summary?vehicleType=ev`, { headers: adminHeaders });
    record('DASHBOARD', 'Vehicle Filter (Electric Vehicle)', evRes.data.summary.totalRecords > 0, `Records: ${evRes.data.summary.totalRecords}`);

    const resBldgRes = await axios.get(`${BACKEND_URL}/dashboard/summary?buildingType=residential`, { headers: adminHeaders });
    record('DASHBOARD', 'Building Filter (Residential)', resBldgRes.data.summary.totalRecords > 0, `Records: ${resBldgRes.data.summary.totalRecords}`);

    const trendsRes = await axios.get(`${BACKEND_URL}/dashboard/trends?groupBy=year`, { headers: adminHeaders });
    record('DASHBOARD', 'Yearly Trends API', trendsRes.data.trends.length === 28, `${trendsRes.data.trends.length} continuous years (2024-2051)`);

    const breakdownsRes = await axios.get(`${BACKEND_URL}/dashboard/breakdowns`, { headers: adminHeaders });
    record('DASHBOARD', 'Vehicle & Building Breakdown API', breakdownsRes.data.vehicleBreakdown.length > 0 && breakdownsRes.data.topPeriods.length === 10, 'Vehicle categories & Top 10 peak periods');

    // ----------------------------------------------------
    // SECTION 5: Dataset Explorer & Column Dictionary
    // ----------------------------------------------------
    console.log('\n--- SECTION 5: DATASET EXPLORER & DICTIONARY ---');
    const dictRes = await axios.get(`${BACKEND_URL}/dataset/dictionary`, { headers: adminHeaders });
    record('DATASET_EXPLORER', 'Official Data Dictionary', dictRes.data.dataDictionary.length === 14, '14 columns documented with statistical classifications');

    const explorerRes = await axios.get(`${BACKEND_URL}/dataset?page=1&limit=25&sortBy=carbonEmissionKgCO2&sortOrder=desc`, { headers: adminHeaders });
    record('DATASET_EXPLORER', 'Pagination & Dynamic Sorting', explorerRes.data.records.length === 25 && explorerRes.data.pagination.totalPages === 400, `Page 1 of 400 (Top emission: ${explorerRes.data.records[0].carbonEmissionKgCO2.toFixed(2)} kg)`);

    const firstRecordId = explorerRes.data.records[0].id;
    const detailRes = await axios.get(`${BACKEND_URL}/dataset/${firstRecordId}`, { headers: adminHeaders });
    record('DATASET_EXPLORER', 'Single Record Detail Inspection', detailRes.data.record.id === firstRecordId, `Inspected date: ${detailRes.data.record.date.split('T')[0]}`);

    // ----------------------------------------------------
    // SECTION 6: Analytics & Correlation Engine
    // ----------------------------------------------------
    console.log('\n--- SECTION 6: ANALYTICS & STATISTICAL MATRICES ---');
    const corrRes = await axios.get(`${BACKEND_URL}/analytics/correlation`, { headers: adminHeaders });
    record('ANALYTICS', '13x13 Pearson Correlation Matrix', corrRes.data.matrix.length === 13, `Sample size: ${corrRes.data.sampleSize} rows`);
    record('ANALYTICS', 'Target Correlation Ranking', corrRes.data.targetCorrelations.length === 12, `Top driver: ${corrRes.data.targetCorrelations[0].label} (r = ${corrRes.data.targetCorrelations[0].correlation})`);

    const scatterRes = await axios.get(`${BACKEND_URL}/analytics/scatter?feature=fuelUsageLiters&limit=100`, { headers: adminHeaders });
    record('ANALYTICS', 'Scatter Plot Samples Extraction', scatterRes.data.points.length === 100, `Feature: ${scatterRes.data.feature}`);

    const renewRes = await axios.get(`${BACKEND_URL}/analytics/renewable`, { headers: adminHeaders });
    record('ANALYTICS', 'Renewable Energy Quartile Mitigations', renewRes.data.quartiles.length === 4, 'Emissions grouped by Q1-Q4 clean share');

    // ----------------------------------------------------
    // SECTION 7: Mode B Real-World Operational Management
    // ----------------------------------------------------
    console.log('\n--- SECTION 7: MODE B REAL-WORLD ACTIVITY MONITORING ---');
    const factorsRes = await axios.get(`${BACKEND_URL}/emission-factors`, { headers: adminHeaders });
    record('EMISSION_FACTORS', 'Official Factor Registry', factorsRes.data.factors.length >= 10, 'CEA Baseline v19, IPCC 2019, BEE, CPHEEO');

    const ceaFactor = factorsRes.data.factors.find(f => f.category === 'ENERGY');
    const dieselFactor = factorsRes.data.factors.find(f => f.fuelOrActivityType.includes('Diesel'));

    // Create Activity Test
    const newAct = await axios.post(`${BACKEND_URL}/activities`, {
      date: '2026-11-07',
      category: 'ENERGY',
      activityName: 'Pre-Deployment Test Run for Stand Cooling Systems',
      quantity: 5000,
      unit: 'kWh',
      scope: 'SCOPE_2',
      emissionFactorId: ceaFactor.id
    }, { headers: officerHeaders });

    const expectedEmission = 5000 * ceaFactor.factor; // 5000 * 0.82 = 4100
    record('MODE_B_ACTIVITIES', 'Create & Auto-calculate Activity', Math.abs(newAct.data.activity.calculatedEmissionKgCO2 - expectedEmission) < 0.01, `${newAct.data.activity.calculatedEmissionKgCO2} kg CO2 computed via CEA factor`);

    // Update Activity Test
    const updatedAct = await axios.put(`${BACKEND_URL}/activities/${newAct.data.activity.id}`, {
      quantity: 6000
    }, { headers: officerHeaders });
    const expectedUpdated = 6000 * ceaFactor.factor;
    record('MODE_B_ACTIVITIES', 'Update Activity & Recalculate', Math.abs(updatedAct.data.activity.calculatedEmissionKgCO2 - expectedUpdated) < 0.01, `Updated to ${updatedAct.data.activity.calculatedEmissionKgCO2} kg CO2`);

    // Delete Activity Test
    await axios.delete(`${BACKEND_URL}/activities/${newAct.data.activity.id}`, { headers: adminHeaders });
    record('MODE_B_ACTIVITIES', 'Delete Operational Activity', true, 'Cleaned up verification record');

    // ----------------------------------------------------
    // SECTION 8: Machine Learning Engine & Prediction Service
    // ----------------------------------------------------
    console.log('\n--- SECTION 8: MACHINE LEARNING & PREDICTION SERVICE ---');
    const mlMetaRes = await axios.get(`${BACKEND_URL}/predictions/models`, { headers: adminHeaders });
    record('ML_ENGINE', '4 Regression Models Benchmarked', mlMetaRes.data.data.models.length === 4, `Active: ${mlMetaRes.data.data.bestModel}`);

    const predTest = await axios.post(`${BACKEND_URL}/predictions/predict`, {
      Energy_Usage_kWh: 0.5,
      Transportation_Distance_km: -0.2,
      Smart_Appliance_Usage_hours: 0.0,
      Renewable_Energy_Usage_percent: 0.8,
      Temperature_C: 0.2,
      Humidity_percent: -0.1,
      Fuel_Usage_Liters: -0.4,
      Waste_Generated_kg: 0.1,
      Vehicle_Type_Car: -0.59,
      Vehicle_Type_Electric_Vehicle: 1.73,
      Vehicle_Type_Walking: -0.57,
      Building_Type_Residential: 1.0,
      model_name: 'active_model'
    }, { headers: analystHeaders });

    record('ML_ENGINE', 'Model Inference & Contributions', predTest.data.result.predicted_emission_kgCO2 > 0 && !!predTest.data.result.feature_contributions, `Predicted: ${predTest.data.result.predicted_emission_kgCO2} kg CO2`);

    const predHist = await axios.get(`${BACKEND_URL}/predictions/history`, { headers: adminHeaders });
    record('ML_ENGINE', 'Prediction History Persistence', predHist.data.history.length > 0, `${predHist.data.history.length} logged inference audits in PostgreSQL`);

    // ----------------------------------------------------
    // SECTION 9: Recommendations Engine
    // ----------------------------------------------------
    console.log('\n--- SECTION 9: RULE-BASED RECOMMENDATION ENGINE ---');
    const recsRes = await axios.get(`${BACKEND_URL}/recommendations`, { headers: adminHeaders });
    record('RECOMMENDATIONS', 'Rule-Based Mitigation Actions', recsRes.data.recommendations.length > 0, `${recsRes.data.recommendations.length} actionable sustainability protocols`);

    const firstRec = recsRes.data.recommendations[0];
    const newStatus = firstRec.status === 'OPEN' ? 'IN_PROGRESS' : 'OPEN';
    const statusUpdate = await axios.patch(`${BACKEND_URL}/recommendations/${firstRec.id}/status`, { status: newStatus }, { headers: officerHeaders });
    record('RECOMMENDATIONS', 'Status Mutation (Open / In Progress)', statusUpdate.data.recommendation.status === newStatus, `Updated to ${newStatus}`);

    // ----------------------------------------------------
    // SECTION 10: Reports Generation & Binary Streams
    // ----------------------------------------------------
    console.log('\n--- SECTION 10: OFFICIAL REPORT GENERATION & EXPORTS ---');
    const repSummary = await axios.get(`${BACKEND_URL}/reports/summary`, { headers: adminHeaders });
    record('REPORTS', 'Report Metadata Synthesis', repSummary.data.reportData.projectRef === 'RES-IPRC-2025-003', repSummary.data.reportData.organization);

    const pdfRes = await axios.get(`${BACKEND_URL}/reports/pdf?reportType=dataset_summary`, { headers: adminHeaders, responseType: 'arraybuffer' });
    const isPdf = Buffer.from(pdfRes.data.slice(0, 4)).toString() === '%PDF';
    record('REPORTS', 'PDF Report Generation (PDFKit)', isPdf && pdfRes.data.byteLength > 2000, `Stream size: ${pdfRes.data.byteLength} bytes`);

    const xlsxRes = await axios.get(`${BACKEND_URL}/reports/excel`, { headers: adminHeaders, responseType: 'arraybuffer' });
    const isXlsx = Buffer.from(xlsxRes.data.slice(0, 2)).toString() === 'PK';
    record('REPORTS', 'Excel Report Generation (ExcelJS)', isXlsx && xlsxRes.data.byteLength > 100000, `Workbook size: ${xlsxRes.data.byteLength} bytes`);

    const csvExportRes = await axios.get(`${BACKEND_URL}/dataset/export?format=csv&limit=50`, { headers: adminHeaders });
    record('REPORTS', 'Dataset CSV Direct Stream Export', csvExportRes.status === 200 && csvExportRes.data.includes('Carbon_Emission_kgCO2_Target'), 'Valid CSV rows');

    // ----------------------------------------------------
    // SECTION 11: Audit Trail Ledger & User Roster
    // ----------------------------------------------------
    console.log('\n--- SECTION 11: COMPLIANCE AUDIT TRAIL & ROSTER ---');
    const usersRes = await axios.get(`${BACKEND_URL}/users`, { headers: adminHeaders });
    record('SECURITY', 'Personnel Roster Access', usersRes.data.users.length >= 3, `${usersRes.data.users.length} active registered officers`);

    const auditRes = await axios.get(`${BACKEND_URL}/users/audit-logs`, { headers: adminHeaders });
    record('SECURITY', 'Immutable Audit Logs Viewer', auditRes.data.logs.length > 0, `${auditRes.data.logs.length} logged mutation events`);

  } catch (err) {
    console.error('Fatal audit failure:', err.response?.data || err.message);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n========================================================================');
  console.log(`🏁 AUDIT COMPLETE: ${passed} FEATURES PASSED | ${failed} FAILED`);
  console.log('========================================================================\n');

  return { passed, failed, auditReport };
}

runAudit();

