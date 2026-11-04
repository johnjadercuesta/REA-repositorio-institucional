import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getToken } from './api.js';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Areas from './pages/Areas.jsx';
import Area from './pages/Area.jsx';
import Resultados from './pages/Resultados.jsx';
import Catalogo from './pages/Catalogo.jsx';
import RecursoForm from './pages/RecursoForm.jsx';
import Detalle from './pages/Detalle.jsx';
import Reportes from './pages/Reportes.jsx';
import Usuarios from './pages/Usuarios.jsx';
import Cursos from './pages/Cursos.jsx';
import Simuladores from './pages/Simuladores.jsx';
import Simulador from './pages/Simulador.jsx';
import Aulas from './pages/Aulas.jsx';
import Aula from './pages/Aula.jsx';
import Salas from './pages/Salas.jsx';
import Sala from './pages/Sala.jsx';
import Pizarra from './pages/Pizarra.jsx';
import Asistencia from './pages/Asistencia.jsx';
import Perfil from './pages/Perfil.jsx';
import Aprendizaje from './pages/Aprendizaje.jsx';
import Ruta from './pages/Ruta.jsx';
import Seguimiento from './pages/Seguimiento.jsx';
import SeguimientoEstudiante from './pages/SeguimientoEstudiante.jsx';
import Layout from './components/Layout.jsx';

const LibroLectura = lazy(() => import('./pages/LibroLectura.jsx'));
const LibroEditor = lazy(() => import('./pages/LibroEditor.jsx'));

function SuspenseShell({ children }) {
  return <Suspense fallback={<div className="alerta info">Cargando módulo…</div>}>{children}</Suspense>;
}

function RequireAuth({ children }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return children;
}

function RequireCoord({ children }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return children;
}

function RequireStaff({ children }) {
  const u = JSON.parse(localStorage.getItem('rea_usuario') || 'null');
  if (!getToken()) return <Navigate to="/login" replace />;
  if (u?.rol === 'estudiante') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="areas" element={<Areas />} />
        <Route path="area/:slug" element={<Area />} />
        <Route path="rutas" element={<Aprendizaje />} />
        <Route path="ruta/:slug" element={<Ruta />} />
        <Route
          path="seguimiento"
          element={
            <RequireStaff>
              <Seguimiento />
            </RequireStaff>
          }
        />
        <Route
          path="seguimiento/:usuarioId"
          element={
            <RequireStaff>
              <SeguimientoEstudiante />
            </RequireStaff>
          }
        />
        <Route path="recursos" element={<Catalogo />} />
        <Route path="resultados" element={<Resultados />} />
        <Route path="simuladores" element={<Simuladores />} />
        <Route path="simuladores/:id" element={<Simulador />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="aulas" element={<Aulas />} />
        <Route path="aulas/:id" element={<Aula />} />
        <Route path="salas" element={<Salas />} />
        <Route path="salas/:id" element={<Sala />} />
        <Route path="pizarra/:sesionId" element={<Pizarra />} />
        <Route path="asistencia/:sesionId" element={<Asistencia />} />
        <Route path="nuevo" element={<RecursoForm />} />
        <Route path="recursos/:id" element={<Detalle />} />
        <Route
          path="recursos/:id/leer"
          element={
            <SuspenseShell>
              <LibroLectura />
            </SuspenseShell>
          }
        />
        <Route
          path="recursos/:id/editar-libro"
          element={
            <SuspenseShell>
              <LibroEditor />
            </SuspenseShell>
          }
        />
        <Route path="recursos/:id/editar" element={<RecursoForm />} />
        <Route
          path="reportes"
          element={
            <RequireCoord>
              <Reportes />
            </RequireCoord>
          }
        />
        <Route
          path="cursos"
          element={
            <RequireCoord>
              <Cursos />
            </RequireCoord>
          }
        />
        <Route
          path="usuarios"
          element={
            <RequireCoord>
              <Usuarios />
            </RequireCoord>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}