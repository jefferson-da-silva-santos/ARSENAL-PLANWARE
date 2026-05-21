import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import AppLayout from './router/AppLayout'     
import Login from '@/pages/Login/Login'
import Dashboard from '@/pages/Dashboard/Dashboard'
import Tenants from '@/pages/Tenants/Tenants'
import Users from '@/pages/Users/Users'
import Permissions from '@/pages/Permissions/Permissions'
import Errors from './pages/Erros/Erros'
import Feedbacks from '@/pages/Feedbacks/Feedbacks'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'SUPERADMIN') return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user?.role === 'SUPERADMIN') return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="users" element={<Users />} />
        <Route path="permissions" element={<Permissions />} />
        <Route path="errors" element={<Errors />} />
        <Route path="feedbacks" element={<Feedbacks />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}