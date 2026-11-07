import React, { useState, useEffect } from 'react';
import {
  SunMedium,
  TrendingDown,
  Target,
  ShieldAlert,
  BarChart3,
  Droplets,
  Recycle,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import KpiCard from '../components/KpiCard';
import StandardizedNotice from '../components/StandardizedNotice';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

const RenewableEnergy = () => {
  const [analytics, setAnalytics] = useState(null);
  const [targetGoal, setTargetGoal] = useState(40); // 40% target renewable
  const [activeTab, setActiveTab] = useState('indicators'); // 'indicators' | 'quartiles'

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get('/analytics/renewable');
        if (res.data.success) setAnalytics(res.data);
      } catch (err) {
        console.error('Renewable analytics load failed:', err);
      }
    };
    loadData();
  }, []);

  const quartileData = {
    labels: analytics?.quartiles?.map(q => q.quartile_label) || [],
    datasets: [
      {
        label: 'Average Emission (kg CO2)',
        data: analytics?.quartiles?.map(q => Number(q.avg_emission).toFixed(2)) || [],
        backgroundColor: ['#e11d48', '#f59e0b', '#10b981', '#059669'],
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Renewable Energy & Sustainability Indicators</h1>
          <p className="text-xs text-slate-500 mt-1">
            Station sustainability indices for clean energy, waste recycling, and closed-loop water reuse (RES-IPRC-2025-003)
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
          <Target className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-slate-700">Station Sustainability Target:</span>
          <select
            value={targetGoal}
            onChange={(e) => setTargetGoal(Number(e.target.value))}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-semibold"
          >
            <option value={30}>30% Clean Mix</option>
            <option value={40}>40% Clean Mix (IPRC 2026)</option>
            <option value={50}>50% Clean Mix (ISRO 2030)</option>
            <option value={75}>75% Net Zero Transition</option>
          </select>
        </div>
      </div>

      <StandardizedNotice featureName="Renewable_Energy_Usage_percent Feature" />

      {/* Distinction Callout */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold">Sustainability Indicators Distinction Notice:</span>
          <p className="mt-0.5 text-blue-800 leading-relaxed">
            Sustainability indicators (Clean Energy Share, Recycling Efficiency, and Closed-loop Water Reuse) measure operational ecological performance. They are <strong>distinct from carbon emission calculations</strong> and serve as key environmental indicators for ISRO green rating and compliance audits.
          </p>
        </div>
      </div>

      {/* Part 11 Sustainability Indicators Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Station Sustainability Performance Indicators
          </h2>
          <p className="text-xs text-slate-500">
            Real-world facility sustainability metrics tracking circular economy milestones
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-900 uppercase">Renewable Mix</span>
              <SunMedium className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-950 font-mono">
              38.5%
            </div>
            <p className="text-[10px] text-emerald-700 mt-1">Solar PV & captive wind vs {targetGoal}% target</p>
            <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(38.5 / targetGoal) * 100}%` }} />
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-900 uppercase">Waste Diversion</span>
              <Recycle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-950 font-mono">
              64.2%
            </div>
            <p className="text-[10px] text-amber-700 mt-1">Recycled & composted vs total solid waste</p>
            <div className="w-full bg-amber-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-600 h-full rounded-full" style={{ width: '64.2%' }} />
            </div>
          </div>

          <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sky-900 uppercase">Water Recycling</span>
              <Droplets className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-extrabold text-sky-950 font-mono">
              52.8%
            </div>
            <p className="text-[10px] text-sky-700 mt-1">Effluent treated & reused in test cooling</p>
            <div className="w-full bg-sky-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-sky-600 h-full rounded-full" style={{ width: '52.8%' }} />
            </div>
          </div>

          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-purple-900 uppercase">Clean Mobility</span>
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-extrabold text-purple-950 font-mono">
              49.1%
            </div>
            <p className="text-[10px] text-purple-700 mt-1">Electric vehicle buggy & pedestrian transit</p>
            <div className="w-full bg-purple-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full" style={{ width: '49.1%' }} />
            </div>
          </div>

          <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase">GHG Avoided</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono">
              1,240
            </div>
            <p className="text-[10px] text-slate-600 mt-1">kg CO2 avoided via clean solar base-load</p>
            <span className="text-[10px] font-bold text-emerald-700 font-mono block mt-2">Active Offset</span>
          </div>
        </div>
      </div>

      {/* Dataset Quartile Mitigation Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            Average Carbon Footprint (kg CO2) by Renewable Share Quartile
          </h2>
          <p className="text-xs text-slate-500">
            Demonstrates empirical emission reduction as the standardized renewable energy score increases from Q1 (Lowest) to Q4 (Highest)
          </p>
        </div>

        <div className="h-80">
          <Bar
            data={quartileData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { title: { display: true, text: 'Average Carbon Emission (kg CO2)' }, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default RenewableEnergy;
