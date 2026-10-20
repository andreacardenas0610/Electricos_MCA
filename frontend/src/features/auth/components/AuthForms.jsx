import { useContext, useState } from 'react';
import { ArrowLeft, LockKeyhole, Mail, Moon, Sun, UserRound, Zap } from 'lucide-react';
import { ThemeContext } from '../../../shared/context/ThemeContext.jsx';
import { getLocalUsers, saveLocalUsers } from '../../../shared/localStore.js';
import '../styles/auth.css';

const iconosCampo = {
  usuario: UserRound,
  correo: Mail,
  password: LockKeyhole,
  confirmar: LockKeyhole,
};

function CampoAuth({ nombre, etiqueta, tipo, valor, onChange, autoComplete }) {
  const Icono = iconosCampo[nombre];

  return (
    <label className="auth-field">
      <span>{etiqueta}</span>
      <div className="auth-input-wrap">
        <Icono className="auth-input-icon" size={15} aria-hidden="true" />
        <input
          required
          name={nombre}
          type={tipo}
          value={valor}
          onChange={onChange}
          placeholder={nombre === 'confirmar' ? 'Confirma tu contraseña' : `Ingresa ${etiqueta.toLowerCase()}`}
          autoComplete={autoComplete}
        />
      </div>
    </label>
  );
}

function MarcoAuth({ titulo, children, onBack }) {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <main className="auth-page">
      <div className="auth-backdrop" aria-hidden="true" />
      <button className="auth-theme-toggle" type="button" onClick={toggleTheme} aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}>
        {theme === 'dark' ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
      <section className="auth-card" aria-labelledby="auth-title">
        <header className="auth-brand">
          <div className="auth-brand-mark" aria-hidden="true"><Zap size={18} strokeWidth={2.2} /></div>
          <h1 id="auth-title">ELÉCTRICOS MCA</h1>
          <span>GESTIÓN INDUSTRIAL</span>
          <h2 className="auth-form-title">{titulo}</h2>
        </header>
        {children}
        <button className="auth-back-link" type="button" onClick={onBack}>
          <ArrowLeft size={14} aria-hidden="true" />
          Volver al inicio de sesión
        </button>
        <footer className="auth-footer">
          © 2024 Eléctricos MCA S.A.S. - Sistema de control interno
        </footer>
      </section>
    </main>
  );
}

export function Registro({ onBack }) {
  const [datos, setDatos] = useState({ usuario: '', correo: '', password: '', confirmar: '' });
  const [mensaje, setMensaje] = useState('');
  const cambiar = (evento) => setDatos({ ...datos, [evento.target.name]: evento.target.value });

  const registrar = (evento) => {
    evento.preventDefault();
    const usuarios = getLocalUsers();
    if (usuarios.some((usuario) => usuario.usuario === datos.usuario || usuario.correo === datos.correo)) {
      setMensaje('El usuario o correo ya está registrado.');
      return;
    }
    if (datos.password.length < 6) {
      setMensaje('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    if (datos.password !== datos.confirmar) {
      setMensaje('Las contraseñas no coinciden.');
      return;
    }
    saveLocalUsers([...usuarios, { usuario: datos.usuario, correo: datos.correo, password: datos.password }]);
    setMensaje('Registro exitoso. Ya puedes iniciar sesión.');
    setDatos({ usuario: '', correo: '', password: '', confirmar: '' });
  };

  return (
    <MarcoAuth titulo="Crear cuenta" onBack={onBack}>
      <form className="auth-form" onSubmit={registrar}>
        {mensaje && <p className={mensaje.startsWith('Registro') ? 'auth-success' : 'auth-error'} role="status">{mensaje}</p>}
        <CampoAuth nombre="usuario" etiqueta="USUARIO" tipo="text" valor={datos.usuario} onChange={cambiar} autoComplete="username" />
        <CampoAuth nombre="correo" etiqueta="CORREO ELECTRÓNICO" tipo="email" valor={datos.correo} onChange={cambiar} autoComplete="email" />
        <CampoAuth nombre="password" etiqueta="CONTRASEÑA" tipo="password" valor={datos.password} onChange={cambiar} autoComplete="new-password" />
        <CampoAuth nombre="confirmar" etiqueta="CONFIRMAR CONTRASEÑA" tipo="password" valor={datos.confirmar} onChange={cambiar} autoComplete="new-password" />
        <button className="auth-submit" type="submit">Crear cuenta</button>
      </form>
    </MarcoAuth>
  );
}

export function RecuperarContrasena({ onBack }) {
  const [correo, setCorreo] = useState('');
  const [nueva, setNueva] = useState('');
  const [mensaje, setMensaje] = useState('');

  const recuperar = (evento) => {
    evento.preventDefault();
    const usuarios = getLocalUsers();
    const indice = usuarios.findIndex((usuario) => usuario.correo === correo);
    if (indice < 0) {
      setMensaje('No encontramos una cuenta con ese correo.');
      return;
    }
    if (nueva.length < 6) {
      setMensaje('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    usuarios[indice] = { ...usuarios[indice], password: nueva };
    saveLocalUsers(usuarios);
    setMensaje('Contraseña actualizada. Ya puedes iniciar sesión.');
    setNueva('');
  };

  return (
    <MarcoAuth titulo="Recuperar contraseña" onBack={onBack}>
      <form className="auth-form" onSubmit={recuperar}>
        {mensaje && <p className={mensaje.startsWith('Contraseña') ? 'auth-success' : 'auth-error'} role="status">{mensaje}</p>}
        <CampoAuth nombre="correo" etiqueta="CORREO ELECTRÓNICO" tipo="email" valor={correo} onChange={(evento) => setCorreo(evento.target.value)} autoComplete="email" />
        <CampoAuth nombre="password" etiqueta="NUEVA CONTRASEÑA" tipo="password" valor={nueva} onChange={(evento) => setNueva(evento.target.value)} autoComplete="new-password" />
        <button className="auth-submit" type="submit">Actualizar contraseña</button>
      </form>
    </MarcoAuth>
  );
}
