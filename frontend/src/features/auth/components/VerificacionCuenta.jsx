import { useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { apiRequest } from '../../../shared/api.js';
import { MarcoAuth } from './AuthForms.jsx';
import '../styles/auth.css';

export function VerificacionCuenta({ token, onBack }) {
  const [estado, setEstado] = useState({ tipo: 'loading', texto: 'Verificando tu correo...' });

  useEffect(() => {
    let vigente = true;
    apiRequest('/auth/verificar', {
      method: 'POST',
      body: { token },
    })
      .then((resultado) => {
        if (vigente) setEstado({ tipo: 'success', texto: resultado.mensaje });
      })
      .catch((error) => {
        if (vigente) setEstado({ tipo: 'error', texto: error.message });
      });

    return () => {
      vigente = false;
    };
  }, [token]);

  return (
    <MarcoAuth titulo={estado.tipo === 'loading' ? 'Verificando cuenta' : 'Verificación de cuenta'} onBack={onBack}>
      <div className={`auth-recuperacion-exito ${estado.tipo === 'error' ? 'is-error' : ''}`} role="status">
        {estado.tipo === 'error'
          ? <CircleAlert size={30} strokeWidth={1.8} aria-hidden="true" />
          : <CheckCircle2 size={30} strokeWidth={1.8} aria-hidden="true" />}
        <p>{estado.texto}</p>
      </div>
      {estado.tipo !== 'loading' && (
        <button className="auth-submit" type="button" onClick={onBack}>
          Volver al inicio de sesión
        </button>
      )}
    </MarcoAuth>
  );
}
