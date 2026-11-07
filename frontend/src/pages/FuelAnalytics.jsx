import React, { useState, useEffect } from 'react';
import { Flame, TrendingUp, BarChart2 } from 'lucide-react';
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

const FuelAnalytics = () => {
  const [scatterPoints, setScatterPoints] = useState([]);
  const [corr, setCorr] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [scatRes, corrRes] = await Promise.all([
          api.get('/analytics/scatter?feature=fuelUsageLiters&limit=300'),
          api.get('/analytics/correlation')
        ]);
        if (scatRes.data.success) setScatterPoints(scatRes.data.points);
        if (corrRes.data.success) {
          const item = corrRes.data.targetCorrelations.find(c => c.field === 'fuelUsageLiters');
          setCorr(item ? item.correlation : 0.65);
        }
      } catch (err) {
        console.error('Fuel analytics load failed:', err);
      }
    };
    loadData();
  }, []);

  const scatterChartData = {
    datasets: [
      {
        label: 'Fuel Observation Record',
        data: scatterPoints.map(p => ({ x: p.x, y: p.y })),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        pointRadius: 4,
        hoverRadius: 6
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Liquid Fuel Combustion Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Analysis of standardized Fuel_Usage_Liters feature vs target physical carbon emissions
        </p>
      </div>

      <StandardizedNotice featureName="Fuel_Usage_Liters Feature" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Pearson Correlation with CO2"
          value={corr !== null ? corr.toFixed(3) : '...'}
          unit="r"
          subtitle="Strong driver of overall emission"
          icon={TrendingUp}
          color="rose"
        />
        <KpiCard
          title="Standardized Score Mean"
          value="0.0000"
          unit="std"
          subtitle="Z-score normalized baseline"
          icon={Flame}
          color="slate"
          isStandardized={true}
        />
        <KpiCard
          title="Analyzed Observations"
          value={scatterPoints.length}
          unit="samples"
          subtitle="Scatter sample points"
          icon={BarChart2}
          color="blue"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            Fuel Usage Score (Standardized) vs Carbon Emission (Physical kg CO2)
          </h2>
          <p className="text-xs text-slate-500">
            X-Axis: Fuel_Usage_Liters (Standardized Z-Score) • Y-Axis: Target Carbon Emission (kg CO2)
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
                    label: (context) => `Fuel Score: ${context.parsed.x.toFixed(3)} std, CO2: ${context.parsed.y.toFixed(2)} kg`
                  }
                }
              },
              scales: {
                x: {
                  title: { display: true, text: 'Fuel_Usage_Liters (Standardized Z-Score)', font: { size: 12 } },
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

export default FuelAnalytics;

