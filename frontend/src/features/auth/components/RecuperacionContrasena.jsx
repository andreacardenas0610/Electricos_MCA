import { useState } from 'react';
import { ArrowRight, CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../../../shared/api.js';
import { MarcoAuth } from './AuthForms.jsx';
import '../styles/auth.css';

function extraerToken(valor) {
  const texto = String(valor || '').trim();
  if (!texto) return '';
  const coincidencia = texto.match(/[?&]recuperar=([^&\s]+)/);
  return coincidencia ? decodeURIComponent(coincidencia[1]) : texto;
}

export function RecuperacionContrasena({ onBack, tokenInicial = '' }) {
  const [paso, setPaso] = useState(tokenInicial ? 2 : 1);
  const [identificador, setIdentificador] = useState('');
  const [token, setToken] = useState(tokenInicial);
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const solicitar = async (evento) => {
    evento.preventDefault();
    if (!identificador.trim()) {
      setAviso({ tipo: 'error', texto: 'Escribe tu usuario o correo electrónico.' });
      return;
    }

    setEnviando(true);
    setAviso(null);
    try {
      const resultado = await apiRequest('/auth/recuperar', {
        method: 'POST',
        body: { identificador: identificador.trim() },
      });
      setAviso({ tipo: 'success', texto: resultado.mensaje });
      setPaso(2);
    } catch (error) {
      setAviso({ tipo: 'error', texto: error.message });
    } finally {
      setEnviando(false);
    }
  };

  const restablecer = async (evento) => {
    evento.preventDefault();
    const codigo = extraerToken(token);

    if (!codigo) {
      setAviso({ tipo: 'error', texto: 'Pega el enlace o el código que recibiste.' });
      return;
    }
    if (password.length < 8) {
      setAviso({ tipo: 'error', texto: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    if (password !== confirmar) {
      setAviso({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
      return;
    }

    setEnviando(true);
    setAviso(null);
    try {
      const resultado = await apiRequest('/auth/restablecer', {
        method: 'POST',
        body: { token: codigo, password },
      });
      setAviso({ tipo: 'success', texto: resultado.mensaje });
      setPaso(3);
    } catch (error) {
      setAviso({ tipo: 'error', texto: error.message });
    } finally {
      setEnviando(false);
    }
  };

  if (paso === 3) {
    return (
      <MarcoAuth titulo="Contraseña actualizada" onBack={onBack}>
        <div className="auth-recuperacion-exito" role="status">
          <CheckCircle2 size={30} strokeWidth={1.8} aria-hidden="true" />
          <p>{aviso?.texto || 'Tu contraseña quedó actualizada.'}</p>
        </div>
        <button className="auth-submit" type="button" onClick={onBack}>
          Iniciar sesión
        </button>
      </MarcoAuth>
    );
  }

  return (
    <MarcoAuth titulo={paso === 1 ? 'Recuperar contraseña' : 'Nueva contraseña'} onBack={onBack}>
      <div className="auth-steps" aria-hidden="true">
        <span className={paso >= 1 ? 'is-active' : ''} />
        <span className={paso >= 2 ? 'is-active' : ''} />
      </div>

      {paso === 1 ? (
        <form className="auth-form" onSubmit={solicitar} noValidate>
          <p className="auth-note">
            Escribe tu usuario o el correo registrado. Te enviamos un enlace válido por 30 minutos
            para definir una nueva contraseña.
          </p>
          {aviso && (
            <p className={aviso.tipo === 'success' ? 'auth-success' : 'auth-error'} role="status">
              {aviso.texto}
            </p>
          )}
          <label className="auth-field">
            <span>USUARIO O CORREO</span>
            <div className="auth-input-wrap">
              <Mail className="auth-input-icon" size={15} aria-hidden="true" />
              <input
                type="text"
                value={identificador}
                onChange={(evento) => setIdentificador(evento.target.value)}
                placeholder="usuario o correo@empresa.com"
                autoComplete="username"
                required
              />
            </div>
          </label>
          <button className="auth-submit" type="submit" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar enlace'} <ArrowRight size={15} aria-hidden="true" />
          </button>
          <div className="auth-links">
            <button
              type="button"
              onClick={() => {
                setAviso(null);
                setPaso(2);
              }}
            >
              Ya tengo el enlace o código
            </button>
          </div>
        </form>
      ) : (
        <form className="auth-form" onSubmit={restablecer} noValidate>
          <p className="auth-note">
            Pega el enlace completo o solo el código que recibiste y define una contraseña de mínimo
            8 caracteres.
          </p>
          {aviso && (
            <p className={aviso.tipo === 'success' ? 'auth-success' : 'auth-error'} role="status">
              {aviso.texto}
            </p>
          )}
          <label className="auth-field">
            <span>ENLACE O CÓDIGO</span>
            <div className="auth-input-wrap">
              <ShieldCheck className="auth-input-icon" size={15} aria-hidden="true" />
              <input
                type="text"
                value={token}
                onChange={(evento) => setToken(evento.target.value)}
                placeholder="Pega el enlace o el código recibido"
                autoComplete="one-time-code"
                required
              />
            </div>
          </label>
          <label className="auth-field">
            <span>NUEVA CONTRASEÑA</span>
            <div className="auth-input-wrap">
              <KeyRound className="auth-input-icon" size={15} aria-hidden="true" />
              <input
                type="password"
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                required
              />
            </div>
          </label>
          <label className="auth-field">
            <span>CONFIRMAR CONTRASEÑA</span>
            <div className="auth-input-wrap">
              <KeyRound className="auth-input-icon" size={15} aria-hidden="true" />
              <input
                type="password"
                value={confirmar}
                onChange={(evento) => setConfirmar(evento.target.value)}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                required
              />
            </div>
          </label>
          <button className="auth-submit" type="submit" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Cambiar contraseña'} <ArrowRight size={15} aria-hidden="true" />
          </button>
          <div className="auth-links">
            <button
              type="button"
              onClick={() => {
                setAviso(null);
                setPaso(1);
              }}
            >
              Solicitar otro enlace
            </button>
          </div>
        </form>
      )}
    </MarcoAuth>
  );
}
