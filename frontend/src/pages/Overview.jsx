import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Zap,
  Car,
  Flame,
  SunMedium,
  TrendingUp,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart as PieIcon,
  Calendar,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import KpiCard from '../components/KpiCard';
import StandardizedNotice from '../components/StandardizedNotice';

// Chart.js registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Overview = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [breakdowns, setBreakdowns] = useState(null);
  const [loading, setLoading] = useState(true);

  // Interactive filters
  const [yearFilter, setYearFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [trendGrouping, setTrendGrouping] = useState('year');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (yearFilter) params.year = yearFilter;
      if (vehicleFilter) params.vehicleType = vehicleFilter;
      if (buildingFilter) params.buildingType = buildingFilter;

      const [summaryRes, trendsRes, distRes, breakdownsRes] = await Promise.all([
        api.get('/dashboard/summary', { params }),
        api.get('/dashboard/trends', { params: { groupBy: trendGrouping } }),
        api.get('/dashboard/distribution'),
        api.get('/dashboard/breakdowns')
      ]);

      if (summaryRes.data.success) setSummary(summaryRes.data.summary);
      if (trendsRes.data.success) setTrends(trendsRes.data.trends);
      if (distRes.data.success) setDistribution(distRes.data.distribution);
      if (breakdownsRes.data.success) setBreakdowns(breakdownsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [yearFilter, vehicleFilter, buildingFilter, trendGrouping]);

  // Trend Chart Data
  const trendChartData = {
    labels: trends.map(t => t.period),
    datasets: [
      {
        label: 'Average Carbon Emission (kgCO2)',
        data: trends.map(t => Number(t.avg_emission).toFixed(2)),
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#059669'
      }
    ]
  };

  // Distribution Chart Data
  const distChartData = {
    labels: distribution.map(d => `${d.bin_start}-${d.bin_end} kg`),
    datasets: [
      {
        label: 'Frequency (Record Count)',
        data: distribution.map(d => d.count),
        backgroundColor: '#10b981',
        borderRadius: 4
      }
    ]
  };

  // Vehicle Breakdown Doughnut
  const vehicleChartData = {
    labels: breakdowns?.vehicleBreakdown?.map(v => v.vehicle_category) || [],
    datasets: [
      {
        data: breakdowns?.vehicleBreakdown?.map(v => v.total_emission) || [],
        backgroundColor: ['#047857', '#0ea5e9', '#6366f1', '#94a3b8'],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Carbon Monitoring Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time analytics and baseline indicators for ISRO Propulsion Complex (RES-IPRC-2025-003)
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium px-2">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Filters:</span>
          </div>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Observation Years (2024–2051)</option>
            <option value="2024">2024 (Baseline Year)</option>
            <option value="2025">2025 (Project Year)</option>
            <option value="2030">2030 Projection</option>
            <option value="2040">2040 Horizon</option>
            <option value="2050">2050 Long Term</option>
          </select>

          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Vehicle Categories</option>
            <option value="car">Car Fleet Only</option>
            <option value="ev">Electric Vehicles Only</option>
            <option value="walking">Walking / Transit</option>
          </select>

          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Building Categories</option>
            <option value="residential">Residential Quarters</option>
            <option value="commercial">Operational / Non-Residential</option>
          </select>

          <button
            onClick={fetchData}
            title="Refresh Data"
            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <StandardizedNotice featureName="Energy, Transportation, Fuel, and Weather Features" />

      {/* Primary KPI Grid (Target physical emissions & total records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Carbon Emission"
          value={summary ? Number(summary.totalEmissionsKgCO2).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '...'}
          unit="kg CO2"
          subtitle="Cumulative target physical footprint"
          icon={CloudRain}
          color="emerald"
        />
        <KpiCard
          title="Average Emission"
          value={summary ? Number(summary.avgEmissionsKgCO2).toFixed(2) : '...'}
          unit="kg CO2"
          subtitle="Per observation period"
          icon={TrendingUp}
          color="blue"
        />
        <KpiCard
          title="Peak Max Emission"
          value={summary ? Number(summary.maxEmissionsKgCO2).toFixed(2) : '...'}
          unit="kg CO2"
          subtitle="Maximum single observation"
          icon={Flame}
          color="rose"
        />
        <KpiCard
          title="Minimum Emission"
          value={summary ? Number(summary.minEmissionsKgCO2).toFixed(2) : '...'}
          unit="kg CO2"
          subtitle="Lowest recorded observation"
          icon={SunMedium}
          color="amber"
        />
        <KpiCard
          title="Dataset Records"
          value={summary ? Number(summary.totalRecords).toLocaleString() : '...'}
          unit="rows"
          subtitle="Preprocessed dataset records"
          icon={BarChart3}
          color="purple"
        />
      </div>

      {/* Standardized Feature Means Grid (Explicitly labeled) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Standardized Feature Baseline Scores (Z-Score Averages)
            </h2>
            <p className="text-xs text-slate-500">
              Mean value is approximately 0.0 with unit variance. Demonstrates relative positioning, not raw kWh or Litres.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Avg Energy Feature"
            value={summary?.standardizedFeatures ? Number(summary.standardizedFeatures.avgEnergyUsage).toFixed(4) : '0.0000'}
            unit="std"
            subtitle="Electricity consumption score"
            icon={Zap}
            color="slate"
            isStandardized={true}
          />
          <KpiCard
            title="Avg Transportation Feature"
            value={summary?.standardizedFeatures ? Number(summary.standardizedFeatures.avgTransportation).toFixed(4) : '0.0000'}
            unit="std"
            subtitle="Transit distance score"
            icon={Car}
            color="slate"
            isStandardized={true}
          />
          <KpiCard
            title="Avg Fuel Usage Feature"
            value={summary?.standardizedFeatures ? Number(summary.standardizedFeatures.avgFuelUsage).toFixed(4) : '0.0000'}
            unit="std"
            subtitle="Liquid fuel combustion score"
            icon={Flame}
            color="slate"
            isStandardized={true}
          />
          <KpiCard
            title="Avg Renewable Energy Feature"
            value={summary?.standardizedFeatures ? Number(summary.standardizedFeatures.avgRenewableEnergy).toFixed(4) : '0.0000'}
            unit="std"
            subtitle="Renewable mix proportion score"
            icon={SunMedium}
            color="slate"
            isStandardized={true}
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Carbon Emission Historical & Projected Trends</h2>
              <p className="text-xs text-slate-500">Average target emission (kgCO2) aggregated by horizon</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setTrendGrouping('year')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  trendGrouping === 'year' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setTrendGrouping('month')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  trendGrouping === 'month' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Monthly (Sample)
              </button>
            </div>
          </div>
          <div className="h-72">
            <Line
              data={trendChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                  y: {
                    title: { display: true, text: 'Average kg CO2', font: { size: 11 } },
                    grid: { color: '#f1f5f9' }
                  },
                  x: {
                    grid: { display: false }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Vehicle Breakdown (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-800">Emissions by Vehicle Category</h2>
            <p className="text-xs text-slate-500">Cumulative kgCO2 grouped by encoded mobility type</p>
          </div>
          <div className="flex-1 flex items-center justify-center h-60">
            {breakdowns?.vehicleBreakdown ? (
              <Doughnut
                data={vehicleChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
                  }
                }}
              />
            ) : (
              <div className="text-xs text-slate-400">Loading breakdown...</div>
            )}
          </div>
        </div>
      </div>

      {/* Lower Row: Distribution & Top Periods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emission Distribution Histogram */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-800">Carbon Emission Distribution Histogram</h2>
            <p className="text-xs text-slate-500">Frequency distribution across 5 kgCO2 bin intervals</p>
          </div>
          <div className="h-64">
            <Bar
              data={distChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { title: { display: true, text: 'Record Count' }, grid: { color: '#f1f5f9' } },
                  x: { grid: { display: false } }
                }
              }}
            />
          </div>
        </div>

        {/* Top Emission Periods */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-800">Top Peak Emission Periods</h2>
            <p className="text-xs text-slate-500">Observations requiring high-priority environmental audit</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Target (kgCO2)</th>
                  <th className="py-2.5 px-3 text-right">Energy (Std)</th>
                  <th className="py-2.5 px-3 text-right">Fuel (Std)</th>
                  <th className="py-2.5 px-3 text-right">Renewable (Std)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {breakdowns?.topPeriods?.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                      {new Date(p.date).toISOString().split('T')[0]}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                      {Number(p.carbonEmissionKgCO2).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {Number(p.energyUsageKwh).toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {Number(p.fuelUsageLiters).toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600">
                      {Number(p.renewableEnergyUsagePercent).toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;

