import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Mail,
  Plus,
  Trash2,
} from 'lucide-react';

import { AccionesFila } from '../../../shared/components/AccionesFila.jsx';
import { apiRequest } from '../../../shared/api.js';
import { useApiData } from '../../../shared/useApiData.js';
import {
  EstadoToggle,
  ESTADOS,
  tonoEstado,
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
  resumenErroresFormulario,
  useToast,
} from '../../../shared/components/ui.jsx';
import {
  fechaISO,
  formatearFecha,
  formatearMoneda,
  horaActual,
} from '../../../shared/services/base.js';
import { precioEnCOP } from '../../../shared/services/catalogos.js';
import { normalizarCliente } from '../../../shared/services/clientesService.js';
import { METODOS_PAGO } from '../../../shared/services/pagosService.js';
import {
  ABONO_MINIMO_PORCENTAJE,
  MONEDA_COTIZACION,
  buscarCotizaciones,
  calcularTotales,
  cotizacionVencida,
  crearItemMaterial,
  crearItemServicio,
  fechaVencimiento,
  minimoAbono,
  normalizarCotizacion,
  ordenarPorLlegada,
  resumenCotizaciones,
} from '../../../shared/services/cotizacionesService.js';
import { normalizarMaterial } from '../../../shared/services/materialesService.js';
import { normalizarServicio } from '../../../shared/services/serviciosService.js';
import { generarPdfCotizacion } from '../../../shared/utils/pdf.js';
import { claseFilaEstado } from '../../../shared/utils/estadosFila.js';

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
  terminos: '',
  garantias: '',
  estadoCotizacion: 'Pendiente',
  items: [],
});

const ABONO_VACIO = () => ({
  monto: '',
  fecha: fechaISO(),
  hora: horaActual(),
  metodo: 'Transferencia',
  referencia: '',
});

export function Cotizacion() {
  const {
    data,
    error,
    loading,
    reload: cargarDatos,
  } = useApiData(async () => {
    const [cotizacionesApi, clientesApi, serviciosApi, materialesApi, cuentas] = await Promise.all([
      apiRequest('/cotizaciones'),
      apiRequest('/clientes'),
      apiRequest('/servicios'),
      apiRequest('/materiales'),
      apiRequest('/pagos/cuentas'),
    ]);
    return {
      cotizaciones: cotizacionesApi.map(normalizarCotizacion),
      clientes: clientesApi.map(normalizarCliente),
      servicios: serviciosApi.map(normalizarServicio),
      materiales: materialesApi.map(normalizarMaterial),
      cuentas,
    };
  }, { cotizaciones: [], clientes: [], servicios: [], materiales: [], cuentas: [] });
  const { cotizaciones, clientes, servicios, materiales, cuentas } = data;

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
  const [cotizacionesCliente, setCotizacionesCliente] = useState([]);
  const [abono, setAbono] = useState(ABONO_VACIO);
  const [abonando, setAbonando] = useState(false);
  const [correoEnvio, setCorreoEnvio] = useState(null);

  const { toast, notify, close } = useToast();

  const opcionesClientes = useMemo(
    () => clientes.map((cliente) => ({
      value: String(cliente.id),
      label: `${cliente.tipoDocumento || ''} ${cliente.documento || ''} · ${cliente.nombre}`.trim(),
      meta: [cliente.departamento, cliente.municipio].filter(Boolean).join(' · ') || 'Sin ubicación',
      search: `${cliente.contacto} ${cliente.correo} ${cliente.telefono} ${cliente.departamento} ${cliente.municipio}`,
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
    () => materiales
      .filter((material) => material.estadoInventario !== 'Inactivo')
      .map((material) => ({
        value: String(material.id),
        label: material.nombre,
        meta: `${material.stock.toLocaleString('es-CO')} ${material.unidad.toLowerCase()} · ${formatearMoneda(material.precioUnitario, 'COP')}`,
        search: `${material.id} ${material.categoria}`,
      })),
    [materiales],
  );

  const filtradas = useMemo(() => {
    const base = buscarCotizaciones(busqueda, cotizaciones);
    const porEstado = filtroEstado === 'Todas'
      ? base
      : base.filter((cotizacion) => cotizacion.estadoCotizacion === filtroEstado);
    return ordenarPorLlegada(porEstado);
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

  const minimoDetalle = minimoAbono(cotizacionDetalle);
  const abonadoDetalle = Number(cuentaDetalle?.abonado || 0);

  const abrirNueva = () => {
    setCotizacionEditando(null);
    setErrores({});
    setServicioSeleccionado('');
    setMaterialSeleccionado('');
    setCotizacionesCliente([]);
    setFormulario(FORMULARIO_VACIO());
    setModalFormulario(true);
  };

  const abrirEditar = (cotizacion) => {
    setCotizacionEditando(cotizacion);
    setErrores({});
    setServicioSeleccionado('');
    setMaterialSeleccionado('');
    setCotizacionesCliente([]);
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
      terminos: cotizacion.terminos || '',
      garantias: cotizacion.garantias || '',
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
    setCotizacionesCliente([]);
  };

  // Al traer el cliente se listan sus cotizaciones disponibles para seleccionar una.
  const cargarCotizacionesCliente = async (id) => {
    if (!id) {
      setCotizacionesCliente([]);
      return;
    }
    try {
      const lista = await apiRequest(`/cotizaciones?cliente=${encodeURIComponent(id)}`);
      setCotizacionesCliente(lista.map(normalizarCotizacion));
    } catch {
      setCotizacionesCliente([]);
    }
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
        ? [cliente.direccion, cliente.departamento, cliente.municipio].filter(Boolean).join(', ')
        : actual.direccion,
    }));
    setErrores((actual) => ({ ...actual, clienteId: '' }));
    void cargarCotizacionesCliente(id);
  };

  const reutilizarCotizacion = (cotizacion) => {
    setFormulario((actual) => ({
      ...actual,
      proyecto: cotizacion.proyecto,
      diasVigencia: String(cotizacion.diasVigencia),
      ivaPorcentaje: String(cotizacion.ivaPorcentaje),
      descuento: String(cotizacion.descuento),
      notas: cotizacion.notas,
      terminos: cotizacion.terminos,
      garantias: cotizacion.garantias,
      items: (cotizacion.items || []).map((item) => ({ ...item, id: `item-${Date.now()}-${item.refId || item.descripcion}` })),
    }));
    notify(
      'info',
      'Cotización cargada',
      `Se copiaron ${cotizacion.items.length} ítems de ${cotizacion.id}. La fecha de emisión será la de hoy.`,
    );
  };

  // Un servicio arrastra automáticamente los materiales que tiene asignados.
  const materialesDeServicio = (servicio) => (servicio.materiales || []).map((material) => ({
    id: material.codigo,
    nombre: material.nombre,
    unidad: material.unidad,
    precioUnitario: Number(material.precioUnitario || 0),
    stock: Number(material.stock || 0),
  }));

  const agregarServicio = (id) => {
    const servicio = servicios.find((item) => String(item.id) === String(id));
    if (!servicio) {
      setServicioSeleccionado('');
      return;
    }

    setFormulario((actual) => {
      const nuevos = [crearItemServicio(servicio, 1)];

      for (const material of materialesDeServicio(servicio)) {
        const repetido = [...actual.items, ...nuevos].some(
          (item) => item.tipo === 'material' && String(item.refId) === String(material.id),
        );
        if (!repetido) nuevos.push(crearItemMaterial(material, 1));
      }

      return { ...actual, items: [...actual.items, ...nuevos] };
    });
    setErrores((actual) => ({ ...actual, items: '' }));
    setServicioSeleccionado('');

    if (servicio.materiales?.length) {
      notify(
        'success',
        'Materiales del servicio agregados',
        `${servicio.nombre} trayajo ${materialesDeServicio(servicio).length} material(es) del catálogo. Ajusta las cantidades en la tabla o sigue agregando materiales con «Buscar y agregar material».`,
      );
    }
  };

  const agregarMaterial = (id) => {
    const material = materiales.find((item) => String(item.id) === String(id));
    if (!material) {
      setMaterialSeleccionado('');
      return;
    }

    if (formulario.items.some((item) => item.tipo === 'material' && String(item.refId) === String(material.id))) {
      notify('warning', 'Material repetido', `${material.nombre} ya está en esta cotización.`);
      setMaterialSeleccionado('');
      return;
    }

    if (material.stock <= 0) {
      notify('warning', 'Advertencia de stock', `${material.nombre} está en 0 unidades; la API rechazará la cotización.`);
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

  const handleGuardar = async (event) => {
    event.preventDefault();

    const nuevosErrores = {};
    if (!formulario.clienteId) nuevosErrores.clienteId = 'Selecciona un cliente.';
    if (!formulario.proyecto.trim()) nuevosErrores.proyecto = 'Escribe el nombre del proyecto.';
    if (formulario.items.length === 0) nuevosErrores.items = 'Agrega al menos un servicio o material.';
    if (formulario.items.some((item) => Number(item.cantidad) <= 0)) {
      nuevosErrores.items = 'Todas las cantidades deben ser mayores que cero.';
    }

    const codigosMateriales = formulario.items
      .filter((item) => item.tipo === 'material')
      .map((item) => String(item.refId));
    const repetido = codigosMateriales.find((codigo, indice) => codigosMateriales.indexOf(codigo) !== indice);
    if (repetido) {
      const material = materiales.find((item) => String(item.id) === repetido);
      nuevosErrores.items = `${material?.nombre || repetido} está repetido; un material no se puede agregar dos veces.`;
    }

    const sobreStock = formulario.items
      .filter((item) => item.tipo === 'material')
      .filter((item) => {
        const inventario = materiales.find((material) => String(material.id) === String(item.refId));
        return inventario && Number(item.cantidad) > inventario.stock;
      });
    if (sobreStock.length) {
      notify(
        'warning',
        'Advertencia de stock',
        `${sobreStock.map((item) => `${item.descripcion} (${item.cantidad} solicitadas)`).join(', ')} supera el inventario disponible.`,
      );
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      notify('warning', 'Mensaje flotante de validación', resumenErroresFormulario(nuevosErrores));
      return;
    }

    try {
      const guardada = await apiRequest(
        cotizacionEditando
          ? `/cotizaciones/${encodeURIComponent(cotizacionEditando.id)}`
          : '/cotizaciones',
        {
          method: cotizacionEditando ? 'PUT' : 'POST',
          body: {
            ...formulario,
            // La fecha de emisión siempre la fija el servidor con la fecha del día.
            fechaEmision: cotizacionEditando ? cotizacionEditando.fechaEmision : fechaISO(),
            fecha: cotizacionEditando ? cotizacionEditando.fechaEmision : fechaISO(),
            diasVigencia: Number(formulario.diasVigencia) || 30,
            ivaPorcentaje: Number(formulario.ivaPorcentaje) || 0,
            descuento: Number(formulario.descuento) || 0,
            items: formulario.items,
          },
        },
      );

      await cargarDatos();
      notify(
        'success',
        cotizacionEditando ? 'Cotización actualizada' : 'Cotización creada',
        `${guardada.id} · ${guardada.cliente} · Total ${formatearMoneda(guardada.total, 'COP')}.`,
      );
      if (guardada.advertencias?.length) {
        notify('warning', 'Advertencia de inventario', guardada.advertencias.join(' '));
      }
      cerrarFormulario();
    } catch (requestError) {
      notify('error', 'No se pudo guardar la cotización', requestError.message);
      if (requestError.advertencias?.length) {
        notify('warning', 'Advertencia de inventario', requestError.advertencias.join(' '));
      }
    }
  };

  // El estado ya no se mueve con un clic: aprobarlo lo hace únicamente el abono del 30%.
  // Rechazar sí sigue siendo una decisión del asesor, por eso queda como acción explícita.
  const handleRechazar = async (cotizacion) => {
    if (!cotizacion) return;
    try {
      const actualizada = await apiRequest(`/cotizaciones/${encodeURIComponent(cotizacion.id)}/estado`, {
        method: 'PATCH',
        body: { estadoCotizacion: 'Rechazado' },
      });
      await cargarDatos();
      setCotizacionDetalle(null);
      notify(
        'info',
        'Cotización rechazada',
        `${cotizacion.id} quedó rechazada y no admite abonos.`,
      );
      if (actualizada?.advertencias?.length) {
        notify('warning', 'Aviso de inventario', actualizada.advertencias.join(' '));
      }
    } catch (requestError) {
      notify('error', 'No se pudo rechazar la cotización', requestError.message);
    }
  };

  const handleAbonar = async (event, cotizacion) => {
    event.preventDefault();
    if (!cotizacion) return;

    const monto = Number(abono.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      notify('warning', 'Mensaje flotante de validación', 'Completa los mensajes obligatorios: El abono debe ser mayor que cero.');
      return;
    }
    if (abono.fecha > fechaISO()) {
      notify('warning', 'Mensaje flotante de validación', 'La fecha del abono debe ser hoy o anterior.');
      return;
    }

    setAbonando(true);
    try {
      const cuenta = cuentas.find((item) => String(item.cotizacionId) === String(cotizacion.id));
      const previo = Number(cuenta?.abonado || 0);
      const pago = await apiRequest('/pagos', {
        method: 'POST',
        body: {
          cotizacionId: cotizacion.id,
          monto,
          fecha: abono.fecha,
          hora: abono.hora,
          metodo: abono.metodo,
          referencia: abono.referencia,
          nota: 'Abono registrado desde Cotizaciones',
        },
      });
      await cargarDatos();
      setAbono(ABONO_VACIO());
      notify(
        'success',
        'Abono registrado',
        `${pago.id} · ${formatearMoneda(pago.monto, 'COP')} recibido el ${formatearFecha(pago.fecha)}.`,
      );
      if (pago?.aprobacion?.aprobada) {
        notify(
          'success',
          'Cotización aprobada automáticamente',
          `Se cubrió el ${ABONO_MINIMO_PORCENTAJE}% del total (${formatearMoneda(
            pago.aprobacion.minimo,
            'COP',
          )}) y ${cotizacion.id} quedó Aprobada con sus materiales descontados.`,
        );
      } else if (pago?.aprobacion?.bloqueadas?.length) {
        notify(
          'warning',
          'El abono sí se guardó, pero no se pudo aprobar',
          `${cotizacion.id} sigue Pendiente por inventario: ${pago.aprobacion.bloqueadas.join('; ')}.`,
        );
      } else if (previo <= 0 && cotizacion.estadoCotizacion !== 'Aprobado') {
        notify(
          'info',
          'Ya puedes aprobar',
          `Con el abono mínimo cubierto, cambia ${cotizacion.id} a Aprobado para descontar el inventario.`,
        );
      }
    } catch (requestError) {
      notify('error', 'No se pudo registrar el abono', requestError.message);
    } finally {
      setAbonando(false);
    }
  };

  // Asignar location.href a un mailto queda mudo en varios navegadores; el ancla temporal
  // sí dispara el cliente de correo asociado sin recargar la aplicación.
  const abrirClienteCorreo = (mailto) => {
    if (!mailto) return false;
    const ancla = document.createElement('a');
    ancla.href = mailto;
    ancla.rel = 'noopener';
    document.body.appendChild(ancla);
    ancla.click();
    ancla.remove();
    return true;
  };

  const abrirEnvioCorreo = (cotizacion) => {
    if (!cotizacion) return;
    setCorreoEnvio({
      cotizacion,
      destinatario: cotizacion.correo || '',
      error: '',
      enviando: false,
      resultado: null,
    });
  };

  const cerrarEnvioCorreo = () => {
    // Si el envío quedó preparado, el correo capturado ya vive en la BD: la lista se refresca.
    if (correoEnvio?.resultado) cargarDatos();
    setCorreoEnvio(null);
  };

  const copiarCorreo = async (resultado) => {
    const contenido = [resultado?.asunto, '', resultado?.texto].filter((linea) => linea !== undefined).join('\n');
    try {
      await navigator.clipboard.writeText(contenido);
      notify('success', 'Contenido copiado', 'Pégalo en el correo de tu cliente o en WhatsApp si el equipo no tiene correo asociado.');
    } catch {
      notify('warning', 'No se pudo copiar', 'Tu navegador bloqueó el portapapeles; usa el botón «Abrir correo».');
    }
  };

  const confirmarEnvioCorreo = async () => {
    if (!correoEnvio?.cotizacion) return;
    const destinatario = String(correoEnvio.destinatario || '').trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinatario)) {
      setCorreoEnvio((actual) => ({ ...actual, error: 'Escribe un correo válido, por ejemplo cliente@correo.com.' }));
      return;
    }

    setCorreoEnvio((actual) => ({ ...actual, enviando: true, error: '' }));

    try {
      const resultado = await apiRequest(
        `/cotizaciones/${encodeURIComponent(correoEnvio.cotizacion.id)}/enviar-correo`,
        { method: 'POST', body: { correo: destinatario } },
      );

      if (resultado.enviado) {
        notify('success', 'Cotización enviada', `El correo ${resultado.correo} recibió la cotización ${correoEnvio.cotizacion.id}.`);
        setCorreoEnvio(null);
        cargarDatos();
        return;
      }

      abrirClienteCorreo(resultado.mailto);
      setCorreoEnvio((actual) => actual && {
        ...actual,
        enviando: false,
        resultado,
        error: resultado.mailto ? '' : (resultado.mensaje || 'No se pudo preparar el correo.'),
      });
      notify(
        resultado.mailto ? 'success' : 'warning',
        resultado.mailto ? 'Correo abierto para enviar' : 'Cotización preparada',
        resultado.mailto
          ? `${resultado.correo} · ${resultado.mensaje || 'Termina el envío en la ventana de correo.'}`
          : (resultado.mensaje || ''),
      );
    } catch (requestError) {
      const datos = requestError.datos;
      if (datos?.mailto) {
        abrirClienteCorreo(datos.mailto);
        setCorreoEnvio((actual) => actual && { ...actual, enviando: false, resultado: datos, error: '' });
        notify('warning', 'El envío automático falló', `${requestError.message} Se abrió tu cliente de correo.`);
        return;
      }
      setCorreoEnvio((actual) => actual && {
        ...actual,
        enviando: false,
        destinatario: datos?.requiereCorreo ? destinatario : actual.destinatario,
        error: requestError.message,
      });
      notify('error', 'No se pudo enviar la cotización', requestError.message);
    }
  };

  const handlePdf = (cotizacion) => {
    const cuenta = cuentas.find(
      (item) => String(item.cotizacionId) === String(cotizacion.id),
    );

    try {
      generarPdfCotizacion({
        ...cotizacion,
        abonado: cuenta?.abonado || 0,
        pagos: cuenta?.pagos || [],
      });
      notify(
        'info',
        'Vista de impresión abierta',
        'Usa "Guardar como PDF" en el diálogo de impresión para descargar la cotización.',
      );
    } catch (error) {
      notify('error', 'No se pudo generar el PDF', error.message);
    }
  };

  const confirmarEliminar = async () => {
    if (!cotizacionEliminar) return;

    try {
      await apiRequest(`/cotizaciones/${encodeURIComponent(cotizacionEliminar.id)}`, { method: 'DELETE' });
      await cargarDatos();
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
      {error && (
        <p role="alert" className="mca-error">
          No se pudieron cargar las cotizaciones desde la API: {error}
        </p>
      )}
      {loading && <p role="status">Cargando cotizaciones desde la API...</p>}
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
        subtitle={`${filtradas.length} de ${cotizaciones.length} · orden de llegada: Pendiente → Aprobado → Rechazado`}
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
                <th className="is-number">Abonado</th>
                <th>Estado</th>
                <th className="mca-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="mca-table__empty">
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
                filtradas.map((cotizacion) => {
                  const cuenta = cuentas.find(
                    (item) => String(item.cotizacionId) === String(cotizacion.id),
                  );
                  const abonado = Number(cuenta?.abonado || 0);
                  const minimo = minimoAbono(cotizacion);
                  const emitidaHoy = cotizacion.fechaEmision === fechaISO();

                  return (
                    <tr
                      key={cotizacion.id}
                      className={claseFilaEstado(cotizacion.estadoCotizacion, 'cotizacion')}
                    >
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
                        {emitidaHoy && (
                          <div className="mca-soft" style={{ fontSize: 10 }}>Hoy</div>
                        )}
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
                      <td className="is-number">
                        {formatearMoneda(abonado, 'COP')}
                        {cotizacion.estadoCotizacion === 'Pendiente' && abonado < minimo && (
                          <div className="mca-soft" style={{ fontSize: 10, color: 'var(--warning-text)' }}>
                            Mínimo {formatearMoneda(minimo, 'COP')}
                          </div>
                        )}
                      </td>
                      <td>
                        <EstadoToggle
                          estado={cotizacion.estadoCotizacion}
                          estados={ESTADOS.cotizacion}
                          width={112}
                          bloqueado
                          motivo="Estado bloqueado: se aprueba solo al registrar el abono del 30%."
                        />
                      </td>
                      <td className="mca-center">
                        <AccionesFila
                          onVer={() => {
                            setCotizacionDetalle(cotizacion);
                            setAbono(ABONO_VACIO());
                          }}
                          onEditar={() => abrirEditar(cotizacion)}
                          onPdf={() => handlePdf(cotizacion)}
                          onCorreo={() => abrirEnvioCorreo(cotizacion)}
                          onAbono={() => {
                            setCotizacionDetalle(cotizacion);
                            setAbono({
                              ...ABONO_VACIO(),
                              monto: String(minimo > abonado ? minimo : ''),
                            });
                          }}
                          onEliminar={() => setCotizacionEliminar(cotizacion)}
                        />
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
        open={modalFormulario}
        onClose={cerrarFormulario}
        title={cotizacionEditando ? `Editar ${cotizacionEditando.id}` : 'Nueva cotización'}
        subtitle={
          cotizacionEditando
            ? `Cliente: ${cotizacionEditando.cliente}`
            : 'El servidor asignará el código al guardar.'
        }
        icon={FileText}
        size="xl"
        footer={
          <>
            {/* El total siempre visible mientras se baja a rellenar el resto de la información. */}
            <div className="mca-total-resumen">
              <span>Total</span>
              <strong>{formatearMoneda(totalesFormulario.total, 'COP')}</strong>
            </div>
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

              <Field
                label="Fecha de emisión"
                hint={
                  cotizacionEditando
                    ? 'Quema la fecha del día en que se registró; no se puede modificar.'
                    : 'Se quema automáticamente con la fecha de hoy.'
                }
              >
                <input
                  className="mca-input"
                  type="date"
                  value={formulario.fechaEmision}
                  max={fechaISO()}
                  disabled
                  readOnly
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

            {cotizacionesCliente.length > 0 && (
              <div className="mca-field mca-field--full">
                <span className="mca-label">Cotizaciones disponibles del cliente</span>
                <div className="mca-stack" style={{ gap: 6 }}>
                  {cotizacionesCliente.map((cotizacion) => (
                    <div key={cotizacion.id} className="mca-row" style={{ justifyContent: 'space-between' }}>
                      <span className="is-nowrap">
                        <Badge tone="yellow">{cotizacion.id}</Badge>
                        <strong style={{ marginLeft: 8 }}>{cotizacion.proyecto}</strong>
                        <span className="mca-soft" style={{ marginLeft: 8, fontSize: 12 }}>
                          {formatearMoneda(cotizacion.total, 'COP')} · {formatearFecha(cotizacion.fechaEmision)}
                        </span>
                      </span>
                      <span className="mca-row" style={{ gap: 8 }}>
                        <Badge tone={tonoEstado(cotizacion.estadoCotizacion, ESTADOS.cotizacion)}>
                          {cotizacion.estadoCotizacion}
                        </Badge>
                        <Button size="sm" onClick={() => reutilizarCotizacion(cotizacion)}>
                          Seleccionar y copiar ítems
                        </Button>
                      </span>
                    </div>
                  ))}
                </div>
                <span className="mca-hint">
                  Selecciona una cotización disponible para reutilizar sus ítems; la nueva conserva la fecha de hoy.
                </span>
              </div>
            )}

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

            <div className="mca-cotizacion-grid">
              <div className="mca-total-col">
                <div className="mca-total-fijo">
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
                    <span className="mca-total-fijo__monto">
                      {formatearMoneda(totalesFormulario.total, 'COP')}
                    </span>
                  </div>
                  <span className="mca-hint">Todos los valores se expresan en {MONEDA_COTIZACION}.</span>
                  <span className="mca-hint" style={{ display: 'block', marginTop: 4 }}>
                    Abono mínimo ({ABONO_MINIMO_PORCENTAJE}%):{' '}
                    {formatearMoneda(Math.round(totalesFormulario.total * ABONO_MINIMO_PORCENTAJE / 100), 'COP')}
                  </span>
                </div>
              </div>

              <div className="mca-cotizacion-cuerpo">
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
                    formulario.items.map((item) => {
                      const inventario = item.tipo === 'material'
                        ? materiales.find((material) => String(material.id) === String(item.refId))
                        : null;
                      const sobreStock = inventario && Number(item.cantidad) > inventario.stock;

                      return (
                        <tr key={item.id} className={sobreStock ? 'mca-row--critico' : ''}>
                          <td>
                            <div className="is-primary">{item.descripcion}</div>
                            {item.monedaServicio && item.monedaServicio !== MONEDA_COTIZACION && (
                              <div className="mca-soft" style={{ fontSize: 10, marginTop: 2 }}>
                                Tarifa original en {item.monedaServicio}
                              </div>
                            )}
                            {inventario && (
                              <div className="mca-soft" style={{ fontSize: 10, marginTop: 2 }}>
                                Inventario: {inventario.stock} {inventario.unidad.toLowerCase()} · {inventario.estado}
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
                              disabled={Boolean(inventario)}
                              onChange={(event) => actualizarItem(item.id, 'precioUnit', event.target.value)}
                              title={
                                inventario
                                  ? 'El valor unitario del material no se puede editar, se toma de Materiales'
                                  : undefined
                              }
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

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
                    placeholder="Observaciones generales de la cotización..."
                    value={formulario.notas}
                    onChange={(event) =>
                      setFormulario((actual) => ({ ...actual, notas: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Términos y condiciones" full hint="Se imprimen en el PDF y se muestran en el detalle.">
                  <textarea
                    className="mca-textarea"
                    placeholder="Forma de pago, tiempos de ejecución, validez de la oferta..."
                    value={formulario.terminos}
                    onChange={(event) =>
                      setFormulario((actual) => ({ ...actual, terminos: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Garantías" full hint="Qué se garantiza y por cuánto tiempo.">
                  <textarea
                    className="mca-textarea"
                    placeholder="Garantía sobre la mano de obra y los materiales instalados..."
                    value={formulario.garantias}
                    onChange={(event) =>
                      setFormulario((actual) => ({ ...actual, garantias: event.target.value }))
                    }
                  />
                </Field>
              </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(correoEnvio)}
        onClose={cerrarEnvioCorreo}
        title={correoEnvio ? `Enviar cotización ${correoEnvio.cotizacion.id}` : 'Enviar cotización'}
        subtitle={correoEnvio?.cotizacion?.proyecto}
        icon={Mail}
        size="sm"
        footer={
          <>
            <Button variant="cerrar" onClick={cerrarEnvioCorreo}>Cerrar</Button>
            {correoEnvio?.resultado?.texto && (
              <Button icon={FileText} onClick={() => copiarCorreo(correoEnvio.resultado)}>
                Copiar contenido
              </Button>
            )}
            {correoEnvio?.resultado?.mailto && (
              <Button
                icon={Mail}
                onClick={() => abrirClienteCorreo(correoEnvio.resultado.mailto)}
              >
                Abrir correo de nuevo
              </Button>
            )}
            <Button
              variant="primary"
              icon={Mail}
              disabled={correoEnvio?.enviando}
              onClick={confirmarEnvioCorreo}
            >
              {correoEnvio?.resultado?.mailto ? 'Reintentar envío' : 'Enviar por correo'}
            </Button>
          </>
        }
      >
        {correoEnvio && (
          <div className="mca-stack">
            <Field
              label="Correo del contacto"
              required
              error={correoEnvio.error}
              hint={correoEnvio.cotizacion.correo
                ? 'Puedes corregirlo: el correo que envíes queda guardado en la cotización.'
                : 'Esta cotización no tiene correo capturado. Escribe el del contacto para poder enviarla.'}
            >
              <input
                type="email"
                className="mca-input"
                value={correoEnvio.destinatario}
                placeholder="cliente@correo.com"
                onChange={(event) => setCorreoEnvio((actual) => ({
                  ...actual,
                  destinatario: event.target.value,
                  error: '',
                }))}
              />
            </Field>

            <div className="mca-row" style={{ justifyContent: 'space-between' }}>
              <span className="mca-muted">Total de la cotización</span>
              <strong>{formatearMoneda(correoEnvio.cotizacion.total, 'COP')}</strong>
            </div>
            <div className="mca-row" style={{ justifyContent: 'space-between' }}>
              <span className="mca-muted">Abono mínimo para aprobar ({ABONO_MINIMO_PORCENTAJE}%)</span>
              <strong>
                {formatearMoneda(
                  Math.round(Number(correoEnvio.cotizacion.total || 0) * (ABONO_MINIMO_PORCENTAJE / 100)),
                  'COP',
                )}
              </strong>
            </div>

            {correoEnvio.resultado?.asunto && (
              <div className="mca-hint">
                <strong>Asunto:</strong> {correoEnvio.resultado.asunto}
              </div>
            )}

            <p className="mca-hint">
              {correoEnvio.resultado?.smtp
                ? 'El backend envía por SMTP; si falla se abre tu cliente de correo como respaldo.'
                : 'Sin SMTP configurado en el backend, se abre tu cliente de correo (Outlook, Gmail de escritorio) con la cotización ya escrita: solo confirma el envío.'}
            </p>
          </div>
        )}
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
            {cotizacionDetalle && (
              <div className="mca-total-resumen">
                <span>Total</span>
                <strong>{formatearMoneda(cotizacionDetalle.total, 'COP')}</strong>
              </div>
            )}
            <Button onClick={() => setCotizacionDetalle(null)}>Cerrar</Button>
            <Button
              icon={FileText}
              onClick={() => handlePdf(cotizacionDetalle)}
            >
              Generar PDF
            </Button>
            <Button
              icon={Mail}
              onClick={() => {
                const cotizacion = cotizacionDetalle;
                setCotizacionDetalle(null);
                abrirEnvioCorreo(cotizacion);
              }}
            >
              Enviar por correo
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
            {cotizacionDetalle?.estadoCotizacion !== 'Rechazado' && (
              <Button variant="danger" onClick={() => handleRechazar(cotizacionDetalle)}>
                Rechazar
              </Button>
            )}
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
                bloqueado
                motivo="Estado bloqueado: se aprueba solo al registrar el abono del 30%."
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

            {cotizacionDetalle.estadoCotizacion !== 'Rechazado' && (
              <form
                className="mca-abono-box"
                onSubmit={(event) => handleAbonar(event, cotizacionDetalle)}
              >
                <div className="mca-row" style={{ justifyContent: 'space-between' }}>
                  <span className="mca-strong">Registrar abono en esta cotización</span>
                  <Badge tone={abonadoDetalle >= minimoDetalle ? 'success' : 'yellow'}>
                    Mínimo {formatearMoneda(minimoDetalle, 'COP')} ({ABONO_MINIMO_PORCENTAJE}%)
                  </Badge>
                </div>
                <div className="mca-form-grid">
                  <Field
                    label="Monto del abono"
                    required
                    hint={
                      abonadoDetalle <= 0
                        ? `Primer abono: no puede ser inferior a ${formatearMoneda(minimoDetalle, 'COP')}.`
                        : `Saldo pendiente: ${formatearMoneda(
                            Math.max(0, cotizacionDetalle.total - abonadoDetalle),
                            'COP',
                          )}.`
                    }
                  >
                    <input
                      className="mca-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={abono.monto}
                      onChange={(event) => setAbono((actual) => ({ ...actual, monto: event.target.value }))}
                    />
                  </Field>
                  <Field label="Fecha del abono" hint="Se escribe sola con la fecha de hoy; solo se acepta hoy o fechas anteriores.">
                    <input
                      className="mca-input"
                      type="date"
                      max={fechaISO()}
                      value={abono.fecha}
                      onChange={(event) => setAbono((actual) => ({ ...actual, fecha: event.target.value }))}
                    />
                  </Field>
                  <Field label="Hora del abono" hint="Se escribe sola con la hora actual del pago.">
                    <input
                      className="mca-input"
                      type="time"
                      value={abono.hora}
                      onChange={(event) => setAbono((actual) => ({ ...actual, hora: event.target.value }))}
                    />
                  </Field>
                  <Field label="Método de pago">
                    <select
                      className="mca-select"
                      value={abono.metodo}
                      onChange={(event) => setAbono((actual) => ({ ...actual, metodo: event.target.value }))}
                    >
                      {METODOS_PAGO.map((metodo) => (
                        <option key={metodo} value={metodo}>
                          {metodo}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Referencia" hint="Número de transacción, konsolidado o recibo.">
                    <input
                      className="mca-input"
                      placeholder="Opcional"
                      value={abono.referencia}
                      onChange={(event) =>
                        setAbono((actual) => ({ ...actual, referencia: event.target.value }))
                      }
                    />
                  </Field>
                </div>
                <div className="mca-row" style={{ justifyContent: 'space-between' }}>
                  <span className="mca-hint">
                    Primero se recibe el pago; con el mínimo cubierto la cotización ya puede aprobarse.
                  </span>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    icon={CircleDollarSign}
                    disabled={abonando}
                  >
                    {abonando ? 'Registrando...' : 'Abonar'}
                  </Button>
                </div>
              </form>
            )}

            {cotizacionDetalle.notas && (
              <div className="mca-notice">
                <FileText size={15} strokeWidth={2} />
                <span>
                  <strong>Observaciones:</strong> {cotizacionDetalle.notas}
                </span>
              </div>
            )}

            {cotizacionDetalle.terminos && (
              <div className="mca-notice is-info">
                <FileText size={15} strokeWidth={2} />
                <span>
                  <strong>Términos y condiciones:</strong> {cotizacionDetalle.terminos}
                </span>
              </div>
            )}

            {cotizacionDetalle.garantias && (
              <div className="mca-notice is-success">
                <CheckCircle2 size={15} strokeWidth={2} />
                <span>
                  <strong>Garantías:</strong> {cotizacionDetalle.garantias}
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
