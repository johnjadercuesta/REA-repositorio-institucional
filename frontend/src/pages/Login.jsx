import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, guardarSesion } from '../api.js';

export default function Login() {
  const [modo, setModo] = useState('login');
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const ruta = modo === 'login' ? '/auth/login' : '/auth/registrar';
      const data = await api(ruta, { method: 'POST', body: form });
      guardarSesion(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={enviar}>
        <div className="login-logo">REA</div>
        <h1>Recursos Educativos Abiertos</h1>
        <p>Prepará tus clases y seguí el currículo del área.</p>

        <div className="tabs">
          <button type="button" className={modo === 'login' ? 'active' : ''} onClick={() => setModo('login')}>
            Ingresar
          </button>
          <button type="button" className={modo === 'registro' ? 'active' : ''} onClick={() => setModo('registro')}>
            Registrarme
          </button>
        </div>

        {modo === 'registro' && (
          <label>
            Nombre y apellido
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </label>
        )}
        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </label>

        {error && <div className="alerta error">{error}</div>}

        <button className="btn btn-primary btn-block" disabled={cargando}>
          {cargando ? 'Procesando…' : modo === 'login' ? 'Ingresar' : 'Crear cuenta'}
        </button>
        <small className="demo">Demo: coord@colegio.edu / Admin123! · docente@colegio.edu / Docente123!</small>
      </form>
    </div>
  );
}