import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FolderPlus,
  Package,
  PauseCircle,
  Plus,
  Tags,
  Trash2,
  Wrench,
} from 'lucide-react';

import { AccionesFila } from '../../../shared/components/AccionesFila.jsx';
import { apiRequest } from '../../../shared/api.js';
import { useApiData } from '../../../shared/useApiData.js';
import { ESTADOS, EstadoToggle, estadoSiguiente } from '../../../shared/components/EstadoToggle.jsx';
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
  resumenErroresFormulario,
  useToast,
} from '../../../shared/components/ui.jsx';
import { formatearFecha, formatearMoneda } from '../../../shared/services/base.js';
import {
  CATEGORIAS_SERVICIO,
  MONEDAS_SERVICIO,
  UNIDADES_SERVICIO,
  reglaTiempoMoneda,
} from '../../../shared/services/catalogos.js';
import { normalizarServicio } from '../../../shared/services/serviciosService.js';
import { normalizarMaterial } from '../../../shared/services/materialesService.js';
import { claseFilaEstado } from '../../../shared/utils/estadosFila.js';

const FORMULARIO_VACIO = {
  nombre: '',
  categoria: 'Instalación',
  desc: '',
  unidad: 'Servicio',
  moneda: 'COP',
  precioNumerico: '',
  horas: '',
  estado: 'Activo',
  materiales: [],
};

const esMonedaUSD = (moneda) => String(moneda).toUpperCase().startsWith('USD');

const formatearPrecioServicio = (servicio) =>
  `${formatearMoneda(
    servicio.precioNumerico,
    esMonedaUSD(servicio.moneda) ? 'USD' : 'COP',
    esMonedaUSD(servicio.moneda) ? 2 : 0,
  )}${String(servicio.moneda).includes('/ H') ? ' / h' : ''}`;

// El estado del servicio pinta toda la barra: Pausado en amarillo, Inactivo tenue, Activo normal.
function claseFilaServicio(servicio) {
  return claseFilaEstado(servicio.estado, 'servicio');
}

// Costo de los materiales vinculados, para el estimado del servicio.
const costoMateriales = (materiales = []) =>
  materiales.reduce(
    (total, material) => total + Number(material.cantidad || 0) * Number(material.precioUnitario || 0),
    0,
  );

// Fila del servicio + despliegue automático de los materiales asignados.
function FragmentRow({ servicio, desplegado, onToggle, onVer, onEditar, onEliminar, onEstado }) {
  const materiales = servicio.materiales || [];

  return (
    <>
      <tr className={claseFilaServicio(servicio)}>
        <td className="mca-center">
          <button
            type="button"
            className="mca-icon-btn"
            onClick={onToggle}
            disabled={!materiales.length}
            title={materiales.length ? 'Ver los materiales del servicio' : 'Sin materiales asignados'}
          >
            {desplegado ? <ChevronDown size={16} strokeWidth={2} /> : <ChevronRight size={16} strokeWidth={2} />}
          </button>
        </td>
        <td>
          <div className="mca-cell-title">
            <span className="mca-cell-icon">
              <Wrench size={15} strokeWidth={1.9} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="is-primary">{servicio.nombre}</div>
              {servicio.desc && (
                <div
                  className="mca-soft"
                  style={{
                    fontSize: 11,
                    marginTop: 2,
                    maxWidth: 340,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {servicio.desc}
                </div>
              )}
            </div>
          </div>
        </td>
        <td>
          <Badge tone="neutral">{servicio.categoria}</Badge>
        </td>
        <td className="is-muted">{servicio.unidad}</td>
        <td className="is-number mca-strong">{formatearPrecioServicio(servicio)}</td>
        <td>
          <div className="mca-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
            <Clock size={13} strokeWidth={1.9} className="mca-soft" />
            <span className="is-nowrap">
              {servicio.tiempo} ({servicio.horas} h)
            </span>
          </div>
        </td>
        <td className="is-number">{materiales.length}</td>
        <td>
          <EstadoToggle
            estado={servicio.estado}
            estados={ESTADOS.servicio}
            width={108}
            onClick={onEstado}
          />
        </td>
        <td className="mca-center">
          <AccionesFila onVer={onVer} onEditar={onEditar} onEliminar={onEliminar} />
        </td>
      </tr>

      {desplegado && materiales.length > 0 && (
        <tr className="mca-row--detalle">
          <td colSpan={9}>
            <div className="mca-subtabla">
              <div className="mca-subtabla__titulo">
                <Package size={14} strokeWidth={1.9} />
                Materiales que se agregan automáticamente al cotizar
              </div>
              <table className="mca-table mca-table--sub">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Material</th>
                    <th className="is-number">Cantidad</th>
                    <th>Unidad</th>
                    <th className="is-number">Precio unit.</th>
                    <th className="is-number">Costo</th>
                    <th className="is-number">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {materiales.map((material) => (
                    <tr
                      key={material.codigo}
                      className={
                        Number(material.cantidad) > Number(material.stock) ? 'mca-row--critico' : ''
                      }
                    >
                      <td className="is-muted is-nowrap">{material.codigo}</td>
                      <td className="is-primary">{material.nombre}</td>
                      <td className="is-number mca-strong">{Number(material.cantidad)}</td>
                      <td className="is-muted">{material.unidad}</td>
                      <td className="is-number">{formatearMoneda(material.precioUnitario, 'COP')}</td>
                      <td className="is-number">
                        {formatearMoneda(
                          Number(material.cantidad) * Number(material.precioUnitario),
                          'COP',
                        )}
                      </td>
                      <td className="is-number">{Number(material.stock)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function CatalogoServicios() {
  const {
    data: servicios,
    error,
    loading,
    reload: cargarServicios,
  } = useApiData(
    () => apiRequest('/servicios').then((lista) => lista.map(normalizarServicio)),
    [],
  );

  const {
    data: categorias,
    error: errorCategorias,
    reload: cargarCategorias,
  } = useApiData(() => apiRequest('/servicios/categorias'), []);

  const {
    data: materiales,
    error: errorMateriales,
  } = useApiData(
    () => apiRequest('/materiales').then((lista) => lista.map(normalizarMaterial)),
    [],
  );

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [serviciosDesplegados, setServiciosDesplegados] = useState([]);

  const [modalFormulario, setModalFormulario] = useState(false);
  const [servicioEditando, setServicioEditando] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});
  const [seleccion, setSeleccion] = useState({ codigo: '', cantidad: '1' });

  const [modalCategoria, setModalCategoria] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: '', estado: 'Activo' });
  const [errorCategoria, setErrorCategoria] = useState('');

  const [servicioDetalle, setServicioDetalle] = useState(null);
  const [servicioEliminar, setServicioEliminar] = useState(null);

  const { toast, notify, close } = useToast();

  const categoriasDisponibles = categorias.length
    ? categorias.filter((categoria) => categoria.estado !== 'Inactivo').map((categoria) => categoria.nombre)
    : CATEGORIAS_SERVICIO;

  const abrirNuevo = () => {
    setServicioEditando(null);
    setErrores({});
    setSeleccion({ codigo: '', cantidad: '1' });
    setFormulario({
      ...FORMULARIO_VACIO,
      categoria: categoriasDisponibles[0] || 'Instalación',
      horas: String(reglaTiempoMoneda('COP').horas),
    });
    setModalFormulario(true);
  };

  const abrirEditar = (servicio) => {
    setServicioEditando(servicio);
    setErrores({});
    setSeleccion({ codigo: '', cantidad: '1' });
    setFormulario({
      nombre: servicio.nombre,
      categoria: servicio.categoria,
      desc: servicio.desc,
      unidad: servicio.unidad,
      moneda: servicio.moneda,
      precioNumerico: String(servicio.precioNumerico ?? ''),
      horas: String(servicio.horas ?? reglaTiempoMoneda(servicio.moneda).horas),
      estado: servicio.estado,
      materiales: (servicio.materiales || []).map((material) => ({
        codigo: material.codigo,
        nombre: material.nombre,
        cantidad: Number(material.cantidad || 1),
        unidad: material.unidad,
        precioUnitario: Number(material.precioUnitario || 0),
        stock: Number(material.stock || 0),
      })),
    });
    setModalFormulario(true);
  };

  const cerrarFormulario = () => {
    setModalFormulario(false);
    setServicioEditando(null);
    setErrores({});
    setSeleccion({ codigo: '', cantidad: '1' });
  };

  const abrirCategoria = () => {
    setNuevaCategoria({ nombre: '', estado: 'Activo' });
    setErrorCategoria('');
    setModalCategoria(true);
  };

  const cambiarMoneda = (moneda) => {
    const regla = reglaTiempoMoneda(moneda);
    setFormulario((actual) => ({
      ...actual,
      moneda,
      horas: String(actual.horas || regla.horas),
    }));
  };

  const agregarMaterial = () => {
    const material = materiales.find((item) => item.id === seleccion.codigo);
    if (!material) {
      notify('warning', 'Mensaje flotante de validación', 'Selecciona un material del inventario.');
      return;
    }

    const cantidad = Number(seleccion.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      notify('warning', 'Mensaje flotante de validación', 'La cantidad del material debe ser mayor que cero.');
      return;
    }

    if (formulario.materiales.some((item) => item.codigo === material.id)) {
      notify('warning', 'Mensaje flotante de validación', `${material.nombre} ya está asignado al servicio; no se puede repetir.`);
      return;
    }

    if (cantidad > material.stock) {
      notify(
        'warning',
        'Advertencia de stock',
        `${material.nombre} tiene ${material.stock} ${material.unidad.toLowerCase()} en inventario y el servicio solicita ${cantidad}.`,
      );
    }

    setFormulario((actual) => ({
      ...actual,
      materiales: [
        ...actual.materiales,
        {
          codigo: material.id,
          nombre: material.nombre,
          cantidad,
          unidad: material.unidad,
          precioUnitario: material.precioUnitario,
          stock: material.stock,
        },
      ],
    }));
    setSeleccion({ codigo: '', cantidad: '1' });
  };

  const quitarMaterial = (codigo) => {
    setFormulario((actual) => ({
      ...actual,
      materiales: actual.materiales.filter((item) => item.codigo !== codigo),
    }));
  };

  const cambiarCantidadMaterial = (codigo, valor) => {
    const cantidad = Number(valor) > 0 ? Number(valor) : 0;
    setFormulario((actual) => ({
      ...actual,
      materiales: actual.materiales.map((item) => {
        if (item.codigo !== codigo) return item;
        const inventario = materiales.find((material) => material.id === codigo);
        return { ...item, cantidad, stock: inventario?.stock ?? item.stock };
      }),
    }));
  };

  const handleGuardar = async (event) => {
    event.preventDefault();

    const nuevosErrores = {};
    const precio = Number(formulario.precioNumerico);
    const horas = Number(formulario.horas);

    if (!formulario.nombre.trim()) nuevosErrores.nombre = 'Escribe el nombre del servicio.';
    if (formulario.precioNumerico === '' || !Number.isFinite(precio) || precio < 0) {
      nuevosErrores.precioNumerico = 'Ingresa un precio válido.';
    }
    if (formulario.horas !== '' && (!Number.isFinite(horas) || horas <= 0)) {
      nuevosErrores.horas = 'Las horas estimadas deben ser mayores que cero.';
    }

    const faltantes = formulario.materiales.filter((item) => !Number.isFinite(Number(item.cantidad)) || Number(item.cantidad) <= 0);
    if (faltantes.length) {
      nuevosErrores.materiales = `Revisa la cantidad de: ${faltantes.map((item) => item.nombre).join(', ')}.`;
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      notify('warning', 'Mensaje flotante de validación', resumenErroresFormulario(nuevosErrores));
      return;
    }

    try {
      const guardado = await apiRequest(
        servicioEditando ? `/servicios/${encodeURIComponent(servicioEditando.id)}` : '/servicios',
        {
          method: servicioEditando ? 'PUT' : 'POST',
          body: {
            nombre: formulario.nombre,
            categoria: formulario.categoria,
            desc: formulario.desc,
            unidad: formulario.unidad,
            moneda: formulario.moneda,
            precioNumerico: precio,
            horas: Number.isFinite(horas) && horas > 0 ? horas : undefined,
            estado: formulario.estado,
            materiales: formulario.materiales.map((item) => ({
              codigo: item.codigo,
              cantidad: Number(item.cantidad),
            })),
          },
        },
      );

      await cargarServicios();
      notify(
        'success',
        servicioEditando ? 'Servicio actualizado' : 'Servicio registrado',
        `${guardado.nombre} · ${guardado.tiempo} estimado (${guardado.horas} h) · ${guardado.materiales?.length || 0} materiales.`,
      );
      const sobreStock = (guardado.materiales || []).filter(
        (material) => Number(material.cantidad) > Number(material.stock),
      );
      if (sobreStock.length) {
        notify(
          'warning',
          'Advertencia de stock',
          `${sobreStock.map((material) => material.nombre).join(', ')} supera el inventario disponible.`,
        );
      }
      cerrarFormulario();
    } catch (requestError) {
      notify('error', 'No se pudo guardar el servicio', requestError.message);
    }
  };

  const handleCrearCategoria = async (event) => {
    event.preventDefault();

    if (!nuevaCategoria.nombre.trim()) {
      setErrorCategoria('Escribe el nombre de la categoría.');
      notify('warning', 'Mensaje flotante de validación', 'Completa los mensajes obligatorios: Escribe el nombre de la categoría.');
      return;
    }

    try {
      const categoria = await apiRequest('/servicios/categorias', {
        method: 'POST',
        body: nuevaCategoria,
      });
      await cargarCategorias();
      setFormulario((actual) => ({ ...actual, categoria: categoria.nombre }));
      setModalCategoria(false);
      setNuevaCategoria({ nombre: '', estado: 'Activo' });
      setErrorCategoria('');
      notify('success', 'Categoría creada', `${categoria.nombre} ya se puede asignar a los servicios.`);
    } catch (requestError) {
      setErrorCategoria(requestError.message);
      notify('error', 'No se pudo crear la categoría', requestError.message);
    }
  };

  const handleCambiarEstadoCategoria = async (categoria) => {
    const siguiente = categoria.estado === 'Activo' ? 'Inactivo' : 'Activo';
    try {
      await apiRequest(`/servicios/categorias/${categoria.id}/estado`, {
        method: 'PATCH',
        body: { estado: siguiente },
      });
      await cargarCategorias();
      notify('info', 'Categoría actualizada', `${categoria.nombre} ahora está ${siguiente.toLowerCase()}.`);
    } catch (requestError) {
      notify('error', 'No se pudo cambiar la categoría', requestError.message);
    }
  };

  const handleCambiarEstado = async (servicio) => {
    const siguiente = estadoSiguiente(ESTADOS.servicio, servicio.estado);
    try {
      const actualizado = await apiRequest(`/servicios/${encodeURIComponent(servicio.id)}/estado`, {
        method: 'PATCH',
        body: { estado: siguiente },
      });
      await cargarServicios();
      notify(
        'info',
        'Estado actualizado',
        `${actualizado.nombre} ahora está ${actualizado.estado.toLowerCase()}.`,
      );
    } catch (requestError) {
      notify('error', 'No se pudo cambiar el estado', requestError.message);
    }
  };

  const confirmarEliminar = async () => {
    if (!servicioEliminar) return;

    try {
      await apiRequest(`/servicios/${encodeURIComponent(servicioEliminar.id)}`, { method: 'DELETE' });
      await cargarServicios();
      notify(
        'success',
        'Servicio eliminado',
        `${servicioEliminar.nombre} ya no estará disponible en cotizaciones.`,
      );
    } catch (requestError) {
      notify('error', 'No se pudo eliminar', requestError.message);
    } finally {
      setServicioEliminar(null);
    }
  };

  const toggleDesplegado = (id) => {
    setServiciosDesplegados((actual) =>
      actual.includes(id) ? actual.filter((item) => item !== id) : [...actual, id],
    );
  };

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return servicios.filter((servicio) => {
      const coincideTexto =
        !termino ||
        [servicio.nombre, servicio.categoria, servicio.desc].some((valor) =>
          String(valor).toLowerCase().includes(termino),
        );

      return (
        coincideTexto &&
        (filtroCategoria === 'Todas' || servicio.categoria === filtroCategoria) &&
        (filtroEstado === 'Todos' || servicio.estado === filtroEstado)
      );
    });
  }, [servicios, busqueda, filtroCategoria, filtroEstado]);

  const activos = servicios.filter((servicio) => servicio.estado === 'Activo').length;
  const inactivos = servicios.filter((servicio) => servicio.estado === 'Inactivo').length;
  const pausados = servicios.length - activos - inactivos;
  const categoriasRegistradas = categorias.length || CATEGORIAS_SERVICIO.length;
  const categoriasUsadas = new Set(servicios.map((servicio) => servicio.categoria)).size;

  const regla = reglaTiempoMoneda(formulario.moneda);
  const horasFormulario = Number(formulario.horas) > 0 ? Number(formulario.horas) : regla.horas;
  const diasEstimados = Math.max(1, Math.ceil(horasFormulario / 8));
  const costoServicioMateriales = costoMateriales(formulario.materiales);
  const materialesDisponibles = materiales.filter(
    (material) =>
      material.estadoInventario !== 'Inactivo' &&
      !formulario.materiales.some((item) => item.codigo === material.id),
  );

  return (
    <PageShell>
      {(error || errorCategorias || errorMateriales) && (
        <p role="alert" className="mca-error">
          No se pudo cargar el catálogo desde la API: {error || errorCategorias || errorMateriales}
        </p>
      )}
      {loading && <p role="status">Cargando servicios desde la API...</p>}
      <PageHeader
        eyebrow="Servicios"
        title="Catálogo de servicios"
        subtitle="Tarifas, tiempos estimados y materiales que alimentan automáticamente las cotizaciones y la agenda."
        icon={Wrench}
        actions={
          <>
            <Button icon={FolderPlus} onClick={abrirCategoria}>
              Nueva categoría
            </Button>
            <Button variant="primary" icon={Plus} onClick={abrirNuevo}>
              Nuevo servicio
            </Button>
          </>
        }
      />

      <div className="mca-kpis">
        <KpiCard
          label="Servicios"
          value={servicios.length}
          hint={`${categoriasUsadas} categorías en uso`}
          icon={Wrench}
          tone="yellow"
        />
        <KpiCard
          label="Activos"
          value={activos}
          hint="Disponibles para cotizar"
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label="Pausados"
          value={pausados}
          hint="Suspendidos temporalmente"
          icon={PauseCircle}
          tone="warning"
        />
        <KpiCard
          label="Inactivos"
          value={inactivos}
          hint="No se pueden cotizar ni agendar"
          icon={Tags}
          tone="danger"
        />
        <KpiCard
          label="Categorías"
          value={categoriasRegistradas}
          hint="Administrables desde el catálogo"
          icon={Tags}
          tone="info"
        />
      </div>

      <Panel
        title="Servicios disponibles"
        subtitle={`${filtrados.length} de ${servicios.length} servicios`}
        actions={
          <>
            <SearchInput
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar por nombre, categoría o descripción..."
            />
            <select
              className="mca-select"
              style={{ width: 170 }}
              value={filtroCategoria}
              onChange={(event) => setFiltroCategoria(event.target.value)}
              aria-label="Filtrar por categoría"
            >
              <option value="Todas">Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria.id || categoria.nombre} value={categoria.nombre}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
            <select
              className="mca-select"
              style={{ width: 145 }}
              value={filtroEstado}
              onChange={(event) => setFiltroEstado(event.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="Todos">Todos los estados</option>
              {ESTADOS.servicio.map((estado) => (
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
                <th className="mca-center">Detalle</th>
                <th>Servicio</th>
                <th>Categoría</th>
                <th>Unidad</th>
                <th className="is-number">Precio</th>
                <th>Tiempo estimado</th>
                <th className="is-number">Materiales</th>
                <th>Estado</th>
                <th className="mca-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="mca-table__empty">
                    <EmptyState
                      icon={Wrench}
                      title="Sin servicios para mostrar"
                      message="Ajusta los filtros o registra un nuevo servicio en el catálogo."
                      action={
                        <Button size="sm" icon={Plus} onClick={abrirNuevo}>
                          Nuevo servicio
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtrados.map((servicio) => {
                  const desplegado = serviciosDesplegados.includes(servicio.id);

                  return (
                    <FragmentRow
                      key={servicio.id}
                      servicio={servicio}
                      desplegado={desplegado}
                      onToggle={() => toggleDesplegado(servicio.id)}
                      onVer={() => setServicioDetalle(servicio)}
                      onEditar={() => abrirEditar(servicio)}
                      onEliminar={() => setServicioEliminar(servicio)}
                      onEstado={() => handleCambiarEstado(servicio)}
                    />
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
        title={servicioEditando ? 'Editar servicio' : 'Nuevo servicio'}
        subtitle={
          servicioEditando
            ? servicioEditando.nombre
            : 'El tiempo estimado, los materiales y el costo se calculan automáticamente.'
        }
        icon={Wrench}
        footer={
          <>
            <Button onClick={cerrarFormulario}>Cancelar</Button>
            <Button
              variant="primary"
              type="submit"
              form="form-servicio"
              icon={servicioEditando ? undefined : Plus}
            >
              {servicioEditando ? 'Guardar cambios' : 'Registrar servicio'}
            </Button>
          </>
        }
      >
        <form id="form-servicio" onSubmit={handleGuardar} noValidate>
          <div className="mca-form-grid">
            <Field label="Nombre del servicio" required full error={errores.nombre}>
              <input
                className="mca-input"
                type="text"
                autoFocus
                placeholder="Ej: Instalación de tablero trifásico"
                value={formulario.nombre}
                onChange={(event) => {
                  setFormulario((actual) => ({ ...actual, nombre: event.target.value }));
                  setErrores((actual) => ({ ...actual, nombre: '' }));
                }}
              />
            </Field>

            <Field label="Categoría" hint="Se administra desde «Nueva categoría».">
              <div className="mca-input-group">
                <select
                  className="mca-select"
                  value={formulario.categoria}
                  onChange={(event) =>
                    setFormulario((actual) => ({ ...actual, categoria: event.target.value }))
                  }
                >
                  {categoriasDisponibles.length === 0 && <option value="">Sin categorías</option>}
                  {categoriasDisponibles.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
                <Button size="sm" icon={FolderPlus} onClick={abrirCategoria}>
                  Nueva
                </Button>
              </div>
            </Field>

            <Field label="Descripción" full>
              <textarea
                className="mca-textarea"
                placeholder="Describe el alcance del servicio."
                value={formulario.desc}
                onChange={(event) =>
                  setFormulario((actual) => ({ ...actual, desc: event.target.value }))
                }
              />
            </Field>

            <Field label="Unidad de cobro">
              <select
                className="mca-select"
                value={formulario.unidad}
                onChange={(event) =>
                  setFormulario((actual) => ({ ...actual, unidad: event.target.value }))
                }
              >
                {UNIDADES_SERVICIO.map((unidad) => (
                  <option key={unidad} value={unidad}>
                    {unidad}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Moneda">
              <select
                className="mca-select"
                value={formulario.moneda}
                onChange={(event) => cambiarMoneda(event.target.value)}
              >
                {MONEDAS_SERVICIO.map((moneda) => (
                  <option key={moneda} value={moneda}>
                    {moneda}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={`Precio (${formulario.moneda})`} required error={errores.precioNumerico}>
              <input
                className="mca-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={formulario.precioNumerico}
                onChange={(event) => {
                  setFormulario((actual) => ({
                    ...actual,
                    precioNumerico: event.target.value,
                  }));
                  setErrores((actual) => ({ ...actual, precioNumerico: '' }));
                }}
              />
            </Field>

            <Field label="Estado del servicio">
              <select
                className="mca-select"
                value={formulario.estado}
                onChange={(event) =>
                  setFormulario((actual) => ({ ...actual, estado: event.target.value }))
                }
              >
                {ESTADOS.servicio.map((estado) => (
                  <option key={estado.nombre} value={estado.nombre}>
                    {estado.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Horas estimadas"
              error={errores.horas}
              hint={`Sugerido por la moneda ${formulario.moneda}: ${regla.horas} h.`}
            >
              <input
                className="mca-input"
                type="number"
                min="1"
                step="0.5"
                placeholder={String(regla.horas)}
                value={formulario.horas}
                onChange={(event) => {
                  setFormulario((actual) => ({ ...actual, horas: event.target.value }));
                  setErrores((actual) => ({ ...actual, horas: '' }));
                }}
              />
            </Field>

            <Field label="Tiempo estimado" hint="Se usa para agendar horas y fechas.">
              <input
                className="mca-input"
                type="text"
                value={`${horasFormulario} h · ${horasFormulario >= 8 ? `${diasEstimados} día(s)` : 'Mismo día'}`}
                disabled
              />
            </Field>

            <div className="mca-field mca-field--full">
              <div className="mca-notice is-info">
                <Clock size={15} strokeWidth={2} />
                <span>
                  <strong>Regla de negocio:</strong> la moneda <strong>{formulario.moneda}</strong>{' '}
                  sugiere <strong>{regla.texto}</strong> ({regla.horas} horas), pero puedes ajustar
                  las horas estimadas; la agenda reserva <strong>{horasFormulario} h</strong> y, si
                  supera la jornada de 8 horas, el servicio se reparte en{' '}
                  <strong>{diasEstimados} día(s)</strong>.
                </span>
              </div>
            </div>

            <div className="mca-field mca-field--full">
              <span className="mca-label">Materiales del servicio</span>
              <div className="mca-input-group">
                <select
                  className="mca-select"
                  value={seleccion.codigo}
                  onChange={(event) =>
                    setSeleccion((actual) => ({ ...actual, codigo: event.target.value }))
                  }
                  aria-label="Seleccionar material"
                >
                  <option value="">
                    {materialesDisponibles.length ? 'Selecciona un material' : 'Sin materiales disponibles'}
                  </option>
                  {materialesDisponibles.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.nombre} · {material.id} · stock {material.stock} {material.unidad}
                    </option>
                  ))}
                </select>
                <input
                  className="mca-input"
                  type="number"
                  min="0"
                  step="1"
                  style={{ width: 96 }}
                  value={seleccion.cantidad}
                  onChange={(event) =>
                    setSeleccion((actual) => ({ ...actual, cantidad: event.target.value }))
                  }
                  aria-label="Cantidad del material"
                />
                <Button size="sm" icon={Plus} onClick={agregarMaterial}>
                  Agregar
                </Button>
              </div>
              <span className="mca-hint">
                Estos materiales se cargan automáticamente al cotizar el servicio y puedes seguir
                agregando más desde la cotización. Un material no se puede repetir.
              </span>
              {errores.materiales && (
                <span className="mca-error" role="alert">
                  {errores.materiales}
                </span>
              )}
            </div>

            {formulario.materiales.length > 0 && (
              <div className="mca-field mca-field--full">
                <div className="mca-table-wrap mca-table-wrap--compact">
                  <table className="mca-table mca-table--sub">
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th className="is-number">Cantidad</th>
                        <th className="is-number">Stock</th>
                        <th className="is-number">Costo</th>
                        <th className="mca-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formulario.materiales.map((material) => (
                        <tr
                          key={material.codigo}
                          className={material.cantidad > material.stock ? 'mca-row--critico' : ''}
                        >
                          <td className="is-primary">
                            {material.nombre}
                            <div className="mca-soft" style={{ fontSize: 11 }}>
                              {material.codigo}
                            </div>
                          </td>
                          <td className="is-number">
                            <input
                              className="mca-input"
                              type="number"
                              min="0"
                              step="1"
                              style={{ width: 86, textAlign: 'right' }}
                              value={material.cantidad}
                              onChange={(event) =>
                                cambiarCantidadMaterial(material.codigo, event.target.value)
                              }
                            />
                          </td>
                          <td className="is-number">{Number(material.stock)}</td>
                          <td className="is-number">
                            {formatearMoneda(
                              Number(material.cantidad) * Number(material.precioUnitario),
                              'COP',
                            )}
                          </td>
                          <td className="mca-center">
                            <button
                              type="button"
                              className="mca-icon-btn mca-icon-btn--danger"
                              onClick={() => quitarMaterial(material.codigo)}
                              title="Quitar material del servicio"
                            >
                              <Trash2 size={15} strokeWidth={1.9} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <span className="mca-hint">
                  Costo en materiales: <strong>{formatearMoneda(costoServicioMateriales, 'COP')}</strong>{' '}
                  · se descuenta del inventario cuando la cotización se aprueba.
                </span>
              </div>
            )}
          </div>
        </form>
      </Modal>

      <Modal
        open={modalCategoria}
        onClose={() => setModalCategoria(false)}
        title="Nueva categoría de servicio"
        subtitle="Las categorías se crean aquí y se asignan a los servicios."
        icon={FolderPlus}
        size="sm"
        footer={
          <>
            <Button onClick={() => setModalCategoria(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" form="form-categoria-servicio">
              Crear categoría
            </Button>
          </>
        }
      >
        <form id="form-categoria-servicio" onSubmit={handleCrearCategoria} noValidate>
          <div className="mca-form-grid">
            <Field label="Nombre de la categoría" required full error={errorCategoria}>
              <input
                className="mca-input"
                type="text"
                autoFocus
                placeholder="Ej: Subestaciones"
                value={nuevaCategoria.nombre}
                onChange={(event) => {
                  setNuevaCategoria((actual) => ({ ...actual, nombre: event.target.value }));
                  setErrorCategoria('');
                }}
              />
            </Field>
            <Field label="Estado" full hint="Una categoría inactiva no se puede asignar.">
              <select
                className="mca-select"
                value={nuevaCategoria.estado}
                onChange={(event) =>
                  setNuevaCategoria((actual) => ({ ...actual, estado: event.target.value }))
                }
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </Field>
          </div>
        </form>

        <div className="mca-stack">
          <span className="mca-label">Categorías registradas</span>
          {categorias.length === 0 && (
            <span className="mca-hint">Aún no hay categorías en la API.</span>
          )}
          {categorias.map((categoria) => (
            <div key={categoria.id} className="mca-row" style={{ justifyContent: 'space-between' }}>
              <span className="is-nowrap">
                {categoria.nombre}
                <span className="mca-soft" style={{ marginLeft: 8, fontSize: 11 }}>
                  {categoria.serviciosCount || 0} servicio(s)
                </span>
              </span>
              <EstadoToggle
                estado={categoria.estado}
                estados={ESTADOS.usuario}
                width={104}
                onClick={() => handleCambiarEstadoCategoria(categoria)}
              />
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={Boolean(servicioDetalle)}
        onClose={() => setServicioDetalle(null)}
        title={servicioDetalle?.nombre || 'Detalle del servicio'}
        subtitle={
          servicioDetalle
            ? `${servicioDetalle.categoria} · ${servicioDetalle.materiales?.length || 0} materiales asignados`
            : ''
        }
        icon={Wrench}
        footer={
          <>
            <Button onClick={() => setServicioDetalle(null)}>Cerrar</Button>
            <Button
              variant="primary"
              onClick={() => {
                const servicio = servicioDetalle;
                setServicioDetalle(null);
                abrirEditar(servicio);
              }}
            >
              Editar servicio
            </Button>
          </>
        }
      >
        {servicioDetalle && (
          <div className="mca-stack">
            <div className="mca-row">
              <EstadoToggle
                estado={servicioDetalle.estado}
                estados={ESTADOS.servicio}
                width={112}
              />
              <Badge tone="neutral">{servicioDetalle.categoria}</Badge>
            </div>

            <DetailGrid>
              <DetailItem label="Categoría">{servicioDetalle.categoria}</DetailItem>
              <DetailItem label="Unidad de cobro">{servicioDetalle.unidad}</DetailItem>
              <DetailItem label="Moneda">{servicioDetalle.moneda}</DetailItem>
              <DetailItem label="Precio">
                {formatearPrecioServicio(servicioDetalle)}
              </DetailItem>
              <DetailItem label="Tiempo estimado">
                {servicioDetalle.tiempo} ({servicioDetalle.horas} h)
              </DetailItem>
              <DetailItem label="Materiales">
                {servicioDetalle.materiales?.length || 0} ·{' '}
                {formatearMoneda(costoMateriales(servicioDetalle.materiales), 'COP')}
              </DetailItem>
              <DetailItem label="Estado">{servicioDetalle.estado}</DetailItem>
              <DetailItem label="Última actualización">
                {servicioDetalle.actualizadoEn
                  ? formatearFecha(servicioDetalle.actualizadoEn)
                  : 'Sin cambios registrados'}
              </DetailItem>
              <DetailItem label="Descripción" full>
                {servicioDetalle.desc || 'Sin descripción.'}
              </DetailItem>
            </DetailGrid>

            <div className="mca-stack">
              <span className="mca-label">
                <Package size={14} strokeWidth={2} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Materiales que se agregan al cotizar
              </span>
              {!servicioDetalle.materiales?.length && (
                <span className="mca-hint">Este servicio no tiene materiales vinculados.</span>
              )}
              {servicioDetalle.materiales?.map((material) => (
                <div key={material.codigo} className="mca-row" style={{ justifyContent: 'space-between' }}>
                  <span>
                    <strong>{material.nombre}</strong>
                    <span className="mca-soft" style={{ marginLeft: 8, fontSize: 12 }}>
                      {Number(material.cantidad)} {String(material.unidad || '').toLowerCase()}
                      {' · '}
                      {formatearMoneda(
                        Number(material.cantidad) * Number(material.precioUnitario),
                        'COP',
                      )}
                    </span>
                  </span>
                  <Badge tone={Number(material.cantidad) > Number(material.stock) ? 'danger' : 'neutral'}>
                    Stock {Number(material.stock)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(servicioEliminar)}
        title="Eliminar servicio"
        message={
          servicioEliminar
            ? `Se eliminará "${servicioEliminar.nombre}" del catálogo junto con sus materiales asignados. Las cotizaciones existentes conservarán su copia.`
            : ''
        }
        onCancel={() => setServicioEliminar(null)}
        onConfirm={confirmarEliminar}
      />

      <Toast toast={toast} onClose={close} />
    </PageShell>
  );
}

export default CatalogoServicios;
