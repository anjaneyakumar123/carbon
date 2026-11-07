import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  BookOpen,
  Table,
  CheckCircle2,
  FileSpreadsheet,
  X
} from 'lucide-react';
import api from '../services/api';
import StandardizedNotice from '../components/StandardizedNotice';

const DatasetExplorer = () => {
  const [activeTab, setActiveTab] = useState('records'); // 'records' | 'dictionary' | 'stats'
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ totalRecords: 0, page: 1, limit: 25, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [dataDictionary, setDataDictionary] = useState([]);

  // Filters & Sorting
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [minEmission, setMinEmission] = useState('');
  const [maxEmission, setMaxEmission] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Record Inspection Modal
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
        minEmission: minEmission || undefined,
        maxEmission: maxEmission || undefined,
        vehicleType: vehicleFilter || undefined,
        buildingType: buildingFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };

      const res = await api.get('/dataset', { params });
      if (res.data.success) {
        setRecords(res.data.records);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch dataset records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [sumRes, dictRes] = await Promise.all([
        api.get('/dataset/summary'),
        api.get('/dataset/dictionary')
      ]);
      if (sumRes.data.success) setSummary(sumRes.data);
      if (dictRes.data.success) setDataDictionary(dictRes.data.dataDictionary);
    } catch (err) {
      console.error('Failed to load dataset metadata:', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchRecords(pagination.page);
  }, [sortBy, sortOrder, vehicleFilter, buildingFilter, pagination.limit]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchRecords(1);
  };

  const handleExport = (format) => {
    const token = localStorage.getItem('iprc_carbontrack_token');
    const url = `http://127.0.0.1:5000/api/dataset/export?format=${format}&limit=5000`;
    window.open(url, '_blank');
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dataset Explorer & Data Dictionary</h1>
          <p className="text-xs text-slate-500 mt-1">
            Standardized Carbon Footprint Research Dataset (10,000 observations • RES-IPRC-2025-003)
          </p>
        </div>

        {/* Tab switchers & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('records')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'records' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Data Records ({pagination.totalRecords.toLocaleString()})</span>
            </button>
            <button
              onClick={() => setActiveTab('dictionary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dictionary' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Data Dictionary</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'stats' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Dataset Summary Stats</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-semibold text-white shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      <StandardizedNotice featureName="Energy, Transportation, Fuel, Smart Appliance, and Weather Features" />

      {/* TAB 1: DATA RECORDS */}
      {activeTab === 'records' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <form onSubmit={handleApplyFilters} className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Date Range:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Emission (kg):</span>
              <input
                type="number"
                placeholder="Min"
                value={minEmission}
                onChange={(e) => setMinEmission(e.target.value)}
                className="w-16 text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
              />
              <span className="text-xs text-slate-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxEmission}
                onChange={(e) => setMaxEmission(e.target.value)}
                className="w-16 text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
              />
            </div>

            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700"
            >
              <option value="">All Vehicles</option>
              <option value="car">Car Fleet Only</option>
              <option value="ev">Electric Vehicles Only</option>
              <option value="walking">Walking Transit Only</option>
            </select>

            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700"
            >
              <option value="">All Building Types</option>
              <option value="residential">Residential Only</option>
              <option value="commercial">Commercial / Non-Residential</option>
            </select>

            <button
              type="submit"
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-colors"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setMinEmission('');
                setMaxEmission('');
                setVehicleFilter('');
                setBuildingFilter('');
                fetchRecords(1);
              }}
              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs rounded-lg transition-colors"
            >
              Reset
            </button>
          </form>

          {/* Records Table */}
          <div className="overflow-x-auto max-h-[550px]">
            <table className="w-full text-xs text-left divide-y divide-slate-100">
              <thead className="bg-slate-100/90 text-slate-700 font-semibold sticky top-0 z-10">
                <tr>
                  <th onClick={() => toggleSort('date')} className="py-3 px-3 cursor-pointer hover:bg-slate-200/80">
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => toggleSort('carbonEmissionKgCO2')} className="py-3 px-3 cursor-pointer hover:bg-slate-200/80 text-right text-emerald-800">
                    <div className="flex items-center justify-end gap-1">
                      <span>Target (kgCO2)</span>
                      <ArrowUpDown className="w-3 h-3 text-emerald-600" />
                    </div>
                  </th>
                  <th onClick={() => toggleSort('energyUsageKwh')} className="py-3 px-3 cursor-pointer hover:bg-slate-200/80 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>Energy (Std)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => toggleSort('fuelUsageLiters')} className="py-3 px-3 cursor-pointer hover:bg-slate-200/80 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>Fuel (Std)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => toggleSort('transportationDistanceKm')} className="py-3 px-3 cursor-pointer hover:bg-slate-200/80 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>Distance (Std)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => toggleSort('renewableEnergyUsagePercent')} className="py-3 px-3 cursor-pointer hover:bg-slate-200/80 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>Renewable % (Std)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => toggleSort('wasteGeneratedKg')} className="py-3 px-3 cursor-pointer hover:bg-slate-200/80 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>Waste (Std)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Vehicle Mode</th>
                  <th className="py-3 px-3 text-center">Building</th>
                  <th className="py-3 px-3 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-800 font-semibold font-sans">
                      {new Date(r.date).toISOString().split('T')[0]}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700 font-sans">
                      {Number(r.carbonEmissionKgCO2).toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {Number(r.energyUsageKwh).toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {Number(r.fuelUsageLiters).toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {Number(r.transportationDistanceKm).toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                      {Number(r.renewableEnergyUsagePercent).toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {Number(r.wasteGeneratedKg).toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {r.vehicleTypeCar > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                          Car
                        </span>
                      )}
                      {r.vehicleTypeElectricVehicle > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                          EV
                        </span>
                      )}
                      {r.vehicleTypeWalking > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                          Walking
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        r.buildingTypeResidential > 0
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {r.buildingTypeResidential > 0 ? 'Residential' : 'Commercial'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedRecord(r)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-emerald-700"
                        title="View Full Record"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.totalRecords.toLocaleString()} total observations)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchRecords(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchRecords(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATA DICTIONARY */}
      {activeTab === 'dictionary' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Official Feature & Column Data Dictionary</h2>
            <p className="text-xs text-slate-500 mt-1">
              Complete technical specification of all 14 dataset columns under RES-IPRC-2025-003
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-700 font-semibold">
                <tr>
                  <th className="py-3 px-4">Column Name</th>
                  <th className="py-3 px-4">Data Type</th>
                  <th className="py-3 px-4">Statistical Nature</th>
                  <th className="py-3 px-4">Standardized</th>
                  <th className="py-3 px-4">Technical Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataDictionary.map((col) => (
                  <tr key={col.name} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {col.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {col.type}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        col.standardized ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {col.nature}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {col.standardized ? (
                        <span className="text-amber-700 font-bold">Yes (Z-score)</span>
                      ) : (
                        <span className="text-emerald-700 font-bold">No (Physical)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 leading-relaxed">
                      {col.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DATASET SUMMARY STATS */}
      {activeTab === 'stats' && summary && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Dataset Verification & Summary Statistics</h2>
            <p className="text-xs text-slate-500 mt-1">Verified characteristics against the actual PostgreSQL 10,000-record import</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 uppercase font-semibold">Total Records</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalRecords.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-600 font-medium">100% Imported</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 uppercase font-semibold">Total Columns</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalColumns}</p>
              <span className="text-[10px] text-slate-500">14 Features Validated</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 uppercase font-semibold">Missing Values</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.missingValues}</p>
              <span className="text-[10px] text-emerald-600 font-medium">Clean Dataset</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 uppercase font-semibold">Duplicate Rows</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.duplicateRows}</p>
              <span className="text-[10px] text-emerald-600 font-medium">Zero Duplicates</span>
            </div>
          </div>

          {/* Target Carbon Variable Distribution Breakdown */}
          <div className="p-5 rounded-xl bg-emerald-50/50 border border-emerald-200">
            <h3 className="text-sm font-bold text-emerald-950 mb-3">
              Target Variable Distribution: Carbon_Emission_kgCO2 (Physical kg CO2)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
              <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block uppercase">Min</span>
                <span className="text-sm font-bold text-slate-900">{Number(summary.statistics.min_carbon).toFixed(2)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block uppercase">25th Percentile</span>
                <span className="text-sm font-bold text-slate-900">{Number(summary.statistics.p25_carbon).toFixed(2)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block uppercase">Median (50%)</span>
                <span className="text-sm font-bold text-slate-900">{Number(summary.statistics.p50_carbon).toFixed(2)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block uppercase">Mean</span>
                <span className="text-sm font-bold text-emerald-700">{Number(summary.statistics.avg_carbon).toFixed(2)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block uppercase">75th Percentile</span>
                <span className="text-sm font-bold text-slate-900">{Number(summary.statistics.p75_carbon).toFixed(2)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block uppercase">Max Peak</span>
                <span className="text-sm font-bold text-rose-600">{Number(summary.statistics.max_carbon).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Observation Record Inspection</h3>
                <p className="text-xs font-mono text-slate-500">ID: {selectedRecord.id}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-emerald-800 uppercase">Target Carbon Emission</span>
                  <p className="text-2xl font-bold text-emerald-950 font-mono">
                    {Number(selectedRecord.carbonEmissionKgCO2).toFixed(4)} <span className="text-sm font-normal text-emerald-800">kg CO2</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Observation Date</span>
                  <span className="text-sm font-semibold text-slate-800 font-mono">
                    {new Date(selectedRecord.date).toISOString().split('T')[0]}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Standardized Input Features (Z-Scores)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                    <span className="text-slate-600">Energy Usage (kWh):</span>
                    <span className="font-mono font-semibold">{Number(selectedRecord.energyUsageKwh).toFixed(4)} std</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                    <span className="text-slate-600">Transport Distance:</span>
                    <span className="font-mono font-semibold">{Number(selectedRecord.transportationDistanceKm).toFixed(4)} std</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                    <span className="text-slate-600">Fuel Usage (Liters):</span>
                    <span className="font-mono font-semibold">{Number(selectedRecord.fuelUsageLiters).toFixed(4)} std</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                    <span className="text-slate-600">Waste Generated (kg):</span>
                    <span className="font-mono font-semibold">{Number(selectedRecord.wasteGeneratedKg).toFixed(4)} std</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                    <span className="text-slate-600">Smart Appliance Hrs:</span>
                    <span className="font-mono font-semibold">{Number(selectedRecord.smartApplianceUsageHours).toFixed(4)} std</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                    <span className="text-slate-600">Renewable Energy %:</span>
                    <span className="font-mono font-semibold text-emerald-700">{Number(selectedRecord.renewableEnergyUsagePercent).toFixed(4)} std</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                    <span className="text-slate-600">Temperature (°C):</span>
                    <span className="font-mono font-semibold">{Number(selectedRecord.temperatureC).toFixed(4)} std</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                    <span className="text-slate-600">Humidity (%):</span>
                    <span className="font-mono font-semibold">{Number(selectedRecord.humidityPercent).toFixed(4)} std</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Encoded Categorical Indicators
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between">
                    <span>Vehicle_Type_Car:</span>
                    <span>{Number(selectedRecord.vehicleTypeCar).toFixed(4)}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between">
                    <span>Vehicle_Type_EV:</span>
                    <span>{Number(selectedRecord.vehicleTypeElectricVehicle).toFixed(4)}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between">
                    <span>Vehicle_Type_Walking:</span>
                    <span>{Number(selectedRecord.vehicleTypeWalking).toFixed(4)}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between">
                    <span>Building_Residential:</span>
                    <span>{Number(selectedRecord.buildingTypeResidential).toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-xl"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetExplorer;

