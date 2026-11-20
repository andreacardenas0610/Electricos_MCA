import { useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
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
import { EstadoToggle, ESTADOS, estadoSiguiente } from '../../../shared/components/EstadoToggle.jsx';
import { claseFilaEstado } from '../../../shared/utils/estadosFila.js';
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
  TIPOS_PERSONA,
  TIPOS_DOCUMENTO,
  normalizarCliente,
} from '../../../shared/services/clientesService.js';
import {
  PRIORIDADES_ORDEN,
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

const TONO_PRIORIDAD = {
  Baja: 'neutral',
  Media: 'info',
  Alta: 'warning',
};

<<<<<<< HEAD
const ICONO_PROPIEDAD = {
  Residencial: House,
  Comercial: Building2,
  Industrial: Factory,
};

// Solo existen dos tipos de cliente; cada uno pide los documentos que le corresponden.
const DOCUMENTOS_POR_TIPO = {
  Natural: ['Cédula', 'Cédula de extranjería', 'Pasaporte'],
  'Jurídico': ['NIT'],
};

const FORMULARIO_CLIENTE = (cliente = null) => {
  const tipoCliente = cliente?.tipoCliente
    || (cliente?.tipoPropiedad === 'Residencial' ? 'Natural' : 'Jurídico');
  return {
    tipoCliente,
    tipoPropiedad: cliente?.tipoPropiedad || (tipoCliente === 'Natural' ? 'Residencial' : 'Comercial'),
    nombre: cliente?.nombre || '',
    tipoDocumento: cliente?.tipoDocumento || (tipoCliente === 'Jurídico' ? 'NIT' : 'Cédula'),
    documento: cliente?.documento || '',
    esDueno: Boolean(cliente?.esDueno),
    contacto: cliente?.contacto || '',
    telefono: cliente?.telefono || '',
    correo: cliente?.correo || '',
    direccion: cliente?.direccion || '',
    municipio: cliente?.municipio || '',
    departamento: cliente?.departamento || '',
    estado: cliente?.estado || 'Activo',
    // Un empleado de la empresa también puede registrar compras: se vincula al tercero.
    terceroId: cliente?.terceroId == null ? '' : String(cliente.terceroId),
    esEmpleado: Boolean(cliente?.esEmpleado),
    empleadoNombre: cliente?.empleadoNombre || '',
  };
};
=======
const FORMULARIO_CLIENTE = (cliente = null) => ({
  tipoPersona: cliente?.tipoCliente || 'Natural',
  nombre: cliente?.nombre || '',
  documento: cliente?.documento || '',
  contacto: cliente?.contacto || '',
  telefono: cliente?.telefono || '',
  correo: cliente?.correo || '',
  direccion: cliente?.direccion || '',
  municipio: cliente?.municipio || '',
  departamento: cliente?.departamento || '',
  estado: cliente?.estado || 'Activo',
  // Un empleado de la empresa también puede registrar compras: se vincula al tercero.
  terceroId: cliente?.terceroId == null ? '' : String(cliente.terceroId),
  esEmpleado: Boolean(cliente?.esEmpleado),
  empleadoNombre: cliente?.empleadoNombre || '',
});
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d

const FORMULARIO_TECNICO = (tecnico = null, rolMovilDefault = '') => ({
  nombre: tecnico?.nombre || '',
  tipoDocumento: tecnico?.tipoDocumento || 'Cédula',
  documento: tecnico?.documento || '',
  telefono: tecnico?.telefono || '',
  correo: tecnico?.correo || '',
  direccion: tecnico?.direccion || '',
  municipio: tecnico?.municipio || '',
  departamento: tecnico?.departamento || '',
  especialidad: tecnico?.especialidad || '',
  estado: tecnico?.estado || 'Activo',
  usuario: tecnico?.usuario || '',
  password: '',
  rolId: tecnico?.rol_id ? String(tecnico.rol_id) : String(rolMovilDefault || ''),
  tieneUsuario: Boolean(tecnico?.usuario_id),
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

// La orden Finalizada se quema: solo se puede consultar.
const ordenFinalizada = (orden) => orden?.estado === 'Finalizada';

export function Clientes() {
  const {
    data: clientes,
    error: errorClientes,
    loading: cargandoClientes,
    reload: cargarClientes,
  } = useApiData(async () => (await apiRequest('/clientes')).map(normalizarCliente), []);
  // Los terceros activos alimentan el selector "un empleado puede ser cliente".
  const {
    data: tecnicos,
  } = useApiData(async () => (await apiRequest('/terceros')).map(normalizarTecnico), []);
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
      if (filtroTipo !== 'Todos' && cliente.tipoCliente !== filtroTipo) return false;
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
      naturales: clientes.filter((cliente) => cliente.tipoCliente === 'Natural').length,
      juridicos: clientes.filter((cliente) => cliente.tipoCliente === 'Jurídico').length,
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
<<<<<<< HEAD
    setFormulario((actual) => {
      const siguiente = { ...actual, [campo]: valor };
      // Si el dueño es persona natural, la persona de contacto es él mismo.
      if (campo === 'nombre' && actual.esDueno && actual.tipoCliente === 'Natural') {
        siguiente.contacto = valor;
      }
      return siguiente;
    });
=======
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
      ...(campo === 'tipoPersona' && valor !== actual.tipoPersona ? { documento: '' } : {}),
    }));
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
  };

  // Cambiar entre Natural y Jurídico ajusta el documento, el nombre y la propiedad.
  const elegirTipoCliente = (tipo) => {
    setFormulario((actual) => ({
      ...actual,
      tipoCliente: tipo,
      tipoDocumento: tipo === 'Jurídico' ? 'NIT' : 'Cédula',
      tipoPropiedad: tipo === 'Natural'
        ? 'Residencial'
        : (actual.tipoPropiedad === 'Residencial' ? 'Comercial' : actual.tipoPropiedad),
    }));
  };

  // Marcar al solicitante como dueño: en persona natural el contacto es él mismo.
  const alternarEsDueno = (marcado) => {
    setFormulario((actual) => ({
      ...actual,
      esDueno: marcado,
      contacto: marcado && actual.tipoCliente === 'Natural'
        ? actual.nombre
        : actual.contacto,
    }));
  };

  const alternarEmpleado = (marcado) => {
    setFormulario((actual) => ({
      ...actual,
      esEmpleado: marcado,
      ...(marcado ? {} : { terceroId: '', empleadoNombre: '' }),
    }));
  };

  // Opción rápida: un empleado de la empresa figura como cliente.
  const opcionesEmpleados = useMemo(
    () => tecnicos
      .filter((tecnico) => tecnico.estado !== 'Inactivo')
      .map((tecnico) => ({
        value: String(tecnico.id),
        label: `${tecnico.nombre} · ${tecnico.documento}`,
        meta: tecnico.especialidad,
        search: `${tecnico.nombre} ${tecnico.documento} ${tecnico.telefono} ${tecnico.municipio}`,
      })),
    [tecnicos],
  );

  const elegirEmpleado = (valor) => {
    const tecnico = tecnicos.find((item) => String(item.id) === String(valor));
    setFormulario((actual) => ({
      ...actual,
      terceroId: valor || '',
      esEmpleado: Boolean(tecnico),
      empleadoNombre: tecnico?.nombre || '',
<<<<<<< HEAD
      // El empleado es persona natural: cédula, nombre propio y residencia.
      tipoCliente: tecnico ? 'Natural' : actual.tipoCliente,
      tipoPropiedad: tecnico ? 'Residencial' : actual.tipoPropiedad,
      tipoDocumento: tecnico ? 'Cédula' : actual.tipoDocumento,
=======
      tipoPersona: tecnico ? 'Natural' : actual.tipoPersona,
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
      documento: tecnico ? tecnico.documento : actual.documento,
      nombre: tecnico ? tecnico.nombre : actual.nombre,
      telefono: tecnico && !actual.telefono ? tecnico.telefono : actual.telefono,
      correo: tecnico && !actual.correo ? tecnico.correo : actual.correo,
      direccion: tecnico && !actual.direccion ? tecnico.direccion : actual.direccion,
      municipio: tecnico && !actual.municipio ? tecnico.municipio : actual.municipio,
      departamento: tecnico && !actual.departamento ? tecnico.departamento : actual.departamento,
    }));
    setErrores((actuales) => ({ ...actuales, nombre: undefined, documento: undefined }));
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    const nuevosErrores = {};
    if (!formulario.nombre.trim()) {
      nuevosErrores.nombre = 'Escribe el nombre o razón social.';
    }
    if (!formulario.documento.trim()) {
      nuevosErrores.documento = 'Escribe el número de la cédula o del NIT.';
    }
    if (!formulario.telefono.trim()) {
      nuevosErrores.telefono = 'Escribe el número de la persona de contacto.';
    }
    if (formulario.correo.trim() && !CORREO_VALIDO.test(formulario.correo.trim())) {
      nuevosErrores.correo = 'Ingresa un correo electrónico válido.';
    }
    if (Object.keys(nuevosErrores).length) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      const esJuridica = formulario.tipoPersona === 'Jurídico';
      const payload = {
        nombre_razon_social: formulario.nombre.trim(),
        documento_nit: formulario.documento.trim(),
<<<<<<< HEAD
        tipo_cliente: formulario.tipoCliente,
        tipo_documento: formulario.tipoDocumento,
        tercero_id: Number(formulario.terceroId) > 0 ? Number(formulario.terceroId) : null,
        es_empleado: formulario.esEmpleado === true || Number(formulario.terceroId) > 0,
        es_dueno: formulario.esDueno === true,
        tipo_propiedad_id: tipoPropiedad.id,
=======
        tipo_cliente: formulario.tipoPersona,
        tipo_documento: esJuridica ? 'NIT' : 'Cédula',
        tercero_id: Number(formulario.terceroId) > 0 ? Number(formulario.terceroId) : null,
        es_empleado: formulario.esEmpleado === true || Number(formulario.terceroId) > 0,
        tipo_propiedad_id: null,
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
        estado: formulario.estado,
        contacto: formulario.contacto.trim()
          || (formulario.esDueno && formulario.tipoCliente === 'Natural' ? formulario.nombre.trim() : ''),
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
        guardado.esEmpleado
          ? `${guardado.nombre} · Persona ${guardado.tipoCliente === 'Jurídico' ? 'jurídica' : 'natural'} · registrado como empleado-cliente.`
          : `${guardado.nombre} · Persona ${guardado.tipoCliente === 'Jurídico' ? 'jurídica' : 'natural'}.`,
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
          tipo_documento: cliente.tipoCliente === 'Jurídico' ? 'NIT' : 'Cédula',
          tercero_id: Number(cliente.terceroId) > 0 ? Number(cliente.terceroId) : null,
          es_empleado: cliente.esEmpleado,
<<<<<<< HEAD
          es_dueno: cliente.esDueno === true,
          tipo_propiedad_id: TIPOS_PROPIEDAD.find((tipo) => tipo.nombre === cliente.tipoPropiedad)?.id,
=======
          tipo_propiedad_id: null,
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
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
          label="Personas naturales"
          value={resumen.naturales}
<<<<<<< HEAD
          hint="Cédula o pasaporte"
=======
          hint="Identificadas con cédula"
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
          icon={House}
          tone="info"
        />
        <KpiCard
<<<<<<< HEAD
          label="Jurídicos"
          value={resumen.juridicos}
          hint="Empresas con NIT"
=======
          label="Personas jurídicas"
          value={resumen.juridicos}
          hint="Identificadas con NIT"
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
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
              placeholder="Buscar por nombre, documento, contacto, departamento o municipio..."
            />
            <select
              className="mca-select"
              style={{ width: 170 }}
              value={filtroTipo}
              onChange={(evento) => setFiltroTipo(evento.target.value)}
<<<<<<< HEAD
              aria-label="Filtrar clientes por tipo"
            >
              <option value="Todos">Todos los tipos</option>
              <option value="Natural">Naturales</option>
              <option value="Jurídico">Jurídicos</option>
=======
              aria-label="Filtrar clientes por tipo de persona"
            >
              <option value="Todos">Todos los tipos</option>
              {TIPOS_PERSONA.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo === 'Jurídico' ? 'Jurídica' : tipo}
                </option>
              ))}
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
            </select>
          </>
        }
        flush
      >
        <div className="mca-table-wrap mca-table-wrap--fit">
          <table className="mca-table mca-table--fit mca-table--clientes">
            <thead>
              <tr>
                <th>Cédula / NIT</th>
                <th>Razón social / Nombre</th>
                <th>Tipo de persona</th>
                <th>Persona de contacto</th>
                <th>Nº de contacto</th>
                <th>Departamento / Municipio</th>
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
                  const Icono = cliente.tipoCliente === 'Natural' ? House : Building2;
                  return (
                    <tr key={cliente.id} className={claseFilaEstado(cliente.estado, 'usuario')}>
                      <td className="is-nowrap" data-label="Documento">
                        <div>{cliente.tipoDocumento || '—'}</div>
                        <div className="mca-soft" style={{ fontSize: 10.5, marginTop: 2 }}>
                          {cliente.documento || '—'}
                        </div>
                      </td>
                      <td data-label="Razón social / Nombre">
                        <div className="mca-cell-title">
                          <div className="mca-cell-icon">
                            <Icono size={15} strokeWidth={1.9} />
                          </div>
                          <div>
                            <div className="is-primary">{cliente.nombre}</div>
                            <div className="mca-soft" style={{ fontSize: 10.5, marginTop: 2 }}>
                              {cliente.tipoCliente === 'Jurídico' ? 'Persona jurídica' : 'Persona natural'}
                            </div>
                            {cliente.esEmpleado && (
                              <Badge tone="indigo" className="mca-badge--inline">Es empleado</Badge>
                            )}
                            {cliente.esDueno && (
                              <Badge tone="success" className="mca-badge--inline">Es dueño</Badge>
                            )}
                          </div>
                        </div>
                      </td>
<<<<<<< HEAD
                      <td>
                        <Badge tone={cliente.tipoCliente === 'Natural' ? 'info' : 'indigo'}>
                          {cliente.tipoCliente}
=======
                      <td data-label="Tipo">
                        <Badge tone={cliente.tipoCliente === 'Natural' ? 'info' : 'indigo'}>
                          {cliente.tipoCliente === 'Jurídico' ? 'Jurídica' : 'Natural'}
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
                        </Badge>
                        <div className="mca-soft" style={{ fontSize: 10.5, marginTop: 4 }}>
                          {cliente.tipoPropiedad}
                        </div>
                      </td>
                      <td data-label="Persona de contacto">
                        <div>{cliente.contacto || '—'}</div>
                        {cliente.correo && (
                          <div className="mca-soft" style={{ fontSize: 10.5, marginTop: 2 }}>
                            {cliente.correo}
                          </div>
                        )}
                      </td>
                      <td className="is-nowrap" data-label="Teléfono">
                        <div className="mca-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                          <Phone size={13} strokeWidth={1.9} className="mca-soft" />
                          <span>{cliente.telefono || '—'}</span>
                        </div>
                      </td>
                      <td data-label="Departamento / Municipio">
                        <div className="mca-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                          <MapPin size={13} strokeWidth={1.9} className="mca-soft" />
                          <span>
                            {cliente.departamento || '—'}
                            {cliente.municipio ? ` · ${cliente.municipio}` : ''}
                          </span>
                        </div>
                      </td>
                      <td data-label="Estado">
                        <EstadoToggle
                          estado={cliente.estado}
                          estados={ESTADOS.usuario}
                          width={110}
                          onClick={() => cambiarEstado(cliente)}
                        />
                      </td>
                      <td className="mca-center" data-label="Acciones">
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
        size="md"
        footer={
          <Button variant="primary" type="submit" form="form-cliente">
            {formulario?.id ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        }
      >
        {formulario && (
          <form id="form-cliente" className="mca-form-grid" onSubmit={guardar} noValidate>
            <Field
<<<<<<< HEAD
              label="Tipo de cliente"
              required
              full
              hint="La información que se pide depende del tipo seleccionado."
              tooltip="Solo existen dos tipos de cliente: persona natural o jurídica."
            >
              <div className="mca-segmented">
                <button
                  type="button"
                  className={formulario.tipoCliente === 'Natural' ? 'is-active' : ''}
                  onClick={() => elegirTipoCliente('Natural')}
                >
                  Natural
                </button>
                <button
                  type="button"
                  className={formulario.tipoCliente === 'Jurídico' ? 'is-active' : ''}
                  onClick={() => elegirTipoCliente('Jurídico')}
                >
                  Jurídico
                </button>
=======
              label="Tipo de persona"
              full
              tooltip="Una persona natural se identifica con cédula; una persona jurídica se identifica con NIT."
            >
              <div className="mca-row" style={{ gap: 8 }}>
                {TIPOS_PERSONA.map((tipo) => (
                  <Button
                    key={tipo}
                    size="sm"
                    variant={formulario.tipoPersona === tipo ? 'primary' : 'ghost'}
                    onClick={() => setCampo('tipoPersona', tipo)}
                  >
                    {tipo === 'Jurídico' ? 'Jurídica' : tipo}
                  </Button>
                ))}
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
              </div>
            </Field>

            <Field
<<<<<<< HEAD
              label="Tipo de documento"
              required
              error={errores.tipoDocumento}
              tooltip={
                formulario.tipoCliente === 'Natural'
                  ? 'Documento personal: cédula, cédula de extranjería o pasaporte.'
                  : 'Las empresas se identifican con su NIT.'
              }
            >
              <select
                className="mca-select"
                value={formulario.tipoDocumento}
                onChange={(evento) => setCampo('tipoDocumento', evento.target.value)}
              >
                {DOCUMENTOS_POR_TIPO[formulario.tipoCliente].map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label={formulario.tipoCliente === 'Jurídico' ? 'NIT' : 'Número de documento'}
              required
              error={errores.documento}
              tooltip={
                formulario.tipoCliente === 'Jurídico'
                  ? 'Número completo del NIT, incluyendo el dígito de verificación.'
                  : 'Número completo del documento de identidad, sin puntos de más.'
=======
              label={formulario.tipoPersona === 'Natural' ? 'Número de cédula' : 'NIT'}
              required
              error={errores.documento}
              tooltip={
                formulario.tipoPersona === 'Natural'
                  ? 'Número de cédula de la persona natural.'
                  : 'Número completo del NIT del cliente, incluyendo el dígito de verificación.'
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
              }
            >
              <input
                className="mca-input"
                value={formulario.documento}
                onChange={(evento) => setCampo('documento', evento.target.value)}
<<<<<<< HEAD
                placeholder={formulario.tipoCliente === 'Jurídico' ? '900.123.456-7' : '1.020.304.050'}
                autoFocus
=======
                placeholder={formulario.tipoPersona === 'Natural' ? '1.020.304.050' : '900.123.456-7'}
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
              />
            </Field>

            <Field
<<<<<<< HEAD
              label={formulario.tipoCliente === 'Jurídico' ? 'Razón social' : 'Nombre completo'}
              required
              error={errores.nombre}
              tooltip={
                formulario.tipoCliente === 'Jurídico'
                  ? 'Razón social registrada de la empresa, tal como aparece en el RUT.'
                  : 'Nombre completo del cliente, tal como aparece en su documento de identidad.'
=======
              label={formulario.tipoPersona === 'Natural' ? 'Nombre completo' : 'Razón social'}
              required
              error={errores.nombre}
              tooltip={
                formulario.tipoPersona === 'Natural'
                  ? 'Nombre completo del cliente, tal como aparece en su documento de identidad.'
                  : 'Razón social registrada de la empresa, tal como aparece en el RUT.'
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
              }
            >
              <input
                className="mca-input"
                value={formulario.nombre}
                onChange={(evento) => setCampo('nombre', evento.target.value)}
<<<<<<< HEAD
                placeholder={formulario.tipoCliente === 'Jurídico' ? 'Empresa S.A.S.' : 'Ana María Gómez'}
=======
                placeholder={formulario.tipoPersona === 'Natural' ? 'Ana María Gómez' : 'Empresa S.A.S.'}
                autoFocus
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
              />
            </Field>

            {formulario.tipoCliente === 'Jurídico' ? (
              <Field
                label="Tipo de propiedad"
                full
                hint="Para personas naturales la propiedad siempre es residencial."
                tooltip="Clase de inmueble donde se presta el servicio."
              >
                <div className="mca-segmented">
                  {TIPOS_PROPIEDAD.filter((tipo) => tipo.nombre !== 'Residencial').map((tipo) => (
                    <button
                      key={tipo.id}
                      type="button"
                      className={formulario.tipoPropiedad === tipo.nombre ? 'is-active' : ''}
                      onClick={() => setCampo('tipoPropiedad', tipo.nombre)}
                    >
                      {tipo.nombre}
                    </button>
                  ))}
                </div>
              </Field>
            ) : (
              <div className="mca-notice is-info mca-field--full">
                <House size={15} strokeWidth={2} />
                <span>
                  Persona natural: la propiedad se registra como <strong>Residencial</strong>.
                </span>
              </div>
            )}

            <Field
              label="¿El solicitante es el dueño?"
              full
              hint={
                formulario.tipoCliente === 'Natural'
                  ? 'Si es el dueño, la persona de contacto es él mismo.'
                  : 'Marca si la persona que solicita el servicio es el dueño de la propiedad.'
              }
              tooltip="Permite registrar que el dueño es quien está solicitando el servicio."
            >
              <label className={`mca-check ${formulario.esDueno ? 'is-active' : ''}`.trim()}>
                <input
                  type="checkbox"
                  checked={formulario.esDueno}
                  onChange={(evento) => alternarEsDueno(evento.target.checked)}
                />
                <span className="mca-check__texto">Sí, el solicitante es el dueño</span>
                <span className="mca-check__meta">
                  {formulario.tipoCliente === 'Natural' ? 'Sus datos son el contacto' : 'Queda marcado en la ficha'}
                </span>
              </label>
            </Field>

            <Field
              label="¿Es empleado de la empresa?"
              full
              hint="Un empleado puede ser cliente: se vincula a su ficha de tercero sin crear duplicados."
              tooltip="Marca si quien compra es un empleado de Eléctricos MCA."
            >
              <label className={`mca-check ${formulario.esEmpleado ? 'is-active' : ''}`.trim()}>
                <input
                  type="checkbox"
                  checked={formulario.esEmpleado}
                  onChange={(evento) => alternarEmpleado(evento.target.checked)}
                />
                <span className="mca-check__texto">Sí, es empleado de Eléctricos MCA</span>
                <span className="mca-check__meta">
                  {formulario.empleadoNombre || 'Se vincula al tercero por documento'}
                </span>
              </label>
            </Field>

            {formulario.esEmpleado && (
              <Field
                label="Empleado vinculado"
                full
                hint="Al seleccionarlo se copian sus datos y la ficha queda marcada como empleado."
                tooltip="Busca y selecciona al empleado; si no está en la lista, el documento lo vinculará solo."
              >
                <Combobox
                  value={formulario.terceroId}
                  onChange={elegirEmpleado}
                  options={opcionesEmpleados}
                  placeholder="Buscar empleado / tercero..."
                  emptyText="No hay terceros activos"
                />
              </Field>
            )}

            <Field
              label="Persona de contacto"
              hint={
                formulario.esDueno && formulario.tipoCliente === 'Natural'
                  ? 'El solicitante es el dueño: queda como contacto.'
                  : undefined
              }
              tooltip="Nombre de la persona que atiende la cuenta dentro de la empresa o del hogar."
            >
              <input
                className="mca-input"
                value={formulario.contacto}
                disabled={formulario.esDueno && formulario.tipoCliente === 'Natural'}
                onChange={(evento) => setCampo('contacto', evento.target.value)}
                placeholder="Nombre del contacto"
              />
            </Field>

            <Field
              label="Número de la persona de contacto"
              required
              error={errores.telefono}
              tooltip="Celular o teléfono fijo, con código de área, de la persona de contacto."
            >
              <input
                className="mca-input"
                type="tel"
                value={formulario.telefono}
                onChange={(evento) => setCampo('telefono', evento.target.value)}
                placeholder="310 555 0000"
              />
            </Field>

            <Field
              label="Correo electrónico"
              error={errores.correo}
              tooltip="Correo donde se envían la cotización en PDF y las notificaciones del servicio."
            >
              <input
                className="mca-input"
                type="email"
                value={formulario.correo}
                onChange={(evento) => setCampo('correo', evento.target.value)}
                placeholder="contacto@empresa.com"
              />
            </Field>

            <Field
              label="Departamento"
              tooltip="Departamento donde se encuentra el cliente; limita la lista de municipios."
            >
              <CampoDepartamento
                className="mca-input"
                value={formulario.departamento}
                onChange={(evento) => setCampo('departamento', evento.target.value)}
                placeholder="Escribe o selecciona un departamento"
              />
            </Field>

            <Field
              label="Municipio"
              tooltip="Municipio o ciudad de la propiedad; se usa para asignar técnicos cercanos."
            >
              <CampoMunicipio
                className="mca-input"
                departamento={formulario.departamento}
                value={formulario.municipio}
                onChange={(evento) => setCampo('municipio', evento.target.value)}
                placeholder="Escribe o selecciona un municipio"
              />
            </Field>

            <Field
              label="Dirección"
              full
              tooltip="Dirección completa donde se presta el servicio: calle, número, barrio y complemento."
            >
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
            ? `${clienteDetalle.documento} · Persona ${clienteDetalle.tipoCliente === 'Jurídico' ? 'jurídica' : 'natural'}`
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
            <DetailItem label="Tipo de documento">{clienteDetalle.tipoDocumento || '—'}</DetailItem>
            <DetailItem label="Documento / NIT">{clienteDetalle.documento || '—'}</DetailItem>
            <DetailItem label="Razón social / Nombre">{clienteDetalle.nombre || '—'}</DetailItem>
<<<<<<< HEAD
            <DetailItem label="Tipo de cliente">{clienteDetalle.tipoCliente}</DetailItem>
            <DetailItem label="Tipo de propiedad">{clienteDetalle.tipoPropiedad}</DetailItem>
            <DetailItem label="¿Es el dueño?">
              {clienteDetalle.esDueno ? 'Sí, el solicitante es el dueño' : 'No'}
=======
            <DetailItem label="Tipo de persona">
              {clienteDetalle.tipoCliente === 'Jurídico' ? 'Jurídica' : 'Natural'}
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
            </DetailItem>
            <DetailItem label="Empleado">
              {clienteDetalle.esEmpleado
                ? clienteDetalle.empleadoNombre || clienteDetalle.nombre
                : 'No es empleado'}
            </DetailItem>
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
            <DetailItem label="Departamento">{clienteDetalle.departamento || '—'}</DetailItem>
            <DetailItem label="Municipio">{clienteDetalle.municipio || '—'}</DetailItem>
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
<<<<<<< HEAD
    const [tecnicosApi, ordenesApi, clientesApi] = await Promise.all([
      apiRequest('/terceros'),
      apiRequest('/ordenes-servicio'),
      apiRequest('/clientes'),
    ]);
    return {
      tecnicos: tecnicosApi.map(normalizarTecnico),
      clientes: clientesApi.map(normalizarCliente),
=======
    const [tecnicosApi, ordenesApi, rolesApi] = await Promise.all([
      apiRequest('/terceros'),
      apiRequest('/ordenes-servicio'),
      apiRequest('/roles'),
    ]);
    return {
      tecnicos: tecnicosApi.map(normalizarTecnico),
      roles: rolesApi,
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
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
<<<<<<< HEAD
  }, { tecnicos: [], clientes: [], actividades: [] });
=======
  }, { tecnicos: [], actividades: [], roles: [] });
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [formulario, setFormulario] = useState(null);
  const [errores, setErrores] = useState({});
  const [detalleId, setDetalleId] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null);
  // Conversión de un tercero en cliente: se llama la información del tercero al abrir.
  const [convertirA, setConvertirA] = useState(null);
  const [convForm, setConvForm] = useState(null);
  const [convCargando, setConvCargando] = useState(false);
  const { toast, notify, close } = useToast();

  // Ficha de cliente vinculada a cada tercero (por tercero_id), sin duplicar personas.
  const clienteDeTercero = useMemo(() => {
    const mapa = new Map();
    datos.clientes.forEach((cliente) => {
      if (cliente.terceroId != null && cliente.terceroId !== '') {
        mapa.set(String(cliente.terceroId), cliente);
      }
    });
    return mapa;
  }, [datos.clientes]);

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
  const rolesMoviles = useMemo(
    () => datos.roles.filter((rol) => rol.estado === 'Activo'
      && rol.plataformas?.includes('Móvil')
      && !rol.plataformas.includes('Web')),
    [datos.roles],
  );

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return datos.tecnicos.filter((tecnico) => {
      if (filtroEstado !== 'Todos' && tecnico.estado !== filtroEstado) return false;
      if (!termino) return true;
      return `${tecnico.nombre} ${tecnico.documento} ${tecnico.telefono} ${tecnico.correo} ${tecnico.municipio} ${tecnico.departamento}`
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
    const rolDefault = rolesMoviles.find((rol) => rol.nombre === 'Técnico')?.id
      || rolesMoviles[0]?.id
      || '';
    setFormulario(FORMULARIO_TECNICO(null, rolDefault));
    setErrores({});
  };

  const abrirEdicion = (tecnico) => {
    setDetalleId(null);
<<<<<<< HEAD
    setFormulario({
      ...FORMULARIO_TECNICO(tecnico),
      id: tecnico.id,
      // Casilla «¿Es cliente?»: refleja si ya tiene ficha de cliente vinculada.
      esCliente: Boolean(clienteDeTercero.has(String(tecnico.id))),
    });
=======
    const rolDefault = rolesMoviles.find((rol) => rol.nombre === 'Técnico')?.id
      || rolesMoviles[0]?.id
      || '';
    setFormulario({ ...FORMULARIO_TECNICO(tecnico, rolDefault), id: tecnico.id });
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
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
    if (!formulario.tipoDocumento.trim()) nuevosErrores.tipoDocumento = 'Selecciona el tipo de documento.';
    if (!formulario.documento.trim()) nuevosErrores.documento = 'Escribe el número del documento.';
    if (!formulario.telefono.trim()) nuevosErrores.telefono = 'Escribe el teléfono.';
    if (!formulario.correo.trim() || !CORREO_VALIDO.test(formulario.correo.trim())) {
      nuevosErrores.correo = 'Ingresa un correo electrónico válido para el acceso móvil.';
    }
    if (!formulario.usuario.trim()) nuevosErrores.usuario = 'Escribe el usuario para iniciar sesión.';
    if (!formulario.rolId) nuevosErrores.rolId = 'Selecciona un rol habilitado para móvil.';
    if ((!formulario.id || !formulario.tieneUsuario) && formulario.password.length < 8) {
      nuevosErrores.password = 'Escribe una contraseña de al menos 8 caracteres.';
    } else if (formulario.password && formulario.password.length < 8) {
      nuevosErrores.password = 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (!formulario.municipio.trim()) {
      nuevosErrores.municipio = 'Escribe el municipio donde reside.';
    }
    if (Object.keys(nuevosErrores).length) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      const payload = {
        nombre_completo: formulario.nombre.trim(),
        tipo_documento: formulario.tipoDocumento,
        documento: formulario.documento.trim(),
        // La especialidad ya no se edita aquí: se conserva el valor registrado.
        empresa: formulario.especialidad.trim(),
        telefono: formulario.telefono.trim(),
        correo_electronico: formulario.correo.trim(),
        direccion: formulario.direccion.trim(),
        municipio: formulario.municipio.trim(),
        departamento: formulario.departamento.trim(),
        estado: formulario.estado || 'Activo',
        usuario: formulario.usuario.trim(),
        password: formulario.password,
        rol_id: Number(formulario.rolId),
      };
      const resultado = await apiRequest(
        formulario.id ? `/terceros/${formulario.id}` : '/terceros',
        { method: formulario.id ? 'PUT' : 'POST', body: payload },
      );
      const guardado = normalizarTecnico(resultado);
      await cargarTecnicos();

      // Casilla «¿Es cliente?»: crea la ficha de cliente vinculada al guardar.
      const yaEsCliente = clienteDeTercero.has(String(guardado.id));
      let vinculoCliente = '';
      if (formulario.esCliente && !yaEsCliente) {
        try {
          const esJuridico = (guardado.tipoDocumento || '') === 'NIT';
          await apiRequest('/clientes', {
            method: 'POST',
            body: {
              nombre_razon_social: guardado.nombre,
              documento_nit: guardado.documento,
              tipo_cliente: esJuridico ? 'Jurídico' : 'Natural',
              tipo_documento: esJuridico ? 'NIT' : (guardado.tipoDocumento || 'Cédula'),
              tercero_id: Number(guardado.id),
              es_empleado: true,
              tipo_propiedad_id: esJuridico ? 2 : 1,
              contacto: guardado.nombre,
              telefono: guardado.telefono || '',
              correo_electronico: guardado.correo || '',
              direccion: guardado.direccion || '',
              municipio: guardado.municipio || '',
              departamento: guardado.departamento || '',
            },
          });
          vinculoCliente = ' Su ficha de cliente quedó vinculada sin duplicar datos.';
          await cargarTecnicos();
        } catch (error) {
          notify('warning', 'El vínculo con cliente no se pudo crear', error.message);
        }
      } else if (!formulario.esCliente && yaEsCliente) {
        vinculoCliente = ' La ficha de cliente vinculada se conserva.';
      }

      notify(
        'success',
        formulario.id ? 'Tercero actualizado' : 'Tercero creado',
<<<<<<< HEAD
        `${guardado.nombre} · reside en ${guardado.municipio || 'sin municipio'}.${vinculoCliente}`,
=======
        `${guardado.nombre} · acceso móvil: ${guardado.usuario || formulario.usuario} (${guardado.rol || 'rol asignado'}).`,
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
      );
      cerrarFormulario();
    } catch (error) {
      notify('error', 'No se pudo guardar', error.message);
    }
  };

  const cambiarEstado = async (tecnico) => {
    const siguiente = estadoSiguiente(ESTADOS.usuario, tecnico.estado);
    try {
      const actualizado = await apiRequest(`/terceros/${tecnico.id}/estado`, {
        method: 'PATCH',
        body: { estado: siguiente },
      });
      await cargarTecnicos();
      const tecnicoActualizado = normalizarTecnico(actualizado);
      notify(
        'success',
        'Estado actualizado',
        siguiente === 'Inactivo'
          ? `${tecnicoActualizado.nombre} quedó inactivo y ya no se ofrece en agenda ni en órdenes.`
          : `${tecnicoActualizado.nombre} vuelve a estar disponible para asignar.`,
      );
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

  // Convertir un tercero en cliente: llama la información fresca del tercero
  // y abre el formulario con los datos copiados, vinculando la ficha (sin duplicar).
  const abrirConversion = async (tecnico) => {
    setConvertirA(tecnico);
    setConvForm(null);
    setConvCargando(true);
    try {
      const fresco = normalizarTecnico(await apiRequest(`/terceros/${tecnico.id}`));
      const esJuridico = (fresco.tipoDocumento || '') === 'NIT';
      setConvForm({
        tipoCliente: esJuridico ? 'Jurídico' : 'Natural',
        tipoPropiedad: esJuridico ? 'Comercial' : 'Residencial',
        nombre: fresco.nombre || '',
        tipoDocumento: esJuridico ? 'NIT' : (fresco.tipoDocumento || 'Cédula'),
        documento: fresco.documento || '',
        contacto: fresco.nombre || '',
        telefono: fresco.telefono || '',
        correo: fresco.correo || '',
        direccion: fresco.direccion || '',
        municipio: fresco.municipio || '',
        departamento: fresco.departamento || '',
      });
    } catch (error) {
      notify('error', 'No se pudo llamar la información', error.message);
      setConvertirA(null);
    } finally {
      setConvCargando(false);
    }
  };

  const setConvCampo = (campo, valor) => {
    setConvForm((actual) => ({ ...actual, [campo]: valor }));
  };

  const elegirConvTipo = (tipo) => {
    setConvForm((actual) => ({
      ...actual,
      tipoCliente: tipo,
      tipoPropiedad: tipo === 'Natural' ? 'Residencial' : 'Comercial',
      tipoDocumento: tipo === 'Jurídico' ? 'NIT' : 'Cédula',
    }));
  };

  const confirmarConversion = async (evento) => {
    evento.preventDefault();
    if (!convForm?.nombre.trim() || !convForm?.documento.trim()) {
      notify('warning', 'Completa los datos del cliente', 'Escribe el nombre y el documento.');
      return;
    }
    try {
      const creado = await apiRequest('/clientes', {
        method: 'POST',
        body: {
          nombre_razon_social: convForm.nombre.trim(),
          documento_nit: convForm.documento.trim(),
          tipo_cliente: convForm.tipoCliente,
          tipo_documento: convForm.tipoDocumento,
          tercero_id: Number(convertirA.id),
          es_empleado: true,
          tipo_propiedad_id: TIPOS_PROPIEDAD.find(
            (tipo) => tipo.nombre === convForm.tipoPropiedad,
          )?.id || null,
          contacto: convForm.contacto.trim(),
          telefono: convForm.telefono.trim(),
          correo_electronico: convForm.correo.trim(),
          direccion: convForm.direccion.trim(),
          municipio: convForm.municipio.trim(),
          departamento: convForm.departamento.trim(),
        },
      });
      await cargarTecnicos();
      notify(
        'success',
        'Tercero convertido en cliente',
        `${creado.nombre_razon_social || convertirA.nombre} ya es cliente y conserva su ficha de tercero.`,
      );
      setConvertirA(null);
      setConvForm(null);
    } catch (error) {
      notify('error', 'No se pudo convertir', error.message);
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Terceros"
        title="Terceros"
        subtitle="Terceros con acceso móvil, disponibles según su rol para la operación de la empresa."
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
        <div className="mca-table-wrap mca-table-wrap--fit">
          <table className="mca-table mca-table--fit mca-table--terceros">
            <thead>
              <tr>
                <th>Tipo doc. / Documento</th>
                <th>Razón social / Nombre</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Servicios activos</th>
                <th>Cliente</th>
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
                    <tr key={tecnico.id} className={claseFilaEstado(tecnico.estado, 'usuario')}>
                      <td className="is-nowrap" data-label="Documento">
                        <div>{tecnico.tipoDocumento || '—'}</div>
                        <div className="mca-soft" style={{ fontSize: 10.5, marginTop: 2 }}>
                          {tecnico.documento || '—'}
                        </div>
                      </td>
                      <td data-label="Razón social / Nombre">
                        <div className="mca-cell-title">
                          <div className="mca-cell-icon">
                            <Handshake size={15} strokeWidth={1.9} />
                          </div>
                          <div className="is-primary">{tecnico.nombre}</div>
                        </div>
                      </td>
<<<<<<< HEAD
                      <td className="is-nowrap">
=======
                      <td data-label="Departamento / Municipio">
                        <div className="mca-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                          <MapPin size={13} strokeWidth={1.9} className="mca-soft" />
                          <span>
                            {tecnico.departamento || '—'}
                            {tecnico.municipio ? ` · ${tecnico.municipio}` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="is-nowrap" data-label="Teléfono">
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
                        <div className="mca-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                          <Phone size={13} strokeWidth={1.9} className="mca-soft" />
                          <span>{tecnico.telefono || '—'}</span>
                        </div>
                      </td>
                      <td data-label="Correo">
                        <div className="mca-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                          <Mail size={13} strokeWidth={1.9} className="mca-soft" />
                          <span>{tecnico.correo || '—'}</span>
                        </div>
                      </td>
                      <td data-label="Servicios activos">
                        <Badge tone={asignados ? 'warning' : 'neutral'}>
                          {asignados} {asignados === 1 ? 'servicio' : 'servicios'}
                        </Badge>
                      </td>
<<<<<<< HEAD
                      <td>
                        {clienteDeTercero.has(String(tecnico.id)) ? (
                          <Badge tone="success">Es cliente</Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="mca-btn--convertir"
                            icon={UsersRound}
                            onClick={() => abrirConversion(tecnico)}
                          >
                            Convertir a cliente
                          </Button>
                        )}
                      </td>
                      <td>
=======
                      <td data-label="Estado">
>>>>>>> e427bd1c3ca2c661480a0d7f15ca33a29dffa92d
                        <EstadoToggle
                          estado={tecnico.estado}
                          estados={ESTADOS.usuario}
                          width={110}
                          onClick={() => cambiarEstado(tecnico)}
                        />
                      </td>
                      <td className="mca-center" data-label="Acciones">
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
        subtitle="Cada tercero tiene una cuenta móvil y un rol; sus datos personales se comparten."
        icon={Handshake}
        size="lg"
        footer={
          <Button variant="primary" type="submit" form="form-tercero">
            {formulario?.id ? 'Guardar cambios' : 'Crear tercero y acceso móvil'}
          </Button>
        }
      >
        {formulario && (
          <form id="form-tercero" className="mca-form-grid" onSubmit={guardar} noValidate>
            <Field
              label="Tipo de documento"
              required
              error={errores.tipoDocumento}
              tooltip="Identificación tributaria del tercero: C.C., C.E., T.I.T. o NIT."
            >
              <select
                className="mca-select"
                value={formulario.tipoDocumento}
                onChange={(evento) => setCampo('tipoDocumento', evento.target.value)}
              >
                {TIPOS_DOCUMENTO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Número de documento"
              required
              error={errores.documento}
              tooltip="Número único de identificación del tercero; no puede repetirse."
            >
              <input
                className="mca-input"
                value={formulario.documento}
                onChange={(evento) => setCampo('documento', evento.target.value)}
                placeholder="71.555.000"
              />
            </Field>

            <Field
              label="Razón social / Nombre del tercero"
              required
              error={errores.nombre}
              tooltip="Nombre o razón social tal como aparece en el documento de identidad."
            >
              <input
                className="mca-input"
                value={formulario.nombre}
                onChange={(evento) => setCampo('nombre', evento.target.value)}
                placeholder="Nombre completo"
                autoFocus
              />
            </Field>

            <Field
              label="Teléfono"
              required
              error={errores.telefono}
              tooltip="Línea directa para coordinar la visita técnica."
            >
              <input
                className="mca-input"
                type="tel"
                value={formulario.telefono}
                onChange={(evento) => setCampo('telefono', evento.target.value)}
                placeholder="310 555 0000"
              />
            </Field>

            <Field
              label="Correo electrónico"
              required
              error={errores.correo}
              tooltip="Correo de la cuenta que usará para acceder desde la aplicación móvil."
            >
              <input
                className="mca-input"
                type="email"
                value={formulario.correo}
                onChange={(evento) => setCampo('correo', evento.target.value)}
                placeholder="tecnico@electricosmca.com"
              />
            </Field>

            <Field
              label="Usuario móvil"
              required
              error={errores.usuario}
              tooltip="Nombre de usuario para iniciar sesión desde la aplicación móvil."
            >
              <input
                className="mca-input"
                value={formulario.usuario}
                onChange={(evento) => setCampo('usuario', evento.target.value)}
                placeholder="usuario.tecnico"
              />
            </Field>

            <Field
              label="Rol móvil"
              required
              error={errores.rolId}
              tooltip="El rol debe estar activo y habilitado solo para Móvil."
            >
              <select
                className="mca-select"
                value={formulario.rolId}
                onChange={(evento) => setCampo('rolId', evento.target.value)}
              >
                <option value="">Selecciona un rol</option>
                {rolesMoviles.map((rol) => (
                  <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                ))}
              </select>
            </Field>

            <Field
              label={formulario.tieneUsuario ? 'Cambiar contraseña (opcional)' : 'Contraseña móvil'}
              required={!formulario.tieneUsuario}
              error={errores.password}
              tooltip="La contraseña se guarda protegida y no se vuelve a mostrar."
            >
              <input
                className="mca-input"
                type="password"
                autoComplete="new-password"
                value={formulario.password}
                onChange={(evento) => setCampo('password', evento.target.value)}
                placeholder={formulario.tieneUsuario ? 'Dejar vacía para conservarla' : 'Mínimo 8 caracteres'}
              />
            </Field>

            <Field
              label="Departamento"
              required
              error={errores.departamento}
              tooltip="Departamento donde reside; limita la lista de municipios."
            >
              <CampoDepartamento
                className="mca-input"
                value={formulario.departamento}
                onChange={(evento) => setCampo('departamento', evento.target.value)}
                placeholder="Escribe o selecciona un departamento"
              />
            </Field>

            <Field
              label="Municipio donde reside"
              required
              error={errores.municipio}
              hint="Se usa para asignar técnicos cerca del sitio del servicio."
              tooltip="Municipio o ciudad de residencia del tercero."
            >
              <CampoMunicipio
                className="mca-input"
                departamento={formulario.departamento}
                value={formulario.municipio}
                onChange={(evento) => setCampo('municipio', evento.target.value)}
                placeholder="Escribe o selecciona un municipio"
              />
            </Field>

            <Field
              label="Dirección de residencia"
              full
              tooltip="Dirección completa (calle, número y barrio) del tercero."
            >
              <input
                className="mca-input"
                value={formulario.direccion}
                onChange={(evento) => setCampo('direccion', evento.target.value)}
                placeholder="Calle 00 # 00-00, barrio"
              />
            </Field>

            <div className="mca-notice is-info mca-field--full">
              <Wrench size={15} strokeWidth={2} />
              <span>
                <strong>Especialidad:</strong> {formulario.especialidad || 'Técnico eléctrico'} ·
                se muestra solo al ver la ficha del tercero.
              </span>
            </div>

            <Field
              label="¿Es cliente?"
              full
              hint="Marca la casilla para crear su ficha de cliente vinculada, sin duplicar los datos."
              tooltip="El tercero puede ser también cliente: la ficha se vincula por su documento."
            >
              <label className={`mca-check ${formulario.esCliente ? 'is-active' : ''}`.trim()}>
                <input
                  type="checkbox"
                  checked={Boolean(formulario.esCliente)}
                  onChange={(evento) => setCampo('esCliente', evento.target.checked)}
                />
                <span className="mca-check__texto">Sí, este tercero también es cliente</span>
                <span className="mca-check__meta">
                  {clienteDeTercero.has(String(formulario.id))
                    ? 'Ya tiene ficha de cliente vinculada'
                    : 'Se crea la ficha de cliente al guardar'}
                </span>
              </label>
            </Field>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(convertirA)}
        onClose={() => {
          setConvertirA(null);
          setConvForm(null);
        }}
        title={convertirA ? `Convertir a cliente: ${convertirA.nombre}` : 'Convertir a cliente'}
        subtitle="Se llama la información del tercero y se crea su ficha de cliente vinculada, sin duplicar la persona."
        icon={UsersRound}
        size="md"
        footer={
          <>
            <Button
              onClick={() => {
                setConvertirA(null);
                setConvForm(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="form-convertir">
              Crear cliente
            </Button>
          </>
        }
      >
        {convCargando || !convForm ? (
          <p role="status" style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Llamando la información del tercero...
          </p>
        ) : (
          <form id="form-convertir" className="mca-form-grid" onSubmit={confirmarConversion} noValidate>
            <Field
              label="Tipo de cliente"
              required
              full
              hint="La ficha se vincula al tercero: queda marcado como empleado."
              tooltip="Natural si se identifica con cédula; Jurídico si su documento es un NIT."
            >
              <div className="mca-segmented">
                <button
                  type="button"
                  className={convForm.tipoCliente === 'Natural' ? 'is-active' : ''}
                  onClick={() => elegirConvTipo('Natural')}
                >
                  Natural
                </button>
                <button
                  type="button"
                  className={convForm.tipoCliente === 'Jurídico' ? 'is-active' : ''}
                  onClick={() => elegirConvTipo('Jurídico')}
                >
                  Jurídico
                </button>
              </div>
            </Field>

            <Field
              label={convForm.tipoCliente === 'Jurídico' ? 'Razón social' : 'Nombre completo'}
              required
              tooltip="Nombre o razón social copiado del tercero."
            >
              <input
                className="mca-input"
                value={convForm.nombre}
                onChange={(evento) => setConvCampo('nombre', evento.target.value)}
              />
            </Field>

            <Field
              label={convForm.tipoCliente === 'Jurídico' ? 'NIT' : 'Número de documento'}
              required
              tooltip="Documento copiado del tercero; con él se evitan duplicados."
            >
              <input
                className="mca-input"
                value={convForm.documento}
                onChange={(evento) => setConvCampo('documento', evento.target.value)}
              />
            </Field>

            <Field
              label="Persona de contacto"
              tooltip="Persona que atiende la cuenta; por defecto el propio tercero."
            >
              <input
                className="mca-input"
                value={convForm.contacto}
                onChange={(evento) => setConvCampo('contacto', evento.target.value)}
              />
            </Field>

            <Field label="Número de contacto" tooltip="Celular o teléfono fijo del contacto.">
              <input
                className="mca-input"
                type="tel"
                value={convForm.telefono}
                onChange={(evento) => setConvCampo('telefono', evento.target.value)}
              />
            </Field>

            <Field label="Correo electrónico" tooltip="Correo para enviarle la cotización y los soportes.">
              <input
                className="mca-input"
                type="email"
                value={convForm.correo}
                onChange={(evento) => setConvCampo('correo', evento.target.value)}
              />
            </Field>

            <Field label="Departamento" tooltip="Departamento copiado del tercero.">
              <CampoDepartamento
                className="mca-input"
                value={convForm.departamento}
                onChange={(evento) => setConvCampo('departamento', evento.target.value)}
                placeholder="Escribe o selecciona un departamento"
              />
            </Field>

            <Field label="Municipio" tooltip="Municipio copiado del tercero.">
              <CampoMunicipio
                className="mca-input"
                departamento={convForm.departamento}
                value={convForm.municipio}
                onChange={(evento) => setConvCampo('municipio', evento.target.value)}
                placeholder="Escribe o selecciona un municipio"
              />
            </Field>

            <Field label="Dirección" full tooltip="Dirección copiada del tercero.">
              <input
                className="mca-input"
                value={convForm.direccion}
                onChange={(evento) => setConvCampo('direccion', evento.target.value)}
              />
            </Field>

            <div className="mca-notice is-success mca-field--full">
              <CheckCircle2 size={15} strokeWidth={2} />
              <span>
                La propiedad queda como <strong>{convForm.tipoPropiedad}</strong> y el tercero
                conserva su ficha: solo se crea la ficha de cliente vinculada.
              </span>
            </div>
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
              {!clienteDeTercero.has(String(tecnicoDetalle.id)) && (
                <Button
                  className="mca-btn--convertir"
                  icon={UsersRound}
                  onClick={() => abrirConversion(tecnicoDetalle)}
                >
                  Convertir a cliente
                </Button>
              )}
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
              <DetailItem label="Tipo de documento">{tecnicoDetalle.tipoDocumento || '—'}</DetailItem>
              <DetailItem label="Número de documento">{tecnicoDetalle.documento || '—'}</DetailItem>
              <DetailItem label="Razón social / Nombre">{tecnicoDetalle.nombre || '—'}</DetailItem>
              <DetailItem label="Especialidad">{tecnicoDetalle.especialidad}</DetailItem>
              <DetailItem label="Teléfono">{tecnicoDetalle.telefono || '—'}</DetailItem>
              <DetailItem label="Correo">{tecnicoDetalle.correo || '—'}</DetailItem>
              <DetailItem label="Usuario móvil">{tecnicoDetalle.usuario || '—'}</DetailItem>
              <DetailItem label="Rol móvil">{tecnicoDetalle.rol || '—'}</DetailItem>
              <DetailItem label="Departamento">{tecnicoDetalle.departamento || '—'}</DetailItem>
              <DetailItem label="Municipio donde reside">{tecnicoDetalle.municipio || '—'}</DetailItem>
              <DetailItem label="Dirección de residencia" full>
                {tecnicoDetalle.direccion || '—'}
              </DetailItem>
              <DetailItem label="Estado">
                <EstadoToggle
                  estado={tecnicoDetalle.estado}
                  estados={ESTADOS.usuario}
                  width={110}
                  onClick={() => cambiarEstado(tecnicoDetalle)}
                />
              </DetailItem>
              <DetailItem label="Servicios activos">{serviciosDetalle.length}</DetailItem>
              <DetailItem label="Cliente vinculado">
                {clienteDeTercero.has(String(tecnicoDetalle.id))
                  ? clienteDeTercero.get(String(tecnicoDetalle.id)).nombre
                  : 'No es cliente'}
              </DetailItem>
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
      label: `${cliente.tipoDocumento || ''} ${cliente.documento || ''} · ${cliente.nombre}`.trim(),
      meta: [cliente.departamento, cliente.municipio].filter(Boolean).join(' · ') || 'Sin ubicación',
      search: `${cliente.contacto} ${cliente.telefono} ${cliente.direccion} ${cliente.departamento} ${cliente.municipio}`,
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
    if (ordenFinalizada(orden)) {
      notify(
        'warning',
        'Orden quemada',
        `${orden.codigo} está Finalizada y queda bloqueada; solo puedes ver su detalle.`,
      );
      return;
    }
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
    if (ordenFinalizada(orden)) {
      notify(
        'warning',
        'Orden quemada',
        `${orden.codigo} está Finalizada: no se le cambia el estado.`,
      );
      return;
    }
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
          <table className="mca-table mca-table--orders">
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
                  <tr key={orden.id} className={claseFilaEstado(orden.estado, 'orden')}>
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
                      <div className="mca-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <EstadoToggle
                          estado={orden.estado}
                          estados={ESTADOS.orden}
                          width={120}
                          onClick={ordenFinalizada(orden) ? undefined : () => cambiarEstado(orden)}
                        />
                        {ordenFinalizada(orden) && <Badge tone="neutral">Quemada</Badge>}
                      </div>
                    </td>
                    <td className="mca-center">
                      <div className="mca-row" style={{ justifyContent: 'center', flexWrap: 'nowrap' }}>
                        <AccionesFila
                          onVer={() => setDetalleId(orden.id)}
                          onEditar={ordenFinalizada(orden) ? undefined : () => abrirEdicion(orden)}
                          onEliminar={ordenFinalizada(orden) ? undefined : () => setPorEliminar(orden)}
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
        subtitle={
          formulario?.id
            ? `Código ${formulario.codigo} · el estado se gestiona automáticamente según la fecha.`
            : 'El código se genera solo al guardar y aparece en el listado; el estado se gestiona según la fecha.'
        }
        icon={ClipboardList}
        size="lg"
        footer={
          <Button variant="primary" type="submit" form="form-orden">
            {formulario?.id ? 'Guardar cambios' : 'Crear orden'}
          </Button>
        }
      >
        {formulario && (
          <form id="form-orden" className="mca-form-grid" onSubmit={guardar} noValidate>
            <Field
              label="Prioridad"
              tooltip="Alta, Media o Baja. Define el orden de atención de la orden de servicio."
            >
              <select
                className="mca-select"
                value={formulario.prioridad}
                onChange={(evento) => setCampo('prioridad', evento.target.value)}
              >
                {PRIORIDADES_ORDEN.map((prioridad) => (
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
            <DetailItem label="Tipo de documento">{ordenDetalle.clienteTipoDocumento || '—'}</DetailItem>
            <DetailItem label="Documento / NIT">{ordenDetalle.clienteDocumento || '—'}</DetailItem>
            <DetailItem label="Razón social / Nombre">{ordenDetalle.cliente}</DetailItem>
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
              {[ordenDetalle.clienteDireccion, ordenDetalle.clienteDepartamento, ordenDetalle.clienteMunicipio]
                .filter(Boolean)
                .join(', ') || '—'}
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
