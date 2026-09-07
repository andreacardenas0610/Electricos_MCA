import { useState } from 'react';
import { RecuperarContrasena, Registro } from './AuthForms';

export function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [vista, setVista] = useState('login');

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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#0f172a',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        backgroundColor: '#1b2a47',
        padding: '32px',
        borderRadius: '12px',
        border: '1px solid #243556',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ color: '#facc15', fontSize: '26px', fontWeight: 'bold', margin: '0 0 6px 0' }}>
            Eléctricos MCA
          </h1>
          <span style={{ fontSize: '12px', color: '#8899ac', letterSpacing: '1.5px', fontWeight: '600' }}>
            GESTIÓN INDUSTRIAL
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '13px',
              textAlign: 'center',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', color: '#a0aec0', fontSize: '13px', marginBottom: '6px' }}>
              Usuario
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ingresa tu usuario"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #243556',
                backgroundColor: '#0f172a',
                color: '#fff',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#a0aec0', fontSize: '13px', marginBottom: '6px' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #243556',
                backgroundColor: '#0f172a',
                color: '#fff',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#facc15',
              color: '#0f172a',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Iniciar Sesión
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '4px' }}>
            <button type="button" onClick={() => { setError(''); setVista('recuperar'); }} style={{ border: 'none', background: 'none', color: '#facc15', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
              ¿Olvidaste tu contraseña?
            </button>
            <button type="button" onClick={() => { setError(''); setVista('registro'); }} style={{ border: 'none', background: 'none', color: '#facc15', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
              Crear cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}