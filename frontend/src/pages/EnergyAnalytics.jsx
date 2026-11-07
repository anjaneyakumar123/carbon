import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, AlertTriangle, ArrowUpRight, BarChart2 } from 'lucide-react';
import api from '../services/api';
import KpiCard from '../components/KpiCard';
import StandardizedNotice from '../components/StandardizedNotice';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Scatter, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const EnergyAnalytics = () => {
  const [scatterPoints, setScatterPoints] = useState([]);
  const [corr, setCorr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [scatRes, corrRes] = await Promise.all([
          api.get('/analytics/scatter?feature=energyUsageKwh&limit=300'),
          api.get('/analytics/correlation')
        ]);

        if (scatRes.data.success) setScatterPoints(scatRes.data.points);
        if (corrRes.data.success) {
          const item = corrRes.data.targetCorrelations.find(c => c.field === 'energyUsageKwh');
          setCorr(item ? item.correlation : 0.45);
        }
      } catch (err) {
        console.error('Energy analytics load failed:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const scatterChartData = {
    datasets: [
      {
        label: 'Observation Record',
        data: scatterPoints.map(p => ({ x: p.x, y: p.y })),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        pointRadius: 4,
        hoverRadius: 6
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Energy Usage Feature Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Detailed analysis of standardized electricity usage vs physical carbon footprint (RES-IPRC-2025-003)
        </p>
      </div>

      <StandardizedNotice featureName="Energy_Usage_kWh Feature" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Pearson Correlation with CO2"
          value={corr !== null ? corr.toFixed(3) : '...'}
          unit="r"
          subtitle="Positive relationship with carbon"
          icon={TrendingUp}
          color="emerald"
        />
        <KpiCard
          title="Standardized Score Mean"
          value="0.0000"
          unit="std"
          subtitle="Normalized baseline (Z-score)"
          icon={Zap}
          color="slate"
          isStandardized={true}
        />
        <KpiCard
          title="Sample Evaluation Size"
          value={scatterPoints.length}
          unit="observations"
          subtitle="Scatter sample points"
          icon={BarChart2}
          color="blue"
        />
      </div>

      {/* Scatter plot */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            Energy Usage Score (Standardized) vs Carbon Emission (Physical kg CO2)
          </h2>
          <p className="text-xs text-slate-500">
            X-Axis: Standardized Energy Feature Score (Negative values indicate below-average usage) • Y-Axis: Physical kg CO2
          </p>
        </div>

        <div className="h-96">
          <Scatter
            data={scatterChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (context) => `Energy: ${context.parsed.x.toFixed(3)} std, CO2: ${context.parsed.y.toFixed(2)} kg`
                  }
                }
              },
              scales: {
                x: {
                  title: { display: true, text: 'Energy_Usage_kWh (Standardized Z-Score)', font: { size: 12 } },
                  grid: { color: '#f1f5f9' }
                },
                y: {
                  title: { display: true, text: 'Carbon_Emission_kgCO2 (Physical kg CO2)', font: { size: 12 } },
                  grid: { color: '#f1f5f9' }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EnergyAnalytics;

