import { useContext, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Moon, Sun, UserRound, Zap } from 'lucide-react';
import { RecuperarContrasena, Registro } from './AuthForms';
import { ThemeContext } from '../../../shared/context/ThemeContext.jsx';
import { apiRequest } from '../../../shared/api.js';
import '../styles/auth.css';

export function Login({ onLogin }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [vista, setVista] = useState('login');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);

    try {
      const sesion = await apiRequest('/auth/login', {
        method: 'POST',
        body: { usuario, password, plataforma: 'web' },
        authenticated: false,
      });
      onLogin(sesion);
    } catch (error) {
      setError(error.message || 'No fue posible iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  };

  if (vista === 'registro') return <Registro onBack={() => setVista('login')} />;
  if (vista === 'recuperar') return <RecuperarContrasena onBack={() => setVista('login')} />;

  return (
    <main className="auth-page">
      <div className="auth-backdrop" aria-hidden="true" />
      <button className="auth-theme-toggle" type="button" onClick={toggleTheme} aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}>
        {theme === 'dark' ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
      <section className="auth-card" aria-labelledby="login-title">
        <header className="auth-brand">
          <div className="auth-brand-mark" aria-hidden="true"><Zap size={18} strokeWidth={2.2} /></div>
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
              <UserRound className="auth-input-icon" size={15} aria-hidden="true" />
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
              <LockKeyhole className="auth-input-icon" size={15} aria-hidden="true" />
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
                {mostrarPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
          </label>

          <button className="auth-submit" type="submit" disabled={enviando}>
            {enviando ? 'Conectando...' : 'Iniciar sesión'} <span aria-hidden="true">&#8594;</span>
          </button>

          <div className="auth-links">
            <button type="button" onClick={() => { setError(''); setVista('recuperar'); }}>
              ¿Olvidaste tu contraseña?
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