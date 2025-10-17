import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Login from './components/auth/Login';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Dashboard Pages
import CashierDashboard from './pages/cashier/CashierDashboard';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

// Manager Pages
import InventoryManagement from './pages/manager/InventoryManagement';
import SalesReports from './pages/manager/SalesReports';
import Analytics from './pages/manager/Analytics';

// Admin Pages
import UserManagement from './pages/admin/UserManagement';
import SystemSettings from './pages/admin/SystemSettings';
import ActivityLogs from './pages/admin/ActivityLogs';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }>
            {/* Role-based route redirection */}
            <Route index element={<Navigate to={`/dashboard/${user?.role}`} replace />} />
            
            {/* Cashier Routes */}
            <Route path="cashier" element={
              <ProtectedRoute requiredRole="cashier">
                <CashierDashboard />
              </ProtectedRoute>
            } />
            
            {/* Manager Routes */}
            <Route path="manager" element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            } />
            <Route path="manager/inventory" element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <InventoryManagement />
              </ProtectedRoute>
            } />
            <Route path="manager/sales" element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <SalesReports />
              </ProtectedRoute>
            } />
            <Route path="manager/analytics" element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <Analytics />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="admin/users" element={
              <ProtectedRoute requiredRole="admin">
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="admin/settings" element={
              <ProtectedRoute requiredRole="admin">
                <SystemSettings />
              </ProtectedRoute>
            } />
            <Route path="admin/activity" element={
              <ProtectedRoute requiredRole="admin">
                <ActivityLogs />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
