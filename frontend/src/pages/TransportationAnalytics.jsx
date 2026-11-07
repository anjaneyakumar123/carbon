import React, { useState, useEffect } from 'react';
import { Car, Zap, Footprints, TrendingUp, BarChart2 } from 'lucide-react';
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
import { Bar, Scatter } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

const TransportationAnalytics = () => {
  const [breakdown, setBreakdown] = useState([]);
  const [scatterPoints, setScatterPoints] = useState([]);
  const [corr, setCorr] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [breakRes, scatRes, corrRes] = await Promise.all([
          api.get('/dashboard/breakdowns'),
          api.get('/analytics/scatter?feature=transportationDistanceKm&limit=300'),
          api.get('/analytics/correlation')
        ]);
        if (breakRes.data.success) setBreakdown(breakRes.data.vehicleBreakdown || []);
        if (scatRes.data.success) setScatterPoints(scatRes.data.points || []);
        if (corrRes.data.success) {
          const item = corrRes.data.targetCorrelations.find(c => c.field === 'transportationDistanceKm');
          setCorr(item ? item.correlation : 0.35);
        }
      } catch (err) {
        console.error('Transportation analytics load failed:', err);
      }
    };
    loadData();
  }, []);

  const barChartData = {
    labels: breakdown.map(b => b.vehicle_category),
    datasets: [
      {
        label: 'Average Emission (kg CO2)',
        data: breakdown.map(b => Number(b.avg_emission).toFixed(2)),
        backgroundColor: ['#f43f5e', '#0ea5e9', '#10b981', '#94a3b8'],
        borderRadius: 6
      }
    ]
  };

  const scatterChartData = {
    datasets: [
      {
        label: 'Car Mode Record',
        data: scatterPoints.filter(p => p.isCar).map(p => ({ x: p.x, y: p.y })),
        backgroundColor: 'rgba(244, 63, 94, 0.7)',
        pointRadius: 4
      },
      {
        label: 'EV Mode Record',
        data: scatterPoints.filter(p => p.isEV).map(p => ({ x: p.x, y: p.y })),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        pointRadius: 4
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transportation & Vehicle Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Comparative evaluation of travel distances and vehicle categories (Car, Electric Vehicle, Walking)
        </p>
      </div>

      <StandardizedNotice featureName="Transportation_Distance_km & Vehicle One-Hot Encoded Features" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Distance Correlation with CO2"
          value={corr !== null ? corr.toFixed(3) : '...'}
          unit="r"
          subtitle="Pearson correlation coefficient"
          icon={TrendingUp}
          color="blue"
        />
        <KpiCard
          title="Vehicle Modes Analyzed"
          value="3"
          unit="categories"
          subtitle="Car, EV, Walking"
          icon={Car}
          color="emerald"
        />
        <KpiCard
          title="Distance Mean Score"
          value="0.0000"
          unit="std"
          subtitle="Standardized Z-Score baseline"
          icon={BarChart2}
          color="slate"
          isStandardized={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Comparison Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Average Emission by Vehicle Mode (kg CO2)</h2>
            <p className="text-xs text-slate-500">Comparison of average physical carbon target across mobility types</p>
          </div>
          <div className="h-72">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { title: { display: true, text: 'Average kg CO2' }, grid: { color: '#f1f5f9' } },
                  x: { grid: { display: false } }
                }
              }}
            />
          </div>
        </div>

        {/* Scatter Plot: Distance vs Emission Colored by Vehicle */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Transportation Distance Score vs Carbon Target</h2>
            <p className="text-xs text-slate-500">Separated by Car (Red) and Electric Vehicle (Green) observations</p>
          </div>
          <div className="h-72">
            <Scatter
              data={scatterChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                  x: { title: { display: true, text: 'Distance (Standardized Score)' }, grid: { color: '#f1f5f9' } },
                  y: { title: { display: true, text: 'Carbon Emission (kg CO2)' }, grid: { color: '#f1f5f9' } }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportationAnalytics;

