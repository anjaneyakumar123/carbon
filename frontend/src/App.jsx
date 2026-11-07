import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';

import Login from './pages/Login';
import Overview from './pages/Overview';
import DatasetExplorer from './pages/DatasetExplorer';
import ActivityMonitoring from './pages/ActivityMonitoring';
import EnergyAnalytics from './pages/EnergyAnalytics';
import FuelAnalytics from './pages/FuelAnalytics';
import TransportationAnalytics from './pages/TransportationAnalytics';
import WasteAnalytics from './pages/WasteAnalytics';
import RenewableEnergy from './pages/RenewableEnergy';
import CarbonEmissionAnalytics from './pages/CarbonEmissionAnalytics';
import PredictionInsights from './pages/PredictionInsights';
import Recommendations from './pages/Recommendations';
import Reports from './pages/Reports';
import DataImport from './pages/DataImport';
import UserManagement from './pages/UserManagement';
import SettingsPage from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-emerald-400 font-mono tracking-widest uppercase">
            Loading IPRC CarbonTrack...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="dataset-explorer" element={<DatasetExplorer />} />
            <Route path="activity-monitoring" element={<ActivityMonitoring />} />
            <Route path="energy-analytics" element={<EnergyAnalytics />} />
            <Route path="fuel-analytics" element={<FuelAnalytics />} />
            <Route path="transportation-analytics" element={<TransportationAnalytics />} />
            <Route path="waste-analytics" element={<WasteAnalytics />} />
            <Route path="renewable-energy" element={<RenewableEnergy />} />
            <Route path="carbon-analytics" element={<CarbonEmissionAnalytics />} />
            <Route path="prediction" element={<PredictionInsights />} />
            <Route path="recommendations" element={<Recommendations />} />
            <Route path="reports" element={<Reports />} />
            <Route path="import" element={<DataImport />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

