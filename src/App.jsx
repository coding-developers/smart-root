import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Gardens from './pages/Gardens.jsx'
import GardenDetail from './pages/GardenDetail.jsx'
import Tickets from './pages/Tickets.jsx'

function Protegida({ children }) {
  const { usuario, carregando } = useAuth()
  if (carregando) return <div className="centro">Carregando…</div>
  if (!usuario) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { usuario } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/cadastro" element={usuario ? <Navigate to="/" replace /> : <Register />} />

      <Route element={<Protegida><Layout /></Protegida>}>
        <Route path="/" element={<Gardens />} />
        <Route path="/jardins/:id" element={<GardenDetail />} />
        <Route path="/chamados" element={<Tickets />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
