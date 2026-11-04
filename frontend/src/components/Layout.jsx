import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cerrarSesion, getUsuario } from '../api.js';
import SearchBar from './SearchBar.jsx';

export default function Layout() {
  const usuario = getUsuario();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);

  function salir() {
    cerrarSesion();
    navigate('/login');
  }

  const linkClase = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;
  const linkClaseMovil = ({ isActive }) => `nav-link nav-link-movil${isActive ? ' active' : ''}`;

  const enlaces = (
    <>
      <NavLink to="/" end className={linkClase}>
        Inicio
      </NavLink>
      <NavLink to="/areas" className={linkClase}>
        Áreas
      </NavLink>
      <NavLink to="/rutas" className={linkClase}>
        Rutas
      </NavLink>
      <NavLink to="/recursos" className={linkClase}>
        Recursos
      </NavLink>
      <NavLink to="/simuladores" className={linkClase}>
        Simuladores
      </NavLink>
      <NavLink to="/aulas" className={linkClase}>
        Aulas
      </NavLink>
      <NavLink to="/salas" className={linkClase}>
        Salas
      </NavLink>
      {(usuario?.rol === 'coordinacion' || usuario?.rol === 'docente') && (
        <NavLink to="/seguimiento" className={linkClase}>
          Seguimiento
        </NavLink>
      )}
      {usuario?.rol === 'coordinacion' && (
        <>
          <NavLink to="/reportes" className={linkClase}>
            Reportes
          </NavLink>
          <NavLink to="/cursos" className={linkClase}>
            Cursos
          </NavLink>
          <NavLink to="/usuarios" className={linkClase}>
            Usuarios
          </NavLink>
        </>
      )}
    </>
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <button
            className="btn btn-ghost hamburguesa"
            onClick={() => setMenu((m) => !m)}
            aria-label="Abrir menú"
            aria-expanded={menu}
          >
            ☰
          </button>
          <span className="logo">REA</span>
          <div>
            <strong>Repositorio Institucional</strong>
            <small>Recursos Educativos Abiertos</small>
          </div>
        </div>
        <SearchBar />
        <nav className="nav-desk">{enlaces}</nav>
        <div className="usuario">
          <NavLink to="/perfil" className="link-perfil">
            <span>
              {usuario?.nombre}
              <small>
                {usuario?.rol === 'coordinacion'
                  ? 'Coordinación'
                  : usuario?.rol === 'estudiante'
                    ? 'Estudiante'
                    : 'Docente'}
              </small>
            </span>
          </NavLink>
          <button className="btn btn-ghost" onClick={salir}>
            Salir
          </button>
        </div>
      </header>
      {menu && (
        <nav className="nav-movil">
          {enlaces}
          <button className="btn btn-ghost nav-cerrar" onClick={() => setMenu(false)}>
            Cerrar menú
          </button>
        </nav>
      )}
      <main className="contenido">
        <Outlet />
      </main>
    </div>
  );
}