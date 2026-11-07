const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testDataImport() {
  console.log('Testing Data Import & Schema Ingestion...');
  try {
    // 1. Authenticate
    const loginRes = await axios.post('http://127.0.0.1:5000/api/auth/login', {
      email: 'admin@iprc.isro.gov.in',
      password: 'Admin@123'
    });
    const token = loginRes.data.token;
    console.log('Logged in as Admin successfully.');

    // 2. Upload dataset file
    const filePath = path.resolve(__dirname, '../../../data/Carbon_Footprint_Synthetic_Test_Dataset_100.csv');
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const importRes = await axios.post('http://127.0.0.1:5000/api/dataset/import', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Import Response Status:', importRes.status);
    console.log('Import Data:', JSON.stringify(importRes.data, null, 2));

    // 3. Verify dataset summary
    const summaryRes = await axios.get('http://127.0.0.1:5000/api/dataset/summary', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Dataset Summary Response:', summaryRes.data);

    console.log('ALL INGESTION TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testDataImport();
