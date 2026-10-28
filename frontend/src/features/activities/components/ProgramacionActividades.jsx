import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';

import { AccionesFila } from '../../../shared/components/AccionesFila.jsx';
import { apiRequest } from '../../../shared/api.js';
import { useApiData } from '../../../shared/useApiData.js';
import { EstadoToggle, ESTADOS } from '../../../shared/components/EstadoToggle.jsx';
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
  resumenErroresFormulario,
  useToast,
} from '../../../shared/components/ui.jsx';
import {
  fechaISO,
  formatearFecha,
  sumarDias,
} from '../../../shared/services/base.js';
import {
  BUFFER_ENTRE_SERVICIOS_MINUTOS,
  DIAS_MAXIMOS_AGENDA,
  MARGEN_MINIMO_AGENDA_MINUTOS,
  formatearHora12,
  horaAMinutos,
  horarioDelDia,
  horasServicio,
  minutosAHora,
  nombreDia,
  sumarMinutosAHora,
} from '../../../shared/services/catalogos.js';
import { normalizarCliente } from '../../../shared/services/clientesService.js';
import {
  ESTADOS_AGENDA,
  PRIORIDADES_AGENDA,
  buscarActividades,
  estadoSiguienteAgenda,
  resumenAgenda,
  validarAgendaCompleta,
  validarCita,
} from '../../../shared/services/agendaService.js';
import { normalizarServicio } from '../../../shared/services/serviciosService.js';
import { normalizarTecnico } from '../../../shared/services/tercerosService.js';
import { claseFilaEstado } from '../../../shared/utils/estadosFila.js';

const FORMULARIO_VACIO = () => ({
  clienteId: '',
  cliente: '',
  telefono: '',
  direccion: '',
  servicioId: '',
  servicio: '',
  tecnicoId: '',
  fecha: fechaISO(),
  horaInicio: '',
  estado: 'Programada',
  prioridad: 'Media',
  descripcion: '',
});

function horaSugerida(fecha) {
  const horario = horarioDelDia(fecha);
  if (!horario) return '';

  const apertura = horaAMinutos(horario.apertura);
  const cierre = horaAMinutos(horario.cierre);

  if (fecha !== fechaISO()) return horario.apertura;

  const ahora = new Date();
  const minimo = ahora.getHours() * 60 + ahora.getMinutes() + MARGEN_MINIMO_AGENDA_MINUTOS;
  const redondeado = Math.ceil(minimo / 30) * 30;

  if (redondeado >= cierre) return '';
  return minutosAHora(Math.max(apertura, redondeado));
}

function fechaSugerida() {
  for (let indice = 0; indice <= DIAS_MAXIMOS_AGENDA; indice += 1) {
    const fecha = sumarDias(indice);
    if (horaSugerida(fecha)) return fecha;
  }
  return fechaISO();
}

// Al Completarse, la actividad se quema: solo se puede consultar.
const actividadQuemada = (actividad) => actividad?.estado === 'Completada';

export function ProgramacionActividades() {
  const {
    data,
    error,
    loading,
    reload: cargarDatos,
  } = useApiData(async () => {
    const [actividades, clientes, servicios, terceros] = await Promise.all([
      apiRequest('/agenda'),
      apiRequest('/clientes'),
      apiRequest('/servicios'),
      apiRequest('/terceros'),
    ]);
    return {
      actividades,
      clientes: clientes.map(normalizarCliente),
      servicios: servicios.map(normalizarServicio),
      tecnicos: terceros.map(normalizarTecnico).filter((tecnico) => tecnico.estado !== 'Inactivo'),
    };
  }, { actividades: [], clientes: [], servicios: [], tecnicos: [] });
  const { actividades, clientes, servicios, tecnicos } = data;

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todas');
  const [filtroPeriodo, setFiltroPeriodo] = useState('Todas');

  const [modalFormulario, setModalFormulario] = useState(false);
  const [actividadEditando, setActividadEditando] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});

  const [actividadDetalle, setActividadDetalle] = useState(null);
  const [actividadEliminar, setActividadEliminar] = useState(null);
  const [modalValidacion, setModalValidacion] = useState(false);

  const { toast, notify, close } = useToast();

  const hoy = fechaISO();
  const limiteSemana = sumarDias(7);

  const opcionesClientes = useMemo(
    () => clientes.map((cliente) => ({
      value: String(cliente.id),
      label: `${cliente.tipoDocumento || ''} ${cliente.documento || ''} · ${cliente.nombre}`.trim(),
      meta: [cliente.departamento, cliente.municipio].filter(Boolean).join(' · ') || 'Sin ubicación',
      search: `${cliente.contacto} ${cliente.telefono} ${cliente.correo} ${cliente.departamento} ${cliente.municipio}`,
    })),
    [clientes],
  );

  const opcionesServicios = useMemo(
    () => servicios.map((servicio) => ({
      value: String(servicio.id),
      label: servicio.nombre,
      meta: `${servicio.categoria} · ${servicio.tiempo} · ${servicio.estado}`,
      search: `${servicio.codigo} ${servicio.categoria} ${servicio.unidad}`,
    })),
    [servicios],
  );

  const filtradas = useMemo(() => {
    let base = buscarActividades(busqueda, actividades);

    if (filtroEstado !== 'Todas') {
      base = base.filter((actividad) => actividad.estado === filtroEstado);
    }

    if (filtroPeriodo === 'Hoy') {
      base = base.filter((actividad) => actividad.fecha === hoy);
    } else if (filtroPeriodo === 'Semana') {
      base = base.filter(
        (actividad) => actividad.fecha >= hoy && actividad.fecha <= limiteSemana,
      );
    } else if (filtroPeriodo === 'Mes') {
      base = base.filter(
        (actividad) => String(actividad.fecha).slice(0, 7) === hoy.slice(0, 7),
      );
    }

    return base;
  }, [actividades, busqueda, filtroEstado, filtroPeriodo, hoy, limiteSemana]);

  const resumen = useMemo(() => resumenAgenda(actividades), [actividades]);
  const incidencias = useMemo(() => validarAgendaCompleta(actividades), [actividades]);

  const erroresAgenda = incidencias.filter((incidencia) => incidencia.severidad === 'error').length;
  const advertenciasAgenda = incidencias.length - erroresAgenda;

  const servicioFormulario = useMemo(
    () => servicios.find((servicio) => String(servicio.id) === String(formulario.servicioId)) || null,
    [servicios, formulario.servicioId],
  );

  const horasFormulario = servicioFormulario ? horasServicio(servicioFormulario) : 0;

  const horaFinFormulario = formulario.horaInicio && horasFormulario > 0
    ? sumarMinutosAHora(formulario.horaInicio, horasFormulario * 60)
    : '';

  const horarioFormulario = horarioDelDia(formulario.fecha);

  // Hora más temprana permitida: la apertura del día, o la hora actual si se agenda hoy.
  const horaMinimaFormulario = formulario.fecha === hoy
    ? horaSugerida(formulario.fecha) || horarioFormulario?.apertura || ''
    : horarioFormulario?.apertura || '';

  const validacionViva = useMemo(() => {
    if (
      !formulario.clienteId
      || !formulario.servicioId
      || !formulario.tecnicoId
      || !formulario.fecha
      || !formulario.horaInicio
    ) {
      return null;
    }

    return validarCita(
      { ...formulario, horas: horasFormulario, estado: formulario.estado },
      actividadEditando?.id,
      { actividades, servicios },
    );
  }, [formulario, horasFormulario, actividadEditando, actividades, servicios]);

  const abrirNuevo = () => {
    const fecha = fechaSugerida();
    setActividadEditando(null);
    setErrores({});
    setFormulario({
      ...FORMULARIO_VACIO(),
      fecha,
      horaInicio: horaSugerida(fecha),
    });
    setModalFormulario(true);
  };

  const abrirEditar = (actividad) => {
    if (actividadQuemada(actividad)) {
      notify(
        'warning',
        'Servicio completado',
        `${actividad.codigo} quedó quemado al completarse; solo puedes consultarlo o descargar su evidencia.`,
      );
      return;
    }
    setActividadEditando(actividad);
    setErrores({});
    setFormulario({
      clienteId: String(actividad.clienteId || ''),
      cliente: actividad.cliente || '',
      telefono: actividad.telefono || '',
      direccion: actividad.direccion || '',
      servicioId: String(actividad.servicioId || ''),
      servicio: actividad.servicio || '',
      tecnicoId: String(actividad.tecnicoId || ''),
      fecha: actividad.fecha || fechaISO(),
      horaInicio: actividad.horaInicio || '',
      estado: actividad.estado || 'Programada',
      prioridad: actividad.prioridad || 'Media',
      descripcion: actividad.descripcion || '',
    });
    setActividadDetalle(null);
    setModalFormulario(true);
  };

  const cerrarFormulario = () => {
    setModalFormulario(false);
    setActividadEditando(null);
    setErrores({});
  };

  const seleccionarCliente = (valor) => {
    const cliente = clientes.find((item) => String(item.id) === String(valor));
    if (!cliente) {
      setFormulario((prev) => ({ ...prev, clienteId: '', cliente: '', telefono: '', direccion: '' }));
      return;
    }

    setFormulario((prev) => ({
      ...prev,
      clienteId: String(cliente.id),
      cliente: cliente.nombre,
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
    }));
    setErrores((prev) => ({ ...prev, clienteId: undefined }));
  };

  const seleccionarServicio = (valor) => {
    const servicio = servicios.find((item) => String(item.id) === String(valor));
    setFormulario((prev) => ({
      ...prev,
      servicioId: valor ? String(valor) : '',
      servicio: servicio?.nombre || '',
    }));
    setErrores((prev) => ({ ...prev, servicioId: undefined }));
  };

  const cambiarFecha = (valor) => {
    setFormulario((prev) => ({
      ...prev,
      fecha: valor,
      horaInicio: horaSugerida(valor) || '',
    }));
    setErrores((prev) => ({ ...prev, fecha: undefined, horaInicio: undefined }));
  };

  const handleGuardar = async (event) => {
    event.preventDefault();

    const nuevosErrores = {};
    if (!formulario.clienteId) nuevosErrores.clienteId = ['Selecciona el cliente.'];
    if (!formulario.servicioId) nuevosErrores.servicioId = ['Selecciona el servicio a agendar.'];
    if (!formulario.tecnicoId) nuevosErrores.tecnicoId = ['Selecciona el técnico responsable.'];
    if (!formulario.fecha) nuevosErrores.fecha = ['Selecciona la fecha del servicio.'];
    if (!formulario.horaInicio) nuevosErrores.horaInicio = ['Selecciona la hora de inicio.'];
    if (
      formulario.horaInicio &&
      horaMinimaFormulario &&
      formulario.horaInicio < horaMinimaFormulario
    ) {
      nuevosErrores.horaInicio = [
        `La hora de inicio no puede ser anterior a ${horaMinimaFormulario}.`,
      ];
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      notify('warning', 'Mensaje flotante de validación', resumenErroresFormulario(nuevosErrores));
      return;
    }

    try {
      const guardada = await apiRequest(
        actividadEditando
          ? `/agenda/${encodeURIComponent(actividadEditando.id)}`
          : '/agenda',
        {
          method: actividadEditando ? 'PUT' : 'POST',
          body: {
            clienteId: formulario.clienteId,
            servicioId: formulario.servicioId,
            tecnicoId: formulario.tecnicoId,
            fecha: formulario.fecha,
            horaInicio: formulario.horaInicio,
            estado: formulario.estado,
            prioridad: formulario.prioridad,
            descripcion: formulario.descripcion,
            horas: horasFormulario,
          },
        },
      );

      await cargarDatos();
      notify(
        'success',
        actividadEditando ? 'Servicio actualizado' : 'Servicio agendado',
        `${guardada.codigo} · ${guardada.cliente} · ${formatearFecha(guardada.fecha)} de ${guardada.horaInicio} a ${guardada.horaFin}.`,
      );
      cerrarFormulario();
    } catch (error) {
      if (error.errores) setErrores(error.errores);
      notify('error', 'No se pudo agendar el servicio', error.message);
    }
  };

  const handleCambiarEstado = async (actividad) => {
    if (actividadQuemada(actividad)) {
      notify(
        'warning',
        'Servicio quemado',
        `${actividad.codigo} está Completada y queda bloqueada; solo se puede consultar.`,
      );
      return;
    }
    try {
      const actualizada = await apiRequest(`/agenda/${encodeURIComponent(actividad.id)}/estado`, {
        method: 'PATCH',
        body: { estado: estadoSiguienteAgenda(actividad.estado) },
      });
      await cargarDatos();
      notify(
        actualizada.estado === 'Completada' ? 'success' : 'info',
        'Estado actualizado',
        actualizada.estado === 'Completada'
          ? `${actualizada.codigo} quedó Finalizada y quemada: ya no se puede editar ni eliminar.`
          : `${actualizada.codigo} pasó a ${actualizada.estado}.`,
      );
    } catch (error) {
      notify('error', 'No se pudo cambiar el estado', error.message);
    }
  };

  const confirmarEliminar = async () => {
    if (!actividadEliminar) return;
    try {
      await apiRequest(`/agenda/${encodeURIComponent(actividadEliminar.id)}`, { method: 'DELETE' });
      await cargarDatos();
      notify(
        'success',
        'Servicio eliminado',
        `${actividadEliminar.codigo} fue retirado de la agenda.`,
      );
    } catch (error) {
      notify('error', 'No se pudo eliminar el servicio', error.message);
    } finally {
      setActividadEliminar(null);
    }
  };

  const errorCampo = (campo) => errores[campo]?.[0] || '';

  return (
    <PageShell>
      {error && <p role="alert" style={{ color: '#b91c1c' }}>No se pudo cargar la agenda desde la API: {error}</p>}
      {loading && <p role="status">Cargando agenda desde la API...</p>}
      <PageHeader
        eyebrow="Agenda"
        title="Agenda de Servicios"
        subtitle={`Atención de lunes a viernes de 07:00 a 18:00 y sábados de 08:00 a 13:00 · agenda con ${MARGEN_MINIMO_AGENDA_MINUTOS} min de anticipación.`}
        icon={CalendarDays}
        actions={
          <>
            <Button icon={ShieldCheck} onClick={() => setModalValidacion(true)}>
              Validar agenda
            </Button>
            <Button variant="primary" icon={CalendarPlus} onClick={abrirNuevo}>
              Agendar servicio
            </Button>
          </>
        }
      />

      <div className="mca-kpis">
        <KpiCard
          label="Servicios agendados"
          value={resumen.total}
          hint={`${resumen.canceladas} cancelados`}
          icon={CalendarDays}
          tone="yellow"
        />
        <KpiCard
          label="Programados"
          value={resumen.programadas}
          hint="Pendientes de ejecución"
          icon={CalendarClock}
          tone="info"
        />
        <KpiCard
          label="En proceso"
          value={resumen.proceso}
          hint="Atención en curso"
          icon={Wrench}
          tone="warning"
        />
        <KpiCard
          label="Completados"
          value={resumen.completadas}
          hint="Servicios finalizados"
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <div
        className={`mca-notice is-${incidencias.length > 0 ? (erroresAgenda > 0 ? 'danger' : 'warning') : 'success'}`}
        style={{ marginBottom: 16, alignItems: 'center' }}
      >
        {incidencias.length > 0 ? (
          <AlertTriangle size={18} strokeWidth={2} />
        ) : (
          <CheckCircle2 size={18} strokeWidth={2} />
        )}
        <div style={{ flex: 1 }}>
          {incidencias.length > 0 ? (
            <>
              <strong>Revisión de agenda:</strong> {erroresAgenda} conflicto(s) y{' '}
              {advertenciasAgenda} advertencia(s) en servicios activos. Revisa los cruces de técnicos,
              horarios fuera de atención o fechas vencidas.
            </>
          ) : (
            <>
              <strong>Agenda validada.</strong> Los servicios activos están dentro del horario de
              atención, sin cruces de técnicos ni fechas vencidas.
            </>
          )}
        </div>
        {incidencias.length > 0 && (
          <Button size="sm" onClick={() => setModalValidacion(true)}>
            Ver incidencias
          </Button>
        )}
      </div>

      <Panel
        title="Servicios programados"
        subtitle={`${filtradas.length} de ${actividades.length} servicios · margen de ${BUFFER_ENTRE_SERVICIOS_MINUTOS} min entre servicios del mismo técnico`}
        actions={
          <>
            <SearchInput
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar por código, cliente, servicio o técnico..."
            />
            <select
              className="mca-select"
              style={{ width: 150 }}
              value={filtroPeriodo}
              onChange={(event) => setFiltroPeriodo(event.target.value)}
              aria-label="Filtrar por periodo"
            >
              <option value="Todas">Todo el periodo</option>
              <option value="Hoy">Hoy</option>
              <option value="Semana">Próximos 7 días</option>
              <option value="Mes">Este mes</option>
            </select>
            <select
              className="mca-select"
              style={{ width: 145 }}
              value={filtroEstado}
              onChange={(event) => setFiltroEstado(event.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="Todas">Todos los estados</option>
              {ESTADOS_AGENDA.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
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
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Técnico</th>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Estado</th>
                <th className="mca-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="mca-table__empty">
                    <EmptyState
                      icon={CalendarDays}
                      title="Sin servicios en la agenda"
                      message="Ajusta los filtros o agenda un servicio con cliente, técnico y horario disponible."
                      action={
                        <Button size="sm" icon={CalendarPlus} onClick={abrirNuevo}>
                          Agendar servicio
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtradas.map((actividad) => (
                  <tr
                    key={actividad.id}
                    className={[
                      claseFilaEstado(actividad.estado, 'actividad'),
                      actividadQuemada(actividad) ? 'mca-row--inactivo' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <td className="is-nowrap">
                      <Badge tone="yellow">{actividad.codigo}</Badge>
                    </td>
                    <td>
                      <div className="is-primary">{actividad.cliente}</div>
                      <div className="mca-soft" style={{ fontSize: 11, marginTop: 2 }}>
                        {actividad.telefono || 'Sin teléfono'}
                      </div>
                    </td>
                    <td>
                      <div className="is-primary" style={{ fontSize: 12 }}>
                        {actividad.servicio}
                      </div>
                      <div className="mca-soft" style={{ fontSize: 11, marginTop: 2 }}>
                        {actividad.prioridad} prioridad
                      </div>
                    </td>
                    <td>{actividad.tecnico}</td>
                    <td className="is-nowrap">
                      <div className="mca-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <span>{formatearFecha(actividad.fecha)}</span>
                        {actividad.fecha === hoy && <Badge tone="info">Hoy</Badge>}
                      </div>
                      <div className="mca-soft" style={{ fontSize: 11, marginTop: 2 }}>
                        {nombreDia(actividad.fecha)}
                      </div>
                    </td>
                    <td className="is-nowrap">
                      <div className="is-primary" style={{ fontSize: 12 }}>
                        {actividad.horaInicio} – {actividad.horaFin}
                      </div>
                      <div className="mca-soft" style={{ fontSize: 11, marginTop: 2 }}>
                        {actividad.horas} h · {formatearHora12(actividad.horaInicio)}
                      </div>
                    </td>
                    <td>
                      <div className="mca-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <EstadoToggle
                          estado={actividad.estado}
                          estados={ESTADOS.actividad}
                          width={118}
                          onClick={
                            actividadQuemada(actividad)
                              ? undefined
                              : () => handleCambiarEstado(actividad)
                          }
                        />
                        {actividadQuemada(actividad) && <Badge tone="neutral">Quemada</Badge>}
                      </div>
                    </td>
                    <td className="mca-center">
                      <AccionesFila
                        onVer={() => setActividadDetalle(actividad)}
                        onEditar={
                          actividadQuemada(actividad) ? undefined : () => abrirEditar(actividad)
                        }
                        onEliminar={
                          actividadQuemada(actividad) ? undefined : () => setActividadEliminar(actividad)
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        open={modalFormulario}
        onClose={cerrarFormulario}
        title={actividadEditando ? 'Editar servicio agendado' : 'Agendar servicio'}
        subtitle={
          actividadEditando
            ? `${actividadEditando.codigo} · ${actividadEditando.cliente}`
            : 'El código de agenda se genera automáticamente.'
        }
        icon={actividadEditando ? CalendarClock : CalendarPlus}
        size="lg"
        footer={
          <>
            <Button onClick={cerrarFormulario}>Cancelar</Button>
            <Button variant="primary" type="submit" form="form-agenda">
              {actividadEditando ? 'Guardar cambios' : 'Agendar servicio'}
            </Button>
          </>
        }
      >
        <form id="form-agenda" className="mca-form-grid" onSubmit={handleGuardar}>
          <Field
            label="Cliente"
            required
            full
            error={errorCampo('clienteId')}
            hint="Busca por nombre, documento, contacto o municipio; los datos se completan solos."
          >
            <Combobox
              value={formulario.clienteId}
              onChange={seleccionarCliente}
              options={opcionesClientes}
              placeholder="Buscar cliente..."
              emptyText="No se encontraron clientes"
            />
          </Field>

          <Field label="Teléfono" hint="Se completa al seleccionar el cliente.">
            <input
              className="mca-input"
              type="text"
              value={formulario.telefono}
              disabled
              placeholder="Automático"
            />
          </Field>

          <Field label="Dirección del servicio" hint="Se completa al seleccionar el cliente.">
            <input
              className="mca-input"
              type="text"
              value={formulario.direccion}
              disabled
              placeholder="Automático"
            />
          </Field>

          <Field
            label="Servicio"
            required
            full
            error={errorCampo('servicioId')}
            hint="La duración se toma automáticamente del tiempo estimado del servicio."
          >
            <Combobox
              value={formulario.servicioId}
              onChange={seleccionarServicio}
              options={opcionesServicios}
              placeholder="Buscar servicio del catálogo..."
              emptyText="No se encontraron servicios"
            />
          </Field>

          <Field label="Duración estimada" hint="Calculada desde el servicio seleccionado.">
            <input
              className="mca-input"
              type="text"
              value={horasFormulario > 0 ? `${horasFormulario} ${horasFormulario === 1 ? 'hora' : 'horas'}` : ''}
              disabled
              placeholder="Selecciona un servicio"
            />
          </Field>

          <Field label="Técnico responsable" required error={errorCampo('tecnicoId')}>
            <select
              className="mca-select"
              value={formulario.tecnicoId}
              onChange={(event) => {
                setFormulario((prev) => ({ ...prev, tecnicoId: event.target.value }));
                setErrores((prev) => ({ ...prev, tecnicoId: undefined }));
              }}
            >
              <option value="">Selecciona un técnico</option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.id} value={tecnico.id}>
                  {tecnico.nombre} · {tecnico.especialidad}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Fecha del servicio"
            required
            error={errorCampo('fecha')}
            hint={
              horarioFormulario
                ? `${nombreDia(formulario.fecha)} · atención de ${horarioFormulario.apertura} a ${horarioFormulario.cierre}`
                : 'Este día no tiene atención. Elige otro.'
            }
          >
            <input
              className="mca-input"
              type="date"
              min={hoy}
              max={sumarDias(DIAS_MAXIMOS_AGENDA)}
              value={formulario.fecha}
              onChange={(event) => cambiarFecha(event.target.value)}
            />
          </Field>

          <Field
            label="Hora de inicio"
            required
            error={errorCampo('horaInicio')}
            tooltip={`Hora en que arranca el servicio. No se ofrecen las horas que ya pasaron: el mínimo disponible es ${horaMinimaFormulario || 'el cierre del día'}.`}
            hint={`Agenda con al menos ${MARGEN_MINIMO_AGENDA_MINUTOS} min de anticipación.`}
          >
            <input
              className="mca-input"
              type="time"
              step="900"
              min={horaMinimaFormulario || undefined}
              value={formulario.horaInicio}
              onChange={(event) => {
                setFormulario((prev) => ({ ...prev, horaInicio: event.target.value }));
                setErrores((prev) => ({ ...prev, horaInicio: undefined }));
              }}
            />
          </Field>

          <Field label="Hora de finalización" hint="Calculada con la duración del servicio.">
            <input
              className="mca-input"
              type="text"
              value={horaFinFormulario ? `${horaFinFormulario} · ${formatearHora12(horaFinFormulario)}` : ''}
              disabled
              placeholder="Se calcula al elegir hora y servicio"
            />
          </Field>

          <Field
            label="Prioridad"
            tooltip="Qué tan rápido se atiende el servicio: Baja, Media o Alta."
          >
            <select
              className="mca-select"
              value={formulario.prioridad}
              onChange={(event) => setFormulario((prev) => ({ ...prev, prioridad: event.target.value }))}
            >
              {PRIORIDADES_AGENDA.map((prioridad) => (
                <option key={prioridad} value={prioridad}>
                  {prioridad}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Estado">
            <select
              className="mca-select"
              value={formulario.estado}
              onChange={(event) => setFormulario((prev) => ({ ...prev, estado: event.target.value }))}
            >
              {ESTADOS_AGENDA.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Descripción del trabajo" full>
            <textarea
              className="mca-textarea"
              rows={2}
              value={formulario.descripcion}
              onChange={(event) => setFormulario((prev) => ({ ...prev, descripcion: event.target.value }))}
              placeholder="Detalle del servicio, materiales o indicaciones para el técnico."
            />
          </Field>

          <div className="mca-field mca-field--full">
            <div className="mca-notice is-info">
              <Clock3 size={16} strokeWidth={2} />
              <div>
                <strong>Horario de atención:</strong> lunes a viernes 07:00–18:00 · sábados
                08:00–13:00. Se reservan {BUFFER_ENTRE_SERVICIOS_MINUTOS} minutos entre servicios del
                mismo técnico.
              </div>
            </div>
          </div>

          {validacionViva && (
            <div className="mca-field mca-field--full">
              <div className={`mca-notice is-${validacionViva.mensajes.length > 0 ? 'warning' : 'success'}`}>
                {validacionViva.mensajes.length > 0 ? (
                  <AlertTriangle size={16} strokeWidth={2} />
                ) : (
                  <CheckCircle2 size={16} strokeWidth={2} />
                )}
                <div>
                  {validacionViva.mensajes.length > 0 ? (
                    <>
                      <strong>Revisa la programación:</strong> {validacionViva.mensajes[0]}
                    </>
                  ) : (
                    <>
                      <strong>Horario disponible.</strong> Termina a las {validacionViva.horaFin} sin
                      cruces con otros servicios del técnico.
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={Boolean(actividadDetalle)}
        onClose={() => setActividadDetalle(null)}
        title={actividadDetalle?.codigo || 'Detalle del servicio'}
        subtitle={actividadDetalle ? `${actividadDetalle.cliente} · ${actividadDetalle.servicio}` : ''}
        icon={CalendarCheck2}
        size="lg"
        footer={
          actividadDetalle && (
            <>
              <Button onClick={() => setActividadDetalle(null)}>Cerrar</Button>
              <Button variant="primary" icon={CalendarClock} onClick={() => abrirEditar(actividadDetalle)}>
                Editar agenda
              </Button>
            </>
          )
        }
      >
        {actividadDetalle && (
          <div className="mca-stack">
            {actividadDetalle.fecha < hoy
              && ['Programada', 'En proceso'].includes(actividadDetalle.estado) && (
                <div className="mca-notice is-warning">
                  <AlertTriangle size={16} strokeWidth={2} />
                  <div>
                    Este servicio quedó en una fecha pasada y sigue activo. Reprograma o cambia su
                    estado para mantener la agenda validada.
                  </div>
                </div>
              )}

            <DetailGrid>
              <DetailItem label="Cliente">{actividadDetalle.cliente}</DetailItem>
              <DetailItem label="Teléfono">{actividadDetalle.telefono || '—'}</DetailItem>
              <DetailItem label="Dirección" full>{actividadDetalle.direccion || '—'}</DetailItem>
              <DetailItem label="Servicio">{actividadDetalle.servicio}</DetailItem>
              <DetailItem label="Técnico">{actividadDetalle.tecnico}</DetailItem>
              <DetailItem label="Fecha">
                {formatearFecha(actividadDetalle.fecha)} · {nombreDia(actividadDetalle.fecha)}
              </DetailItem>
              <DetailItem label="Horario">
                {actividadDetalle.horaInicio} – {actividadDetalle.horaFin}
              </DetailItem>
              <DetailItem label="Duración">{actividadDetalle.horas} horas</DetailItem>
              <DetailItem label="Prioridad">{actividadDetalle.prioridad}</DetailItem>
              <DetailItem label="Estado">
                <EstadoToggle estado={actividadDetalle.estado} estados={ESTADOS.actividad} width={118} />
              </DetailItem>
              <DetailItem label="Descripción" full>
                {actividadDetalle.descripcion || 'Sin descripción registrada.'}
              </DetailItem>
            </DetailGrid>

            <div className="mca-notice is-info">
              <Users size={16} strokeWidth={2} />
              <div>
                <strong>Técnico:</strong> {actividadDetalle.tecnico}. Verifica que no existan otros
                servicios del mismo técnico dentro de los {BUFFER_ENTRE_SERVICIOS_MINUTOS} minutos
                anteriores o posteriores a este horario.
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={modalValidacion}
        onClose={() => setModalValidacion(false)}
        title="Validación de agenda"
        subtitle="Revisión de horarios, fechas y cruces de técnicos en servicios activos."
        icon={ShieldCheck}
        size="lg"
        footer={<Button onClick={() => setModalValidacion(false)}>Cerrar</Button>}
      >
        <div className="mca-stack">
          {incidencias.length === 0 ? (
            <div className="mca-notice is-success">
              <CheckCircle2 size={18} strokeWidth={2} />
              <div>
                <strong>Agenda sin conflictos.</strong> Todos los servicios activos están dentro del
                horario permitido, con fechas válidas y sin cruces de técnicos.
              </div>
            </div>
          ) : (
            <>
              <div className="mca-notice is-warning">
                <AlertTriangle size={18} strokeWidth={2} />
                <div>
                  Se encontraron {incidencias.length} incidencia(s): {erroresAgenda} de severidad alta
                  (conflictos u horarios inválidos) y {advertenciasAgenda} advertencia(s).
                </div>
              </div>

              <div className="mca-table-wrap">
                <table className="mca-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Cliente / Técnico</th>
                      <th>Severidad</th>
                      <th>Detalle</th>
                      <th className="mca-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidencias.map((incidencia, indice) => (
                      <tr
                        key={`${incidencia.id}-${indice}`}
                        className={
                          incidencia.severidad === 'error' ? 'mca-row--critico' : 'mca-row--bajo'
                        }
                      >
                        <td className="is-nowrap">
                          <Badge tone={incidencia.severidad === 'error' ? 'danger' : 'warning'}>
                            {incidencia.codigo}
                          </Badge>
                        </td>
                        <td>{incidencia.cliente || '—'}</td>
                        <td>
                          <Badge tone={incidencia.severidad === 'error' ? 'danger' : 'warning'}>
                            {incidencia.severidad === 'error' ? 'Alta' : 'Advertencia'}
                          </Badge>
                        </td>
                        <td>{incidencia.mensaje}</td>
                        <td className="mca-center">
                          <Button
                            size="sm"
                            onClick={() => {
                              const actividad = actividades.find(
                                (item) => String(item.id) === String(incidencia.id),
                              );
                              setModalValidacion(false);
                              if (actividad) abrirEditar(actividad);
                            }}
                          >
                            Revisar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="mca-notice is-info">
            <Clock3 size={16} strokeWidth={2} />
            <div>
              La validación automática revisa: día de atención, horario permitido, fechas vencidas,
              anticipación mínima de {MARGEN_MINIMO_AGENDA_MINUTOS} minutos y {BUFFER_ENTRE_SERVICIOS_MINUTOS}{' '}
              minutos de margen entre servicios del mismo técnico.
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(actividadEliminar)}
        title="Eliminar servicio de la agenda"
        message={
          actividadEliminar
            ? `Se eliminará ${actividadEliminar.codigo} de ${actividadEliminar.cliente} programado para el ${formatearFecha(actividadEliminar.fecha)} a las ${actividadEliminar.horaInicio}. Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar servicio"
        onCancel={() => setActividadEliminar(null)}
        onConfirm={confirmarEliminar}
      />

      <Toast toast={toast} onClose={close} />
    </PageShell>
  );
}

export default ProgramacionActividades;
