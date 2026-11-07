import React, { useState, useEffect } from 'react';
import {
  Activity,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  HelpCircle,
  Calculator,
  Zap,
  Flame,
  Car,
  Trash,
  Droplets,
  Box,
  Filter
} from 'lucide-react';
import api from '../services/api';
import KpiCard from '../components/KpiCard';

const CATEGORIES = [
  { key: 'ALL', label: 'All Activities', icon: Activity },
  { key: 'ENERGY', label: 'Electricity / Energy', icon: Zap },
  { key: 'FUEL', label: 'Liquid & Gas Fuel', icon: Flame },
  { key: 'TRANSPORTATION', label: 'Logistics & Transit', icon: Car },
  { key: 'WASTE', label: 'Solid & Haz Waste', icon: Trash },
  { key: 'WATER', label: 'Water & Wastewater', icon: Droplets },
  { key: 'MATERIAL', label: 'Cryogenics & Materials', icon: Box }
];

const ActivityMonitoring = () => {
  const [activities, setActivities] = useState([]);
  const [factors, setFactors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [scopeAgg, setScopeAgg] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('ALL');

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'ENERGY',
    activityName: '',
    quantity: '',
    unit: 'kWh',
    scope: 'SCOPE_2',
    emissionFactorId: '',
    departmentId: '',
    // Category-specific details
    renewableConsumedKwh: '',
    nonRenewableConsumedKwh: '',
    fuelType: 'Diesel (HSD)',
    vehicleType: 'Heavy Commercial Truck (Diesel)',
    distanceKm: '',
    wasteCategory: 'Municipal Solid Waste',
    treatmentMethod: 'RECYCLED',
    recycledQuantityKg: '',
    waterConsumedKl: '',
    waterReusedKl: '',
    wastewaterGeneratedKl: '',
    materialCategory: 'Cryogenic Fluid (LN2)',
    supplier: 'ISRO Auxiliary Supply Pool'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategoryTab !== 'ALL') {
        params.category = selectedCategoryTab;
      }

      const [actRes, factRes, deptRes] = await Promise.all([
        api.get('/activities', { params }),
        api.get('/emission-factors'),
        api.get('/auth/departments')
      ]);

      if (actRes.data.success) {
        setActivities(actRes.data.activities);
        setScopeAgg(actRes.data.scopeAgg);
      }
      if (factRes.data.success) {
        setFactors(factRes.data.factors);
        if (factRes.data.factors.length > 0 && !formData.emissionFactorId) {
          setFormData(prev => ({
            ...prev,
            emissionFactorId: factRes.data.factors[0].id,
            unit: factRes.data.factors[0].unit.split('/')[1]?.trim() || 'kWh'
          }));
        }
      }
      if (deptRes.data.success) setDepartments(deptRes.data.departments);
    } catch (err) {
      console.error('Failed to load operational activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategoryTab]);

  const handleCategorySelect = (cat) => {
    // Find default factor for category
    const defaultFactor = factors.find(f => f.category === cat) || factors[0];
    const unitPart = defaultFactor?.unit.split('/')[1]?.trim() || 'units';

    let defaultScope = 'SCOPE_3';
    if (cat === 'ENERGY') defaultScope = 'SCOPE_2';
    else if (cat === 'FUEL') defaultScope = 'SCOPE_1';

    setFormData(prev => ({
      ...prev,
      category: cat,
      emissionFactorId: defaultFactor?.id || '',
      unit: unitPart,
      scope: defaultScope
    }));
  };

  const handleFactorChange = (factorId) => {
    const selected = factors.find(f => f.id === factorId);
    if (selected) {
      const unitPart = selected.unit.split('/')[1]?.trim() || 'units';
      setFormData(prev => ({
        ...prev,
        emissionFactorId: factorId,
        category: selected.category,
        unit: unitPart,
        scope: selected.category === 'ENERGY' ? 'SCOPE_2' : (selected.category === 'FUEL' ? 'SCOPE_1' : 'SCOPE_3')
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Package category specific details
      const details = {};
      if (formData.category === 'ENERGY') {
        details.renewableConsumedKwh = parseFloat(formData.renewableConsumedKwh) || 0;
        details.nonRenewableConsumedKwh = parseFloat(formData.nonRenewableConsumedKwh) || 0;
      } else if (formData.category === 'FUEL') {
        details.fuelType = formData.fuelType;
      } else if (formData.category === 'TRANSPORTATION') {
        details.vehicleType = formData.vehicleType;
        details.distanceKm = parseFloat(formData.distanceKm) || 0;
      } else if (formData.category === 'WASTE') {
        details.wasteCategory = formData.wasteCategory;
        details.treatmentMethod = formData.treatmentMethod;
        details.recycledQuantityKg = parseFloat(formData.recycledQuantityKg) || 0;
      } else if (formData.category === 'WATER') {
        details.waterConsumedKl = parseFloat(formData.waterConsumedKl) || 0;
        details.waterReusedKl = parseFloat(formData.waterReusedKl) || 0;
        details.wastewaterGeneratedKl = parseFloat(formData.wastewaterGeneratedKl) || 0;
      } else if (formData.category === 'MATERIAL') {
        details.materialCategory = formData.materialCategory;
        details.supplier = formData.supplier;
      }

      await api.post('/activities', {
        date: formData.date,
        category: formData.category,
        activityName: formData.activityName,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        scope: formData.scope,
        emissionFactorId: formData.emissionFactorId,
        departmentId: formData.departmentId || null,
        details
      });

      setShowAddModal(false);
      fetchData();
      setFormData(prev => ({ ...prev, activityName: '', quantity: '' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording operational activity');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this operational activity record?')) return;
    try {
      await api.delete(`/activities/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const totalEmissions = activities.reduce((sum, a) => sum + (a.calculatedEmissionKgCO2 || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mode B — Operational Activity Monitoring</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-world carbon measurement for Energy, Fuel, Transportation, Waste, Water, and Materials (RES-IPRC-2025-003)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Real-world Activity</span>
        </button>
      </div>

      {/* Mode B Notice Banner */}
      <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-lg shadow-xs">
        <div className="flex items-start">
          <Calculator className="h-5 w-5 text-emerald-700 mt-0.5 flex-shrink-0" />
          <div className="ml-3 text-xs text-emerald-900">
            <h3 className="font-bold text-sm">Mode B Separation Principle & Calculation Methodology</h3>
            <p className="mt-1 leading-relaxed">
              These operational entries are <strong>strictly separated</strong> from the standardized research dataset.
              Calculations apply physical quantities multiplied by verified authoritative emission factors:
              <code className="mx-1 px-1.5 py-0.5 bg-emerald-100 rounded text-emerald-800 font-mono font-bold">
                Emissions (kg CO2) = Activity Quantity × Emission Factor
              </code>
              (CEA India Baseline v19, IPCC 2019 Guidelines, GHG Protocol).
            </p>
          </div>
        </div>
      </div>

      {/* Scope Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard
          title="Total Logged Activities"
          value={activities.length}
          unit="events"
          subtitle="Real-world recorded entries"
          icon={Activity}
          color="blue"
        />
        <KpiCard
          title="Operational Emissions"
          value={totalEmissions.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          unit="kg CO2"
          subtitle="Physical carbon calculated"
          icon={Calculator}
          color="emerald"
        />
        <KpiCard
          title="Active Emission Factors"
          value={factors.length}
          unit="factors"
          subtitle="CEA, IPCC, BEE, CPHEEO"
          icon={CheckCircle}
          color="purple"
        />
        <KpiCard
          title="Facility Divisions"
          value={departments.length}
          unit="divisions"
          subtitle="PTF, CEP, EMD, FIU, SQA"
          icon={Building}
          color="slate"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategoryTab === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategoryTab(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recorded Operational Activities</h2>
            <p className="text-xs text-slate-500">Live operational ledger linked to verified emission factors</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {activities.length} Records
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No operational activities recorded in this category</h3>
            <p className="text-xs text-slate-500 mt-1">
              Click "Log Real-world Activity" above to create an entry.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Activity Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Physical Quantity</th>
                  <th className="py-3 px-4">Factor Benchmark</th>
                  <th className="py-3 px-4">Scope</th>
                  <th className="py-3 px-4 text-right">Calculated CO2</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {activities.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {new Date(a.date).toISOString().split('T')[0]}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{a.activityName}</span>
                      {a.details && typeof a.details === 'object' && Object.keys(a.details).length > 0 && (
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {Object.entries(a.details).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {a.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {a.quantity.toLocaleString()} {a.unit}
                    </td>
                    <td className="py-3 px-4">
                      {a.emissionFactor ? (
                        <div title={a.emissionFactor.source}>
                          <span className="font-mono text-emerald-800 font-semibold">{a.emissionFactor.factor} {a.emissionFactor.unit}</span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">{a.emissionFactor.fuelOrActivityType}</span>
                        </div>
                      ) : (
                        <span className="text-amber-600 italic">No Factor Assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        a.scope === 'SCOPE_1' ? 'bg-rose-100 text-rose-800' :
                        a.scope === 'SCOPE_2' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {a.scope.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 font-mono">
                      {a.calculatedEmissionKgCO2 !== null
                        ? `${Number(a.calculatedEmissionKgCO2).toFixed(2)} kg`
                        : 'Pending'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {a.department?.name || 'General Facility'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Activity Modal with Category Specific Fields */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">Log Mode B Real-World Operational Activity</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select category to load specialized tracking fields and verified emission factors
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Category Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.filter(c => c.key !== 'ALL').map((c) => (
                    <button
                      type="button"
                      key={c.key}
                      onClick={() => handleCategorySelect(c.key)}
                      className={`p-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 justify-center transition-all ${
                        formData.category === c.key
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{c.label.split('/')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observation Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Activity Name / Equipment Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Test Stand 1 Cryogenic Pumping Stage"
                  value={formData.activityName}
                  onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              {/* Verified Emission Factor Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Verified Emission Factor</label>
                <select
                  value={formData.emissionFactorId}
                  onChange={(e) => handleFactorChange(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                >
                  {factors
                    .filter(f => f.category === formData.category)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.fuelOrActivityType} ({f.factor} {f.unit}) — {f.source}
                      </option>
                    ))}
                  {factors.filter(f => f.category === formData.category).length === 0 && (
                    factors.map(f => (
                      <option key={f.id} value={f.id}>{f.fuelOrActivityType} ({f.factor} {f.unit})</option>
                    ))
                  )}
                </select>
              </div>

              {/* Quantity and Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 2500"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Measurement Unit</label>
                  <input
                    type="text"
                    readOnly
                    value={formData.unit}
                    className="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 font-mono"
                  />
                </div>
              </div>

              {/* CATEGORY SPECIFIC FIELDS */}
              {formData.category === 'ENERGY' && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-emerald-900 mb-1">Renewable Energy (kWh)</label>
                    <input
                      type="number"
                      placeholder="e.g. 800"
                      value={formData.renewableConsumedKwh}
                      onChange={(e) => setFormData({ ...formData, renewableConsumedKwh: e.target.value })}
                      className="w-full bg-white border border-emerald-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-emerald-900 mb-1">Non-Renewable Grid (kWh)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1700"
                      value={formData.nonRenewableConsumedKwh}
                      onChange={(e) => setFormData({ ...formData, nonRenewableConsumedKwh: e.target.value })}
                      className="w-full bg-white border border-emerald-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    />
                  </div>
                </div>
              )}

              {formData.category === 'TRANSPORTATION' && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-blue-900 mb-1">Vehicle Classification</label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                      className="w-full bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    >
                      <option value="Electric Vehicle (Powered by CEA Grid)">Electric Vehicle Buggy</option>
                      <option value="Heavy Commercial Truck (Diesel)">Heavy Commercial Truck</option>
                      <option value="Passenger Car (Mid-size Fleet Petrol)">Passenger Fleet Car</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-blue-900 mb-1">Travel Distance (km)</label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      value={formData.distanceKm}
                      onChange={(e) => setFormData({ ...formData, distanceKm: e.target.value })}
                      className="w-full bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    />
                  </div>
                </div>
              )}

              {formData.category === 'WASTE' && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block font-semibold text-amber-900 mb-1">Waste Category</label>
                    <select
                      value={formData.wasteCategory}
                      onChange={(e) => setFormData({ ...formData, wasteCategory: e.target.value })}
                      className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1.5 text-slate-800 text-[11px]"
                    >
                      <option value="Solid Industrial">Solid Industrial</option>
                      <option value="Electronic Waste">E-Waste</option>
                      <option value="Organic Canteen">Organic Waste</option>
                      <option value="Hazardous Propellant Residue">Hazardous</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-amber-900 mb-1">Treatment</label>
                    <select
                      value={formData.treatmentMethod}
                      onChange={(e) => setFormData({ ...formData, treatmentMethod: e.target.value })}
                      className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1.5 text-slate-800 text-[11px]"
                    >
                      <option value="RECYCLED">Recycled</option>
                      <option value="SECURE_LANDFILL">Landfill</option>
                      <option value="INCINERATED">Incinerated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-amber-900 mb-1">Recycled (kg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 150"
                      value={formData.recycledQuantityKg}
                      onChange={(e) => setFormData({ ...formData, recycledQuantityKg: e.target.value })}
                      className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1.5 text-slate-800 text-[11px]"
                    />
                  </div>
                </div>
              )}

              {formData.category === 'WATER' && (
                <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-sky-900 mb-1">Water Reused (kL)</label>
                    <input
                      type="number"
                      placeholder="e.g. 180"
                      value={formData.waterReusedKl}
                      onChange={(e) => setFormData({ ...formData, waterReusedKl: e.target.value })}
                      className="w-full bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-sky-900 mb-1">Wastewater Generated (kL)</label>
                    <input
                      type="number"
                      placeholder="e.g. 210"
                      value={formData.wastewaterGeneratedKl}
                      onChange={(e) => setFormData({ ...formData, wastewaterGeneratedKl: e.target.value })}
                      className="w-full bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    />
                  </div>
                </div>
              )}

              {formData.category === 'MATERIAL' && (
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-purple-900 mb-1">Material Sub-type</label>
                    <input
                      type="text"
                      placeholder="Liquid Nitrogen / Argon / Solvent"
                      value={formData.materialCategory}
                      onChange={(e) => setFormData({ ...formData, materialCategory: e.target.value })}
                      className="w-full bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-purple-900 mb-1">Supplier / Vendor</label>
                    <input
                      type="text"
                      placeholder="ISRO Auxiliary Gas Plant"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="w-full bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* GHG Protocol Scope & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GHG Protocol Scope</label>
                  <select
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  >
                    <option value="SCOPE_1">Scope 1 (Direct Fuel Combustion)</option>
                    <option value="SCOPE_2">Scope 2 (Purchased Electricity)</option>
                    <option value="SCOPE_3">Scope 3 (Indirect / Supply Chain / Waste)</option>
                    <option value="UNASSIGNED">Unassigned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  >
                    <option value="">General Facility</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
                >
                  Record & Calculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityMonitoring;
