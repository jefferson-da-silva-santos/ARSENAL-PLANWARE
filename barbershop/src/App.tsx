import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useAOS } from './hooks/useAOS'

// Layout
import AppLayout from './components/Layout/AppLayout'

// Páginas
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import Agenda from './pages/Agenda/Agenda'
import Barbeiros from './pages/Barbeiros/Barbeiros'
import BarbeiroDetalhe from './pages/Barbeiros/BarbeiroDetalhe'
import Servicos from './pages/Servicos/Servicos'
import Clientes from './pages/Clientes/Clientes'
import ClienteDetalhe from './pages/Clientes/ClienteDetalhe'
import Fila from './pages/Fila/Fila'
import Estoque from './pages/Estoque/Estoque'
import Assinaturas from './pages/Assinaturas/Assinaturas'
import Fidelidade from './pages/Fidelidade/Fidelidade'
import Financeiro from './pages/Financeiro/Financeiro'
import Configuracoes from './pages/Configuracoes/Configuracoes'

// ─────────────────────────────────────────────────────────────
//  Guard — redireciona para /login se não autenticado
// ─────────────────────────────────────────────────────────────

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { logged, loading } = useAuth()

  // Enquanto restaura sessão do localStorage, não redireciona
  if (loading) return null

  return logged ? <>{children}</> : <Navigate to="/login" replace />
}

// ─────────────────────────────────────────────────────────────
//  App
// ─────────────────────────────────────────────────────────────

export default function App() {
  // Inicializa AOS uma vez na raiz da aplicação
  useAOS({ duration: 400, once: true, offset: 40 })

  return (
    <Routes>
      {/* Rota pública */}
      <Route path="/login" element={<Login />} />

      {/* Rotas protegidas — todas dentro do AppLayout */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="barbeiros" element={<Barbeiros />} />
        <Route path="barbeiros/:id" element={<BarbeiroDetalhe />} />
        <Route path="servicos" element={<Servicos />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="clientes/:id" element={<ClienteDetalhe />} />
        <Route path="fila" element={<Fila />} />
        <Route path="estoque" element={<Estoque />} />
        <Route path="assinaturas" element={<Assinaturas />} />
        <Route path="fidelidade" element={<Fidelidade />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="configuracoes" element={<Configuracoes />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}