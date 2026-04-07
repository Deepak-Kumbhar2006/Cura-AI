import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import FloatingChatWidget from './components/FloatingChatWidget';
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'));
const DoctorReports = lazy(() => import('./pages/DoctorReports'));
const DoctorAlerts = lazy(() => import('./pages/DoctorAlerts'));
const DoctorMap = lazy(() => import('./pages/DoctorMap'));
const PatientDashboard = lazy(() => import('./pages/PatientDashboard'));
const SymptomSubmit = lazy(() => import('./pages/SymptomSubmit'));
const NearbyRisk = lazy(() => import('./pages/NearbyRisk'));
const ChatbotPage = lazy(() => import('./pages/ChatbotPage'));
const VitalsPage = lazy(() => import('./pages/VitalsPage'));
const MedicalUploads = lazy(() => import('./pages/MedicalUploads'));
const AIEngine = lazy(() => import('./pages/AIEngine'));
const DoctorPatientChat = lazy(() => import('./pages/DoctorPatientChat'));
const WeatherDashboard = lazy(() => import('./pages/WeatherDashboard'));
const TrendingDiseases = lazy(() => import('./pages/TrendingDiseases'));
const AppointmentScheduler = lazy(() => import('./pages/AppointmentScheduler'));
const MedicationTracker = lazy(() => import('./pages/MedicationTracker'));

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
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-slate-600">Loading...</div>}>
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

        <Route path="/chat" element={<ProtectedLayout><ChatbotPage /></ProtectedLayout>} />
        <Route path="/" element={<RoleHome />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}
