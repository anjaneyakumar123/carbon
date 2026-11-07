import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';
import Papa from 'papaparse';
import api from '../services/api';

const DataImport = () => {
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [detectedColumns, setDetectedColumns] = useState([]);
  const [validationStatus, setValidationStatus] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const EXPECTED_COLUMNS = [
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

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setValidationStatus(null);
    setImportResult(null);

    // Parse preview in browser
    Papa.parse(selected, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      preview: 5,
      complete: (results) => {
        setPreviewRows(results.data);
        const cols = Object.keys(results.data[0] || {});
        setDetectedColumns(cols);

        // Validate columns
        const missing = EXPECTED_COLUMNS.filter(c => !cols.includes(c));
        setValidationStatus({
          isValid: missing.length === 0,
          missingColumns: missing,
          totalDetected: cols.length,
          previewCount: results.data.length
        });
      }
    });
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/dataset/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setImportResult(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dataset Import & Schema Ingestion</h1>
        <p className="text-xs text-slate-500 mt-1">
          Validate and import standardized CSV/Excel carbon measurement datasets with duplicate detection (RES-IPRC-2025-003)
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-emerald-100">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h2 className="text-base font-bold text-slate-900">Upload Dataset File</h2>
          <p className="text-xs text-slate-500 mt-1">Supports CSV, XLSX, or preprocessed tabular observations</p>

          <label className="mt-5 inline-block cursor-pointer">
            <span className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors">
              Choose File from Disk
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {file && (
            <p className="text-xs font-mono font-semibold text-slate-700 mt-3">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>
      </div>

      {/* Validation Status */}
      {validationStatus && (
        <div className={`p-5 rounded-xl border ${
          validationStatus.isValid
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2 mb-2 font-bold text-sm">
            {validationStatus.isValid ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Dataset Schema Fully Validated</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Schema Validation Warning</span>
              </>
            )}
          </div>
          <p className="text-xs">
            Detected <strong>{validationStatus.totalDetected}</strong> columns.
            {validationStatus.isValid ? (
              ' All 14 mandatory standardized features and target variable are present and validated.'
            ) : (
              ` Missing columns: ${validationStatus.missingColumns.join(', ')}`
            )}
          </p>
        </div>
      )}

      {/* Preview Table */}
      {previewRows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Dataset Preview (First 5 Rows)</h3>
            <button
              onClick={handleConfirmImport}
              disabled={importing || !validationStatus?.isValid}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{importing ? 'Importing Rows into DB...' : 'Confirm Ingestion into PostgreSQL'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-700 font-semibold font-mono">
                <tr>
                  {detectedColumns.map((c) => (
                    <th key={c} className="py-2.5 px-3 truncate max-w-[140px]" title={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono text-[11px]">
                {previewRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    {detectedColumns.map((c) => (
                      <td key={c} className="py-2 px-3 text-slate-700 truncate max-w-[140px]">
                        {typeof r[c] === 'number' ? r[c].toFixed(3) : r[c]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Result Notification */}
      {importResult && (
        <div className="p-4 bg-emerald-100/70 border border-emerald-300 rounded-xl text-emerald-900 text-xs">
          <h4 className="font-bold text-sm mb-1">Import Success</h4>
          <p>Imported dataset ID: <span className="font-mono">{importResult.datasetId}</span> ({importResult.rowCount} records saved in PostgreSQL).</p>
        </div>
      )}
    </div>
  );
};

export default DataImport;

