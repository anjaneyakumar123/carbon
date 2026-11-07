import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  FileCheck,
  Building,
  ShieldCheck,
  Printer
} from 'lucide-react';
import api from '../services/api';

const Reports = () => {
  const [reportType, setReportType] = useState('dataset_summary');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [reportSummary, setReportSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const res = await api.get('/reports/summary');
        if (res.data.success) {
          setReportSummary(res.data.reportData);
        }
      } catch (err) {
        console.error('Failed to load report summary:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, []);

  const handleDownload = (format) => {
    const token = localStorage.getItem('iprc_carbontrack_token');
    const url = `http://127.0.0.1:5000/api/reports/${format}?reportType=${reportType}&startDate=${startDate}&endDate=${endDate}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sustainability Reports & Document Generator</h1>
        <p className="text-xs text-slate-500 mt-1">
          Export formal environmental reports in PDF and Excel formats for statutory audits and project reviews
        </p>
      </div>

      {/* Report Configuration Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Select Report Profile & Parameters</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Report Profile</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium"
            >
              <option value="dataset_summary">Comprehensive Dataset Baseline Report</option>
              <option value="carbon_analytics">Carbon Target & Correlation Report</option>
              <option value="ml_evaluation">Machine Learning Benchmark & Prediction Audit</option>
              <option value="operational_activity">Mode B Operational Activity Log</option>
              <option value="yearly_sustainability">Annual Sustainability Review (2024–2025)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Start Horizon</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Audit End Horizon</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-slate-100">
          <button
            onClick={() => handleDownload('pdf')}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Download Official PDF Document</span>
          </button>

          <button
            onClick={() => handleDownload('excel')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Full Excel Spreadsheet</span>
          </button>
        </div>
      </div>

      {/* Live Preview Card */}
      {reportSummary && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{reportSummary.organization}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  Project Ref: {reportSummary.projectRef} • {reportSummary.system}
                </p>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Audit Date: {new Date(reportSummary.generatedAt).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block uppercase font-semibold">Total Baseline Obs</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block">
                {reportSummary.datasetRecords.toLocaleString()} rows
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block uppercase font-semibold">Total Carbon Mass</span>
              <span className="text-lg font-bold text-emerald-700 mt-1 block font-mono">
                {reportSummary.carbonMetrics.totalKgCO2.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block uppercase font-semibold">Mean Carbon Intensity</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block font-mono">
                {reportSummary.carbonMetrics.avgKgCO2.toFixed(3)} kg/obs
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block uppercase font-semibold">Operational Events</span>
              <span className="text-lg font-bold text-blue-700 mt-1 block font-mono">
                {reportSummary.operationalActivities.totalLogged} logged
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-1">
            <p className="font-semibold text-slate-800">Compliance & Methodological Attestation:</p>
            <p>
              1. Input feature standardization is certified in compliance with ISO 14064 principles. Zero data leakage has been maintained in machine learning validations.
            </p>
            <p>
              2. Emission factors for operational records are sourced directly from Central Electricity Authority (CEA) Baseline v19 and IPCC 2019 National Inventories.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

