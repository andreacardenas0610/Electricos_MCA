import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  IdCard,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserCog,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import { AccionesFila } from '../../../shared/components/AccionesFila.jsx';
import { apiRequest } from '../../../shared/api.js';
import { useApiData } from '../../../shared/useApiData.js';
import { EstadoToggle, ESTADOS } from '../../../shared/components/EstadoToggle.jsx';
import {
  Badge,
  Button,
  ConfirmDialog,
  DetailGrid,
  DetailItem,
  EmptyState,
  Field,
  KpiCard,
  Modal,
  PageHeader,
  PageShell,
  Panel,
  SearchInput,
  Toast,
  useToast,
} from '../../../shared/components/ui.jsx';
import {
  ZONAS_USUARIO,
} from '../../../shared/services/usuariosService.js';

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TONO_ROL = {
  Administrador: 'warning',
  Supervisor: 'info',
  Técnico: 'success',
  Ventas: 'indigo',
  Operario: 'neutral',
};

const FORMULARIO_USUARIO = (usuario = null) => ({
  nombre: usuario?.nombre || '',
  usuario: usuario?.usuario || '',
  correo: usuario?.correo || '',
  telefono: usuario?.telefono || '',
  rol: usuario?.rol || 'Operario',
  zona: usuario?.zona || 'General',
  password: '',
  confirmar: '',
});

export function GestionUsuarios() {
  const {
    data: datos,
    error,
    loading,
    reload: cargarDatos,
  } = useApiData(async () => {
    const [usuarios, roles] = await Promise.all([
      apiRequest('/usuarios'),
      apiRequest('/roles'),
    ]);
    return { usuarios, roles };
  }, { usuarios: [], roles: [] });
  const { usuarios, roles } = datos;

  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [formulario, setFormulario] = useState(null);
  const [errores, setErrores] = useState({});
  const [detalleId, setDetalleId] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null);
  const { toast, notify, close } = useToast();

  const resumen = useMemo(() => ({
    total: usuarios.length,
    activos: usuarios.filter((usuario) => usuario.estado === 'Activo').length,
    administradores: usuarios.filter((usuario) => usuario.rol === 'Administrador').length,
    tecnicos: usuarios.filter((usuario) => usuario.rol === 'Técnico').length,
  }), [usuarios]);

  const opcionesRol = useMemo(() => {
    const nombres = new Set(roles.map((rol) => rol.nombre));
    usuarios.forEach((usuario) => nombres.add(usuario.rol));
    return [...nombres];
  }, [roles, usuarios]);

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return usuarios.filter((usuario) => {
      if (filtroRol !== 'Todos' && usuario.rol !== filtroRol) return false;
      if (!termino) return true;
      return `${usuario.nombre} ${usuario.usuario} ${usuario.correo} ${usuario.rol} ${usuario.zona}`
        .toLowerCase()
        .includes(termino);
    });
  }, [usuarios, busqueda, filtroRol]);

  const usuarioDetalle = usuarios.find((usuario) => String(usuario.id) === String(detalleId));

  const rolesDisponibles = roles.filter((rol) => (
    rol.estado === 'Activo' || rol.nombre === formulario?.rol
  ));

  const abrirNuevo = () => {
    setFormulario(FORMULARIO_USUARIO());
    setErrores({});
  };

  const abrirEdicion = (usuario) => {
    setDetalleId(null);
    setFormulario({ ...FORMULARIO_USUARIO(usuario), id: usuario.id });
    setErrores({});
  };

  const cerrarFormulario = () => {
    setFormulario(null);
    setErrores({});
  };

  const setCampo = (campo, valor) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    const nuevosErrores = {};
    if (!formulario.nombre.trim()) nuevosErrores.nombre = 'Escribe el nombre completo.';
    if (!formulario.usuario.trim()) nuevosErrores.usuario = 'Escribe el nombre de acceso.';
    if (!formulario.correo.trim()) {
      nuevosErrores.correo = 'Escribe el correo electrónico.';
    } else if (!CORREO_VALIDO.test(formulario.correo.trim())) {
      nuevosErrores.correo = 'Ingresa un correo electrónico válido.';
    }
    if (!formulario.id && formulario.password.length < 8) {
      nuevosErrores.password = 'La contraseña debe tener mínimo 8 caracteres.';
    }
    if (formulario.password && formulario.password.length < 8) {
      nuevosErrores.password = 'La contraseña debe tener mínimo 8 caracteres.';
    }
    if (formulario.password !== formulario.confirmar) {
      nuevosErrores.confirmar = 'Las contraseñas no coinciden.';
    }
    if (Object.keys(nuevosErrores).length) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      const { password } = formulario;
      const datosUsuario = {
        nombre: formulario.nombre,
        usuario: formulario.usuario,
        correo: formulario.correo,
        telefono: formulario.telefono,
        rol: formulario.rol,
        zona: formulario.zona,
      };
      const guardado = await apiRequest(
        formulario.id ? `/usuarios/${encodeURIComponent(formulario.id)}` : '/usuarios',
        {
          method: formulario.id ? 'PUT' : 'POST',
          body: { ...datosUsuario, password },
        },
      );
      await cargarDatos();
      notify(
        'success',
        formulario.id ? 'Usuario actualizado' : 'Usuario creado',
        `${guardado.nombre} · ${guardado.rol}.`,
      );
      cerrarFormulario();
    } catch (error) {
      notify('error', 'No se pudo guardar', error.message);
    }
  };

  const alternarEstado = async (usuario) => {
    try {
      const actualizado = await apiRequest(`/usuarios/${encodeURIComponent(usuario.id)}/estado`, {
        method: 'PATCH',
        body: { estado: usuario.estado === 'Activo' ? 'Inactivo' : 'Activo' },
      });
      await cargarDatos();
      notify('success', `Usuario ${actualizado.estado.toLowerCase()}`, `${actualizado.nombre}.`);
    } catch (error) {
      notify('error', 'No se pudo cambiar el estado', error.message);
    }
  };

  const confirmarEliminar = async () => {
    if (!porEliminar) return;
    try {
      await apiRequest(`/usuarios/${encodeURIComponent(porEliminar.id)}`, { method: 'DELETE' });
      await cargarDatos();
      notify('success', 'Usuario eliminado', `${porEliminar.nombre} ya no tiene acceso al sistema.`);
      setPorEliminar(null);
    } catch (error) {
      notify('error', 'No se pudo eliminar', error.message);
      setPorEliminar(null);
    }
  };

  return (
    <PageShell>
      {error && <p role="alert" style={{ color: '#b91c1c' }}>No se pudieron cargar usuarios y roles desde la API: {error}</p>}
      {loading && <p role="status">Cargando usuarios desde la API...</p>}
      <PageHeader
        eyebrow="Gestión usuarios"
        title="Usuarios del sistema"
        subtitle="Cuentas con acceso a la plataforma, rol asignado y estado de disponibilidad."
        icon={UsersRound}
        actions={
          <Button variant="primary" icon={UserPlus} onClick={abrirNuevo}>
            Nuevo usuario
          </Button>
        }
      />

      <div className="mca-kpis">
        <KpiCard
          label="Usuarios registrados"
          value={resumen.total}
          hint={`${usuarios.length} cuentas locales`}
          icon={UsersRound}
          tone="yellow"
        />
        <KpiCard
          label="Cuentas activas"
          value={resumen.activos}
          hint={`${resumen.total - resumen.activos} inactivas`}
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label="Administradores"
          value={resumen.administradores}
          hint="Con acceso total"
          icon={ShieldCheck}
          tone="warning"
        />
        <KpiCard
          label="Técnicos"
          value={resumen.tecnicos}
          hint="Equipo operativo"
          icon={UserCog}
          tone="info"
        />
      </div>

      <Panel
        title="Directorio de usuarios"
        subtitle={`${filtrados.length} de ${usuarios.length} usuarios`}
        actions={
          <>
            <SearchInput
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar por nombre, usuario, correo o zona..."
            />
            <select
              className="mca-select"
              style={{ width: 180 }}
              value={filtroRol}
              onChange={(evento) => setFiltroRol(evento.target.value)}
              aria-label="Filtrar usuarios por rol"
            >
              <option value="Todos">Todos los roles</option>
              {opcionesRol.map((rol) => (
                <option key={rol} value={rol}>{rol}</option>
              ))}
            </select>
          </>
        }
        flush
      >
        <div className="mca-table-wrap">
          <table className="mca-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Zona</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((usuario) => (
                <tr key={usuario.id}>
                  <td>
                    <div className="mca-row" style={{ gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          display: 'grid',
                          placeItems: 'center',
                          backgroundColor: 'var(--bg-elevated)',
                          color: 'var(--accent-yellow)',
                          fontWeight: 800,
                          fontSize: 12,
                          flexShrink: 0,
                        }}
                      >
                        {usuario.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ display: 'block' }}>{usuario.nombre}</strong>
                        <span className="mca-muted" style={{ fontSize: 11 }}>@{usuario.usuario}</span>
                      </div>
                    </div>
                  </td>
                  <td>{usuario.correo || '—'}</td>
                  <td>
                    <Badge tone={TONO_ROL[usuario.rol] || 'neutral'}>{usuario.rol}</Badge>
                  </td>
                  <td>{usuario.zona}</td>
                  <td>{usuario.telefono || '—'}</td>
                  <td>
                    <EstadoToggle
                      estado={usuario.estado}
                      estados={ESTADOS.usuario}
                      onClick={() => alternarEstado(usuario)}
                    />
                  </td>
                  <td>
                    <AccionesFila
                      onVer={() => setDetalleId(usuario.id)}
                      onEditar={() => abrirEdicion(usuario)}
                      onEliminar={() => setPorEliminar(usuario)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtrados.length && (
          <EmptyState
            icon={UsersRound}
            title="Sin usuarios que mostrar"
            message="Ajusta el filtro o registra una nueva cuenta de acceso."
            action={<Button icon={UserPlus} onClick={abrirNuevo}>Nuevo usuario</Button>}
          />
        )}
      </Panel>

      <Modal
        open={Boolean(formulario)}
        onClose={cerrarFormulario}
        title={formulario?.id ? 'Editar usuario' : 'Nuevo usuario'}
        subtitle="Los datos de acceso se validan contra el inicio de sesión."
        icon={formulario?.id ? UserCog : UserPlus}
        footer={
          <>
            <Button onClick={cerrarFormulario}>Cancelar</Button>
            <Button variant="primary" type="submit" form="form-usuario">
              {formulario?.id ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </>
        }
      >
        {formulario && (
          <form id="form-usuario" className="mca-form-grid" onSubmit={guardar}>
            <Field label="Nombre completo" required error={errores.nombre}>
              <input
                className="mca-input"
                value={formulario.nombre}
                onChange={(evento) => setCampo('nombre', evento.target.value)}
                placeholder="Nombre y apellido"
                autoFocus
              />
            </Field>
            <Field label="Usuario de acceso" required error={errores.usuario}>
              <input
                className="mca-input"
                value={formulario.usuario}
                onChange={(evento) => setCampo('usuario', evento.target.value)}
                placeholder="usuario.apellido"
                autoComplete="off"
              />
            </Field>
            <Field label="Correo electrónico" required error={errores.correo}>
              <input
                className="mca-input"
                type="email"
                value={formulario.correo}
                onChange={(evento) => setCampo('correo', evento.target.value)}
                placeholder="usuario@electricosmca.com"
                autoComplete="off"
              />
            </Field>
            <Field label="Teléfono">
              <input
                className="mca-input"
                type="tel"
                value={formulario.telefono}
                onChange={(evento) => setCampo('telefono', evento.target.value)}
                placeholder="310 555 0000"
              />
            </Field>
            <Field label="Rol" required hint="Define los permisos del usuario.">
              <select
                className="mca-select"
                value={formulario.rol}
                onChange={(evento) => setCampo('rol', evento.target.value)}
              >
                {rolesDisponibles.map((rol) => (
                  <option key={rol.nombre} value={rol.nombre}>
                    {rol.nombre}{rol.estado === 'Inactivo' ? ' (inactivo)' : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Zona">
              <select
                className="mca-select"
                value={formulario.zona}
                onChange={(evento) => setCampo('zona', evento.target.value)}
              >
                {ZONAS_USUARIO.map((zona) => (
                  <option key={zona} value={zona}>{zona}</option>
                ))}
              </select>
            </Field>
            <Field
              label={formulario.id ? 'Nueva contraseña' : 'Contraseña'}
              required={!formulario.id}
              error={errores.password}
              hint={formulario.id ? 'Déjala vacía para conservar la actual.' : 'Mínimo 8 caracteres.'}
            >
              <input
                className="mca-input"
                type="password"
                value={formulario.password}
                onChange={(evento) => setCampo('password', evento.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirmar contraseña" required={!formulario.id || Boolean(formulario.password)} error={errores.confirmar}>
              <input
                className="mca-input"
                type="password"
                value={formulario.confirmar}
                onChange={(evento) => setCampo('confirmar', evento.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(usuarioDetalle)}
        onClose={() => setDetalleId(null)}
        title={usuarioDetalle?.nombre || 'Detalle del usuario'}
        subtitle={`@${usuarioDetalle?.usuario || ''} · ${usuarioDetalle?.rol || ''}`}
        icon={UsersRound}
        footer={
          <>
            <Button onClick={() => setDetalleId(null)}>Cerrar</Button>
            {usuarioDetalle && (
              <Button variant="primary" icon={UserCog} onClick={() => abrirEdicion(usuarioDetalle)}>
                Editar usuario
              </Button>
            )}
          </>
        }
      >
        {usuarioDetalle && (
          <>
            <DetailGrid>
              <DetailItem label="Nombre">{usuarioDetalle.nombre}</DetailItem>
              <DetailItem label="Usuario">@{usuarioDetalle.usuario}</DetailItem>
              <DetailItem label="Correo">{usuarioDetalle.correo || '—'}</DetailItem>
              <DetailItem label="Teléfono">{usuarioDetalle.telefono || '—'}</DetailItem>
              <DetailItem label="Rol">
                <Badge tone={TONO_ROL[usuarioDetalle.rol] || 'neutral'}>{usuarioDetalle.rol}</Badge>
              </DetailItem>
              <DetailItem label="Zona">{usuarioDetalle.zona}</DetailItem>
              <DetailItem label="Estado">
                <Badge tone={usuarioDetalle.estado === 'Activo' ? 'success' : 'danger'}>
                  {usuarioDetalle.estado}
                </Badge>
              </DetailItem>
              <DetailItem label="Último acceso">{usuarioDetalle.ultimoAcceso}</DetailItem>
            </DetailGrid>
            <div className="mca-notice is-info" style={{ marginTop: 16 }}>
              <KeyRound size={16} />
              <div>
                <strong>Acceso al sistema</strong>
                <p style={{ margin: '4px 0 0' }}>
                  El usuario ingresa con “{usuarioDetalle.usuario}” y su contraseña local. Los permisos
                  se administran desde el módulo de Roles.
                </p>
              </div>
            </div>
            <div className="mca-row" style={{ gap: 18, marginTop: 14, flexWrap: 'wrap' }}>
              <span className="mca-muted mca-row" style={{ gap: 6, fontSize: 12 }}>
                <Mail size={14} /> {usuarioDetalle.correo || 'Sin correo'}
              </span>
              <span className="mca-muted mca-row" style={{ gap: 6, fontSize: 12 }}>
                <Phone size={14} /> {usuarioDetalle.telefono || 'Sin teléfono'}
              </span>
              <span className="mca-muted mca-row" style={{ gap: 6, fontSize: 12 }}>
                <MapPin size={14} /> Zona {usuarioDetalle.zona}
              </span>
              <span className="mca-muted mca-row" style={{ gap: 6, fontSize: 12 }}>
                <IdCard size={14} /> ID {usuarioDetalle.id}
              </span>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(porEliminar)}
        title="Eliminar usuario"
        message={`¿Seguro que deseas eliminar a ${porEliminar?.nombre || 'este usuario'}? Perderá el acceso a la plataforma.`}
        confirmLabel="Eliminar usuario"
        onCancel={() => setPorEliminar(null)}
        onConfirm={confirmarEliminar}
      />
      <Toast toast={toast} onClose={close} />
    </PageShell>
  );
}

export default GestionUsuarios;
