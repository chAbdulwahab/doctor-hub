import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages - Anonymous/Common
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Pages - Patient
import SearchDoctors from './pages/SearchDoctors';
import DoctorProfile from './pages/DoctorProfile';
import MyAppointments from './pages/MyAppointments';
import MedicalHistory from './pages/MedicalHistory';

// Pages - Doctor
import DoctorDashboard from './pages/DoctorDashboard';
import ManageClinics from './pages/ManageClinics';
import ManageAssistants from './pages/ManageAssistants';

// Pages - Assistant
import AssistantDashboard from './pages/AssistantDashboard';

// Pages - Admin
import AdminDashboard from './pages/AdminDashboard';

// Private Route Guard Component
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-center animate-fade" style={{ minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'pulse-soft 1s infinite linear'
        }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard if role is invalid for this route
    if (user.role === 'doctor') return <Navigate to="/doctor-dashboard" replace />;
    if (user.role === 'assistant') return <Navigate to="/assistant-dashboard" replace />;
    if (user.role === 'admin' || user.role === 'super_admin') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <div className={user ? "app-layout-authenticated" : "app-layout-anonymous"}>
        <Navbar />
        <div className="main-content-wrapper">
          <main className="container" style={{ paddingBottom: '40px' }}>
            <Routes>
              {/* Common Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Patient Protected Routes */}
              <Route path="/search" element={
                <PrivateRoute allowedRoles={['patient']}>
                  <SearchDoctors />
                </PrivateRoute>
              } />
              <Route path="/doctors/:id" element={
                <PrivateRoute allowedRoles={['patient']}>
                  <DoctorProfile />
                </PrivateRoute>
              } />
              <Route path="/appointments" element={
                <PrivateRoute allowedRoles={['patient']}>
                  <MyAppointments />
                </PrivateRoute>
              } />
              <Route path="/history" element={
                <PrivateRoute allowedRoles={['patient']}>
                  <MedicalHistory />
                </PrivateRoute>
              } />

              {/* Doctor Protected Routes */}
              <Route path="/doctor-dashboard" element={
                <PrivateRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </PrivateRoute>
              } />
              <Route path="/manage-clinics" element={
                <PrivateRoute allowedRoles={['doctor']}>
                  <ManageClinics />
                </PrivateRoute>
              } />
              <Route path="/manage-assistants" element={
                <PrivateRoute allowedRoles={['doctor']}>
                  <ManageAssistants />
                </PrivateRoute>
              } />

              {/* Assistant Protected Routes */}
              <Route path="/assistant-dashboard" element={
                <PrivateRoute allowedRoles={['assistant']}>
                  <AssistantDashboard />
                </PrivateRoute>
              } />

              {/* Admin & Super Admin Protected Routes */}
              <Route path="/admin-dashboard" element={
                <PrivateRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              } />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          {!user && <Footer />}
        </div>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
