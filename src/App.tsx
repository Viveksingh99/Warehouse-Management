import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuditorPage } from './pages/AuditorPage';
import { FloorPage } from './pages/FloorPage';
import { LoginPage } from './pages/LoginPage';
import { ShuttlePage } from './pages/ShuttlePage';
import { UsersPage } from './pages/UsersPage';
import type { UserRole } from './types/warehouse';

function RequireAuth({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: UserRole[];
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">
        Verifying session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Layout>
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900"
        >
          Access denied: your role ({user.role}) does not have permission to view this page.
        </div>
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <FloorPage />
              </RequireAuth>
            }
          />
          <Route
            path="/shuttle"
            element={
              <RequireAuth>
                <ShuttlePage />
              </RequireAuth>
            }
          />
          <Route
            path="/auditor"
            element={
              <RequireAuth allowedRoles={['auditor', 'admin']}>
                <AuditorPage />
              </RequireAuth>
            }
          />
          <Route
            path="/users"
            element={
              <RequireAuth allowedRoles={['admin']}>
                <UsersPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
