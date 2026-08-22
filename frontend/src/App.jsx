import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import LandingPage from '@/pages/LandingPage';
import SignInPage from '@/pages/SignInPage';
import SignUpPage from '@/pages/SignUpPage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';
import EmployeesPage from '@/pages/EmployeesPage';
import ProfilePage from '@/pages/ProfilePage';
import AttendancePage from '@/pages/AttendancePage';
import TimeOffPage from '@/pages/TimeOffPage';
import NotFoundPage from '@/pages/NotFoundPage';

function AuthRedirect({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/employees" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<AuthRedirect><SignInPage /></AuthRedirect>} />
            <Route path="/signup" element={<AuthRedirect><SignUpPage /></AuthRedirect>} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/employees/:id" element={<ProfilePage />} />
              <Route path="/me" element={<ProfilePage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/time-off" element={<TimeOffPage />} />
            </Route>
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
