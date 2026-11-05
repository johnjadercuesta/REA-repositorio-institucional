import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cerrarSesion, getUsuario } from '../api.js';
import SearchBar from './SearchBar.jsx';

const ROLES = {
  coordinacion: 'Coordinación',
  docente: 'Docente',
  estudiante: 'Estudiante',
};

export default function Layout() {
  const usuario = getUsuario();
  const navigate = useNavigate();
  const location = useLocation();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    setMenu(false);
  }, [location.pathname]);

  function salir() {
    cerrarSesion();
    navigate('/login');
  }

  const linkClase = ({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`;

  const esStaff = usuario?.rol === 'coordinacion' || usuario?.rol === 'docente';
  const esCoord = usuario?.rol === 'coordinacion';

  const secciones = [
    {
      titulo: 'Explorar',
      enlaces: [
        { to: '/', end: true, label: 'Inicio', icono: '🏠' },
        { to: '/areas', label: 'Áreas', icono: '🗂️' },
        { to: '/rutas', label: 'Rutas de aprendizaje', icono: '🧭' },
        { to: '/recursos', label: 'Recursos', icono: '📚' },
        { to: '/simuladores', label: 'Simuladores', icono: '🧪' },
      ],
    },
    {
      titulo: 'Clases',
      enlaces: [
        { to: '/aulas', label: 'Aulas', icono: '🏫' },
        { to: '/salas', label: 'Salas virtuales', icono: '💬' },
      ],
    },
  ];

  if (esStaff) {
    secciones.push({
      titulo: 'Acompañamiento',
      enlaces: [{ to: '/seguimiento', label: 'Seguimiento', icono: '📈' }],
    });
  }

  if (esCoord) {
    secciones.push({
      titulo: 'Administración',
      enlaces: [
        { to: '/reportes', label: 'Reportes', icono: '📊' },
        { to: '/cursos', label: 'Cursos', icono: '🎓' },
        { to: '/usuarios', label: 'Usuarios', icono: '👥' },
      ],
    });
  }

  const inicial = (usuario?.nombre || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="app app-sidebar">
      {menu && <div className="sidebar-overlay" onClick={() => setMenu(false)} aria-hidden="true" />}

      <aside className={`sidebar${menu ? ' sidebar-abierto' : ''}`}>
        <div className="sidebar-brand">
          <span className="logo">REA</span>
          <div className="sidebar-brand-txt">
            <strong>Repositorio</strong>
            <small>Recursos Educativos Abiertos</small>
          </div>
          <button
            className="sidebar-cerrar"
            onClick={() => setMenu(false)}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Menú principal">
          {secciones.map((seccion) => (
            <div key={seccion.titulo} className="sidebar-grupo">
              <p className="sidebar-grupo-titulo">{seccion.titulo}</p>
              {seccion.enlaces.map((enlace) => (
                <NavLink
                  key={enlace.to}
                  to={enlace.to}
                  end={enlace.end}
                  className={linkClase}
                  onClick={() => setMenu(false)}
                >
                  <span className="sidebar-icono" aria-hidden="true">
                    {enlace.icono}
                  </span>
                  <span>{enlace.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/perfil" className="sidebar-perfil">
            <span className="sidebar-avatar">{inicial}</span>
            <span className="sidebar-perfil-txt">
              <strong>{usuario?.nombre}</strong>
              <small>{ROLES[usuario?.rol] || 'Usuario'}</small>
            </span>
          </NavLink>
          <button className="btn sidebar-salir" onClick={salir}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button
            className="btn btn-ghost hamburguesa"
            onClick={() => setMenu(true)}
            aria-label="Abrir menú"
            aria-expanded={menu}
          >
            ☰
          </button>
          <SearchBar />
        </header>
        <main className="contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
