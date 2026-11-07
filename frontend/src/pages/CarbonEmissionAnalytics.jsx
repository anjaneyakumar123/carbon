import React, { useState, useEffect } from 'react';
import { CloudRain, TrendingUp, BarChart3, Layers, HelpCircle } from 'lucide-react';
import api from '../services/api';
import KpiCard from '../components/KpiCard';
import StandardizedNotice from '../components/StandardizedNotice';

const CarbonEmissionAnalytics = () => {
  const [corrData, setCorrData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get('/analytics/correlation');
        if (res.data.success) setCorrData(res.data);
      } catch (err) {
        console.error('Failed to load correlation analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Carbon Emission Target Analytics & Correlation Matrix</h1>
        <p className="text-xs text-slate-500 mt-1">
          Multivariate correlation matrix and statistical relationship with target Carbon_Emission_kgCO2 (RES-IPRC-2025-003)
        </p>
      </div>

      <StandardizedNotice featureName="All Statistical Input Features" />

      {/* Ranked Target Correlations */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            Ranked Feature Correlations with Target Variable (Carbon_Emission_kgCO2)
          </h2>
          <p className="text-xs text-slate-500">
            Pearson coefficient r ranges from -1.0 (strong negative) to +1.0 (strong positive correlation)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {corrData?.targetCorrelations?.map((item) => {
            const isPos = item.correlation >= 0;
            const magnitude = Math.abs(item.correlation);
            return (
              <div key={item.field} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{item.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{item.field}</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold font-mono ${
                    magnitude > 0.4 ? (isPos ? 'text-rose-600' : 'text-emerald-600') : 'text-slate-700'
                  }`}>
                    {item.correlation > 0 ? `+${item.correlation.toFixed(3)}` : item.correlation.toFixed(3)}
                  </span>
                  <div className="w-16 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isPos ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, magnitude * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Correlation Matrix Table */}
      {corrData?.matrix && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs overflow-hidden">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Full Pearson Correlation Matrix Table</h2>
            <p className="text-xs text-slate-500">Pairwise correlation between all 13 dataset variables</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[10px] text-center font-mono">
              <thead className="bg-slate-100 text-slate-700 font-semibold">
                <tr>
                  <th className="py-2 px-2 text-left font-sans">Variable</th>
                  {corrData.fields.map((f) => (
                    <th key={f} className="py-2 px-1 truncate max-w-[55px]" title={f}>{f.split(' ')[0]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {corrData.matrix.map((row) => (
                  <tr key={row.field} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2 text-left font-sans font-semibold text-slate-800 whitespace-nowrap">
                      {row.label}
                    </td>
                    {row.correlations.map((val, idx) => {
                      const abs = Math.abs(val);
                      let bg = 'bg-white text-slate-600';
                      if (abs > 0.8) bg = 'bg-emerald-200 text-emerald-950 font-bold';
                      else if (abs > 0.5) bg = 'bg-emerald-100 text-emerald-900 font-semibold';
                      else if (abs > 0.2) bg = 'bg-slate-100 text-slate-800';

                      return (
                        <td key={idx} className={`py-1.5 px-1 ${bg}`}>
                          {val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarbonEmissionAnalytics;

