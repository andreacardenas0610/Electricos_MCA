import { useContext, useState } from 'react';
import { ArrowLeft, IdCard, LockKeyhole, Mail, Moon, Sun, UserRound, Zap } from 'lucide-react';
import { ThemeContext } from '../../../shared/context/ThemeContext.jsx';
import { apiRequest } from '../../../shared/api.js';
import '../styles/auth.css';

const iconosCampo = {
  nombre: UserRound,
  usuario: UserRound,
  correo: Mail,
  documento: IdCard,
  password: LockKeyhole,
  confirmar: LockKeyhole,
};

function CampoAuth({ nombre, etiqueta, tipo, valor, onChange, autoComplete, error }) {
  const Icono = iconosCampo[nombre];

  return (
    <label className={`auth-field ${error ? 'has-error' : ''}`}>
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
          aria-invalid={Boolean(error)}
        />
      </div>
      {error && <span className="auth-field-error">{error}</span>}
    </label>
  );
}

export function MarcoAuth({ titulo, children, onBack }) {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <main className="auth-page">
      <div className="auth-backdrop" aria-hidden="true" />
      <button className="auth-theme-toggle" type="button" onClick={toggleTheme} aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}>
        {theme === 'dark' ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
        {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
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
  const [datos, setDatos] = useState({
    nombre: '',
    usuario: '',
    correo: '',
    documento: '',
    genero: 'Prefiere no decirlo',
    password: '',
    confirmar: '',
  });
  const [mensaje, setMensaje] = useState(null);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const cambiar = (evento) => {
    setDatos({ ...datos, [evento.target.name]: evento.target.value });
    setErrores((actuales) => ({ ...actuales, [evento.target.name]: undefined }));
  };

  const registrar = async (evento) => {
    evento.preventDefault();
    const nuevosErrores = {};
    if (!datos.nombre.trim()) nuevosErrores.nombre = 'Escribe tu nombre completo.';
    if (!datos.usuario.trim()) nuevosErrores.usuario = 'Escribe tu usuario.';
    if (!datos.correo.trim()) nuevosErrores.correo = 'Escribe tu correo electrónico.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) {
      nuevosErrores.correo = 'Ingresa un correo electrónico válido.';
    }
    if (!datos.documento.trim()) nuevosErrores.documento = 'Escribe tu documento.';
    if (datos.password.length < 8) nuevosErrores.password = 'La contraseña debe tener mínimo 8 caracteres.';
    if (!datos.confirmar) nuevosErrores.confirmar = 'Confirma tu contraseña.';
    else if (datos.password !== datos.confirmar) nuevosErrores.confirmar = 'Las contraseñas no coinciden.';
    if (Object.keys(nuevosErrores).length) {
      setErrores(nuevosErrores);
      setMensaje(null);
      return;
    }

    setEnviando(true);
    setMensaje(null);
    try {
      const resultado = await apiRequest('/auth/registro', {
        method: 'POST',
        body: {
          nombre: datos.nombre.trim(),
          usuario: datos.usuario.trim(),
          correo: datos.correo.trim(),
          documento: datos.documento.trim(),
          genero: datos.genero,
          password: datos.password,
        },
      });
      setMensaje({ tipo: 'success', texto: resultado.mensaje });
      setErrores({});
      setDatos({
        nombre: '',
        usuario: '',
        correo: '',
        documento: '',
        genero: 'Prefiere no decirlo',
        password: '',
        confirmar: '',
      });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <MarcoAuth titulo="Crear cuenta" onBack={onBack}>
      <form className="auth-form" onSubmit={registrar} noValidate>
        <p className="auth-note">Registro para técnicos. El acceso móvil se habilita al verificar el correo.</p>
        {mensaje && <p className={mensaje.tipo === 'success' ? 'auth-success' : 'auth-error'} role="status">{mensaje.texto}</p>}
        <CampoAuth nombre="nombre" etiqueta="NOMBRE COMPLETO" tipo="text" valor={datos.nombre} onChange={cambiar} autoComplete="name" error={errores.nombre} />
        <CampoAuth nombre="usuario" etiqueta="USUARIO" tipo="text" valor={datos.usuario} onChange={cambiar} autoComplete="username" error={errores.usuario} />
        <CampoAuth nombre="correo" etiqueta="CORREO ELECTRÓNICO" tipo="email" valor={datos.correo} onChange={cambiar} autoComplete="email" error={errores.correo} />
        <CampoAuth nombre="documento" etiqueta="DOCUMENTO" tipo="text" valor={datos.documento} onChange={cambiar} autoComplete="off" error={errores.documento} />
        <fieldset className="auth-genero">
          <legend>GÉNERO</legend>
          <p className="auth-genero__ayuda">Elige la imagen con la que aparecerás en la plataforma.</p>
          {['Mujer', 'Hombre', 'Prefiere no decirlo'].map((opcion) => (
            <label key={opcion} className={datos.genero === opcion ? 'is-active' : ''}>
              <input
                type="radio"
                name="genero"
                value={opcion}
                checked={datos.genero === opcion}
                onChange={cambiar}
              />
              <span>{opcion}</span>
            </label>
          ))}
        </fieldset>
        <CampoAuth nombre="password" etiqueta="CONTRASEÑA" tipo="password" valor={datos.password} onChange={cambiar} autoComplete="new-password" error={errores.password} />
        <CampoAuth nombre="confirmar" etiqueta="CONFIRMAR CONTRASEÑA" tipo="password" valor={datos.confirmar} onChange={cambiar} autoComplete="new-password" error={errores.confirmar} />
        <button className="auth-submit" type="submit" disabled={enviando}>
          {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
    </MarcoAuth>
  );
}
