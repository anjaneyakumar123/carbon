import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Cpu,
  TrendingUp,
  Sliders,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  Award
} from 'lucide-react';
import api from '../services/api';
import KpiCard from '../components/KpiCard';
import StandardizedNotice from '../components/StandardizedNotice';

const PredictionInsights = () => {
  const [modelsData, setModelsData] = useState(null);
  const [selectedModel, setSelectedModel] = useState('active_model');
  const [predictionResult, setPredictionResult] = useState(null);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [retraining, setRetraining] = useState(false);

  // Standardized Feature Form Input
  const [features, setFeatures] = useState({
    Energy_Usage_kWh: 0.0,
    Transportation_Distance_km: 0.0,
    Smart_Appliance_Usage_hours: 0.0,
    Renewable_Energy_Usage_percent: 0.0,
    Temperature_C: 0.0,
    Humidity_percent: 0.0,
    Fuel_Usage_Liters: 0.0,
    Waste_Generated_kg: 0.0,
    Vehicle_Type_Car: -0.59,
    Vehicle_Type_Electric_Vehicle: -0.58,
    Vehicle_Type_Walking: -0.57,
    Building_Type_Residential: 1.0
  });

  const loadModels = async () => {
    try {
      const res = await api.get('/predictions/models');
      if (res.data.success) {
        setModelsData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load ML models:', err);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoadingPredict(true);
    try {
      const payload = {
        ...features,
        model_name: selectedModel
      };
      const res = await api.post('/predictions/predict', payload);
      if (res.data.success) {
        setPredictionResult(res.data.result);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Prediction failed');
    } finally {
      setLoadingPredict(false);
    }
  };

  const handleRetrain = async () => {
    if (!window.confirm('Retrain all 4 machine learning models on the 10,000-record dataset?')) return;
    setRetraining(true);
    try {
      const res = await api.post('/predictions/train');
      if (res.data.success) {
        alert('Models retrained successfully!');
        loadModels();
      }
    } catch (err) {
      alert('Retrain error: ' + (err.response?.data?.message || err.message));
    } finally {
      setRetraining(false);
    }
  };

  const setVehiclePreset = (mode) => {
    if (mode === 'car') {
      setFeatures(prev => ({
        ...prev,
        Vehicle_Type_Car: 1.69,
        Vehicle_Type_Electric_Vehicle: -0.58,
        Vehicle_Type_Walking: -0.57
      }));
    } else if (mode === 'ev') {
      setFeatures(prev => ({
        ...prev,
        Vehicle_Type_Car: -0.59,
        Vehicle_Type_Electric_Vehicle: 1.73,
        Vehicle_Type_Walking: -0.57
      }));
    } else if (mode === 'walking') {
      setFeatures(prev => ({
        ...prev,
        Vehicle_Type_Car: -0.59,
        Vehicle_Type_Electric_Vehicle: -0.58,
        Vehicle_Type_Walking: 1.74
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Machine Learning & Carbon Footprint Prediction</h1>
          <p className="text-xs text-slate-500 mt-1">
            Predictive modeling and model benchmarking for RES-IPRC-2025-003 with zero target leakage
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
          <span>{retraining ? 'Retraining Models...' : 'Retrain All Models'}</span>
        </button>
      </div>

      <StandardizedNotice featureName="Prediction Feature Inputs" />

      {/* Model Benchmark Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Evaluated Regression Models Comparison (80/20 Train/Test Split)
            </h2>
            <p className="text-xs text-slate-500">
              R² score, MAE, MSE, and RMSE evaluated strictly on unseen test observations with seed=42
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-xs font-semibold">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Best Model: {modelsData?.bestModel || 'Linear Regression'}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left divide-y divide-slate-100">
            <thead className="bg-slate-50 text-slate-700 font-semibold">
              <tr>
                <th className="py-3 px-4">Model Architecture</th>
                <th className="py-3 px-4 text-right">Test R² Score</th>
                <th className="py-3 px-4 text-right">Test MAE (kg)</th>
                <th className="py-3 px-4 text-right">Test RMSE (kg)</th>
                <th className="py-3 px-4 text-right">Chrono Test R²</th>
                <th className="py-3 px-4 text-right">Chrono RMSE (kg)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-mono">
              {modelsData?.models?.map((m) => (
                <tr key={m.modelName} className={m.isActive ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}>
                  <td className="py-3 px-4 font-sans font-bold text-slate-900">
                    {m.modelName}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">
                    {Number(m.r2Score).toFixed(4)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">
                    {Number(m.mae).toFixed(3)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">
                    {Number(m.rmse).toFixed(3)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-blue-700">
                    {Number(m.chronoR2Score).toFixed(4)}
                  </td>
                  <td className="py-3 px-4 text-right text-blue-700">
                    {Number(m.chronoRmse).toFixed(3)}
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    {m.isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                        Active Model
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        Benchmarked
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prediction Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Standardized Prediction Input Parameters</h2>
              <p className="text-xs text-slate-500">
                Adjust standardized scores (-2.0 to +2.0) to estimate resulting physical Carbon_Emission_kgCO2
              </p>
            </div>

            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-semibold"
            >
              <option value="active_model">Best Model (Linear Regression)</option>
              <option value="gradient_boosting">Gradient Boosting</option>
              <option value="random_forest">Random Forest</option>
              <option value="decision_tree">Decision Tree</option>
            </select>
          </div>

          <form onSubmit={handlePredict} className="space-y-4">
            {/* Mobility Preset Selector */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-700 block mb-2">Mobility Mode Setting:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVehiclePreset('car')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    features.Vehicle_Type_Car > 0 ? 'bg-rose-600 text-white' : 'bg-white border text-slate-700'
                  }`}
                >
                  Car Fleet Mode
                </button>
                <button
                  type="button"
                  onClick={() => setVehiclePreset('ev')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    features.Vehicle_Type_Electric_Vehicle > 0 ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-700'
                  }`}
                >
                  Electric Vehicle Mode
                </button>
                <button
                  type="button"
                  onClick={() => setVehiclePreset('walking')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    features.Vehicle_Type_Walking > 0 ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700'
                  }`}
                >
                  Walking / Transit Mode
                </button>
              </div>
            </div>

            {/* Continuous Feature Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'Energy_Usage_kWh', label: 'Energy Usage Score (Std)' },
                { key: 'Fuel_Usage_Liters', label: 'Liquid Fuel Usage Score (Std)' },
                { key: 'Transportation_Distance_km', label: 'Transportation Distance Score (Std)' },
                { key: 'Renewable_Energy_Usage_percent', label: 'Renewable Energy % Score (Std)' },
                { key: 'Waste_Generated_kg', label: 'Waste Generated Score (Std)' },
                { key: 'Smart_Appliance_Usage_hours', label: 'Smart Appliance Hours (Std)' },
                { key: 'Temperature_C', label: 'Ambient Temperature Score (Std)' },
                { key: 'Humidity_percent', label: 'Humidity Score (Std)' }
              ].map(({ key, label }) => (
                <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-700">{label}</span>
                    <span className="text-xs font-mono font-bold text-slate-900">{features[key].toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.05"
                    value={features[key]}
                    onChange={(e) => setFeatures({ ...features, [key]: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>-2.0 (Low)</span>
                    <span>0.0 (Average)</span>
                    <span>+2.0 (High)</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loadingPredict}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-700/30 transition-all flex items-center justify-center gap-2"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>{loadingPredict ? 'Predicting Emission...' : 'Calculate Predicted Footprint'}</span>
            </button>
          </form>
        </div>

        {/* Prediction Results Card (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Estimated Physical Footprint</h2>
            <p className="text-xs text-slate-500 mb-4">Model inference output based on supplied feature vector</p>

            {predictionResult ? (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                    Predicted Carbon Emission
                  </span>
                  <div className="text-4xl font-extrabold text-emerald-950 font-mono my-2">
                    {predictionResult.predicted_emission_kgCO2}
                  </div>
                  <span className="text-xs font-bold text-emerald-800">
                    kg CO2 (Physical Measurement)
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Model Applied:</span>
                    <span className="font-semibold text-slate-900">{predictionResult.model_used}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Model Test R²:</span>
                    <span className="font-semibold text-emerald-700 font-mono">{predictionResult.model_r2_score}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Test RMSE:</span>
                    <span className="font-semibold text-slate-900 font-mono">{predictionResult.model_rmse} kg</span>
                  </div>
                </div>

                {/* Feature contributions breakdown */}
                {predictionResult.feature_contributions && (
                  <div className="mt-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Key Feature Contributions
                    </h3>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {Object.entries(predictionResult.feature_contributions).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-slate-50">
                          <span className="text-slate-600 truncate max-w-[150px]">{k.replace(/_/g, ' ')}</span>
                          <span className={`font-mono font-semibold ${v >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {v > 0 ? `+${v}` : v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <BrainCircuit className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  Adjust standardized feature scores on the left and click "Calculate Predicted Footprint".
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 leading-tight">
              Predicted value is synthesized from the standardized dataset model. Input features must be treated strictly as standardized scores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionInsights;

