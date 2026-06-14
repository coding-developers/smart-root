import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

export default function Layout() {
  const { usuario, logout } = useAuth()
  return (
    <div className="app">
      <header className="topo">
        <Link to="/" className="logo">🌱 Smart Root</Link>
        <div className="topo-dir">
          <span className="ola">Olá, {usuario?.nome?.split(' ')[0]}</span>
          <button className="link-btn" onClick={logout}>Sair</button>
        </div>
      </header>

      <main className="conteudo">
        <Outlet />
      </main>

      <nav className="rodape-nav">
        <NavLink to="/" end>Jardins</NavLink>
        <NavLink to="/chamados">Chamados</NavLink>
      </nav>
    </div>
  )
}
