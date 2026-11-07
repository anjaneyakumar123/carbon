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
  Calculator
} from 'lucide-react';
import api from '../services/api';
import KpiCard from '../components/KpiCard';

const ActivityMonitoring = () => {
  const [activities, setActivities] = useState([]);
  const [factors, setFactors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [scopeAgg, setScopeAgg] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'ENERGY',
    activityName: '',
    quantity: '',
    unit: 'kWh',
    scope: 'SCOPE_2',
    emissionFactorId: '',
    departmentId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [actRes, factRes, deptRes] = await Promise.all([
        api.get('/activities'),
        api.get('/emission-factors'),
        api.get('/auth/departments')
      ]);

      if (actRes.data.success) {
        setActivities(actRes.data.activities);
        setScopeAgg(actRes.data.scopeAgg);
      }
      if (factRes.data.success) {
        setFactors(factRes.data.factors);
        if (factRes.data.factors.length > 0) {
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
  }, []);

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
      await api.post('/activities', formData);
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
            Activity-based carbon measurement using verified emission factors (CEA Baseline, IPCC Guidelines, GHG Protocol)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-emerald-700/30 transition-all self-start md:self-auto"
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
            <h3 className="font-bold text-sm">Mode B Separation Principle</h3>
            <p className="mt-1 leading-relaxed">
              These operational records are kept <strong>completely distinct</strong> from the preprocessed standardized research dataset.
              Emissions are calculated mathematically using physical input quantities and verified emission factors:
              <code className="mx-1 px-1.5 py-0.5 bg-emerald-100 rounded text-emerald-800 font-mono font-bold">
                Emissions (kg CO2) = Activity Quantity × Emission Factor
              </code>.
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
          title="Total Operational Emissions"
          value={totalEmissions.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          unit="kg CO2"
          subtitle="Sum of activity emissions"
          icon={Calculator}
          color="emerald"
        />
        <KpiCard
          title="Active Emission Factors"
          value={factors.length}
          unit="factors"
          subtitle="CEA, IPCC, BEE benchmarks"
          icon={CheckCircle}
          color="purple"
        />
        <KpiCard
          title="Departments Enrolled"
          value={departments.length}
          unit="divisions"
          subtitle="PTF, CEP, EMD, FIU, SQA"
          icon={Building}
          color="slate"
        />
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recorded Operational Activities</h2>
            <p className="text-xs text-slate-500">Live operational log with linked emission factor verification</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {activities.length} Records
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No operational activities logged yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Click "Log Real-world Activity" above to record electricity, fuel, transit, or waste generation.
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
                  <th className="py-3 px-4">Emission Factor</th>
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
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {a.activityName}
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
                          <span className="font-mono text-emerald-800 font-semibold">{a.emissionFactor.factor}</span>
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

      {/* Add Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Log New Real-world Operational Activity</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select category and verified emission factor to calculate physical CO2 footprint
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Activity Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cryogenic stand high-voltage auxiliary compressor test"
                  value={formData.activityName}
                  onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emission Factor Benchmark</label>
                <select
                  value={formData.emissionFactorId}
                  onChange={(e) => handleFactorChange(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                >
                  {factors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.fuelOrActivityType} ({f.factor} {f.unit}) — {f.source}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 1500"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
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

