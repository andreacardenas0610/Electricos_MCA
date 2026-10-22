import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Globe,
  KeyRound,
  ListChecks,
  Plus,
  Shield,
  ShieldCheck,
  Smartphone,
  UserCog,
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
  ACCIONES_PERMISO,
  MODULOS_PERMISO,
  generarCodigoRol,
  permisosOtorgados,
} from '../../../shared/services/rolesService.js';

const PLATAFORMAS = ['Web', 'Móvil'];

const FORMULARIO_ROL = (rol = null) => ({
  id: rol?.id || null,
  nombre: rol?.nombre || '',
  codigo: rol?.codigo || 'ROL-NUEVO',
  descripcion: rol?.descripcion || '',
  plataformas: rol?.plataformas || ['Web'],
  estado: rol?.estado || 'Activo',
  permisos: rol?.permisos || {},
});

function PlataformaIcono({ plataforma }) {
  return plataforma === 'Móvil' ? <Smartphone size={14} /> : <Globe size={14} />;
}

export function GestionRolesPermisos() {
  const {
    data: datos,
    error,
    loading,
    reload: cargarDatos,
  } = useApiData(async () => {
    const [roles, usuarios] = await Promise.all([
      apiRequest('/roles'),
      apiRequest('/usuarios'),
    ]);
    return { roles, usuarios };
  }, { roles: [], usuarios: [] });
  const { roles, usuarios } = datos;

  const [busqueda, setBusqueda] = useState('');
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [formulario, setFormulario] = useState(null);
  const [errores, setErrores] = useState({});
  const [detalleId, setDetalleId] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null);
  const { toast, notify, close } = useToast();

  const conteoUsuarios = useMemo(() => usuarios.reduce((mapa, usuario) => {
    mapa[usuario.rol] = (mapa[usuario.rol] || 0) + 1;
    return mapa;
  }, {}), [usuarios]);

  const resumen = useMemo(() => ({
    total: roles.length,
    activos: roles.filter((rol) => rol.estado === 'Activo').length,
    permisos: roles.reduce((total, rol) => total + permisosOtorgados(rol), 0),
    usuariosAsignados: usuarios.length,
  }), [roles, usuarios]);

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return roles;
    return roles.filter((rol) => (
      `${rol.nombre} ${rol.codigo} ${rol.descripcion}`
        .toLowerCase()
        .includes(termino)
    ));
  }, [roles, busqueda]);

  const rolActivo = roles.find((rol) => String(rol.id) === String(seleccionadoId)) || roles[0] || null;
  const usuariosDelRol = rolActivo
    ? usuarios.filter((usuario) => usuario.rol === rolActivo.nombre)
    : [];
  const rolDetalle = roles.find((rol) => String(rol.id) === String(detalleId));

  const abrirNuevo = () => {
    setFormulario(FORMULARIO_ROL());
    setErrores({});
  };

  const abrirEdicion = (rol) => {
    setDetalleId(null);
    setFormulario(FORMULARIO_ROL(rol));
    setErrores({});
  };

  const cerrarFormulario = () => {
    setFormulario(null);
    setErrores({});
  };

  const setCampo = (campo, valor) => {
    setFormulario((actual) => {
      const siguiente = { ...actual, [campo]: valor };
      if (campo === 'nombre' && !actual.id) {
        siguiente.codigo = generarCodigoRol(valor);
      }
      return siguiente;
    });
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
  };

  const alternarPlataforma = (plataforma) => {
    setFormulario((actual) => {
      const activa = actual.plataformas.includes(plataforma);
      const plataformas = activa
        ? actual.plataformas.filter((item) => item !== plataforma)
        : [...actual.plataformas, plataforma];
      return { ...actual, plataformas: plataformas.length ? plataformas : actual.plataformas };
    });
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    const nuevosErrores = {};
    if (!formulario.nombre.trim()) nuevosErrores.nombre = 'Escribe el nombre del rol.';
    const duplicado = roles.some((rol) => (
      rol.nombre.toLowerCase() === formulario.nombre.trim().toLowerCase()
      && String(rol.id) !== String(formulario.id)
    ));
    if (formulario.nombre.trim() && duplicado) {
      nuevosErrores.nombre = 'Ya existe un rol con ese nombre.';
    }
    if (Object.keys(nuevosErrores).length) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      const guardado = await apiRequest(
        formulario.id ? `/roles/${encodeURIComponent(formulario.id)}` : '/roles',
        {
          method: formulario.id ? 'PUT' : 'POST',
          body: formulario,
        },
      );
      await cargarDatos();
      setSeleccionadoId(guardado.id);
      notify(
        'success',
        formulario.id ? 'Rol actualizado' : 'Rol creado',
        `${guardado.nombre} · ${guardado.codigo}.`,
      );
      cerrarFormulario();
    } catch (error) {
      notify('error', 'No se pudo guardar', error.message);
    }
  };

  const alternarPermiso = (modulo, accion) => {
    if (!rolActivo) return;
    const actuales = rolActivo.permisos?.[modulo] || [];
    const siguientes = actuales.includes(accion)
      ? actuales.filter((item) => item !== accion)
      : [...actuales, accion];
    persistirPermisos({ ...rolActivo.permisos, [modulo]: siguientes });
  };

  const alternarModulo = (modulo) => {
    if (!rolActivo) return;
    const actuales = rolActivo.permisos?.[modulo] || [];
    const todos = ACCIONES_PERMISO.every((accion) => actuales.includes(accion.id));
    const siguientes = todos ? [] : ACCIONES_PERMISO.map((accion) => accion.id);
    persistirPermisos({ ...rolActivo.permisos, [modulo]: siguientes });
  };

  const persistirPermisos = async (permisos) => {
    try {
      await apiRequest(`/roles/${encodeURIComponent(rolActivo.id)}`, {
        method: 'PUT',
        body: { ...rolActivo, permisos },
      });
      await cargarDatos();
    } catch (error) {
      notify('error', 'No se pudieron actualizar los permisos', error.message);
    }
  };

  const alternarEstado = async (rol) => {
    try {
      const actualizado = await apiRequest(`/roles/${encodeURIComponent(rol.id)}/estado`, {
        method: 'PATCH',
        body: { estado: rol.estado === 'Activo' ? 'Inactivo' : 'Activo' },
      });
      await cargarDatos();
      notify('success', `Rol ${actualizado.estado.toLowerCase()}`, actualizado.nombre);
    } catch (error) {
      notify('error', 'No se pudo cambiar el estado', error.message);
    }
  };

  const confirmarEliminar = async () => {
    if (!porEliminar) return;
    try {
      await apiRequest(`/roles/${encodeURIComponent(porEliminar.id)}`, { method: 'DELETE' });
      await cargarDatos();
      notify('success', 'Rol eliminado', `${porEliminar.nombre} se retiró del sistema.`);
      setPorEliminar(null);
      if (String(rolActivo?.id) === String(porEliminar.id)) setSeleccionadoId(null);
    } catch (error) {
      notify('error', 'No se pudo eliminar', error.message);
      setPorEliminar(null);
    }
  };

  return (
    <PageShell>
      {error && <p role="alert" style={{ color: '#b91c1c' }}>No se pudieron cargar roles y usuarios desde la API: {error}</p>}
      {loading && <p role="status">Cargando roles desde la API...</p>}
      <PageHeader
        eyebrow="Roles y permisos"
        title="Roles y permisos"
        subtitle="Define qué puede ver y hacer cada rol dentro de los módulos de Eléctricos MCA."
        icon={ShieldCheck}
        actions={
          <Button variant="primary" icon={Plus} onClick={abrirNuevo}>
            Nuevo rol
          </Button>
        }
      />

      <div className="mca-kpis">
        <KpiCard
          label="Roles registrados"
          value={resumen.total}
          hint={`${resumen.activos} activos`}
          icon={ShieldCheck}
          tone="yellow"
        />
        <KpiCard
          label="Roles activos"
          value={resumen.activos}
          hint={`${resumen.total - resumen.activos} inactivos`}
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label="Permisos otorgados"
          value={resumen.permisos}
          hint="Acciones habilitadas"
          icon={KeyRound}
          tone="info"
        />
        <KpiCard
          label="Usuarios asignados"
          value={resumen.usuariosAsignados}
          hint="Cuentas con rol"
          icon={UsersRound}
          tone="indigo"
        />
      </div>

      <div className="mca-dashboard-grid">
        <Panel
          title={rolActivo ? `Permisos · ${rolActivo.nombre}` : 'Permisos del rol'}
          subtitle={rolActivo
            ? 'Marca las acciones permitidas por módulo. Cada cambio se guarda al instante.'
            : 'Selecciona un rol para configurar sus permisos.'}
          actions={rolActivo && (
            <>
              <EstadoToggle
                estado={rolActivo.estado}
                estados={ESTADOS.usuario}
                onClick={() => alternarEstado(rolActivo)}
                width={110}
              />
              <AccionesFila
                onVer={() => setDetalleId(rolActivo.id)}
                onEditar={() => abrirEdicion(rolActivo)}
                onEliminar={() => setPorEliminar(rolActivo)}
              />
            </>
          )}
          flush={!rolActivo}
        >
          {rolActivo ? (
            <>
              <div className="mca-row" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                <Badge tone="indigo">{rolActivo.codigo}</Badge>
                {rolActivo.plataformas.map((plataforma) => (
                  <Badge key={plataforma} tone="neutral">
                    <span className="mca-row" style={{ gap: 5 }}>
                      <PlataformaIcono plataforma={plataforma} /> {plataforma}
                    </span>
                  </Badge>
                ))}
                <Badge tone={rolActivo.estado === 'Activo' ? 'success' : 'danger'}>
                  {rolActivo.estado}
                </Badge>
                <span className="mca-muted" style={{ fontSize: 12 }}>
                  {permisosOtorgados(rolActivo)} de {MODULOS_PERMISO.length * ACCIONES_PERMISO.length} permisos
                </span>
              </div>

              {rolActivo.descripcion && (
                <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
                  {rolActivo.descripcion}
                </p>
              )}

              <div className="mca-table-wrap">
                <table className="mca-table">
                  <thead>
                    <tr>
                      <th>Módulo</th>
                      {ACCIONES_PERMISO.map((accion) => (
                        <th key={accion.id} style={{ textAlign: 'center', width: 92 }}>
                          {accion.nombre}
                        </th>
                      ))}
                      <th style={{ textAlign: 'right', width: 110 }}>Todos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULOS_PERMISO.map((modulo) => {
                      const acciones = rolActivo.permisos?.[modulo.id] || [];
                      const todos = ACCIONES_PERMISO.every((accion) => acciones.includes(accion.id));
                      return (
                        <tr key={modulo.id}>
                          <td>
                            <strong>{modulo.nombre}</strong>
                            <span className="mca-muted" style={{ display: 'block', fontSize: 11 }}>
                              {acciones.length} de {ACCIONES_PERMISO.length} acciones
                            </span>
                          </td>
                          {ACCIONES_PERMISO.map((accion) => (
                            <td key={accion.id} style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={acciones.includes(accion.id)}
                                onChange={() => alternarPermiso(modulo.id, accion.id)}
                                aria-label={`${accion.nombre} ${modulo.nombre}`}
                                style={{
                                  width: 16,
                                  height: 16,
                                  accentColor: 'var(--accent-yellow)',
                                  cursor: 'pointer',
                                }}
                              />
                            </td>
                          ))}
                          <td style={{ textAlign: 'right' }}>
                            <Button size="sm" variant="ghost" onClick={() => alternarModulo(modulo.id)}>
                              {todos ? 'Quitar todos' : 'Dar todos'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 18 }}>
                <div className="mca-row" style={{ gap: 8, marginBottom: 10 }}>
                  <UsersRound size={15} />
                  <strong style={{ fontSize: 13 }}>Usuarios con este rol</strong>
                  <Badge tone="neutral">{usuariosDelRol.length}</Badge>
                </div>
                {usuariosDelRol.length ? (
                  <div className="mca-row" style={{ gap: 8, flexWrap: 'wrap' }}>
                    {usuariosDelRol.map((usuario) => (
                      <span key={usuario.id} className="mca-chip">
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--accent-yellow)',
                            fontSize: 9,
                            fontWeight: 800,
                          }}
                        >
                          {usuario.nombre.slice(0, 2).toUpperCase()}
                        </span>
                        {usuario.nombre}
                        <Badge tone={usuario.estado === 'Activo' ? 'success' : 'danger'}>
                          {usuario.estado}
                        </Badge>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mca-muted" style={{ margin: 0, fontSize: 12 }}>
                    Ningún usuario tiene asignado este rol todavía.
                  </p>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              icon={ShieldCheck}
              title="Sin roles configurados"
              message="Crea el primer rol para comenzar a asignar permisos."
              action={<Button icon={Plus} variant="primary" onClick={abrirNuevo}>Nuevo rol</Button>}
            />
          )}
        </Panel>

        <Panel
          title="Roles del sistema"
          subtitle={`${filtrados.length} de ${roles.length} roles`}
          actions={
            <SearchInput
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar rol..."
            />
          }
          flush
        >
          <div className="mca-list">
            {filtrados.map((rol) => {
              const activo = rolActivo && String(rol.id) === String(rolActivo.id);
              return (
                <div
                  key={rol.id}
                  className="mca-list__item mca-list__item--button"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSeleccionadoId(rol.id)}
                  onKeyDown={(evento) => {
                    if (evento.key === 'Enter' || evento.key === ' ') {
                      evento.preventDefault();
                      setSeleccionadoId(rol.id);
                    }
                  }}
                  style={activo ? {
                    background: 'var(--bg-elevated)',
                    boxShadow: 'inset 3px 0 0 var(--accent-yellow)',
                  } : undefined}
                >
                  <div className="mca-list__icon">
                    <Shield size={18} strokeWidth={1.9} />
                  </div>
                  <div className="mca-list__body">
                    <div className="mca-list__title">
                      {rol.nombre}
                      {activo && <Badge tone="yellow">Seleccionado</Badge>}
                    </div>
                    <div className="mca-list__meta">
                      {rol.codigo} · {conteoUsuarios[rol.nombre] || 0} usuarios
                    </div>
                  </div>
                  <Badge tone={rol.estado === 'Activo' ? 'success' : 'danger'}>
                    {rol.estado}
                  </Badge>
                </div>
              );
            })}
          </div>
          {!filtrados.length && (
            <EmptyState
              icon={Shield}
              title="Sin resultados"
              message="No hay roles que coincidan con la búsqueda."
            />
          )}
        </Panel>
      </div>

      <Modal
        open={Boolean(formulario)}
        onClose={cerrarFormulario}
        title={formulario?.id ? 'Editar rol' : 'Nuevo rol'}
        subtitle="El código se genera automáticamente y los permisos se configuran en la matriz."
        icon={ShieldCheck}
        footer={
          <>
            <Button onClick={cerrarFormulario}>Cancelar</Button>
            <Button variant="primary" type="submit" form="form-rol">
              {formulario?.id ? 'Guardar cambios' : 'Crear rol'}
            </Button>
          </>
        }
      >
        {formulario && (
          <form id="form-rol" className="mca-form-grid" onSubmit={guardar}>
            <Field label="Nombre del rol" required error={errores.nombre}>
              <input
                className="mca-input"
                value={formulario.nombre}
                onChange={(evento) => setCampo('nombre', evento.target.value)}
                placeholder="Coordinador de obra"
                autoFocus
              />
            </Field>
            <Field label="Código" hint="Se calcula a partir del nombre.">
              <input className="mca-input" value={formulario.codigo} readOnly disabled />
            </Field>
            <Field label="Descripción" full>
              <textarea
                className="mca-textarea"
                value={formulario.descripcion}
                onChange={(evento) => setCampo('descripcion', evento.target.value)}
                placeholder="Responsabilidades y alcance del rol."
                rows={3}
              />
            </Field>
            <Field label="Plataformas" required hint="Selecciona dónde puede operar el rol.">
              <div className="mca-segmented">
                {PLATAFORMAS.map((plataforma) => (
                  <button
                    key={plataforma}
                    type="button"
                    className={formulario.plataformas.includes(plataforma) ? 'is-active' : ''}
                    onClick={() => alternarPlataforma(plataforma)}
                  >
                    <PlataformaIcono plataforma={plataforma} /> {plataforma}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Estado">
              <select
                className="mca-select"
                value={formulario.estado}
                onChange={(evento) => setCampo('estado', evento.target.value)}
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </Field>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(rolDetalle)}
        onClose={() => setDetalleId(null)}
        title={rolDetalle?.nombre || 'Detalle del rol'}
        subtitle={`${rolDetalle?.codigo || ''} · ${permisosOtorgados(rolDetalle)} permisos`}
        icon={ListChecks}
        footer={
          <>
            <Button onClick={() => setDetalleId(null)}>Cerrar</Button>
            {rolDetalle && (
              <Button variant="primary" icon={UserCog} onClick={() => abrirEdicion(rolDetalle)}>
                Editar rol
              </Button>
            )}
          </>
        }
      >
        {rolDetalle && (
          <>
            <DetailGrid>
              <DetailItem label="Nombre">{rolDetalle.nombre}</DetailItem>
              <DetailItem label="Código">{rolDetalle.codigo}</DetailItem>
              <DetailItem label="Estado">
                <Badge tone={rolDetalle.estado === 'Activo' ? 'success' : 'danger'}>
                  {rolDetalle.estado}
                </Badge>
              </DetailItem>
              <DetailItem label="Usuarios asignados">{conteoUsuarios[rolDetalle.nombre] || 0}</DetailItem>
              <DetailItem label="Plataformas" full>
                <span className="mca-row" style={{ gap: 10 }}>
                  {rolDetalle.plataformas.map((plataforma) => (
                    <span key={plataforma} className="mca-row" style={{ gap: 5, fontSize: 12 }}>
                      <PlataformaIcono plataforma={plataforma} /> {plataforma}
                    </span>
                  ))}
                </span>
              </DetailItem>
              <DetailItem label="Descripción" full>{rolDetalle.descripcion || '—'}</DetailItem>
            </DetailGrid>

            <div className="mca-notice is-info" style={{ marginTop: 16 }}>
              <KeyRound size={16} />
              <div>
                <strong>Resumen de permisos</strong>
                <p style={{ margin: '4px 0 0' }}>
                  {MODULOS_PERMISO.map((modulo) => {
                    const cantidad = (rolDetalle.permisos?.[modulo.id] || []).length;
                    return `${modulo.nombre}: ${cantidad}/${ACCIONES_PERMISO.length}`;
                  }).join(' · ')}
                </p>
              </div>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(porEliminar)}
        title="Eliminar rol"
        message={`¿Seguro que deseas eliminar el rol ${porEliminar?.nombre || ''}? Solo es posible si no tiene usuarios asignados.`}
        confirmLabel="Eliminar rol"
        onCancel={() => setPorEliminar(null)}
        onConfirm={confirmarEliminar}
      />
      <Toast toast={toast} onClose={close} />
    </PageShell>
  );
}

export default GestionRolesPermisos;
