import React, { useState, useEffect } from 'react';
import { Lightbulb, CheckCircle2, Clock, AlertCircle, Plus, Filter, Tag } from 'lucide-react';
import api from '../services/api';
import KpiCard from '../components/KpiCard';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'HIGH',
    category: 'ENERGY',
    supportingData: '',
    relatedFeature: '',
    suggestedAction: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (priorityFilter) params.priority = priorityFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/recommendations', { params });
      if (res.data.success) {
        setRecommendations(res.data.recommendations);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [priorityFilter, statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/recommendations/${id}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/recommendations', formData);
      setShowAddModal(false);
      fetchData();
      setFormData({
        title: '',
        description: '',
        priority: 'HIGH',
        category: 'ENERGY',
        supportingData: '',
        relatedFeature: '',
        suggestedAction: ''
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating recommendation');
    }
  };

  const highCount = recommendations.filter(r => r.priority === 'HIGH').length;
  const openCount = recommendations.filter(r => r.status === 'OPEN').length;
  const resolvedCount = recommendations.filter(r => r.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Environmental Action Recommendations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Rule-based mitigations derived from dataset analysis and operational thresholds (RES-IPRC-2025-003)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Recommendation</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard
          title="Total Recommendations"
          value={recommendations.length}
          unit="rules"
          subtitle="Identified mitigation actions"
          icon={Lightbulb}
          color="blue"
        />
        <KpiCard
          title="High Priority Actions"
          value={highCount}
          unit="critical"
          subtitle="Requires immediate review"
          icon={AlertCircle}
          color="rose"
        />
        <KpiCard
          title="Open Action Items"
          value={openCount}
          unit="pending"
          subtitle="Awaiting implementation"
          icon={Clock}
          color="amber"
        />
        <KpiCard
          title="Resolved Actions"
          value={resolvedCount}
          unit="closed"
          subtitle="Implemented and audited"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span>Filter Action Items:</span>
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
        >
          <option value="">All Priorities</option>
          <option value="HIGH">High Priority</option>
          <option value="MEDIUM">Medium Priority</option>
          <option value="LOW">Low Priority</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {/* Recommendations Cards List */}
      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  rec.priority === 'HIGH' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                  rec.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {rec.priority} Priority
                </span>

                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                  {rec.category}
                </span>

                <span className="text-[11px] text-slate-400 font-mono">
                  {rec.relatedFeature}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900">{rec.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>

              {/* Supporting Data & Suggested Action */}
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-700 block text-[11px]">Supporting Analysis:</span>
                  <span className="text-slate-600 font-mono text-[11px] mt-0.5 block">{rec.supportingData}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="font-semibold text-emerald-900 block text-[11px]">Action Strategy:</span>
                  <span className="text-emerald-800 text-[11px] mt-0.5 block">{rec.suggestedAction}</span>
                </div>
              </div>
            </div>

            {/* Status Selector */}
            <div className="flex md:flex-col items-center gap-2 self-end md:self-start">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Status</span>
              <select
                value={rec.status}
                onChange={(e) => handleStatusChange(rec.id, e.target.value)}
                className={`text-xs font-bold rounded-lg px-3 py-1.5 border focus:outline-none ${
                  rec.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                  rec.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                  'bg-slate-50 text-slate-700 border-slate-300'
                }`}
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Add Recommendation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Add New Sustainability Recommendation</h3>
            <p className="text-xs text-slate-500 mt-1">Rule-based action protocol for facility environmental management</p>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Variable Frequency Drives on Liquid Chilling Plants"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  >
                    <option value="ENERGY">Energy Efficiency</option>
                    <option value="FUEL">Fuel Combustion</option>
                    <option value="TRANSPORT">Mobility & Fleet</option>
                    <option value="RENEWABLE">Solar / Clean Power</option>
                    <option value="WASTE">Waste Management</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detailed context of the environmental pattern observed..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supporting Analytical Evidence</label>
                <input
                  type="text"
                  placeholder="e.g. Energy feature score spike during test operations"
                  value={formData.supportingData}
                  onChange={(e) => setFormData({ ...formData, supportingData: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Suggested Mitigation Strategy</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule auxiliary pumping during off-peak solar window"
                  value={formData.suggestedAction}
                  onChange={(e) => setFormData({ ...formData, suggestedAction: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
                  Save Recommendation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recommendations;

