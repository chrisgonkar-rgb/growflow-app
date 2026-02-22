// Growflow - GreenFlow Customer Management App
// © TrueNorth Group of Companies Ltd.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

// Pages
import LandingPage from '@/pages/LandingPage';
import CustomerSignupPage from '@/pages/CustomerSignupPage';
import CustomerLoginPage from '@/pages/CustomerLoginPage';
import CustomerDashboardPage from '@/pages/CustomerDashboardPage';
import PaymentConfirmationPage from '@/pages/PaymentConfirmationPage';
import AdminLoginPage from '@/pages/AdminLoginPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import PendingQuotesPage from '@/pages/PendingQuotesPage';
import PaymentVerificationPage from '@/pages/PaymentVerificationPage';
import CustomerDirectoryPage from '@/pages/CustomerDirectoryPage';
import ImportPage from '@/pages/ImportPage';
import ReportsPage from '@/pages/ReportsPage';

// Protected route component for admin/staff
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isStaffAuthenticated, isStaff } = useAuth();
  
  if (!isStaffAuthenticated) {
    return <Navigate to="/admin" replace />;
  }
  
  if (!isStaff) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Protected route for admin only
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isStaffAuthenticated, isAdmin } = useAuth();
  
  if (!isStaffAuthenticated) {
    return <Navigate to="/admin" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  return <>{children}</>;
}

// Protected route for customers
function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { isCustomerAuthenticated } = useAuth();
  
  if (!isCustomerAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<CustomerSignupPage />} />
      <Route path="/login" element={<CustomerLoginPage />} />
      
      {/* Staff Login - Separate Entry Point */}
      <Route path="/admin" element={<AdminLoginPage />} />
      
      {/* Customer Routes (Protected) */}
      <Route 
        path="/customer/dashboard" 
        element={
          <CustomerRoute>
            <CustomerDashboardPage />
          </CustomerRoute>
        } 
      />
      <Route 
        path="/customer/payment" 
        element={
          <CustomerRoute>
            <PaymentConfirmationPage />
          </CustomerRoute>
        } 
      />
      
      {/* Admin Routes (Protected) */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/quotes" 
        element={
          <ProtectedRoute>
            <PendingQuotesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/payments" 
        element={
          <ProtectedRoute>
            <PaymentVerificationPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/customers" 
        element={
          <ProtectedRoute>
            <CustomerDirectoryPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/import" 
        element={
          <AdminRoute>
            <ImportPage />
          </AdminRoute>
        } 
      />
      <Route 
        path="/admin/reports" 
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-center" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
