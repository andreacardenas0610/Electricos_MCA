import { useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Factory,
  Handshake,
  House,
  Mail,
  MapPin,
  Phone,
  Plus,
  UsersRound,
  Wrench,
} from 'lucide-react';

import { AccionesFila } from '../../../shared/components/AccionesFila.jsx';
import { EstadoToggle, ESTADOS } from '../../../shared/components/EstadoToggle.jsx';
import { CampoDepartamento, CampoMunicipio } from '../../../shared/components/UbicacionColombia.jsx';
import { apiRequest } from '../../../shared/api.js';
import { useApiData } from '../../../shared/useApiData.js';
import {
  Badge,
  Button,
  Combobox,
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
import { formatearFecha } from '../../../shared/services/base.js';
import {
  TIPOS_PROPIEDAD,
  normalizarCliente,
} from '../../../shared/services/clientesService.js';
import {
  buscarOrdenes,
  generarCodigoOrden,
  resumenOrdenes,
} from '../../../shared/services/ordenesService.js';
import {
  normalizarTecnico,
} from '../../../shared/services/tercerosService.js';

const ESTADOS_ACTIVOS_AGENDA = ['Programada', 'En proceso', 'En Ejecución', 'En ejecución'];
const ESTADOS_CON_FECHA = ['Programada', 'En Ejecución', 'En ejecución'];
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TONO_PROPIEDAD = {
  Residencial: 'info',
  Comercial: 'indigo',
  Industrial: 'warning',
};

const TONO_PRIORIDAD = {
  Baja: 'neutral',
  Media: 'info',
  Alta: 'warning',
};

const ICONO_PROPIEDAD = {
  Residencial: House,
  Comercial: Building2,
  Industrial: Factory,
};

const FORMULARIO_CLIENTE = (cliente = null) => ({
  tipoPropiedad: cliente?.tipoPropiedad || 'Comercial',
  nombre: cliente?.nombre || '',
  documento: cliente?.documento || '',
  contacto: cliente?.contacto || '',
  telefono: cliente?.telefono || '',
  correo: cliente?.correo || '',
  direccion: cliente?.direccion || '',
  municipio: cliente?.municipio || '',
  departamento: cliente?.departamento || '',
  estado: cliente?.estado || 'Activo',
});

const FORMULARIO_TECNICO = (tecnico = null) => ({
  nombre: tecnico?.nombre || '',
  documento: tecnico?.documento || '',
  telefono: tecnico?.telefono || '',
  correo: tecnico?.correo || '',
  especialidad: tecnico?.especialidad || '',
  estado: tecnico?.estado || 'Activo',
});

const FORMULARIO_ORDEN = (orden = null, codigo = '') => ({
  codigo: orden?.codigo || codigo,
  clienteId: orden?.clienteId || '',
  servicioId: orden?.servicioId || '',
  responsableId: orden?.responsableId || '',
  prioridad: orden?.prioridad || 'Media',
  fecha: orden?.fecha || '',
  estado: orden?.estado || 'Pendiente',
  descripcion: orden?.descripcion || '',
});

function estadoApi({ loading, error }) {
  if (loading) return <p role="status">Cargando datos desde la API...</p>;
  if (error) return <p role="alert" style={{ color: '#b91c1c' }}>No se pudo conectar con la API: {error}</p>;
  return null;
}

function mapearOrdenApi(orden, clientes, servicios) {
  const cliente = clientes.find((item) => String(item.id) === String(orden.cliente_id));
  const servicio = servicios.find((item) => String(item.id) === String(orden.servicio_id));

  return {
    id: orden.id,
    codigo: orden.codigo,
    clienteId: String(orden.cliente_id ?? ''),
    cliente: orden.cliente || cliente?.nombre || 'Cliente sin nombre',
    clienteDocumento: cliente?.documento || '',
    clienteTelefono: cliente?.telefono || '',
    clienteDireccion: cliente?.direccion || '',
    servicioId: String(orden.servicio_id ?? ''),
    servicio: orden.servicio || servicio?.nombre || 'Servicio',
    servicioHoras: servicio?.horas || 0,
    responsableId: String(orden.tercero_id ?? ''),
    responsable: orden.tecnico || 'Sin asignar',
    prioridadId: String(orden.prioridad_id ?? ''),
    prioridad: orden.prioridad || 'Media',
    estadoId: String(orden.estado_id ?? ''),
    estado: orden.estado || 'Pendiente',
    fecha: orden.fecha_programada || '',
    descripcion: orden.descripcion || '',
  };
}

function idCatalogoPorNombre(catalogo, nombre) {
  const normalizar = (valor) => String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return catalogo.find((item) => normalizar(item.nombre) === normalizar(nombre))?.id;
}

export function Clientes() {
  const {
    data: clientes,
    error: errorClientes,
    loading: cargandoClientes,
    reload: cargarClientes,
  } = useApiData(async () => (await apiRequest('/clientes')).map(normalizarCliente), []);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [formulario, setFormulario] = useState(null);
  const [errores, setErrores] = useState({});
  const [detalleId, setDetalleId] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null);
  const { toast, notify, close } = useToast();

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return clientes.filter((cliente) => {
      if (filtroTipo !== 'Todos' && cliente.tipoPropiedad !== filtroTipo) return false;
      if (!termino) return true;
      return `${cliente.nombre} ${cliente.documento} ${cliente.contacto} ${cliente.telefono} ${cliente.correo} ${cliente.municipio} ${cliente.departamento}`
        .toLowerCase()
        .includes(termino);
    });
  }, [clientes, busqueda, filtroTipo]);

  const resumen = useMemo(
    () => ({
      total: clientes.length,
      activos: clientes.filter((cliente) => cliente.estado === 'Activo').length,
      residenciales: clientes.filter((cliente) => cliente.tipoPropiedad === 'Residencial').length,
      empresas: clientes.filter((cliente) => cliente.tipoPropiedad !== 'Residencial').length,
    }),
    [clientes],
  );

  const clienteDetalle = clientes.find((cliente) => String(cliente.id) === String(detalleId));

  const abrirNuevo = () => {
    setFormulario(FORMULARIO_CLIENTE());
    setErrores({});
  };

  const abrirEdicion = (cliente) => {
    setDetalleId(null);
    setFormulario({ ...FORMULARIO_CLIENTE(cliente), id: cliente.id });
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
    if (!formulario.nombre.trim()) {
      nuevosErrores.nombre = 'Escribe el nombre o razón social.';
    }
    if (!formulario.documento.trim()) {
      nuevosErrores.documento = 'Escribe el documento o NIT.';
    }
    if (!formulario.telefono.trim()) {
      nuevosErrores.telefono = 'Escribe el teléfono de contacto.';
    }
    if (formulario.correo.trim() && !CORREO_VALIDO.test(formulario.correo.trim())) {
      nuevosErrores.correo = 'Ingresa un correo electrónico válido.';
    }
    if (Object.keys(nuevosErrores).length) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      const tipoPropiedad = TIPOS_PROPIEDAD.find(
        (tipo) => tipo.nombre === formulario.tipoPropiedad,
      ) || TIPOS_PROPIEDAD[0];
      const payload = {
        nombre_razon_social: formulario.nombre.trim(),
        documento_nit: formulario.documento.trim(),
        tipo_cliente: tipoPropiedad.nombre === 'Residencial' ? 'Natural' : 'Jurídico',
        tipo_propiedad_id: tipoPropiedad.id,
        estado: formulario.estado,
        contacto: formulario.contacto.trim(),
        telefono: formulario.telefono.trim(),
        correo_electronico: formulario.correo.trim(),
        direccion: formulario.direccion.trim(),
        municipio: formulario.municipio.trim(),
        departamento: formulario.departamento.trim(),
      };
      const resultado = await apiRequest(
        formulario.id ? `/clientes/${formulario.id}` : '/clientes',
        { method: formulario.id ? 'PUT' : 'POST', body: payload },
      );
      const guardado = normalizarCliente(resultado);
      await cargarClientes();
      notify(
        'success',
        formulario.id ? 'Cliente actualizado' : 'Cliente creado',
        `${guardado.nombre} · ${guardado.tipoPropiedad}.`,
      );
      cerrarFormulario();
    } catch (error) {
      notify('error', 'No se pudo guardar', error.message);
    }
  };

  const cambiarEstado = async (cliente) => {
    try {
      const actualizado = await apiRequest(`/clientes/${cliente.id}`, {
        method: 'PUT',
        body: {
          nombre_razon_social: cliente.nombre,
          documento_nit: cliente.documento,
          tipo_cliente: cliente.tipoCliente,
          tipo_propiedad_id: TIPOS_PROPIEDAD.find((tipo) => tipo.nombre === cliente.tipoPropiedad)?.id,
          estado: cliente.estado === 'Activo' ? 'Inactivo' : 'Activo',
          contacto: cliente.contacto,
          telefono: cliente.telefono,
          correo_electronico: cliente.correo,
          direccion: cliente.direccion,
          municipio: cliente.municipio,
          departamento: cliente.departamento,
        },
      });
      await cargarClientes();
      const actualizadoNormalizado = normalizarCliente(actualizado);
      notify('success', 'Estado actualizado', `${actualizadoNormalizado.nombre} · ${actualizadoNormalizado.estado}.`);
    } catch (error) {
      notify('error', 'No se pudo cambiar el estado', error.message);
    }
  };

  const confirmarEliminacion = async () => {
    try {
      await apiRequest(`/clientes/${porEliminar.id}`, { method: 'DELETE' });
      await cargarClientes();
      notify('success', 'Cliente eliminado', porEliminar.nombre);
      if (String(detalleId) === String(porEliminar.id)) setDetalleId(null);
      setPorEliminar(null);
    } catch (error) {
      notify('error', 'No se pudo eliminar', error.message);
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Clientes"
        title="Clientes"
        subtitle="Empresas y personas que alimentan las cotizaciones, la agenda y las órdenes de servicio."
        icon={UsersRound}
        actions={
          <Button variant="primary" icon={Plus} onClick={abrirNuevo}>
            Nuevo cliente
          </Button>
        }
      />
      {estadoApi({ loading: cargandoClientes, error: errorClientes })}

      <div className="mca-kpis">
        <KpiCard
          label="Clientes registrados"
          value={resumen.total}
          hint={`${clientes.length} fichas disponibles`}
          icon={UsersRound}
          tone="yellow"
        />
        <KpiCard
          label="Clientes activos"
          value={resumen.activos}
          hint={`${resumen.total - resumen.activos} inactivos`}
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label="Residenciales"
          value={resumen.residenciales}
          hint="Personas naturales"
          icon={House}
          tone="info"
        />
        <KpiCard
          label="Empresas"
          value={resumen.empresas}
          hint="Comerciales e industriales"
          icon={Building2}
          tone="indigo"
        />
      </div>

      <Panel
        title="Directorio de clientes"
        subtitle={`${filtrados.length} de ${clientes.length} clientes`}
        actions={
          <>
            <SearchInput
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar por nombre, documento, contacto o municipio..."
            />
            <select
              className="mca-select"
              style={{ width: 170 }}
              value={filtroTipo}
              onChange={(evento) => setFiltroTipo(evento.target.value)}
              aria-label="Filtrar clientes por tipo de propiedad"
            >
              <option value="Todos">Todos los tipos</option>
              {TIPOS_PROPIEDAD.map((tipo) => (
                <option key={tipo.id} value={tipo.nombre}>
                  {tipo.nombre}
                </option>
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
                <th>Cliente</th>
                <th>Documento / NIT</th>
                <th>Tipo</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Municipio</th>
                <th>Estado</th>
                <th className="mca-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="mca-table__empty">
                    <EmptyState
                      icon={UsersRound}
                      title="Sin clientes para mostrar"
                      message="Ajusta los filtros o registra un nuevo cliente para comenzar."
                      action={
                        <Button size="sm" icon={Plus} onClick={abrirNuevo}>
                          Nuevo cliente
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtrados.map((cliente) => {
                  const Icono = ICONO_PROPIEDAD[cliente.tipoPropiedad] || Building2;
                  return (
                    <tr key={cliente.id}>
                      <td>
                        <div className="mca-cell-title">
                          <div className="mca-cell-icon">
                            <Icono size={15} strokeWidth={1.9} />
                          </div>
                          <div>
                            <div className="is-primary">{cliente.nombre}</div>
                            <div className="mca-soft" style={{ fontSize: 10.5, marginTop: 2 }}>
                              {cliente.tipoCliente}
                              {cliente.departamento ? ` · ${cliente.departamento}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="is-nowrap">{cliente.documento || '—'}</td>
                      <td>
                        <Badge tone={TONO_PROPIEDAD[cliente.tipoPropiedad] || 'neutral'}>
                          {cliente.tipoPropiedad}
                        </Badge>
                      </td>
                      <td>
                        <div>{cliente.contacto || '—'}</div>
                        {cliente.correo && (
                          <div className="mca-soft" style={{ fontSize: 10.5, marginTop: 2 }}>
                            {cliente.correo}
                          </div>
                        )}
                      </td>
                      <td className="is-nowrap">
                        <div className="mca-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                          <Phone size={13} strokeWidth={1.9} className="mca-soft" />
                          <span>{cliente.telefono || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="mca-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                          <MapPin size={13} strokeWidth={1.9} className="mca-soft" />
                          <span>{cliente.municipio || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <EstadoToggle
                          estado={cliente.estado}
                          estados={ESTADOS.usuario}
                          width={110}
                          onClick={() => cambiarEstado(cliente)}
                        />
                      </td>
                      <td className="mca-center">
                        <div className="mca-row" style={{ justifyContent: 'center', flexWrap: 'nowrap' }}>
                          <AccionesFila
                            onVer={() => setDetalleId(cliente.id)}
                            onEditar={() => abrirEdicion(cliente)}
                            onEliminar={() => setPorEliminar(cliente)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={Boolean(formulario)}
        onClose={cerrarFormulario}
        title={formulario?.id ? 'Editar cliente' : 'Nuevo cliente'}
        subtitle="Estos datos se reutilizan automáticamente en cotizaciones, agenda y órdenes."
        icon={Building2}
        size="lg"
        footer={
          <>
            <Button onClick={cerrarFormulario}>Cancelar</Button>
            <Button variant="primary" type="submit" form="form-cliente">
              {formulario?.id ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </>
        }
      >
        {formulario && (
          <form id="form-cliente" className="mca-form-grid" onSubmit={guardar} noValidate>
            <Field
              label="Tipo de propiedad"
              full
              hint="Residencial usa persona natural; Comercial e Industrial usan razón social."
            >
              <div className="mca-row" style={{ gap: 8 }}>
                {TIPOS_PROPIEDAD.map((tipo) => (
                  <Button
                    key={tipo.id}
                    size="sm"
                    variant={formulario.tipoPropiedad === tipo.nombre ? 'primary' : 'ghost'}
                    onClick={() => setCampo('tipoPropiedad', tipo.nombre)}
                  >
                    {tipo.nombre}
                  </Button>
                ))}
              </div>
            </Field>

            <Field
              label={formulario.tipoPropiedad === 'Residencial' ? 'Nombre completo' : 'Razón social'}
              required
              error={errores.nombre}
            >
              <input
                className="mca-input"
                value={formulario.nombre}
                onChange={(evento) => setCampo('nombre', evento.target.value)}
                placeholder={formulario.tipoPropiedad === 'Residencial' ? 'Ana María Gómez' : 'Empresa S.A.S.'}
                autoFocus
              />
            </Field>

            <Field
              label={formulario.tipoPropiedad === 'Residencial' ? 'Documento de identidad' : 'NIT'}
              required
              error={errores.documento}
            >
              <input
                className="mca-input"
                value={formulario.documento}
                onChange={(evento) => setCampo('documento', evento.target.value)}
                placeholder={formulario.tipoPropiedad === 'Residencial' ? '1.020.304.050' : '900.123.456-7'}
              />
            </Field>

            <Field label="Persona de contacto">
              <input
                className="mca-input"
                value={formulario.contacto}
                onChange={(evento) => setCampo('contacto', evento.target.value)}
                placeholder="Nombre del contacto"
              />
            </Field>

            <Field label="Teléfono" required error={errores.telefono}>
              <input
                className="mca-input"
                type="tel"
                value={formulario.telefono}
                onChange={(evento) => setCampo('telefono', evento.target.value)}
                placeholder="310 555 0000"
              />
            </Field>

            <Field label="Correo electrónico" error={errores.correo}>
              <input
                className="mca-input"
                type="email"
                value={formulario.correo}
                onChange={(evento) => setCampo('correo', evento.target.value)}
                placeholder="contacto@empresa.com"
              />
            </Field>

            <Field label="Municipio">
              <CampoMunicipio
                className="mca-input"
                departamento={formulario.departamento}
                value={formulario.municipio}
                onChange={(evento) => setCampo('municipio', evento.target.value)}
                placeholder="Escribe o selecciona un municipio"
              />
            </Field>

            <Field label="Departamento">
              <CampoDepartamento
                className="mca-input"
                value={formulario.departamento}
                onChange={(evento) => setCampo('departamento', evento.target.value)}
                placeholder="Escribe o selecciona un departamento"
              />
            </Field>

            <Field label="Dirección" full>
              <input
                className="mca-input"
                value={formulario.direccion}
                onChange={(evento) => setCampo('direccion', evento.target.value)}
                placeholder="Calle 00 # 00-00"
              />
            </Field>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(clienteDetalle)}
        onClose={() => setDetalleId(null)}
        title={clienteDetalle?.nombre}
        subtitle={
          clienteDetalle
            ? `${clienteDetalle.documento} · ${clienteDetalle.tipoPropiedad}`
            : ''
        }
        icon={Building2}
        size="lg"
        footer={
          clienteDetalle && (
            <>
              <Button onClick={() => setDetalleId(null)}>Cerrar</Button>
              <Button variant="primary" onClick={() => abrirEdicion(clienteDetalle)}>
                Editar cliente
              </Button>
            </>
          )
        }
      >
        {clienteDetalle && (
          <DetailGrid>
            <DetailItem label="Tipo de propiedad">{clienteDetalle.tipoPropiedad}</DetailItem>
            <DetailItem label="Tipo de cliente">{clienteDetalle.tipoCliente}</DetailItem>
            <DetailItem label="Documento / NIT">{clienteDetalle.documento || '—'}</DetailItem>
            <DetailItem label="Estado">
              <EstadoToggle
                estado={clienteDetalle.estado}
                estados={ESTADOS.usuario}
                width={110}
              />
            </DetailItem>
            <DetailItem label="Contacto">{clienteDetalle.contacto || '—'}</DetailItem>
            <DetailItem label="Teléfono">{clienteDetalle.telefono || '—'}</DetailItem>
            <DetailItem label="Correo electrónico" full>
              {clienteDetalle.correo || '—'}
            </DetailItem>
            <DetailItem label="Municipio">{clienteDetalle.municipio || '—'}</DetailItem>
            <DetailItem label="Departamento">{clienteDetalle.departamento || '—'}</DetailItem>
            <DetailItem label="Dirección" full>{clienteDetalle.direccion || '—'}</DetailItem>
          </DetailGrid>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(porEliminar)}
        title="Eliminar cliente"
        message={
          porEliminar
            ? `¿Seguro que deseas eliminar a ${porEliminar.nombre}? Las cotizaciones y órdenes ya emitidas conservan su historial.`
            : ''
        }
        confirmLabel="Eliminar cliente"
        onCancel={() => setPorEliminar(null)}
        onConfirm={confirmarEliminacion}
      />

      <Toast toast={toast} onClose={close} />
    </PageShell>
  );
}

export function GestionTerceros() {
  const {
    data: datos,
    error: errorTecnicos,
    loading: cargandoTecnicos,
    reload: cargarTecnicos,
  } = useApiData(async () => {
    const [tecnicosApi, ordenesApi] = await Promise.all([
      apiRequest('/terceros'),
      apiRequest('/ordenes-servicio'),
    ]);
    return {
      tecnicos: tecnicosApi.map((tercero) => normalizarTecnico({
        ...tercero,
        especialidad: tercero.empresa,
      })),
      actividades: ordenesApi.map((orden) => ({
        id: orden.id,
        tecnicoId: orden.tercero_id,
        estado: orden.estado,
        fecha: orden.fecha_programada || '',
        horaInicio: '',
        horaFin: '',
        servicio: orden.servicio || '',
        codigo: orden.codigo,
        cliente: orden.cliente || '',
      })),
    };
  }, { tecnicos: [], actividades: [] });
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [formulario, setFormulario] = useState(null);
  const [errores, setErrores] = useState({});
  const [detalleId, setDetalleId] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null);
  const { toast, notify, close } = useToast();

  const cargaTecnicos = useMemo(() => {
    const carga = {};
    datos.actividades
      .filter((actividad) => ESTADOS_ACTIVOS_AGENDA.includes(actividad.estado))
      .forEach((actividad) => {
        const clave = String(actividad.tecnicoId);
        carga[clave] = (carga[clave] || 0) + 1;
      });
    return carga;
  }, [datos.actividades]);

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return datos.tecnicos.filter((tecnico) => {
      if (filtroEstado !== 'Todos' && tecnico.estado !== filtroEstado) return false;
      if (!termino) return true;
      return `${tecnico.nombre} ${tecnico.documento} ${tecnico.telefono} ${tecnico.correo} ${tecnico.especialidad}`
        .toLowerCase()
        .includes(termino);
    });
  }, [datos.tecnicos, busqueda, filtroEstado]);

  const resumen = useMemo(
    () => ({
      total: datos.tecnicos.length,
      activos: datos.tecnicos.filter((tecnico) => tecnico.estado === 'Activo').length,
      especialidades: new Set(
        datos.tecnicos.map((tecnico) => tecnico.especialidad).filter(Boolean),
      ).size,
      asignados: datos.actividades.filter(
        (actividad) => ESTADOS_ACTIVOS_AGENDA.includes(actividad.estado),
      ).length,
    }),
    [datos.tecnicos, datos.actividades],
  );

  const tecnicoDetalle = datos.tecnicos.find(
    (tecnico) => String(tecnico.id) === String(detalleId),
  );

  const serviciosDetalle = useMemo(
    () => datos.actividades
      .filter(
        (actividad) => String(actividad.tecnicoId) === String(tecnicoDetalle?.id)
          && ESTADOS_ACTIVOS_AGENDA.includes(actividad.estado),
      )
      .sort((a, b) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`)),
    [datos.actividades, tecnicoDetalle],
  );

  const abrirNuevo = () => {
    setFormulario(FORMULARIO_TECNICO());
    setErrores({});
  };

  const abrirEdicion = (tecnico) => {
    setDetalleId(null);
    setFormulario({ ...FORMULARIO_TECNICO(tecnico), id: tecnico.id });
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
    if (!formulario.nombre.trim()) nuevosErrores.nombre = 'Escribe el nombre del tercero.';
    if (!formulario.documento.trim()) nuevosErrores.documento = 'Escribe el documento.';
    if (!formulario.telefono.trim()) nuevosErrores.telefono = 'Escribe el teléfono.';
    if (formulario.correo.trim() && !CORREO_VALIDO.test(formulario.correo.trim())) {
      nuevosErrores.correo = 'Ingresa un correo electrónico válido.';
    }
    if (Object.keys(nuevosErrores).length) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      const payload = {
        nombre_completo: formulario.nombre.trim(),
        documento: formulario.documento.trim(),
        empresa: formulario.especialidad.trim(),
        telefono: formulario.telefono.trim(),
        correo_electronico: formulario.correo.trim(),
        estado: formulario.estado || 'Activo',
      };
      const resultado = await apiRequest(
        formulario.id ? `/terceros/${formulario.id}` : '/terceros',
        { method: formulario.id ? 'PUT' : 'POST', body: payload },
      );
      const guardado = normalizarTecnico({
        ...resultado,
        especialidad: resultado.empresa,
      });
      await cargarTecnicos();
      notify(
        'success',
        formulario.id ? 'Tercero actualizado' : 'Tercero creado',
        `${guardado.nombre} · ${guardado.especialidad}.`,
      );
      cerrarFormulario();
    } catch (error) {
      notify('error', 'No se pudo guardar', error.message);
    }
  };

  const cambiarEstado = async (tecnico) => {
    try {
      const actualizado = await apiRequest(`/terceros/${tecnico.id}`, {
        method: 'PUT',
        body: {
          nombre_completo: tecnico.nombre,
          documento: tecnico.documento,
          empresa: tecnico.especialidad,
          telefono: tecnico.telefono,
          correo_electronico: tecnico.correo,
          estado: tecnico.estado === 'Activo' ? 'Inactivo' : 'Activo',
        },
      });
      await cargarTecnicos();
      const tecnicoActualizado = normalizarTecnico({
        ...actualizado,
        especialidad: actualizado.empresa,
      });
      notify('success', 'Estado actualizado', `${tecnicoActualizado.nombre} · ${tecnicoActualizado.estado}.`);
    } catch (error) {
      notify('error', 'No se pudo cambiar el estado', error.message);
    }
  };

  const solicitarEliminar = (tecnico) => {
    if (cargaTecnicos[String(tecnico.id)]) {
      notify(
        'warning',
        'Tercero con servicios activos',
        'Reasigna sus órdenes activas antes de eliminarlo.',
      );
      return;
    }
    setPorEliminar(tecnico);
  };

  const confirmarEliminacion = async () => {
    try {
      await apiRequest(`/terceros/${porEliminar.id}`, { method: 'DELETE' });
      await cargarTecnicos();
      notify('success', 'Tercero eliminado', porEliminar.nombre);
      if (String(detalleId) === String(porEliminar.id)) setDetalleId(null);
      setPorEliminar(null);
    } catch (error) {
      notify('error', 'No se pudo eliminar', error.message);
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Terceros"
        title="Terceros"
        subtitle="Técnicos externos disponibles para asignar en la agenda y las órdenes de servicio."
        icon={Handshake}
        actions={
          <Button variant="primary" icon={Plus} onClick={abrirNuevo}>
            Nuevo tercero
          </Button>
        }
      />
      {estadoApi({ loading: cargandoTecnicos, error: errorTecnicos })}

      <div className="mca-kpis">
        <KpiCard
          label="Terceros registrados"
          value={resumen.total}
          hint={`${datos.tecnicos.length} fichas disponibles`}
          icon={Handshake}
          tone="yellow"
        />
        <KpiCard
          label="Terceros activos"
          value={resumen.activos}
          hint={`${resumen.total - resumen.activos} inactivos`}
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label="Especialidades"
          value={resumen.especialidades}
          hint="Perfiles técnicos distintos"
          icon={Wrench}
          tone="info"
        />
        <KpiCard
          label="Servicios asignados"
          value={resumen.asignados}
          hint="Órdenes activas del equipo"
          icon={CalendarDays}
          tone="indigo"
        />
      </div>

      <Panel
        title="Equipo de terceros"
        subtitle={`${filtrados.length} de ${datos.tecnicos.length} terceros`}
        actions={
          <>
            <SearchInput
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar por nombre, documento o especialidad..."
            />
            <select
              className="mca-select"
              style={{ width: 160 }}
              value={filtroEstado}
              onChange={(evento) => setFiltroEstado(evento.target.value)}
              aria-label="Filtrar terceros por estado"
            >
              <option value="Todos">Todos</option>
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
            </select>
          </>
        }
        flush
      >
        <div className="mca-table-wrap">
          <table className="mca-table">
            <thead>
              <tr>
                <th>Tercero</th>
                <th>Documento</th>
                <th>Especialidad</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Servicios activos</th>
                <th>Estado</th>
                <th className="mca-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="mca-table__empty">
                    <EmptyState
                      icon={Handshake}
                      title="Sin terceros para mostrar"
                      message="Ajusta los filtros o registra un nuevo técnico externo."
                      action={
                        <Button size="sm" icon={Plus} onClick={abrirNuevo}>
                          Nuevo tercero
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtrados.map((tecnico) => {
                  const asignados = cargaTecnicos[String(tecnico.id)] || 0;
                  return (
                    <tr key={tecnico.id}>
                      <td>
                        <div className="mca-cell-title">
                          <div className="mca-cell-icon">
                            <Handshake size={15} strokeWidth={1.9} />
                          </div>
                          <div className="is-primary">{tecnico.nombre}</div>
                        </div>
                      </td>
                      <td className="is-nowrap">{tecnico.documento || '—'}</td>
                      <td>
                        <Badge tone="indigo">{tecnico.especialidad}</Badge>
                      </td>
                      <td className="is-nowrap">
                        <div className="mca-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                          <Phone size={13} strokeWidth={1.9} className="mca-soft" />
                          <span>{tecnico.telefono || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="mca-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                          <Mail size={13} strokeWidth={1.9} className="mca-soft" />
                          <span>{tecnico.correo || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <Badge tone={asignados ? 'warning' : 'neutral'}>
                          {asignados} {asignados === 1 ? 'servicio' : 'servicios'}
                        </Badge>
                      </td>
                      <td>
                        <EstadoToggle
                          estado={tecnico.estado}
                          estados={ESTADOS.usuario}
                          width={110}
                          onClick={() => cambiarEstado(tecnico)}
                        />
                      </td>
                      <td className="mca-center">
                        <div className="mca-row" style={{ justifyContent: 'center', flexWrap: 'nowrap' }}>
                          <AccionesFila
                            onVer={() => setDetalleId(tecnico.id)}
                            onEditar={() => abrirEdicion(tecnico)}
                            onEliminar={() => solicitarEliminar(tecnico)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={Boolean(formulario)}
        onClose={cerrarFormulario}
        title={formulario?.id ? 'Editar tercero' : 'Nuevo tercero'}
        subtitle="Los terceros activos se ofrecen automáticamente al agendar y crear órdenes."
        icon={Handshake}
        size="lg"
        footer={
          <>
            <Button onClick={cerrarFormulario}>Cancelar</Button>
            <Button variant="primary" type="submit" form="form-tercero">
              {formulario?.id ? 'Guardar cambios' : 'Crear tercero'}
            </Button>
          </>
        }
      >
        {formulario && (
          <form id="form-tercero" className="mca-form-grid" onSubmit={guardar} noValidate>
            <Field label="Nombre del tercero" required error={errores.nombre}>
              <input
                className="mca-input"
                value={formulario.nombre}
                onChange={(evento) => setCampo('nombre', evento.target.value)}
                placeholder="Nombre completo"
                autoFocus
              />
            </Field>

            <Field label="Documento" required error={errores.documento}>
              <input
                className="mca-input"
                value={formulario.documento}
                onChange={(evento) => setCampo('documento', evento.target.value)}
                placeholder="71.555.000"
              />
            </Field>

            <Field label="Teléfono" required error={errores.telefono}>
              <input
                className="mca-input"
                type="tel"
                value={formulario.telefono}
                onChange={(evento) => setCampo('telefono', evento.target.value)}
                placeholder="310 555 0000"
              />
            </Field>

            <Field label="Correo electrónico" error={errores.correo}>
              <input
                className="mca-input"
                type="email"
                value={formulario.correo}
                onChange={(evento) => setCampo('correo', evento.target.value)}
                placeholder="tecnico@electricosmca.com"
              />
            </Field>

            <Field
              label="Especialidad"
              full
              hint="Se muestra al elegir el técnico responsable en agenda y órdenes."
            >
              <input
                className="mca-input"
                value={formulario.especialidad}
                onChange={(evento) => setCampo('especialidad', evento.target.value)}
                placeholder="Instalaciones y tableros"
                list="especialidades-terceros"
              />
              <datalist id="especialidades-terceros">
                {[...new Set(datos.tecnicos.map((tecnico) => tecnico.especialidad).filter(Boolean))]
                  .map((especialidad) => (
                    <option key={especialidad} value={especialidad} />
                  ))}
              </datalist>
            </Field>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(tecnicoDetalle)}
        onClose={() => setDetalleId(null)}
        title={tecnicoDetalle?.nombre}
        subtitle={
          tecnicoDetalle
            ? `${tecnicoDetalle.documento} · ${tecnicoDetalle.especialidad}`
            : ''
        }
        icon={Handshake}
        size="lg"
        footer={
          tecnicoDetalle && (
            <>
              <Button onClick={() => setDetalleId(null)}>Cerrar</Button>
              <Button variant="primary" onClick={() => abrirEdicion(tecnicoDetalle)}>
                Editar tercero
              </Button>
            </>
          )
        }
      >
        {tecnicoDetalle && (
          <div className="mca-stack">
            <DetailGrid>
              <DetailItem label="Documento">{tecnicoDetalle.documento || '—'}</DetailItem>
              <DetailItem label="Especialidad">{tecnicoDetalle.especialidad}</DetailItem>
              <DetailItem label="Teléfono">{tecnicoDetalle.telefono || '—'}</DetailItem>
              <DetailItem label="Correo">{tecnicoDetalle.correo || '—'}</DetailItem>
              <DetailItem label="Estado">
                <EstadoToggle
                  estado={tecnicoDetalle.estado}
                  estados={ESTADOS.usuario}
                  width={110}
                  onClick={() => cambiarEstado(tecnicoDetalle)}
                />
              </DetailItem>
              <DetailItem label="Servicios activos">{serviciosDetalle.length}</DetailItem>
            </DetailGrid>

            {serviciosDetalle.length > 0 && (
              <div>
                <h3 className="mca-panel__title" style={{ fontSize: 13, marginBottom: 10 }}>
                  Servicios asignados
                </h3>
                <div className="mca-list">
                  {serviciosDetalle.map((actividad) => (
                    <div key={actividad.id} className="mca-list__item">
                      <div className="mca-list__icon">
                        <CalendarDays size={16} strokeWidth={1.9} />
                      </div>
                      <div className="mca-list__body">
                        <div className="mca-list__title">{actividad.servicio}</div>
                        <div className="mca-list__meta">
                          {actividad.codigo} · {actividad.cliente}
                        </div>
                      </div>
                      <div className="mca-list__value">
                        <div className="mca-list__amount" style={{ fontSize: 11.5 }}>
                          {formatearFecha(actividad.fecha)}
                        </div>
                        <div className="mca-list__hint">
                          {actividad.horaInicio && actividad.horaFin
                            ? `${actividad.horaInicio} – ${actividad.horaFin}`
                            : 'Orden de servicio'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(porEliminar)}
        title="Eliminar tercero"
        message={
          porEliminar
            ? `¿Seguro que deseas eliminar a ${porEliminar.nombre}? Esta acción quita la ficha del directorio de terceros.`
            : ''
        }
        confirmLabel="Eliminar tercero"
        onCancel={() => setPorEliminar(null)}
        onConfirm={confirmarEliminacion}
      />

      <Toast toast={toast} onClose={close} />
    </PageShell>
  );
}

export function OrdenesServicio() {
  const {
    data: datos,
    error: errorOrdenes,
    loading: cargandoOrdenes,
    reload: cargarOrdenes,
  } = useApiData(async () => {
    const [ordenesApi, clientesApi, tecnicosApi, catalogos] = await Promise.all([
      apiRequest('/ordenes-servicio'),
      apiRequest('/clientes'),
      apiRequest('/terceros'),
      apiRequest('/ordenes-servicio/catalogos'),
    ]);
    const clientes = clientesApi.map(normalizarCliente);
    const tecnicos = tecnicosApi.map((tercero) => normalizarTecnico({
      ...tercero,
      especialidad: tercero.empresa,
    }));
    const servicios = catalogos.servicios.map((servicio) => ({
      ...servicio,
      estado: 'Activo',
      horas: 0,
      tiempo: '',
      categoria: '',
      desc: '',
    }));
    return {
      ordenes: ordenesApi.map((orden) => mapearOrdenApi(orden, clientes, servicios)),
      clientes,
      tecnicos,
      servicios,
      catalogos: {
        prioridades: catalogos.prioridades,
        estados: catalogos.estados,
      },
    };
  }, {
    ordenes: [],
    clientes: [],
    tecnicos: [],
    servicios: [],
    catalogos: { prioridades: [], estados: [] },
  });
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [formulario, setFormulario] = useState(null);
  const [errores, setErrores] = useState({});
  const [detalleId, setDetalleId] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null);
  const { toast, notify, close } = useToast();

  const filtrados = useMemo(() => {
    const base = buscarOrdenes(busqueda, datos.ordenes);
    if (filtroEstado === 'Todos') return base;
    return base.filter((orden) => orden.estado === filtroEstado);
  }, [datos.ordenes, busqueda, filtroEstado]);

  const resumen = useMemo(() => resumenOrdenes(datos.ordenes), [datos.ordenes]);
  const ordenDetalle = datos.ordenes.find(
    (orden) => String(orden.id) === String(detalleId),
  );

  const opcionesClientes = useMemo(
    () => datos.clientes.map((cliente) => ({
      value: String(cliente.id),
      label: cliente.nombre,
      meta: `${cliente.documento} · ${cliente.municipio || 'Sin municipio'}`,
      search: `${cliente.contacto} ${cliente.telefono} ${cliente.direccion}`,
    })),
    [datos.clientes],
  );

  const opcionesServicios = useMemo(
    () => datos.servicios
      .filter((servicio) => servicio.estado === 'Activo')
      .map((servicio) => ({
        value: String(servicio.id),
        label: servicio.nombre,
        meta: [servicio.tiempo, servicio.categoria].filter(Boolean).join(' · '),
        search: servicio.desc,
      })),
    [datos.servicios],
  );

  const opcionesTecnicos = useMemo(
    () => datos.tecnicos.map((tecnico) => ({
      value: String(tecnico.id),
      label: tecnico.nombre,
      meta: `${tecnico.especialidad}${tecnico.estado === 'Inactivo' ? ' · Inactivo' : ''}`,
    })),
    [datos.tecnicos],
  );

  const clienteFormulario = datos.clientes.find(
    (cliente) => String(cliente.id) === String(formulario?.clienteId),
  );
  const servicioFormulario = datos.servicios.find(
    (servicio) => String(servicio.id) === String(formulario?.servicioId),
  );

  const abrirNuevo = () => {
    setFormulario(FORMULARIO_ORDEN(null, generarCodigoOrden(datos.ordenes)));
    setErrores({});
  };

  const abrirEdicion = (orden) => {
    setDetalleId(null);
    setFormulario({ ...FORMULARIO_ORDEN(orden), id: orden.id });
    setErrores({});
  };

  const cerrarFormulario = () => {
    setFormulario(null);
    setErrores({});
  };

  const setCampo = (campo, valor) => {
    setFormulario((actual) => {
      const siguiente = { ...actual, [campo]: valor };
      if (
        campo === 'fecha'
        && !['Finalizada', 'Cancelada', 'En ejecución'].includes(actual.estado)
      ) {
        siguiente.estado = valor ? 'Programada' : 'Pendiente';
      }
      return siguiente;
    });
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    const nuevosErrores = {};
    if (!formulario.clienteId) nuevosErrores.clienteId = 'Selecciona el cliente.';
    if (!formulario.servicioId) nuevosErrores.servicioId = 'Selecciona el servicio.';
    if (!formulario.responsableId) nuevosErrores.responsableId = 'Selecciona el responsable.';
    if (ESTADOS_CON_FECHA.includes(formulario.estado) && !formulario.fecha) {
      nuevosErrores.fecha = 'Define la fecha programada para esta orden.';
    }
    if (Object.keys(nuevosErrores).length) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      const payload = {
        codigo: formulario.codigo,
        cliente_id: Number(formulario.clienteId),
        servicio_id: Number(formulario.servicioId),
        fecha_programada: formulario.fecha || null,
        tercero_id: Number(formulario.responsableId),
        prioridad_id: idCatalogoPorNombre(datos.catalogos.prioridades, formulario.prioridad),
        estado_id: idCatalogoPorNombre(datos.catalogos.estados, formulario.estado),
        descripcion: formulario.descripcion,
      };
      const resultado = await apiRequest(
        formulario.id ? `/ordenes-servicio/${formulario.id}` : '/ordenes-servicio',
        { method: formulario.id ? 'PUT' : 'POST', body: payload },
      );
      const guardada = mapearOrdenApi(resultado, datos.clientes, datos.servicios);
      await cargarOrdenes();
      notify(
        'success',
        formulario.id ? 'Orden actualizada' : 'Orden creada',
        `${guardada.codigo} · ${guardada.cliente}.`,
      );
      cerrarFormulario();
    } catch (error) {
      notify('error', 'No se pudo guardar', error.message);
    }
  };

  const cambiarEstado = async (orden) => {
    try {
      const estados = [...datos.catalogos.estados].sort((a, b) => Number(a.id) - Number(b.id));
      const indiceActual = estados.findIndex((estado) => String(estado.id) === String(orden.estadoId));
      const siguienteEstado = estados[(indiceActual + 1) % estados.length];
      if (!siguienteEstado) throw new Error('No hay estados de órdenes configurados en la API.');
      const resultado = await apiRequest(`/ordenes-servicio/${orden.id}/estado`, {
        method: 'PATCH',
        body: { estado_id: siguienteEstado.id },
      });
      const actualizada = mapearOrdenApi(resultado, datos.clientes, datos.servicios);
      await cargarOrdenes();
      notify(
        'success',
        'Estado actualizado',
        `${actualizada.codigo} · ${actualizada.estado}.`,
      );
    } catch (error) {
      notify('error', 'No se pudo cambiar el estado', error.message);
    }
  };

  const confirmarEliminacion = async () => {
    try {
      await apiRequest(`/ordenes-servicio/${porEliminar.id}`, { method: 'DELETE' });
      await cargarOrdenes();
      notify('success', 'Orden eliminada', porEliminar.codigo);
      if (String(detalleId) === String(porEliminar.id)) setDetalleId(null);
      setPorEliminar(null);
    } catch (error) {
      notify('error', 'No se pudo eliminar', error.message);
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Órdenes de Servicio"
        title="Órdenes de Servicio"
        subtitle="Coordina los trabajos contratados con cliente, servicio, técnico y fecha en un solo flujo."
        icon={ClipboardList}
        actions={
          <Button variant="primary" icon={Plus} onClick={abrirNuevo}>
            Nueva orden
          </Button>
        }
      />
      {estadoApi({ loading: cargandoOrdenes, error: errorOrdenes })}

      <div className="mca-kpis">
        <KpiCard
          label="Órdenes totales"
          value={resumen.total}
          hint={`${datos.ordenes.length} registros`}
          icon={ClipboardList}
          tone="yellow"
        />
        <KpiCard
          label="Pendientes"
          value={resumen.pendientes}
          hint="Sin fecha programada"
          icon={Clock3}
          tone="warning"
        />
        <KpiCard
          label="Programadas"
          value={resumen.programadas + resumen.ejecucion}
          hint={`${resumen.ejecucion} en ejecución`}
          icon={CalendarDays}
          tone="info"
        />
        <KpiCard
          label="Finalizadas"
          value={resumen.finalizadas}
          hint={`${resumen.canceladas} canceladas`}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <Panel
        title="Órdenes registradas"
        subtitle={`${filtrados.length} de ${datos.ordenes.length} órdenes`}
        actions={
          <>
            <SearchInput
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar por código, cliente, servicio o responsable..."
            />
            <select
              className="mca-select"
              style={{ width: 170 }}
              value={filtroEstado}
              onChange={(evento) => setFiltroEstado(evento.target.value)}
              aria-label="Filtrar órdenes por estado"
            >
              <option value="Todos">Todos los estados</option>
              {datos.catalogos.estados.map((estado) => (
                <option key={estado.id} value={estado.nombre}>
                  {estado.nombre}
                </option>
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
                <th>Código</th>
                <th>Cliente / Servicio</th>
                <th>Fecha</th>
                <th>Responsable</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th className="mca-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="mca-table__empty">
                    <EmptyState
                      icon={ClipboardList}
                      title="Sin órdenes para mostrar"
                      message="Ajusta los filtros o crea una nueva orden de servicio."
                      action={
                        <Button size="sm" icon={Plus} onClick={abrirNuevo}>
                          Nueva orden
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtrados.map((orden) => (
                  <tr key={orden.id}>
                    <td className="is-nowrap">
                      <Badge tone="yellow">{orden.codigo}</Badge>
                    </td>
                    <td>
                      <div className="is-primary">{orden.cliente}</div>
                      <div className="mca-soft" style={{ fontSize: 10.5, marginTop: 2 }}>
                        {orden.servicio}
                        {orden.servicioHoras ? ` · ${orden.servicioHoras} h` : ''}
                      </div>
                    </td>
                    <td className="is-nowrap">
                      {orden.fecha ? (
                        <>
                          <div className="is-primary" style={{ fontSize: 12 }}>
                            {formatearFecha(orden.fecha)}
                          </div>
                          <div className="mca-soft" style={{ fontSize: 10.5, marginTop: 2 }}>
                            Fecha programada
                          </div>
                        </>
                      ) : (
                        <span className="mca-muted">Sin programar</span>
                      )}
                    </td>
                    <td>{orden.responsable}</td>
                    <td>
                      <Badge tone={TONO_PRIORIDAD[orden.prioridad] || 'neutral'}>
                        {orden.prioridad}
                      </Badge>
                    </td>
                    <td>
                      <EstadoToggle
                        estado={orden.estado}
                        estados={ESTADOS.orden}
                        width={120}
                        onClick={() => cambiarEstado(orden)}
                      />
                    </td>
                    <td className="mca-center">
                      <div className="mca-row" style={{ justifyContent: 'center', flexWrap: 'nowrap' }}>
                        <AccionesFila
                          onVer={() => setDetalleId(orden.id)}
                          onEditar={() => abrirEdicion(orden)}
                          onEliminar={() => setPorEliminar(orden)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={Boolean(formulario)}
        onClose={cerrarFormulario}
        title={formulario?.id ? 'Editar orden de servicio' : 'Nueva orden de servicio'}
        subtitle="El código y el estado se gestionan automáticamente según la fecha."
        icon={ClipboardList}
        size="lg"
        footer={
          <>
            <Button onClick={cerrarFormulario}>Cancelar</Button>
            <Button variant="primary" type="submit" form="form-orden">
              {formulario?.id ? 'Guardar cambios' : 'Crear orden'}
            </Button>
          </>
        }
      >
        {formulario && (
          <form id="form-orden" className="mca-form-grid" onSubmit={guardar} noValidate>
            <Field label="Código de orden" hint="Generado automáticamente.">
              <input className="mca-input" value={formulario.codigo} readOnly disabled />
            </Field>

            <Field label="Prioridad">
              <select
                className="mca-select"
                value={formulario.prioridad}
                onChange={(evento) => setCampo('prioridad', evento.target.value)}
              >
                {datos.catalogos.prioridades.map((prioridad) => (
                  <option key={prioridad.id} value={prioridad.nombre}>
                    {prioridad.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Cliente" required error={errores.clienteId} full>
              <Combobox
                value={formulario.clienteId}
                onChange={(valor) => setCampo('clienteId', valor)}
                options={opcionesClientes}
                placeholder="Buscar cliente por nombre, NIT o contacto..."
                emptyText="No hay clientes que coincidan"
              />
            </Field>

            <Field label="Teléfono del cliente" hint="Se completa al seleccionar el cliente.">
              <input
                className="mca-input"
                value={clienteFormulario?.telefono || ''}
                placeholder="Automático"
                disabled
              />
            </Field>

            <Field label="Dirección del servicio" hint="Se completa al seleccionar el cliente.">
              <input
                className="mca-input"
                value={clienteFormulario?.direccion || ''}
                placeholder="Automático"
                disabled
              />
            </Field>

            <Field label="Servicio" required error={errores.servicioId} full>
              <Combobox
                value={formulario.servicioId}
                onChange={(valor) => setCampo('servicioId', valor)}
                options={opcionesServicios}
                placeholder="Buscar servicio del catálogo..."
                emptyText="No hay servicios activos que coincidan"
              />
            </Field>

            <Field label="Duración estimada" hint="Calculada desde el servicio seleccionado.">
              <input
                className="mca-input"
                value={servicioFormulario ? 'Duración no definida en el catálogo' : ''}
                placeholder="Selecciona un servicio"
                disabled
              />
            </Field>

            <Field label="Responsable" required error={errores.responsableId}>
              <Combobox
                value={formulario.responsableId}
                onChange={(valor) => setCampo('responsableId', valor)}
                options={opcionesTecnicos}
                placeholder="Buscar tercero..."
                emptyText="No hay terceros disponibles"
              />
            </Field>

            <Field
              label="Fecha programada"
              error={errores.fecha}
              hint={
                ESTADOS_CON_FECHA.includes(formulario.estado)
                  ? 'Obligatoria para órdenes programadas o en ejecución.'
                  : 'Al asignar fecha, la orden pasa a Programada.'
              }
            >
              <input
                className="mca-input"
                type="date"
                value={formulario.fecha}
                onChange={(evento) => setCampo('fecha', evento.target.value)}
              />
            </Field>

            <Field label="Estado" hint="Se propone automáticamente según la fecha.">
              <select
                className="mca-select"
                value={formulario.estado}
                onChange={(evento) => setCampo('estado', evento.target.value)}
              >
                {datos.catalogos.estados.map((estado) => (
                  <option key={estado.id} value={estado.nombre}>
                    {estado.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Descripción del trabajo" full>
              <textarea
                className="mca-textarea"
                rows={3}
                value={formulario.descripcion}
                onChange={(evento) => setCampo('descripcion', evento.target.value)}
                placeholder="Indicaciones, materiales o alcance del trabajo."
              />
            </Field>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(ordenDetalle)}
        onClose={() => setDetalleId(null)}
        title={ordenDetalle?.codigo}
        subtitle={
          ordenDetalle
            ? `${ordenDetalle.cliente} · ${ordenDetalle.servicio}`
            : ''
        }
        icon={ClipboardList}
        size="lg"
        footer={
          ordenDetalle && (
            <>
              <Button onClick={() => setDetalleId(null)}>Cerrar</Button>
              <Button variant="primary" onClick={() => abrirEdicion(ordenDetalle)}>
                Editar orden
              </Button>
            </>
          )
        }
      >
        {ordenDetalle && (
          <DetailGrid>
            <DetailItem label="Cliente">{ordenDetalle.cliente}</DetailItem>
            <DetailItem label="Documento">{ordenDetalle.clienteDocumento || '—'}</DetailItem>
            <DetailItem label="Teléfono">{ordenDetalle.clienteTelefono || '—'}</DetailItem>
            <DetailItem label="Responsable">{ordenDetalle.responsable}</DetailItem>
            <DetailItem label="Servicio" full>{ordenDetalle.servicio}</DetailItem>
            <DetailItem label="Duración estimada">
              {ordenDetalle.servicioHoras ? `${ordenDetalle.servicioHoras} h` : '—'}
            </DetailItem>
            <DetailItem label="Prioridad">
              <Badge tone={TONO_PRIORIDAD[ordenDetalle.prioridad] || 'neutral'}>
                {ordenDetalle.prioridad}
              </Badge>
            </DetailItem>
            <DetailItem label="Fecha programada">
              {ordenDetalle.fecha ? formatearFecha(ordenDetalle.fecha) : 'Sin programar'}
            </DetailItem>
            <DetailItem label="Estado">
              <EstadoToggle
                estado={ordenDetalle.estado}
                estados={ESTADOS.orden}
                width={120}
                onClick={() => cambiarEstado(ordenDetalle)}
              />
            </DetailItem>
            <DetailItem label="Dirección del servicio" full>
              {ordenDetalle.clienteDireccion || '—'}
            </DetailItem>
            <DetailItem label="Descripción" full>
              {ordenDetalle.descripcion || '—'}
            </DetailItem>
          </DetailGrid>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(porEliminar)}
        title="Eliminar orden de servicio"
        message={
          porEliminar
            ? `¿Seguro que deseas eliminar la orden ${porEliminar.codigo} de ${porEliminar.cliente}?`
            : ''
        }
        confirmLabel="Eliminar orden"
        onCancel={() => setPorEliminar(null)}
        onConfirm={confirmarEliminacion}
      />

      <Toast toast={toast} onClose={close} />
    </PageShell>
  );
}
