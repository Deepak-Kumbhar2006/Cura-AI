import { Navigate, Route, Routes } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import FloatingChatWidget from './components/FloatingChatWidget';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorReports from './pages/DoctorReports';
import DoctorAlerts from './pages/DoctorAlerts';
import DoctorMap from './pages/DoctorMap';
import PatientDashboard from './pages/PatientDashboard';
import SymptomSubmit from './pages/SymptomSubmit';
import NearbyRisk from './pages/NearbyRisk';
import ChatbotPage from './pages/ChatbotPage';
import VitalsPage from './pages/VitalsPage';
import MedicalUploads from './pages/MedicalUploads';
import AIEngine from './pages/AIEngine';
import HealthBotIntegration from './pages/HealthBotIntegration';
import DoctorPatientChat from './pages/DoctorPatientChat';
import WeatherDashboard from './pages/WeatherDashboard';
import TrendingDiseases from './pages/TrendingDiseases';
import AppointmentScheduler from './pages/AppointmentScheduler';
import MedicationTracker from './pages/MedicationTracker';
import DataSources from './pages/DataSources';

const ProtectedLayout = ({ children, requiredRole = null }) => (
  <ProtectedRoute requiredRole={requiredRole}>
    <Layout>{children}</Layout>
    <FloatingChatWidget />
  </ProtectedRoute>
);

function RoleHome() {
  const { user } = useAuth();
  const home = useMemo(() => (user?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'), [user]);
  return <Navigate to={home} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/doctor/dashboard" element={<ProtectedLayout requiredRole="doctor"><DoctorDashboard /></ProtectedLayout>} />
      <Route path="/doctor/reports" element={<ProtectedLayout requiredRole="doctor"><DoctorReports /></ProtectedLayout>} />
      <Route path="/doctor/alerts" element={<ProtectedLayout requiredRole="doctor"><DoctorAlerts /></ProtectedLayout>} />
      <Route path="/doctor/map" element={<ProtectedLayout requiredRole="doctor"><DoctorMap /></ProtectedLayout>} />
      <Route path="/doctor/ai-engine" element={<ProtectedLayout requiredRole="doctor"><AIEngine /></ProtectedLayout>} />
      <Route path="/doctor/chat" element={<ProtectedLayout requiredRole="doctor"><DoctorPatientChat /></ProtectedLayout>} />
      <Route path="/doctor/weather" element={<ProtectedLayout requiredRole="doctor"><WeatherDashboard /></ProtectedLayout>} />
      <Route path="/doctor/diseases" element={<ProtectedLayout requiredRole="doctor"><TrendingDiseases /></ProtectedLayout>} />
      <Route path="/doctor/data-sources" element={<ProtectedLayout requiredRole="doctor"><DataSources /></ProtectedLayout>} />

      <Route path="/patient/dashboard" element={<ProtectedLayout requiredRole="patient"><PatientDashboard /></ProtectedLayout>} />
      <Route path="/patient/submit" element={<ProtectedLayout requiredRole="patient"><SymptomSubmit /></ProtectedLayout>} />
      <Route path="/patient/vitals" element={<ProtectedLayout requiredRole="patient"><VitalsPage /></ProtectedLayout>} />
      <Route path="/patient/uploads" element={<ProtectedLayout requiredRole="patient"><MedicalUploads /></ProtectedLayout>} />
      <Route path="/patient/nearby" element={<ProtectedLayout requiredRole="patient"><NearbyRisk /></ProtectedLayout>} />
      <Route path="/patient/chat" element={<ProtectedLayout requiredRole="patient"><DoctorPatientChat /></ProtectedLayout>} />
      <Route path="/patient/appointments" element={<ProtectedLayout requiredRole="patient"><AppointmentScheduler /></ProtectedLayout>} />
      <Route path="/patient/medications" element={<ProtectedLayout requiredRole="patient"><MedicationTracker /></ProtectedLayout>} />
      <Route path="/patient/weather" element={<ProtectedLayout requiredRole="patient"><WeatherDashboard /></ProtectedLayout>} />
      <Route path="/patient/diseases" element={<ProtectedLayout requiredRole="patient"><TrendingDiseases /></ProtectedLayout>} />
      <Route path="/patient/data-sources" element={<ProtectedLayout requiredRole="patient"><DataSources /></ProtectedLayout>} />

      <Route path="/chat" element={<ProtectedLayout><ChatbotPage /></ProtectedLayout>} />
      <Route path="/healthbot" element={<ProtectedLayout><HealthBotIntegration /></ProtectedLayout>} />
      <Route path="/" element={<RoleHome />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
