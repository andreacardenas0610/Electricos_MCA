import { useState } from 'react';

const leerUsuarios = () => {
  const usuarios = localStorage.getItem('mca_usuarios');
  return usuarios ? JSON.parse(usuarios) : [{ usuario: 'admin', correo: 'admin@electricosmca.com', password: '1033490682' }];
};

const caja = { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #243556', backgroundColor: '#0f172a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' };
const boton = { padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#facc15', color: '#0f172a', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' };
const enlace = { border: 'none', background: 'none', color: '#facc15', cursor: 'pointer', fontSize: '13px', padding: 0 };

function MarcoAuth({ titulo, children, onBack }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100vw', backgroundColor: '#0f172a', fontFamily: 'sans-serif' }}>
    <div style={{ width: '100%', maxWidth: '380px', backgroundColor: '#1b2a47', padding: '32px', borderRadius: '12px', border: '1px solid #243556', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}><h1 style={{ color: '#facc15', fontSize: '25px', margin: '0 0 6px' }}>Eléctricos MCA</h1><span style={{ fontSize: '11px', color: '#8899ac', letterSpacing: '1.4px', fontWeight: '600' }}>GESTIÓN INDUSTRIAL</span><h2 style={{ color: '#fff', fontSize: '18px', margin: '22px 0 0' }}>{titulo}</h2></div>
      {children}
      <button type="button" onClick={onBack} style={{ ...enlace, display: 'block', margin: '18px auto 0' }}>← Volver al inicio de sesión</button>
    </div>
  </div>;
}

export function Registro({ onBack }) {
  const [datos, setDatos] = useState({ usuario: '', correo: '', password: '', confirmar: '' });
  const [mensaje, setMensaje] = useState('');
  const cambiar = (evento) => setDatos({ ...datos, [evento.target.name]: evento.target.value });
  const registrar = (evento) => {
    evento.preventDefault();
    const usuarios = leerUsuarios();
    if (usuarios.some((usuario) => usuario.usuario === datos.usuario || usuario.correo === datos.correo)) return setMensaje('El usuario o correo ya está registrado.');
    if (datos.password.length < 6) return setMensaje('La contraseña debe tener mínimo 6 caracteres.');
    if (datos.password !== datos.confirmar) return setMensaje('Las contraseñas no coinciden.');
    localStorage.setItem('mca_usuarios', JSON.stringify([...usuarios, { usuario: datos.usuario, correo: datos.correo, password: datos.password }]));
    setMensaje('Registro exitoso. Ya puedes iniciar sesión.');
    setDatos({ usuario: '', correo: '', password: '', confirmar: '' });
  };
  return <MarcoAuth titulo="Crear cuenta" onBack={onBack}><form onSubmit={registrar} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{mensaje && <p style={{ color: mensaje.startsWith('Registro') ? '#4ade80' : '#f87171', fontSize: '13px', textAlign: 'center', margin: 0 }}>{mensaje}</p>}{[['usuario', 'Usuario', 'text'], ['correo', 'Correo electrónico', 'email'], ['password', 'Contraseña', 'password'], ['confirmar', 'Confirmar contraseña', 'password']].map(([nombre, etiqueta, tipo]) => <label key={nombre} style={{ color: '#a0aec0', fontSize: '13px' }}>{etiqueta}<input required name={nombre} type={tipo} value={datos[nombre]} onChange={cambiar} style={{ ...caja, marginTop: '6px' }} /></label>)}<button type="submit" style={boton}>Crear cuenta</button></form></MarcoAuth>;
}

export function RecuperarContrasena({ onBack }) {
  const [correo, setCorreo] = useState('');
  const [nueva, setNueva] = useState('');
  const [mensaje, setMensaje] = useState('');
  const recuperar = (evento) => {
    evento.preventDefault();
    const usuarios = leerUsuarios();
    const indice = usuarios.findIndex((usuario) => usuario.correo === correo);
    if (indice < 0) return setMensaje('No encontramos una cuenta con ese correo.');
    if (nueva.length < 6) return setMensaje('La contraseña debe tener mínimo 6 caracteres.');
    usuarios[indice] = { ...usuarios[indice], password: nueva };
    localStorage.setItem('mca_usuarios', JSON.stringify(usuarios));
    setMensaje('Contraseña actualizada. Ya puedes iniciar sesión.');
    setNueva('');
  };
  return <MarcoAuth titulo="Recuperar contraseña" onBack={onBack}><form onSubmit={recuperar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>{mensaje && <p style={{ color: mensaje.startsWith('Contraseña') ? '#4ade80' : '#f87171', fontSize: '13px', textAlign: 'center', margin: 0 }}>{mensaje}</p>}<label style={{ color: '#a0aec0', fontSize: '13px' }}>Correo electrónico<input required type="email" value={correo} onChange={(evento) => setCorreo(evento.target.value)} style={{ ...caja, marginTop: '6px' }} /></label><label style={{ color: '#a0aec0', fontSize: '13px' }}>Nueva contraseña<input required type="password" value={nueva} onChange={(evento) => setNueva(evento.target.value)} style={{ ...caja, marginTop: '6px' }} /></label><button type="submit" style={boton}>Actualizar contraseña</button></form></MarcoAuth>;
}
