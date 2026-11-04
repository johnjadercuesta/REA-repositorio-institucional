import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Reportes() {
  const [vista, setVista] = useState('cobertura');
  const [filtros, setFiltros] = useState({ grado: '', asignatura: '' });
  const [opciones, setOpciones] = useState({ grados: [], asignaturas: [] });
  const [cobertura, setCobertura] = useState({ resumen: null, rows: [] });
  const [uso, setUso] = useState({ data: [], total: 0 });
  const [asistencia, setAsistencia] = useState({ rows: [], resumen: null });
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api('/curriculo/filtros').then(setOpciones).catch(() => setOpciones({ grados: [], asignaturas: [] }));
    api('/cursos').then(setCursos).catch(() => setCursos([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (filtros.grado) qs.set('grado', filtros.grado);
    if (filtros.asignatura) qs.set('asignatura', filtros.asignatura);
    setCargando(true);
    if (vista === 'cobertura') {
      api(`/reportes/cobertura?${qs}`).then((d) => {
        setCobertura(d);
        setCargando(false);
      });
    } else if (vista === 'uso') {
      api(`/reportes/uso`).then((d) => {
        setUso(d);
        setCargando(false);
      });
    } else {
      const q = cursoId ? `?cursoId=${cursoId}` : '';
      api(`/reportes/asistencia${q}`).then((d) => {
        setAsistencia(d);
        setCargando(false);
      });
    }
  }, [vista, filtros, cursoId]);

  const resumen = cobertura.resumen;
  const pct = Number(resumen?.pct_cobertura || 0);
  const cubiertos = Number(resumen?.contenidos_cubiertos || 0);
  const total = Number(resumen?.total_contenidos || 0);

  const aResumen = asistencia.resumen;
  const promedio =
    aResumen && aResumen.estudiantes > 0
      ? Math.round(
          (100 *
            aResumen.presentes) /
            (aResumen.total_sesiones * aResumen.estudiantes)
        )
      : 0;

  return (
    <div>
      <div className="page-head">
        <h1>Seguimiento y reportes</h1>
        <div className="tabs">
          <button className={vista === 'cobertura' ? 'active' : ''} onClick={() => setVista('cobertura')}>
            Cobertura
          </button>
          <button className={vista === 'uso' ? 'active' : ''} onClick={() => setVista('uso')}>
            Uso
          </button>
          <button className={vista === 'asistencia' ? 'active' : ''} onClick={() => setVista('asistencia')}>
            Asistencia
          </button>
        </div>
      </div>

      {vista === 'cobertura' && (
        <>
          <div className="filtros">
            <select value={filtros.grado} onChange={(e) => setFiltros({ ...filtros, grado: e.target.value })}>
              <option value="">Todos los grados</option>
              {opciones.grados.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <select value={filtros.asignatura} onChange={(e) => setFiltros({ ...filtros, asignatura: e.target.value })}>
              <option value="">Todas las asignaturas</option>
              {opciones.asignaturas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {resumen && (
            <div className="tarjeta-resumen">
              <div className="resumen-num">
                <strong>{pct}%</strong>
                <span>cobertura del currículo</span>
              </div>
              <div className="barra">
                <div className="barra-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <p className="muted">
                {cubiertos} de {total} contenidos con al menos un recurso.
              </p>
            </div>
          )}

          {cargando ? (
            <div className="alerta info">Calculando…</div>
          ) : (
            <>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Grado</th>
                    <th>Asignatura</th>
                    <th>Unidad</th>
                    <th>Contenido</th>
                    <th>Recursos</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cobertura.rows.map((r) => (
                    <tr key={`${r.grado}-${r.asignatura}-${r.unidad}-${r.contenido}`}>
                      <td>{r.grado}</td>
                      <td>{r.asignatura}</td>
                      <td>{r.unidad || '—'}</td>
                      <td>{r.contenido}</td>
                      <td>{r.cantidad_recursos}</td>
                      <td>
                        <span className={`pill ${r.cubierto ? 'ok' : 'falta'}`}>
                          {r.cubierto ? 'Cubierto' : 'Sin recurso'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <a className="btn btn-ghost" href={`/api/reportes/cobertura?csv&${new URLSearchParams(filtros)}`}>
                Exportar CSV
              </a>
            </>
          )}
        </>
      )}

      {vista === 'uso' && (
        <>
          {cargando ? (
            <div className="alerta info">Cargando…</div>
          ) : (
            <>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Recurso</th>
                    <th>Subido por</th>
                    <th>Tipo</th>
                    <th>Descargas</th>
                    <th>Valoración</th>
                  </tr>
                </thead>
                <tbody>
                  {uso.data.map((r) => (
                    <tr key={r.id}>
                      <td>{r.titulo}</td>
                      <td>{r.usuario_nombre}</td>
                      <td>{r.tipo}</td>
                      <td>{r.contador_descargas}</td>
                      <td>
                        {(Number(r.puntaje_promed) || 0).toFixed(1)} ({r.total_valoraciones ?? 0})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <a className="btn btn-ghost" href="/api/reportes/uso?csv">
                Exportar CSV
              </a>
            </>
          )}
        </>
      )}

      {vista === 'asistencia' && (
        <>
          <div className="filtros">
            <select value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
              <option value="">Todos los cursos</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {aResumen && (
            <div className="tarjeta-resumen">
              <div className="resumen-num">
                <strong>{promedio}%</strong>
                <span>asistencia promedio</span>
              </div>
              <div className="barra">
                <div className="barra-fill" style={{ width: `${Math.min(promedio, 100)}%` }} />
              </div>
              <p className="muted">
                {aResumen.estudiantes} estudiantes · {aResumen.total_sesiones} sesiones · {aResumen.presentes}{' '}
                presencias registradas en {aResumen.cursos} curso(s).
              </p>
            </div>
          )}

          {cargando ? (
            <div className="alerta info">Calculando…</div>
          ) : (
            <>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Curso</th>
                    <th>Estudiante</th>
                    <th>Sesiones</th>
                    <th>Presente</th>
                    <th>Ausente</th>
                    <th>Justificado</th>
                    <th>% Asist.</th>
                  </tr>
                </thead>
                <tbody>
                  {asistencia.rows.map((r) => (
                    <tr key={`${r.curso_id}-${r.estudiante_id}`}>
                      <td>{r.curso_nombre}</td>
                      <td>
                        {r.estudiante} <span className="muted">({r.email})</span>
                      </td>
                      <td>{r.total_sesiones}</td>
                      <td>{r.presentes}</td>
                      <td>{r.ausentes}</td>
                      <td>{r.justificados}</td>
                      <td>
                        <span className={`pill ${r.pct_asistencia >= 75 ? 'ok' : 'falta'}`}>{r.pct_asistencia}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <a className="btn btn-ghost" href={`/api/reportes/asistencia?csv${cursoId ? `&cursoId=${cursoId}` : ''}`}>
                Exportar CSV
              </a>
            </>
          )}
        </>
      )}
    </div>
  );
}