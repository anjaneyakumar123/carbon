import React, { useState, useEffect } from 'react';
import { SunMedium, TrendingDown, Target, ShieldAlert, BarChart3 } from 'lucide-react';
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
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

const RenewableEnergy = () => {
  const [analytics, setAnalytics] = useState(null);
  const [targetGoal, setTargetGoal] = useState(40); // 40% target renewable

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Renewable Energy & Sustainability Monitoring</h1>
          <p className="text-xs text-slate-500 mt-1">
            Standardized Renewable_Energy_Usage_percent feature tracking and carbon offset analytics
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Carbon Mitigation Effect"
          value="Inverse"
          unit="trend"
          subtitle="Higher clean share reduces net emission"
          icon={TrendingDown}
          color="emerald"
        />
        <KpiCard
          title="Dataset Renewable Score Mean"
          value="0.0000"
          unit="std"
          subtitle="Standardized baseline (Z-score)"
          icon={SunMedium}
          color="slate"
          isStandardized={true}
        />
        <KpiCard
          title="Target Facility Benchmark"
          value={`${targetGoal}%`}
          unit="solar/wind"
          subtitle="Facility target threshold"
          icon={Target}
          color="blue"
        />
      </div>

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

