import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';

import { AccionesFila } from '../../../shared/components/AccionesFila.jsx';
import {
  EstadoToggle,
  ESTADOS,
  estadoSiguiente,
} from '../../../shared/components/EstadoToggle.jsx';
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
import {
  fechaISO,
  formatearFecha,
  formatearMoneda,
  useData,
} from '../../../shared/services/base.js';
import { precioEnCOP } from '../../../shared/services/catalogos.js';
import { CLIENTES_KEY, obtenerClientes } from '../../../shared/services/clientesService.js';
import {
  COTIZACIONES_KEY,
  MONEDA_COTIZACION,
  buscarCotizaciones,
  calcularTotales,
  cambiarEstadoCotizacion,
  cotizacionVencida,
  crearItemMaterial,
  crearItemServicio,
  eliminarCotizacion,
  fechaVencimiento,
  generarIdCotizacion,
  guardarCotizacion,
  obtenerCotizaciones,
  resumenCotizaciones,
} from '../../../shared/services/cotizacionesService.js';
import { MATERIALES_KEY, obtenerMateriales } from '../../../shared/services/materialesService.js';
import { PAGOS_KEY, obtenerCuentas } from '../../../shared/services/pagosService.js';
import { SERVICIOS_KEY, obtenerServicios } from '../../../shared/services/serviciosService.js';
import { generarPdfCotizacion } from '../../../shared/utils/pdf.js';

const FORMULARIO_VACIO = () => ({
  clienteId: '',
  cliente: '',
  documento: '',
  contacto: '',
  telefono: '',
  correo: '',
  direccion: '',
  proyecto: '',
  fechaEmision: fechaISO(),
  diasVigencia: '30',
  ivaPorcentaje: '16',
  descuento: '0',
  notas: '',
  estadoCotizacion: 'Pendiente',
  items: [],
});

export function Cotizacion() {
  const cotizaciones = useData([COTIZACIONES_KEY], obtenerCotizaciones);
  const clientes = useData([CLIENTES_KEY], obtenerClientes);
  const servicios = useData([SERVICIOS_KEY], obtenerServicios);
  const materiales = useData([MATERIALES_KEY], obtenerMateriales);
  const cuentas = useData([PAGOS_KEY, COTIZACIONES_KEY], obtenerCuentas);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todas');

  const [modalFormulario, setModalFormulario] = useState(false);
  const [cotizacionEditando, setCotizacionEditando] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});

  const [cotizacionDetalle, setCotizacionDetalle] = useState(null);
  const [cotizacionEliminar, setCotizacionEliminar] = useState(null);
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  const [materialSeleccionado, setMaterialSeleccionado] = useState('');

  const { toast, notify, close } = useToast();

  const opcionesClientes = useMemo(
    () => clientes.map((cliente) => ({
      value: String(cliente.id),
      label: cliente.nombre,
      meta: cliente.documento,
      search: `${cliente.contacto} ${cliente.correo} ${cliente.telefono} ${cliente.municipio} ${cliente.departamento}`,
    })),
    [clientes],
  );

  const opcionesServicios = useMemo(
    () => servicios
      .filter((servicio) => servicio.estado === 'Activo')
      .map((servicio) => ({
        value: String(servicio.id),
        label: servicio.nombre,
        meta: `${formatearMoneda(precioEnCOP(servicio.precioNumerico, servicio.moneda), 'COP')} · ${servicio.tiempo}`,
        search: `${servicio.codigo} ${servicio.categoria}`,
      })),
    [servicios],
  );

  const opcionesMateriales = useMemo(
    () => materiales.map((material) => ({
      value: String(material.id),
      label: material.nombre,
      meta: `${material.stock.toLocaleString('es-CO')} ${material.unidad.toLowerCase()} · ${formatearMoneda(material.precioUnitario, 'COP')}`,
      search: `${material.id} ${material.categoria}`,
    })),
    [materiales],
  );

  const filtradas = useMemo(() => {
    const base = buscarCotizaciones(busqueda, cotizaciones);
    return filtroEstado === 'Todas'
      ? base
      : base.filter((cotizacion) => cotizacion.estadoCotizacion === filtroEstado);
  }, [cotizaciones, busqueda, filtroEstado]);

  const resumen = useMemo(() => resumenCotizaciones(cotizaciones), [cotizaciones]);
  const saldoPorCobrar = useMemo(
    () => cuentas.reduce((total, cuenta) => total + cuenta.saldo, 0),
    [cuentas],
  );

  const totalesFormulario = useMemo(
    () => calcularTotales({
      items: formulario.items,
      descuento: formulario.descuento,
      ivaPorcentaje: formulario.ivaPorcentaje,
    }),
    [formulario.items, formulario.descuento, formulario.ivaPorcentaje],
  );

  const cuentaDetalle = cotizacionDetalle
    ? cuentas.find((cuenta) => String(cuenta.cotizacionId) === String(cotizacionDetalle.id))
    : null;

  const abrirNueva = () => {
    setCotizacionEditando(null);
    setErrores({});
    setServicioSeleccionado('');
    setMaterialSeleccionado('');
    setFormulario(FORMULARIO_VACIO());
    setModalFormulario(true);
  };

  const abrirEditar = (cotizacion) => {
    setCotizacionEditando(cotizacion);
    setErrores({});
    setServicioSeleccionado('');
    setMaterialSeleccionado('');
    setFormulario({
      clienteId: cotizacion.clienteId ? String(cotizacion.clienteId) : '',
      cliente: cotizacion.cliente,
      documento: cotizacion.documento,
      contacto: cotizacion.contacto,
      telefono: cotizacion.telefono,
      correo: cotizacion.correo,
      direccion: cotizacion.direccion,
      proyecto: cotizacion.proyecto,
      fechaEmision: cotizacion.fechaEmision,
      diasVigencia: String(cotizacion.diasVigencia),
      ivaPorcentaje: String(cotizacion.ivaPorcentaje),
      descuento: String(cotizacion.descuento),
      notas: cotizacion.notas,
      estadoCotizacion: cotizacion.estadoCotizacion,
      items: (cotizacion.items || []).map((item) => ({ ...item })),
    });
    setModalFormulario(true);
  };

  const cerrarFormulario = () => {
    setModalFormulario(false);
    setCotizacionEditando(null);
    setErrores({});
    setServicioSeleccionado('');
    setMaterialSeleccionado('');
  };

  const seleccionarCliente = (id) => {
    const cliente = clientes.find((item) => String(item.id) === String(id));

    setFormulario((actual) => ({
      ...actual,
      clienteId: cliente ? String(cliente.id) : id,
      cliente: cliente?.nombre || '',
      documento: cliente?.documento || '',
      contacto: cliente?.contacto || '',
      telefono: cliente?.telefono || '',
      correo: cliente?.correo || '',
      direccion: cliente
        ? [cliente.direccion, cliente.municipio].filter(Boolean).join(', ')
        : actual.direccion,
    }));
    setErrores((actual) => ({ ...actual, clienteId: '' }));
  };

  const agregarServicio = (id) => {
    const servicio = servicios.find((item) => String(item.id) === String(id));
    if (!servicio) {
      setServicioSeleccionado('');
      return;
    }

    setFormulario((actual) => ({
      ...actual,
      items: [...actual.items, crearItemServicio(servicio, 1)],
    }));
    setErrores((actual) => ({ ...actual, items: '' }));
    setServicioSeleccionado('');
  };

  const agregarMaterial = (id) => {
    const material = materiales.find((item) => String(item.id) === String(id));
    if (!material) {
      setMaterialSeleccionado('');
      return;
    }

    setFormulario((actual) => ({
      ...actual,
      items: [...actual.items, crearItemMaterial(material, 1)],
    }));
    setErrores((actual) => ({ ...actual, items: '' }));
    setMaterialSeleccionado('');
  };

  const actualizarItem = (id, campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      items: actual.items.map((item) => {
        if (item.id !== id) return item;
        if (campo === 'cantidad' || campo === 'precioUnit') {
          return { ...item, [campo]: valor === '' ? 0 : Number(valor) };
        }
        return { ...item, [campo]: valor };
      }),
    }));
  };

  const quitarItem = (id) => {
    setFormulario((actual) => ({
      ...actual,
      items: actual.items.filter((item) => item.id !== id),
    }));
  };

  const handleGuardar = (event) => {
    event.preventDefault();

    const nuevosErrores = {};
    if (!formulario.clienteId) nuevosErrores.clienteId = 'Selecciona un cliente.';
    if (!formulario.proyecto.trim()) nuevosErrores.proyecto = 'Escribe el nombre del proyecto.';
    if (formulario.items.length === 0) nuevosErrores.items = 'Agrega al menos un servicio o material.';
    if (formulario.items.some((item) => Number(item.cantidad) <= 0)) {
      nuevosErrores.items = 'Todas las cantidades deben ser mayores que cero.';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      const guardada = guardarCotizacion(
        {
          ...formulario,
          fechaEmision: formulario.fechaEmision,
          fecha: formulario.fechaEmision,
          diasVigencia: Number(formulario.diasVigencia) || 30,
          ivaPorcentaje: Number(formulario.ivaPorcentaje) || 0,
          descuento: Number(formulario.descuento) || 0,
          items: formulario.items,
        },
        cotizacionEditando?.id,
      );

      notify(
        'success',
        cotizacionEditando ? 'Cotización actualizada' : 'Cotización creada',
        `${guardada.id} · ${guardada.cliente} · Total ${formatearMoneda(guardada.total, 'COP')}.`,
      );
      cerrarFormulario();
    } catch (error) {
      notify('error', 'No se pudo guardar la cotización', error.message);
    }
  };

  const handleCambiarEstado = (cotizacion) => {
    const siguiente = estadoSiguiente(ESTADOS.cotizacion, cotizacion.estadoCotizacion);

    try {
      cambiarEstadoCotizacion(cotizacion.id, siguiente);
      notify(
        'info',
        'Estado actualizado',
        `${cotizacion.id} ahora está ${siguiente.toLowerCase()}.`,
      );
    } catch (error) {
      notify('error', 'No se pudo cambiar el estado', error.message);
    }
  };

  const handlePdf = (cotizacion) => {
    const cuenta = cuentas.find(
      (item) => String(item.cotizacionId) === String(cotizacion.id),
    );

    try {
      generarPdfCotizacion({ ...cotizacion, abonado: cuenta?.abonado || 0 });
      notify(
        'info',
        'Vista de impresión abierta',
        'Usa "Guardar como PDF" en el diálogo de impresión para descargar la cotización.',
      );
    } catch (error) {
      notify('error', 'No se pudo generar el PDF', error.message);
    }
  };

  const confirmarEliminar = () => {
    if (!cotizacionEliminar) return;

    try {
      eliminarCotizacion(cotizacionEliminar.id);
      notify(
        'success',
        'Cotización eliminada',
        `${cotizacionEliminar.id} se retiró de la lista. Los abonos registrados se conservan en el historial de pagos.`,
      );
    } catch (error) {
      notify('error', 'No se pudo eliminar', error.message);
    } finally {
      setCotizacionEliminar(null);
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Cotizaciones"
        title="Cotizaciones"
        subtitle="Servicios y materiales del catálogo, cantidades editables y PDF listo para el cliente."
        icon={FileText}
        actions={
          <Button variant="primary" icon={Plus} onClick={abrirNueva}>
            Nueva cotización
          </Button>
        }
      />

      <div className="mca-kpis">
        <KpiCard
          label="Cotizaciones"
          value={cotizaciones.length}
          hint={`${resumen.aprobadas} aprobadas · ${resumen.pendientes} pendientes`}
          icon={FileText}
          tone="yellow"
        />
        <KpiCard
          label="Total cotizado"
          value={formatearMoneda(resumen.total, 'COP')}
          hint="Suma de todas las cotizaciones"
          icon={CircleDollarSign}
          tone="info"
        />
        <KpiCard
          label="Aprobadas"
          value={resumen.aprobadas}
          hint="Habilitadas para abonos"
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label="Saldo por cobrar"
          value={formatearMoneda(saldoPorCobrar, 'COP')}
          hint="Pendiente de recaudo"
          icon={Clock3}
          tone="warning"
        />
      </div>

      <Panel
        title="Listado de cotizaciones"
        subtitle={`${filtradas.length} de ${cotizaciones.length} cotizaciones`}
        actions={
          <>
            <SearchInput
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar por ID, cliente, proyecto o ítem..."
            />
            <select
              className="mca-select"
              style={{ width: 160 }}
              value={filtroEstado}
              onChange={(event) => setFiltroEstado(event.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="Todas">Todos los estados</option>
              {ESTADOS.cotizacion.map((estado) => (
                <option key={estado.nombre} value={estado.nombre}>
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
                <th>ID</th>
                <th>Cliente / Proyecto</th>
                <th>Emitida</th>
                <th>Vence</th>
                <th className="is-number">Ítems</th>
                <th className="is-number">Total</th>
                <th>Estado</th>
                <th className="mca-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="mca-table__empty">
                    <EmptyState
                      icon={FileText}
                      title="Sin cotizaciones para mostrar"
                      message="Ajusta los filtros o crea una nueva cotización con servicios y materiales."
                      action={
                        <Button size="sm" icon={Plus} onClick={abrirNueva}>
                          Nueva cotización
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtradas.map((cotizacion) => (
                  <tr key={cotizacion.id}>
                    <td className="is-nowrap">
                      <Badge tone="yellow">{cotizacion.id}</Badge>
                    </td>
                    <td>
                      <div className="is-primary">{cotizacion.cliente}</div>
                      <div className="mca-soft" style={{ fontSize: 11, marginTop: 2 }}>
                        {cotizacion.proyecto}
                      </div>
                    </td>
                    <td className="is-muted is-nowrap">
                      {formatearFecha(cotizacion.fechaEmision)}
                    </td>
                    <td className="is-nowrap">
                      <div className="mca-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <span className="is-muted">{formatearFecha(fechaVencimiento(cotizacion))}</span>
                        {cotizacionVencida(cotizacion) && (
                          <Badge tone="danger">Vencida</Badge>
                        )}
                      </div>
                    </td>
                    <td className="is-number">{cotizacion.items.length}</td>
                    <td className="is-number mca-strong">
                      {formatearMoneda(cotizacion.total, 'COP')}
                    </td>
                    <td>
                      <EstadoToggle
                        estado={cotizacion.estadoCotizacion}
                        estados={ESTADOS.cotizacion}
                        width={112}
                        onClick={() => handleCambiarEstado(cotizacion)}
                      />
                    </td>
                    <td className="mca-center">
                      <AccionesFila
                        onVer={() => setCotizacionDetalle(cotizacion)}
                        onEditar={() => abrirEditar(cotizacion)}
                        onPdf={() => handlePdf(cotizacion)}
                        onEliminar={() => setCotizacionEliminar(cotizacion)}
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
        title={cotizacionEditando ? `Editar ${cotizacionEditando.id}` : 'Nueva cotización'}
        subtitle={
          cotizacionEditando
            ? `Cliente: ${cotizacionEditando.cliente}`
            : `Se asignará el código ${generarIdCotizacion()} al guardar.`
        }
        icon={FileText}
        size="xl"
        footer={
          <>
            <Button onClick={cerrarFormulario}>Cancelar</Button>
            <Button variant="primary" type="submit" form="form-cotizacion">
              {cotizacionEditando ? 'Guardar cambios' : 'Crear cotización'}
            </Button>
          </>
        }
      >
        <form id="form-cotizacion" onSubmit={handleGuardar} noValidate>
          <div className="mca-stack">
            <div className="mca-form-grid">
              <Field
                label="Cliente"
                required
                full
                error={errores.clienteId}
                hint="Busca por nombre, NIT o contacto; los datos se completan automáticamente."
              >
                <Combobox
                  value={formulario.clienteId}
                  onChange={seleccionarCliente}
                  options={opcionesClientes}
                  placeholder="Buscar cliente..."
                  emptyText="No hay clientes que coincidan"
                />
              </Field>

              <Field label="Proyecto" required full error={errores.proyecto}>
                <input
                  className="mca-input"
                  type="text"
                  placeholder="Ej: Instalación eléctrica edificio Mirador"
                  value={formulario.proyecto}
                  onChange={(event) => {
                    setFormulario((actual) => ({ ...actual, proyecto: event.target.value }));
                    setErrores((actual) => ({ ...actual, proyecto: '' }));
                  }}
                />
              </Field>

              <Field label="Documento / NIT">
                <input
                  className="mca-input"
                  type="text"
                  placeholder="Autocompletado desde el cliente"
                  value={formulario.documento}
                  onChange={(event) =>
                    setFormulario((actual) => ({ ...actual, documento: event.target.value }))
                  }
                />
              </Field>

              <Field label="Contacto">
                <input
                  className="mca-input"
                  type="text"
                  placeholder="Autocompletado desde el cliente"
                  value={formulario.contacto}
                  onChange={(event) =>
                    setFormulario((actual) => ({ ...actual, contacto: event.target.value }))
                  }
                />
              </Field>

              <Field label="Teléfono">
                <input
                  className="mca-input"
                  type="text"
                  placeholder="Autocompletado desde el cliente"
                  value={formulario.telefono}
                  onChange={(event) =>
                    setFormulario((actual) => ({ ...actual, telefono: event.target.value }))
                  }
                />
              </Field>

              <Field label="Correo">
                <input
                  className="mca-input"
                  type="email"
                  placeholder="Autocompletado desde el cliente"
                  value={formulario.correo}
                  onChange={(event) =>
                    setFormulario((actual) => ({ ...actual, correo: event.target.value }))
                  }
                />
              </Field>

              <Field label="Dirección" full>
                <input
                  className="mca-input"
                  type="text"
                  placeholder="Autocompletado desde el cliente"
                  value={formulario.direccion}
                  onChange={(event) =>
                    setFormulario((actual) => ({ ...actual, direccion: event.target.value }))
                  }
                />
              </Field>

              <Field label="Fecha de emisión">
                <input
                  className="mca-input"
                  type="date"
                  value={formulario.fechaEmision}
                  onChange={(event) =>
                    setFormulario((actual) => ({ ...actual, fechaEmision: event.target.value }))
                  }
                />
              </Field>

              <Field label="Días de vigencia">
                <input
                  className="mca-input"
                  type="number"
                  min="1"
                  step="1"
                  value={formulario.diasVigencia}
                  onChange={(event) =>
                    setFormulario((actual) => ({ ...actual, diasVigencia: event.target.value }))
                  }
                />
              </Field>
            </div>

            <div className="mca-field mca-field--full">
              <span className="mca-label">Agregar ítems</span>
              <div className="mca-grid-2">
                <div>
                  <Combobox
                    value={servicioSeleccionado}
                    onChange={agregarServicio}
                    options={opcionesServicios}
                    placeholder="Buscar y agregar servicio..."
                    emptyText="No hay servicios activos"
                  />
                  <span className="mca-hint">
                    Se agrega con su precio convertido a COP y cantidad 1.
                  </span>
                </div>
                <div>
                  <Combobox
                    value={materialSeleccionado}
                    onChange={agregarMaterial}
                    options={opcionesMateriales}
                    placeholder="Buscar y agregar material..."
                    emptyText="No hay materiales en inventario"
                  />
                  <span className="mca-hint">
                    Toma el precio unitario registrado en Materiales.
                  </span>
                </div>
              </div>
              {errores.items && <span className="mca-error">{errores.items}</span>}
            </div>

            <div
              className="mca-table-wrap"
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <table className="mca-table">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Tipo</th>
                    <th>Unidad</th>
                    <th style={{ width: 110 }}>Cantidad</th>
                    <th style={{ width: 150 }}>Vr. unitario</th>
                    <th className="is-number">Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {formulario.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="mca-table__empty">
                        Agrega servicios o materiales para calcular la cotización.
                      </td>
                    </tr>
                  ) : (
                    formulario.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="is-primary">{item.descripcion}</div>
                          {item.monedaServicio && item.monedaServicio !== MONEDA_COTIZACION && (
                            <div className="mca-soft" style={{ fontSize: 10, marginTop: 2 }}>
                              Tarifa original en {item.monedaServicio}
                            </div>
                          )}
                        </td>
                        <td>
                          <Badge tone={item.tipo === 'servicio' ? 'info' : 'neutral'}>
                            {item.tipo === 'servicio' ? 'Servicio' : 'Material'}
                          </Badge>
                        </td>
                        <td className="is-muted">{item.unidad}</td>
                        <td>
                          <input
                            className="mca-input"
                            type="number"
                            min="0.01"
                            step="0.01"
                            style={{ height: 32, padding: '0 8px' }}
                            value={item.cantidad}
                            onChange={(event) => actualizarItem(item.id, 'cantidad', event.target.value)}
                            aria-label={`Cantidad de ${item.descripcion}`}
                          />
                        </td>
                        <td>
                          <input
                            className="mca-input"
                            type="number"
                            min="0"
                            step="0.01"
                            style={{ height: 32, padding: '0 8px' }}
                            value={item.precioUnit}
                            onChange={(event) => actualizarItem(item.id, 'precioUnit', event.target.value)}
                            aria-label={`Precio unitario de ${item.descripcion}`}
                          />
                        </td>
                        <td className="is-number mca-strong">
                          {formatearMoneda(item.cantidad * item.precioUnit, 'COP')}
                        </td>
                        <td className="mca-center">
                          <button
                            type="button"
                            className="mca-icon-btn mca-icon-btn--danger"
                            onClick={() => quitarItem(item.id)}
                            title="Quitar ítem"
                          >
                            <Trash2 size={15} strokeWidth={1.9} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mca-grid-2" style={{ alignItems: 'start' }}>
              <div className="mca-form-grid">
                <Field label="Descuento (%)">
                  <input
                    className="mca-input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formulario.descuento}
                    onChange={(event) =>
                      setFormulario((actual) => ({ ...actual, descuento: event.target.value }))
                    }
                  />
                </Field>
                <Field label="IVA (%)">
                  <input
                    className="mca-input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formulario.ivaPorcentaje}
                    onChange={(event) =>
                      setFormulario((actual) => ({ ...actual, ivaPorcentaje: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Notas" full>
                  <textarea
                    className="mca-textarea"
                    placeholder="Condiciones, garantía, observaciones..."
                    value={formulario.notas}
                    onChange={(event) =>
                      setFormulario((actual) => ({ ...actual, notas: event.target.value }))
                    }
                  />
                </Field>
              </div>

              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                }}
              >
                <div className="mca-row" style={{ justifyContent: 'space-between' }}>
                  <span className="mca-muted">Subtotal</span>
                  <span className="mca-strong">{formatearMoneda(totalesFormulario.subtotal, 'COP')}</span>
                </div>
                {totalesFormulario.montoDescuento > 0 && (
                  <div className="mca-row" style={{ justifyContent: 'space-between', marginTop: 6 }}>
                    <span className="mca-muted">
                      Descuento ({Number(formulario.descuento) || 0}%)
                    </span>
                    <span className="mca-danger">
                      − {formatearMoneda(totalesFormulario.montoDescuento, 'COP')}
                    </span>
                  </div>
                )}
                <div className="mca-row" style={{ justifyContent: 'space-between', marginTop: 6 }}>
                  <span className="mca-muted">
                    IVA ({Number(formulario.ivaPorcentaje) || 0}%)
                  </span>
                  <span className="mca-strong">
                    {formatearMoneda(totalesFormulario.montoImpuesto, 'COP')}
                  </span>
                </div>
                <hr className="mca-divider" style={{ margin: '12px 0' }} />
                <div className="mca-row" style={{ justifyContent: 'space-between' }}>
                  <span className="mca-strong">Total</span>
                  <span className="mca-yellow mca-strong" style={{ fontSize: 18 }}>
                    {formatearMoneda(totalesFormulario.total, 'COP')}
                  </span>
                </div>
                <span className="mca-hint">Todos los valores se expresan en {MONEDA_COTIZACION}.</span>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(cotizacionDetalle)}
        onClose={() => setCotizacionDetalle(null)}
        title={cotizacionDetalle ? `Cotización ${cotizacionDetalle.id}` : 'Detalle de la cotización'}
        subtitle={cotizacionDetalle?.proyecto}
        icon={FileText}
        size="lg"
        footer={
          <>
            <Button onClick={() => setCotizacionDetalle(null)}>Cerrar</Button>
            <Button
              icon={FileText}
              onClick={() => handlePdf(cotizacionDetalle)}
            >
              Generar PDF
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const cotizacion = cotizacionDetalle;
                setCotizacionDetalle(null);
                abrirEditar(cotizacion);
              }}
            >
              Editar cotización
            </Button>
          </>
        }
      >
        {cotizacionDetalle && (
          <div className="mca-stack">
            <div className="mca-row">
              <EstadoToggle
                estado={cotizacionDetalle.estadoCotizacion}
                estados={ESTADOS.cotizacion}
                width={118}
              />
              {cotizacionVencida(cotizacionDetalle) && (
                <Badge tone="danger">Vencida</Badge>
              )}
              <Badge tone="neutral">{cotizacionDetalle.items.length} ítems</Badge>
            </div>

            <DetailGrid>
              <DetailItem label="Cliente">{cotizacionDetalle.cliente}</DetailItem>
              <DetailItem label="Documento / NIT">{cotizacionDetalle.documento}</DetailItem>
              <DetailItem label="Contacto">{cotizacionDetalle.contacto}</DetailItem>
              <DetailItem label="Teléfono">{cotizacionDetalle.telefono}</DetailItem>
              <DetailItem label="Correo">{cotizacionDetalle.correo}</DetailItem>
              <DetailItem label="Emisión">
                {formatearFecha(cotizacionDetalle.fechaEmision)}
              </DetailItem>
              <DetailItem label="Vence">
                {formatearFecha(fechaVencimiento(cotizacionDetalle))}
              </DetailItem>
              <DetailItem label="Vigencia">{cotizacionDetalle.diasVigencia} días</DetailItem>
              <DetailItem label="Dirección" full>{cotizacionDetalle.direccion}</DetailItem>
            </DetailGrid>

            <div
              className="mca-table-wrap"
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <table className="mca-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Descripción</th>
                    <th>Unidad</th>
                    <th className="is-number">Cant.</th>
                    <th className="is-number">Vr. unitario</th>
                    <th className="is-number">Vr. total</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizacionDetalle.items.map((item, indice) => (
                    <tr key={item.id}>
                      <td className="is-muted">{indice + 1}</td>
                      <td>
                        <div className="is-primary">{item.descripcion}</div>
                        <Badge tone={item.tipo === 'servicio' ? 'info' : 'neutral'}>
                          {item.tipo === 'servicio' ? 'Servicio' : 'Material'}
                        </Badge>
                      </td>
                      <td className="is-muted">{item.unidad}</td>
                      <td className="is-number">{item.cantidad.toLocaleString('es-CO')}</td>
                      <td className="is-number">{formatearMoneda(item.precioUnit, 'COP')}</td>
                      <td className="is-number mca-strong">
                        {formatearMoneda(item.cantidad * item.precioUnit, 'COP')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mca-row" style={{ justifyContent: 'flex-end' }}>
              <div style={{ minWidth: 280 }}>
                <div className="mca-row" style={{ justifyContent: 'space-between' }}>
                  <span className="mca-muted">Subtotal</span>
                  <span>{formatearMoneda(cotizacionDetalle.subtotal, 'COP')}</span>
                </div>
                {cotizacionDetalle.montoDescuento > 0 && (
                  <div className="mca-row" style={{ justifyContent: 'space-between' }}>
                    <span className="mca-muted">Descuento ({cotizacionDetalle.descuento}%)</span>
                    <span className="mca-danger">
                      − {formatearMoneda(cotizacionDetalle.montoDescuento, 'COP')}
                    </span>
                  </div>
                )}
                <div className="mca-row" style={{ justifyContent: 'space-between' }}>
                  <span className="mca-muted">IVA ({cotizacionDetalle.ivaPorcentaje}%)</span>
                  <span>{formatearMoneda(cotizacionDetalle.montoImpuesto, 'COP')}</span>
                </div>
                <hr className="mca-divider" style={{ margin: '10px 0' }} />
                <div className="mca-row" style={{ justifyContent: 'space-between' }}>
                  <span className="mca-strong">Total</span>
                  <span className="mca-yellow mca-strong" style={{ fontSize: 17 }}>
                    {formatearMoneda(cotizacionDetalle.total, 'COP')}
                  </span>
                </div>
              </div>
            </div>

            {cuentaDetalle && (
              <div className={`mca-notice ${cuentaDetalle.estado === 'LIQUIDADO' ? 'is-success' : 'is-warning'}`}>
                <CircleDollarSign size={15} strokeWidth={2} />
                <span>
                  <strong>Control de pagos:</strong> abonado{' '}
                  {formatearMoneda(cuentaDetalle.abonado, 'COP')} · saldo{' '}
                  {formatearMoneda(cuentaDetalle.saldo, 'COP')} · estado{' '}
                  {cuentaDetalle.estado.toLowerCase()}.
                </span>
              </div>
            )}

            {cotizacionDetalle.notas && (
              <div className="mca-notice">
                <FileText size={15} strokeWidth={2} />
                <span>
                  <strong>Observaciones:</strong> {cotizacionDetalle.notas}
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(cotizacionEliminar)}
        title="Eliminar cotización"
        message={
          cotizacionEliminar
            ? `Se eliminará ${cotizacionEliminar.id} de ${cotizacionEliminar.cliente}. Los abonos registrados se conservarán y podrán buscarse por ID en Abonos y Ventas.`
            : ''
        }
        onCancel={() => setCotizacionEliminar(null)}
        onConfirm={confirmarEliminar}
      />

      <Toast toast={toast} onClose={close} />
    </PageShell>
  );
}

export default Cotizacion;
