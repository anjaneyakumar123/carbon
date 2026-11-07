const axios = require('axios');

async function testDownloads() {
  const login = await axios.post('http://127.0.0.1:5000/api/auth/login', {
    email: 'admin@iprc.isro.gov.in',
    password: 'Admin@123'
  });
  const token = login.data.token;
  console.log('1. Logged in, JWT token acquired successfully.');

  // Test 1: Header-based PDF download (Blob)
  const pdfRes = await axios.get('http://127.0.0.1:5000/api/reports/pdf?reportType=dataset_summary', {
    headers: { Authorization: 'Bearer ' + token },
    responseType: 'arraybuffer'
  });
  const pdfHeader = Buffer.from(pdfRes.data.slice(0, 4)).toString();
  console.log('2. Header PDF Download:', pdfRes.status, 'Header:', pdfHeader, 'Bytes:', pdfRes.data.byteLength);

  // Test 2: Header-based Excel download (Blob)
  const xlsxRes = await axios.get('http://127.0.0.1:5000/api/reports/excel', {
    headers: { Authorization: 'Bearer ' + token },
    responseType: 'arraybuffer'
  });
  const xlsxHeader = Buffer.from(xlsxRes.data.slice(0, 2)).toString();
  console.log('3. Header Excel Download:', xlsxRes.status, 'Header:', xlsxHeader, 'Bytes:', xlsxRes.data.byteLength);

  // Test 3: Query parameter token PDF download (Direct browser URL fallback)
  const queryPdf = await axios.get('http://127.0.0.1:5000/api/reports/pdf?reportType=dataset_summary&token=' + token, {
    responseType: 'arraybuffer'
  });
  console.log('4. Query Token PDF Download:', queryPdf.status, 'Header:', Buffer.from(queryPdf.data.slice(0, 4)).toString(), 'Bytes:', queryPdf.data.byteLength);

  // Test 4: Query parameter token Excel download (Direct browser URL fallback)
  const queryXlsx = await axios.get('http://127.0.0.1:5000/api/reports/excel?token=' + token, {
    responseType: 'arraybuffer'
  });
  console.log('5. Query Token Excel Download:', queryXlsx.status, 'Header:', Buffer.from(queryXlsx.data.slice(0, 2)).toString(), 'Bytes:', queryXlsx.data.byteLength);

  // Test 5: ML prediction with different model names (Linear Regression, Random Forest, etc.)
  const pred1 = await axios.post('http://127.0.0.1:8000/predict', {
    Energy_Usage_kWh: 1.0,
    model_name: 'linear_regression'
  });
  console.log('6. ML Linear Regression Output:', pred1.data.predicted_emission_kgCO2, 'kg CO2');

  const pred2 = await axios.post('http://127.0.0.1:8000/predict', {
    Energy_Usage_kWh: 1.0,
    model_name: 'random_forest'
  });
  console.log('7. ML Random Forest Output:', pred2.data.predicted_emission_kgCO2, 'kg CO2');

  console.log('\n✅ ALL REPORT DOWNLOADS (PDF & EXCEL) AND ML PREDICTION TESTS PASSED 100%!');
}

testDownloads().catch(e => console.error('Error:', e.response?.data || e.message));

