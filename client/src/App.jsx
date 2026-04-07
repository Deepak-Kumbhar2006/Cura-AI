import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DataInput from './pages/DataInput';
import MapView from './pages/MapView';
import Reports from './pages/Reports';
import Assistant from './pages/Assistant';

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
      <Route path="/data-input" element={<ProtectedLayout><DataInput /></ProtectedLayout>} />
      <Route path="/map" element={<ProtectedLayout><MapView /></ProtectedLayout>} />
      <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
      <Route path="/assistant" element={<ProtectedLayout><Assistant /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
