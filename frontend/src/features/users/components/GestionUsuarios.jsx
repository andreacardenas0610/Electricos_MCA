import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  IdCard,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  UserCog,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import { AccionesFila } from '../../../shared/components/AccionesFila.jsx';
import { apiRequest } from '../../../shared/api.js';
import { useApiData } from '../../../shared/useApiData.js';
import { EstadoToggle, ESTADOS } from '../../../shared/components/EstadoToggle.jsx';
import { claseFilaEstado } from '../../../shared/utils/estadosFila.js';
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

const FORMULARIO_USUARIO = (usuario = null) => {
  // La cuenta puede tener varios roles: el primero de la lista es el principal.
  const roles = usuario?.roles?.length
    ? [...usuario.roles]
    : (usuario?.rol ? [usuario.rol] : []);
  return {
    documento: usuario?.documento || '',
    nombre: usuario?.nombre || '',
    usuario: usuario?.usuario || '',
    correo: usuario?.correo || '',
    telefono: usuario?.telefono || '',
    terceroId: usuario?.terceroId || '',
    rol: roles[0] || '',
    roles,
    zona: usuario?.zona || 'General',
    password: '',
    confirmar: '',
  };
};

export function GestionUsuarios({ usuario: usuarioSesion }) {
  const {
    data: datos,
    error,
    loading,
    reload: cargarDatos,
  } = useApiData(async () => {
    const [usuarios, roles, terceros, clientes] = await Promise.all([
      apiRequest('/usuarios'),
      apiRequest('/roles'),
      apiRequest('/terceros'),
      apiRequest('/clientes'),
    ]);
    return { usuarios, roles, terceros, clientes };
  }, { usuarios: [], roles: [], terceros: [], clientes: [] });
  const { usuarios, roles, terceros, clientes } = datos;

  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [formulario, setFormulario] = useState(null);
  const [errores, setErrores] = useState({});
  const [detalleId, setDetalleId] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null);
  const { toast, notify, close } = useToast();

  const esUsuarioActual = (usuario) => (
    Boolean(usuarioSesion?.id)
    && String(usuarioSesion.id) === String(usuario?.id)
  );

  const perfilesVinculados = (usuario) => {
    if (!usuario) return { tercero: null, cliente: null };
    const tercero = terceros.find((item) => (
      String(item.id) === String(usuario.terceroId)
    )) || null;
    const documento = String(usuario.documento || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
    const cliente = clientes.find((item) => (
      (tercero && String(item.terceroId) === String(tercero.id))
      || (
        documento
        && String(item.documento || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase() === documento
      )
    )) || null;
    return { tercero, cliente };
  };

  const resumen = useMemo(() => ({
    total: usuarios.length,
    activos: usuarios.filter((usuario) => usuario.estado === 'Activo').length,
    administradores: usuarios.filter((usuario) => (usuario.roles || []).includes('Administrador')).length,
    tecnicos: usuarios.filter((usuario) => (usuario.roles || []).includes('Técnico')).length,
  }), [usuarios]);

  const opcionesRol = useMemo(() => {
    const nombres = new Set(roles.map((rol) => rol.nombre));
    usuarios.forEach((usuario) => (usuario.roles || []).forEach((rol) => nombres.add(rol)));
    return [...nombres];
  }, [roles, usuarios]);

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return usuarios.filter((usuario) => {
      if (filtroRol !== 'Todos' && !(usuario.roles || []).includes(filtroRol)) return false;
      if (!termino) return true;
      return `${usuario.nombre} ${usuario.usuario} ${usuario.correo} ${(usuario.roles || []).join(' ')} ${usuario.zona}`
        .toLowerCase()
        .includes(termino);
    });
  }, [usuarios, busqueda, filtroRol]);

  const usuarioDetalle = usuarios.find((usuario) => String(usuario.id) === String(detalleId));

  const rolesDisponibles = roles.filter((rol) => (
    rol.estado === 'Activo' || (formulario?.roles || []).includes(rol.nombre)
  ));
  const perfilesTecnicosDisponibles = terceros.filter((tercero) => (
    tercero.estado === 'Activo'
    && (!usuarios.some((usuario) => (
      String(usuario.terceroId) === String(tercero.id)
      && String(usuario.id) !== String(formulario?.id)
    )))
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

  // Un usuario puede tener varios roles: el primero de la lista es el principal.
  const alternarRol = (nombre) => {
    setFormulario((actual) => {
      const tiene = actual.roles.includes(nombre);
      const roles = tiene
        ? actual.roles.filter((rol) => rol !== nombre)
        : [...actual.roles, nombre];
      // Siempre debe quedar al menos un rol marcado.
      const finales = roles.length ? roles : [actual.rol];
      return { ...actual, roles: finales, rol: finales[0] };
    });
  };

  // Lupa de la cédula: busca en usuarios, terceros y clientes para rellenar
  // el formulario sin tener que digitar dos veces los mismos datos.
  const buscarDocumento = async () => {
    const documento = String(formulario.documento || '').trim();
    if (documento.length < 3) {
      notify('warning', 'Escribe la cédula', 'La lupa busca con mínimo 3 caracteres.');
      return;
    }
    try {
      const resultado = await apiRequest(
        `/usuarios/buscar-documento?documento=${encodeURIComponent(documento)}`,
      );
      if (resultado.usuario) {
        notify(
          'warning',
          'Esa cédula ya tiene usuario',
          `La cuenta pertenece a ${resultado.usuario.nombre}.`,
        );
        return;
      }
      const fuente = resultado.tercero || resultado.cliente;
      if (!fuente) {
        notify('info', 'Sin coincidencias', 'No se encontró esa cédula en terceros ni en clientes.');
        return;
      }
      setFormulario((actual) => ({
        ...actual,
        nombre: resultado.tercero?.nombre_completo
          || resultado.cliente?.nombre_razon_social
          || actual.nombre,
        correo: resultado.tercero?.correo_electronico
          || resultado.cliente?.correo_electronico
          || actual.correo,
        telefono: resultado.tercero?.telefono
          || resultado.cliente?.telefono
          || actual.telefono,
      }));
      notify(
        'success',
        'Datos encontrados',
        resultado.tercero
          ? 'Se rellenaron los datos desde la ficha del tercero.'
          : 'Se rellenaron los datos desde la ficha del cliente.',
      );
    } catch (error) {
      notify('error', 'No se pudo buscar', error.message);
    }
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    const nuevosErrores = {};
    if (!String(formulario.documento || '').trim()) {
      nuevosErrores.documento = 'Escribe la cédula del usuario.';
    }
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
    if (!formulario.roles?.length) {
      nuevosErrores.roles = 'Selecciona al menos un rol para la cuenta.';
    }
    if (formulario.rol === 'Técnico' && !formulario.terceroId) {
      nuevosErrores.terceroId = 'Selecciona el perfil del técnico.';
    }
    if (Object.keys(nuevosErrores).length) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      const { password } = formulario;
      const datosUsuario = {
        documento: formulario.documento,
        nombre: formulario.nombre,
        usuario: formulario.usuario,
        correo: formulario.correo,
        telefono: formulario.telefono,
        rol: formulario.rol,
        roles: formulario.roles,
        zona: formulario.zona,
        tercero_id: formulario.rol === 'Técnico' ? formulario.terceroId : null,
      };
      const guardado = await apiRequest(
        formulario.id ? `/usuarios/${encodeURIComponent(formulario.id)}` : '/usuarios',
        {
          method: formulario.id ? 'PUT' : 'POST',
          body: { ...datosUsuario, password },
        },
      );
      await cargarDatos();
      const listaRoles = guardado.roles?.length ? guardado.roles : [guardado.rol];
      notify(
        'success',
        formulario.id ? 'Usuario actualizado' : 'Usuario creado',
        `${guardado.nombre} · ${listaRoles.join(' + ')}.`,
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
    if (esUsuarioActual(porEliminar)) {
      notify('warning', 'Acción no permitida', 'No puedes eliminar tu propia cuenta.');
      setPorEliminar(null);
      return;
    }
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
          <table className="mca-table mca-table--users">
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
                <tr key={usuario.id} className={claseFilaEstado(usuario.estado, 'usuario')}>
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
                    <div className="mca-row" style={{ gap: 4, flexWrap: 'wrap' }}>
                      {(usuario.roles || [usuario.rol]).map((rol) => (
                        <Badge
                          key={rol}
                          tone={rol === usuario.rol ? (TONO_ROL[rol] || 'neutral') : 'indigo'}
                        >
                          {rol}
                        </Badge>
                      ))}
                    </div>
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
                      onEliminar={esUsuarioActual(usuario) ? undefined : () => setPorEliminar(usuario)}
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
          <Button variant="primary" type="submit" form="form-usuario">
            {formulario?.id ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        }
      >
        {formulario && (
          <form id="form-usuario" className="mca-form-grid" onSubmit={guardar} noValidate>
            <Field
              label="Cédula"
              required
              full
              error={errores.documento}
              hint="Siempre se pide primero: con la lupa se rellenan los demás datos."
              tooltip="Número de cédula del usuario; no puede repetirse."
            >
              <div className="mca-input-con-boton">
                <input
                  className="mca-input"
                  value={formulario.documento}
                  onChange={(evento) => setCampo('documento', evento.target.value)}
                  placeholder="1.020.304.050"
                  inputMode="numeric"
                  autoFocus
                />
                <Button icon={Search} onClick={buscarDocumento} title="Buscar la cédula en el sistema">
                  Lupa
                </Button>
              </div>
            </Field>
            <Field label="Nombre completo" required error={errores.nombre}>
              <input
                className="mca-input"
                value={formulario.nombre}
                onChange={(evento) => setCampo('nombre', evento.target.value)}
                placeholder="Nombre y apellido"
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
            <Field
              label="Roles"
              required
              full
              error={errores.roles}
              hint="El primero de la lista es el rol principal; la cuenta puede tener varios."
              tooltip="Selecciona uno o más roles para la cuenta. El rol principal define el acceso por defecto."
            >
              <div className="mca-rol-options">
                {rolesDisponibles.map((rol) => {
                  const marcado = formulario.roles.includes(rol.nombre);
                  const esPrincipal = marcado && formulario.rol === rol.nombre;
                  return (
                    <label
                      key={rol.nombre}
                      className={`mca-check ${marcado ? 'is-active' : ''}`.trim()}
                    >
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => alternarRol(rol.nombre)}
                      />
                      <span className="mca-check__texto">
                        {rol.nombre}
                        {esPrincipal && (
                          <Badge tone="yellow" className="mca-badge--inline">Principal</Badge>
                        )}
                      </span>
                      <span className="mca-check__meta">
                        {rol.estado === 'Inactivo'
                          ? 'Inactivo'
                          : (rol.descripcion || rol.codigo || '')}
                      </span>
                    </label>
                  );
                })}
              </div>
            </Field>
            {formulario.rol === 'Técnico' && (
              <Field
                label="Perfil de técnico"
                required
                error={errores.terceroId}
                hint="La cuenta móvil quedará vinculada a este perfil."
              >
                <select
                  className="mca-select"
                  value={formulario.terceroId}
                  onChange={(evento) => setCampo('terceroId', evento.target.value)}
                >
                  <option value="">Selecciona un técnico</option>
                  {perfilesTecnicosDisponibles.map((tercero) => (
                    <option key={tercero.id} value={tercero.id}>
                      {tercero.nombre_completo} · {tercero.documento}
                    </option>
                  ))}
                </select>
                {!perfilesTecnicosDisponibles.length && (
                  <small className="mca-muted">No hay perfiles activos sin una cuenta asociada.</small>
                )}
              </Field>
            )}
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
        subtitle={`${usuarioDetalle?.usuario || ''} · ${usuarioDetalle?.rol || ''}`}
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
              <DetailItem label="Usuario">{usuarioDetalle.usuario}</DetailItem>
              <DetailItem label="Cédula">{usuarioDetalle.documento || '—'}</DetailItem>
              <DetailItem label="Correo">{usuarioDetalle.correo || '—'}</DetailItem>
              <DetailItem label="Teléfono">{usuarioDetalle.telefono || '—'}</DetailItem>
              <DetailItem label="Rol">
                <Badge tone={TONO_ROL[usuarioDetalle.rol] || 'neutral'}>{usuarioDetalle.rol}</Badge>
              </DetailItem>
              <DetailItem label="Roles de la cuenta" full>
                <div className="mca-row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  {(usuarioDetalle.roles || [usuarioDetalle.rol]).map((rol) => (
                    <Badge
                      key={rol}
                      tone={rol === usuarioDetalle.rol ? (TONO_ROL[rol] || 'neutral') : 'indigo'}
                    >
                      {rol}
                    </Badge>
                  ))}
                </div>
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
        message={(() => {
          if (!porEliminar) return '';
          const { tercero, cliente } = perfilesVinculados(porEliminar);
          const perfiles = [
            tercero ? 'su perfil de tercero' : '',
            cliente ? 'su ficha de cliente' : '',
          ].filter(Boolean);
          const consecuencia = perfiles.length
            ? ` También se eliminarán ${perfiles.join(' y ')} vinculado(s) a esta cuenta.`
            : '';
          return `¿Seguro que deseas eliminar a ${porEliminar.nombre || 'este usuario'}? Perderá el acceso a la plataforma.${consecuencia}`;
        })()}
        confirmLabel="Eliminar usuario"
        onCancel={() => setPorEliminar(null)}
        onConfirm={confirmarEliminar}
      />
      <Toast toast={toast} onClose={close} />
    </PageShell>
  );
}

export default GestionUsuarios;
