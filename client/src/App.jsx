import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DataSources from './pages/DataSources';
import RealtimeMonitoring from './pages/RealtimeMonitoring';
import OutbreakPrediction from './pages/OutbreakPrediction';
import AlertsPage from './pages/AlertsPage';
import DecisionSupport from './pages/DecisionSupport';
import SystemArchitecture from './pages/SystemArchitecture';
import SettingsPrivacy from './pages/SettingsPrivacy';

const ProtectedLayout = ({ children }) => (
  <ProtectedRoute>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/data-sources" element={<ProtectedLayout><DataSources /></ProtectedLayout>} />
      <Route path="/real-time-monitoring" element={<ProtectedLayout><RealtimeMonitoring /></ProtectedLayout>} />
      <Route path="/outbreak-prediction" element={<ProtectedLayout><OutbreakPrediction /></ProtectedLayout>} />
      <Route path="/alerts" element={<ProtectedLayout><AlertsPage /></ProtectedLayout>} />
      <Route path="/decision-support" element={<ProtectedLayout><DecisionSupport /></ProtectedLayout>} />
      <Route path="/system-architecture" element={<ProtectedLayout><SystemArchitecture /></ProtectedLayout>} />
      <Route path="/settings-privacy" element={<ProtectedLayout><SettingsPrivacy /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
