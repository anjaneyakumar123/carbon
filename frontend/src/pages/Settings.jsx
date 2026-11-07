import React, { useState, useEffect } from 'react';
import { Settings, Shield, Database, Plus, CheckCircle2, Server, Globe } from 'lucide-react';
import api from '../services/api';

const SettingsPage = () => {
  const [factors, setFactors] = useState([]);
  const [showAddFactor, setShowAddFactor] = useState(false);
  const [newFactor, setNewFactor] = useState({
    category: 'ENERGY',
    fuelOrActivityType: '',
    factor: '',
    unit: 'kg CO2 / unit',
    source: '',
    version: '2024.1',
    methodology: 'Tier 1 Standard Model'
  });

  const loadFactors = async () => {
    try {
      const res = await api.get('/emission-factors');
      if (res.data.success) setFactors(res.data.factors);
    } catch (err) {
      console.error('Failed to load emission factors:', err);
    }
  };

  useEffect(() => {
    loadFactors();
  }, []);

  const handleCreateFactor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/emission-factors', newFactor);
      setShowAddFactor(false);
      loadFactors();
      setNewFactor({
        category: 'ENERGY',
        fuelOrActivityType: '',
        factor: '',
        unit: 'kg CO2 / unit',
        source: '',
        version: '2024.1',
        methodology: 'Tier 1 Standard Model'
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating factor');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Emission Benchmarks</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure verified emission coefficients, server endpoints, and organizational project metadata
        </p>
      </div>

      {/* Organization Metadata Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Research & Organization Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Organization</span>
            <span className="font-bold text-slate-900 mt-1 block">ISRO Propulsion Complex (IPRC)</span>
            <span className="text-[10px] text-slate-500">Mahendragiri, Tirunelveli District, Tamil Nadu</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Project Reference</span>
            <span className="font-bold text-emerald-700 font-mono mt-1 block">RES-IPRC-2025-003</span>
            <span className="text-[10px] text-slate-500">Research Area: Environment Protection</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">System Connectivity</span>
            <span className="font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Express API & Python ML Service Online</span>
            </span>
            <span className="text-[10px] text-slate-500">PostgreSQL 15 (Prisma ORM) Active</span>
          </div>
        </div>
      </div>

      {/* Emission Factor Management */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Verified Emission Factors Registry</h2>
            <p className="text-xs text-slate-500">Configurable factors for Mode B activity-based carbon accounting</p>
          </div>
          <button
            onClick={() => setShowAddFactor(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Factor</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left divide-y divide-slate-100">
            <thead className="bg-slate-50 text-slate-700 font-semibold">
              <tr>
                <th className="py-3 px-4">Fuel / Activity Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Factor Value</th>
                <th className="py-3 px-4">Measurement Unit</th>
                <th className="py-3 px-4">Authoritative Source</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {factors.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {f.fuelOrActivityType}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {f.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    {f.factor}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {f.unit}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={f.source}>
                    {f.source}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {f.version}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Factor Modal */}
      {showAddFactor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Register New Emission Factor</h3>
            <p className="text-xs text-slate-500 mt-1">Specify authoritative source and calculation units</p>

            <form onSubmit={handleCreateFactor} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fuel or Activity Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bio-diesel B20 Blend"
                  value={newFactor.fuelOrActivityType}
                  onChange={(e) => setNewFactor({ ...newFactor, fuelOrActivityType: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newFactor.category}
                    onChange={(e) => setNewFactor({ ...newFactor, category: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  >
                    <option value="ENERGY">Energy</option>
                    <option value="FUEL">Fuel</option>
                    <option value="TRANSPORTATION">Transportation</option>
                    <option value="WASTE">Waste</option>
                    <option value="WATER">Water</option>
                    <option value="MATERIAL">Material</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Factor (kg CO2 / unit)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    placeholder="e.g. 2.15"
                    value={newFactor.factor}
                    onChange={(e) => setNewFactor({ ...newFactor, factor: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit String</label>
                  <input
                    type="text"
                    required
                    placeholder="kg CO2 / Litre"
                    value={newFactor.unit}
                    onChange={(e) => setNewFactor({ ...newFactor, unit: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Version</label>
                  <input
                    type="text"
                    required
                    value={newFactor.version}
                    onChange={(e) => setNewFactor({ ...newFactor, version: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Authoritative Source</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IPCC 2019 Refinement / CEA Baseline"
                  value={newFactor.source}
                  onChange={(e) => setNewFactor({ ...newFactor, source: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddFactor(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
                >
                  Save Benchmark Factor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

