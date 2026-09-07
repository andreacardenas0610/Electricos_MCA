import { useContext, useState } from 'react';
import { RecuperarContrasena, Registro } from './AuthForms';
import { ThemeContext } from '../context/ThemeContext';
import '../styles/auth.css';

export function Login({ onLogin }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [vista, setVista] = useState('login');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const usuariosGuardados = localStorage.getItem('mca_usuarios');
    const usuarios = usuariosGuardados ? JSON.parse(usuariosGuardados) : [{ usuario: 'admin', correo: 'admin@electricosmca.com', password: '1033490682' }];
    const usuarioValido = usuarios.find((cuenta) => cuenta.usuario === usuario && cuenta.password === password);

    if (usuarioValido) {
      setError('');
      onLogin(); // Autoriza el acceso
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  if (vista === 'registro') return <Registro onBack={() => setVista('login')} />;
  if (vista === 'recuperar') return <RecuperarContrasena onBack={() => setVista('login')} />;

  return (
    <main className="auth-page">
      <div className="auth-backdrop" aria-hidden="true" />
      <button className="auth-theme-toggle" type="button" onClick={toggleTheme} aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}>
        <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
      <section className="auth-card" aria-labelledby="login-title">
        <header className="auth-brand">
          <div className="auth-brand-mark" aria-hidden="true">⚡</div>
          <h1 id="login-title">ELÉCTRICOS MCA</h1>
          <span>GESTIÓN INDUSTRIAL</span>
        </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <label className="auth-field">
            <span>USUARIO</span>
            <div className="auth-input-wrap">
              <span className="auth-input-icon" aria-hidden="true">@</span>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                required
              />
            </div>
          </label>

          <label className="auth-field">
            <span>CONTRASEÑA</span>
            <div className="auth-input-wrap">
              <span className="auth-input-icon" aria-hidden="true">&#9679;</span>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                required
              />
              <button
                className="auth-password-toggle"
                type="button"
                onClick={() => setMostrarPassword((visible) => !visible)}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </label>

          <button className="auth-submit" type="submit">
            Iniciar sesión <span aria-hidden="true">&#8594;</span>
          </button>

          <div className="auth-links">
            <button type="button" onClick={() => { setError(''); setVista('recuperar'); }}>
              ¿Olvidaste tu contraseña?
            </button>
            <button type="button" onClick={() => { setError(''); setVista('registro'); }}>
              Crear cuenta
            </button>
          </div>
        </form>

        <footer className="auth-footer">
          © 2024 Eléctricos MCA S.A.S. - Sistema de control interno
        </footer>
      </section>
    </main>
  );
}