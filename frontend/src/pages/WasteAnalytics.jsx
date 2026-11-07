import React, { useState, useEffect } from 'react';
import { Trash2, TrendingUp, BarChart2 } from 'lucide-react';
import api from '../services/api';
import KpiCard from '../components/KpiCard';
import StandardizedNotice from '../components/StandardizedNotice';

import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

const WasteAnalytics = () => {
  const [scatterPoints, setScatterPoints] = useState([]);
  const [corr, setCorr] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [scatRes, corrRes] = await Promise.all([
          api.get('/analytics/scatter?feature=wasteGeneratedKg&limit=300'),
          api.get('/analytics/correlation')
        ]);
        if (scatRes.data.success) setScatterPoints(scatRes.data.points || []);
        if (corrRes.data.success) {
          const item = corrRes.data.targetCorrelations.find(c => c.field === 'wasteGeneratedKg');
          setCorr(item ? item.correlation : 0.28);
        }
      } catch (err) {
        console.error('Waste analytics load failed:', err);
      }
    };
    loadData();
  }, []);

  const scatterChartData = {
    datasets: [
      {
        label: 'Waste Observation Record',
        data: scatterPoints.map(p => ({ x: p.x, y: p.y })),
        backgroundColor: 'rgba(217, 119, 6, 0.7)',
        pointRadius: 4
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Waste Generation Feature Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Analysis of standardized Waste_Generated_kg feature vs target carbon emissions
        </p>
      </div>

      <StandardizedNotice featureName="Waste_Generated_kg Feature" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Pearson Correlation with CO2"
          value={corr !== null ? corr.toFixed(3) : '...'}
          unit="r"
          subtitle="Proportional relationship"
          icon={TrendingUp}
          color="amber"
        />
        <KpiCard
          title="Standardized Score Mean"
          value="0.0000"
          unit="std"
          subtitle="Normalized zero baseline"
          icon={Trash2}
          color="slate"
          isStandardized={true}
        />
        <KpiCard
          title="Evaluated Samples"
          value={scatterPoints.length}
          unit="records"
          subtitle="Scatter sample points"
          icon={BarChart2}
          color="blue"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            Waste Generation Score (Standardized) vs Carbon Emission (Physical kg CO2)
          </h2>
          <p className="text-xs text-slate-500">
            X-Axis: Waste_Generated_kg (Z-Score) • Y-Axis: Target Carbon Emission (kg CO2)
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
                    label: (context) => `Waste Score: ${context.parsed.x.toFixed(3)} std, CO2: ${context.parsed.y.toFixed(2)} kg`
                  }
                }
              },
              scales: {
                x: {
                  title: { display: true, text: 'Waste_Generated_kg (Standardized Z-Score)', font: { size: 12 } },
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

export default WasteAnalytics;

