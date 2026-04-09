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

const ProtectedLayout = ({ children }) => (
  <ProtectedRoute>
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

      <Route path="/doctor/dashboard" element={<ProtectedLayout><DoctorDashboard /></ProtectedLayout>} />
      <Route path="/doctor/reports" element={<ProtectedLayout><DoctorReports /></ProtectedLayout>} />
      <Route path="/doctor/alerts" element={<ProtectedLayout><DoctorAlerts /></ProtectedLayout>} />
      <Route path="/doctor/map" element={<ProtectedLayout><DoctorMap /></ProtectedLayout>} />
      <Route path="/doctor/ai-engine" element={<ProtectedLayout><AIEngine /></ProtectedLayout>} />

      <Route path="/patient/dashboard" element={<ProtectedLayout><PatientDashboard /></ProtectedLayout>} />
      <Route path="/patient/submit" element={<ProtectedLayout><SymptomSubmit /></ProtectedLayout>} />
      <Route path="/patient/vitals" element={<ProtectedLayout><VitalsPage /></ProtectedLayout>} />
      <Route path="/patient/uploads" element={<ProtectedLayout><MedicalUploads /></ProtectedLayout>} />
      <Route path="/patient/nearby" element={<ProtectedLayout><NearbyRisk /></ProtectedLayout>} />

      <Route path="/chat" element={<ProtectedLayout><ChatbotPage /></ProtectedLayout>} />
      <Route path="/messages" element={<ProtectedLayout><DoctorPatientChat /></ProtectedLayout>} />
      <Route path="/healthbot" element={<ProtectedLayout><HealthBotIntegration /></ProtectedLayout>} />
      <Route path="/" element={<RoleHome />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
