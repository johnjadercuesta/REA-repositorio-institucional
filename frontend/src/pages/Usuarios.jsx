import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    api('/usuarios').then(setUsuarios).catch(() => setUsuarios([]));
  }, []);

  async function cambiarRol(u, rol) {
    await api(`/usuarios/${u.id}/rol`, { method: 'PATCH', body: { rol } });
    setMensaje(`Rol de ${u.nombre} actualizado.`);
    setUsuarios(await api('/usuarios'));
  }

  return (
    <div>
      <div className="page-head">
        <h1>Usuarios</h1>
      </div>
      {mensaje && <div className="alerta ok">{mensaje}</div>}
      <table className="tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td>{u.rol === 'coordinacion' ? 'Coordinación' : 'Docente'}</td>
              <td>
                {u.rol === 'docente' && (
                  <button className="btn btn-ghost" onClick={() => cambiarRol(u, 'coordinacion')}>
                    Hacer coordinación
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}