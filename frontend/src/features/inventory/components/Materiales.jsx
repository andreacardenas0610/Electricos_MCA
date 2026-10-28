import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  FolderPlus,
  Layers,
  PackageOpen,
  Plus,
} from 'lucide-react';

import { AccionesFila } from '../../../shared/components/AccionesFila.jsx';
import { apiRequest } from '../../../shared/api.js';
import { useApiData } from '../../../shared/useApiData.js';
import { ESTADOS } from '../../../shared/components/EstadoToggle.jsx';
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
  UNIDADES_MEDIDA,
  unidadSugeridaPorCategoria,
} from '../../../shared/services/catalogos.js';
import {
  calcularEstadoStock,
  normalizarMaterial,
} from '../../../shared/services/materialesService.js';

const TONO_ESTADO = {
  Óptimo: 'neutral',
  Medio: 'yellow',
  'Bajo Stock': 'warning',
  Crítico: 'danger',
};

const ESTADOS_REGISTRO = [
  { nombre: 'Activo', tono: 'success' },
  { nombre: 'Inactivo', tono: 'danger' },
];

// Sin stock la fila completa se pinta de rojo; con poco stock de amarillo;
// con stock suficiente queda con el gris normal de la tabla.
function claseFilaMaterial(material) {
  if (material.estado === 'Crítico') return 'mca-row--critico';
  if (material.estado === 'Bajo Stock' || material.estado === 'Medio') return 'mca-row--bajo';
  if (material.estadoInventario === 'Inactivo') return 'mca-row--inactivo';
  return '';
}

const FORMULARIO_VACIO = {
  nombre: '',
  categoria: '',
  unidad: 'Unidad',
  cantidad: '',
  stockMinimo: '10',
  stockMedio: '20',
  precioUnitario: '',
  estadoInventario: 'Activo',
};

export function Materiales() {
  const {
    data: materiales,
    error: errorMateriales,
    loading: cargandoMateriales,
    reload: cargarMateriales,
  } = useApiData(() => apiRequest('/materiales').then((lista) => lista.map(normalizarMaterial)), []);
  const {
    data: categorias,
    error: errorCategorias,
    loading: cargandoCategorias,
    reload: cargarCategorias,
  } = useApiData(() => apiRequest('/materiales/categorias'), []);

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroRegistro, setFiltroRegistro] = useState('Todos');

  const [modalFormulario, setModalFormulario] = useState(false);
  const [materialEditando, setMaterialEditando] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});

  const [modalCategoria, setModalCategoria] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: '', unidad: 'Unidad' });
  const [errorCategoria, setErrorCategoria] = useState('');

  const [materialDetalle, setMaterialDetalle] = useState(null);
  const [materialEliminar, setMaterialEliminar] = useState(null);

  const { toast, notify, close } = useToast();

  const unidadDeCategoria = (nombre) =>
    categorias.find((categoria) => categoria.nombre === nombre)?.unidad ||
    unidadSugeridaPorCategoria(nombre);

  const abrirNuevo = () => {
    const primera = categorias[0];
    setMaterialEditando(null);
    setErrores({});
    setFormulario({
      ...FORMULARIO_VACIO,
      categoria: primera?.nombre || '',
      unidad: primera?.unidad || 'Unidad',
    });
    setModalFormulario(true);
  };

  const abrirEditar = (material) => {
    setMaterialEditando(material);
    setErrores({});
    setFormulario({
      nombre: material.nombre,
      categoria: material.categoria,
      unidad: material.unidad,
      cantidad: String(material.stock),
      stockMinimo: String(material.stockMinimo ?? 10),
      stockMedio: String(material.stockMedio ?? Math.max(Number(material.stockMinimo ?? 10) * 2, 20)),
      precioUnitario: String(material.precioUnitario ?? ''),
      estadoInventario: material.estadoInventario || 'Activo',
    });
    setModalFormulario(true);
  };

  const abrirCategoria = () => {
    setNuevaCategoria({ nombre: '', unidad: 'Unidad' });
    setErrorCategoria('');
    setModalCategoria(true);
  };

  const cambiarCategoria = (nombre) => {
    setFormulario((actual) => ({
      ...actual,
      categoria: nombre,
      unidad: unidadDeCategoria(nombre),
    }));
  };

  const cerrarFormulario = () => {
    setModalFormulario(false);
    setMaterialEditando(null);
    setErrores({});
  };

  const handleGuardar = async (event) => {
    event.preventDefault();

    const nuevosErrores = {};
    const cantidad = Number(formulario.cantidad);
    const minimo = Number(formulario.stockMinimo);
    const medio = Number(formulario.stockMedio);
    const precio = Number(formulario.precioUnitario);

    if (!formulario.nombre.trim()) nuevosErrores.nombre = 'Escribe el nombre del material.';
    if (!formulario.categoria) nuevosErrores.categoria = 'Selecciona o crea una categoría.';
    if (formulario.cantidad === '' || !Number.isFinite(cantidad) || cantidad < 0) {
      nuevosErrores.cantidad = 'Ingresa una cantidad válida.';
    }
    if (formulario.stockMinimo !== '' && (!Number.isFinite(minimo) || minimo < 0)) {
      nuevosErrores.stockMinimo = 'Ingresa un stock mínimo válido.';
    }
    if (formulario.stockMedio !== '' && (!Number.isFinite(medio) || medio < 0)) {
      nuevosErrores.stockMedio = 'Ingresa un stock medio válido.';
    }
    // El parámetro medio es el límite del buen stock: debe quedar por encima del mínimo.
    if (Number.isFinite(minimo) && Number.isFinite(medio) && medio > 0 && medio < minimo) {
      nuevosErrores.stockMedio = 'El stock medio debe ser mayor que el stock mínimo.';
    }
    if (formulario.precioUnitario !== '' && (!Number.isFinite(precio) || precio < 0)) {
      nuevosErrores.precioUnitario = 'Ingresa un precio válido.';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      notify('warning', 'Mensaje flotante de validación', resumenErroresFormulario(nuevosErrores));
      return;
    }

    try {
      const guardado = await apiRequest(
        materialEditando ? `/materiales/${encodeURIComponent(materialEditando.id)}` : '/materiales',
        {
          method: materialEditando ? 'PUT' : 'POST',
          body: {
            nombre: formulario.nombre,
            categoria: formulario.categoria,
            unidad: formulario.unidad,
            stock: cantidad,
            stockMinimo: Number.isFinite(minimo) ? minimo : 10,
            stockMedio: Number.isFinite(medio) ? medio : Math.max(minimo * 2, 20),
            precioUnitario: Number.isFinite(precio) ? precio : 0,
            estadoInventario: formulario.estadoInventario,
          },
        },
      );

      await cargarMateriales();
      notify(
        'success',
        materialEditando ? 'Material actualizado' : 'Material registrado',
        `${guardado.nombre} · ${guardado.id} · Stock ${guardado.stock} · Estado ${guardado.estado}.`,
      );
      if (materialEditando && Number(guardado.precioUnitario) !== precio) {
        notify(
          'warning',
          'Precio unitario bloqueado',
          `${guardado.id} ya se usó en una cotización, su precio unitario no se puede editar.`,
        );
      }
      cerrarFormulario();
    } catch (error) {
      notify('error', 'No se pudo guardar el material', error.message);
    }
  };

  const handleCambiarEstadoRegistro = async (material) => {
    const siguiente = material.estadoInventario === 'Activo' ? 'Inactivo' : 'Activo';
    try {
      await apiRequest(`/materiales/${encodeURIComponent(material.id)}/estado`, {
        method: 'PATCH',
        body: { estado: siguiente },
      });
      await cargarMateriales();
      setMaterialDetalle((actual) => (
        actual && actual.id === material.id ? { ...actual, estadoInventario: siguiente } : actual
      ));
      notify(
        'info',
        'Estado actualizado',
        `${material.nombre} ahora está ${siguiente}.`,
      );
    } catch (error) {
      notify('error', 'No se pudo cambiar el estado', error.message);
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
      const categoria = await apiRequest('/materiales/categorias', {
        method: 'POST',
        body: nuevaCategoria,
      });
      await cargarCategorias();
      setFormulario((actual) => ({
        ...actual,
        categoria: categoria.nombre,
        unidad: categoria.unidad,
      }));
      setModalCategoria(false);
      setNuevaCategoria({ nombre: '', unidad: 'Unidad' });
      setErrorCategoria('');
      notify(
        'success',
        'Categoría creada',
        `${categoria.nombre} ahora asigna la unidad ${categoria.unidad} automáticamente.`,
      );
    } catch (error) {
      setErrorCategoria(error.message);
      notify('error', 'No se pudo crear la categoría', error.message);
    }
  };

  const confirmarEliminar = async () => {
    if (!materialEliminar) return;

    try {
      await apiRequest(`/materiales/${encodeURIComponent(materialEliminar.id)}`, { method: 'DELETE' });
      await cargarMateriales();
      notify(
        'success',
        'Material eliminado',
        `${materialEliminar.nombre} se retiró del inventario.`,
      );
    } catch (error) {
      notify('error', 'No se pudo eliminar', error.message);
    } finally {
      setMaterialEliminar(null);
    }
  };

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return materiales.filter((material) => {
      const coincideTexto =
        !termino ||
        [material.nombre, material.categoria, material.id, material.unidad].some((valor) =>
          String(valor).toLowerCase().includes(termino),
        );

      return (
        coincideTexto &&
        (filtroCategoria === 'Todas' || material.categoria === filtroCategoria) &&
        (filtroEstado === 'Todos' || material.estado === filtroEstado) &&
        (filtroRegistro === 'Todos' || material.estadoInventario === filtroRegistro)
      );
    });
  }, [materiales, busqueda, filtroCategoria, filtroEstado, filtroRegistro]);

  const valorInventario = useMemo(
    () => materiales.reduce((total, material) => total + material.stock * material.precioUnitario, 0),
    [materiales],
  );

  const criticos = materiales.filter((material) => material.estado === 'Crítico').length;
  const bajos = materiales.filter(
    (material) => material.estado === 'Bajo Stock' || material.estado === 'Medio',
  ).length;

  const codigoSugerido = materialEditando?.id || 'Se asigna al guardar';

  const estadoSugerido =
    formulario.cantidad === ''
      ? null
      : calcularEstadoStock(formulario.cantidad, formulario.stockMinimo, formulario.stockMedio);

  return (
    <PageShell>
      {(errorMateriales || errorCategorias) && (
        <p role="alert" className="mca-error">
          No se pudo cargar el inventario desde la API: {errorMateriales || errorCategorias}
        </p>
      )}
      {(cargandoMateriales || cargandoCategorias) && <p role="status">Cargando inventario desde la API...</p>}
      <PageHeader
        eyebrow="Inventario"
        title="Materiales"
        subtitle="Componentes eléctricos, existencias y valor del inventario sincronizados con cotizaciones y agenda."
        icon={PackageOpen}
        actions={
          <>
            <Button icon={FolderPlus} onClick={abrirCategoria}>
              Nueva categoría
            </Button>
            <Button variant="primary" icon={Plus} onClick={abrirNuevo}>
              Nuevo material
            </Button>
          </>
        }
      />

      <div className="mca-kpis">
        <KpiCard
          label="Referencias"
          value={materiales.length}
          hint={`${categorias.length} categorías registradas`}
          icon={Boxes}
          tone="yellow"
        />
        <KpiCard
          label="Valor del inventario"
          value={formatearMoneda(valorInventario, 'COP')}
          hint="Cantidad × precio unitario"
          icon={CircleDollarSign}
          tone="info"
        />
        <KpiCard
          label="Stock crítico"
          value={criticos}
          hint="Existencias en 0, la fila se pinta de rojo"
          icon={AlertTriangle}
          tone="danger"
        />
        <KpiCard
          label="Bajo stock"
          value={bajos}
          hint="Bajo el stock mínimo o en la franja media configuradas"
          icon={Layers}
          tone="warning"
        />
      </div>

      <Panel
        title="Inventario de materiales"
        subtitle={`${filtrados.length} de ${materiales.length} referencias`}
        actions={
          <>
            <SearchInput
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar por nombre, código o categoría..."
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
              aria-label="Filtrar por nivel de stock"
            >
              <option value="Todos">Todos los estados</option>
              {ESTADOS.inventario.map((estado) => (
                <option key={estado.nombre} value={estado.nombre}>
                  {estado.nombre}
                </option>
              ))}
            </select>
            <select
              className="mca-select"
              style={{ width: 145 }}
              value={filtroRegistro}
              onChange={(event) => setFiltroRegistro(event.target.value)}
              aria-label="Filtrar por registro activo o inactivo"
            >
              <option value="Todos">Activo e inactivo</option>
              {ESTADOS_REGISTRO.map((estado) => (
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
                <th>Código</th>
                <th>Material</th>
                <th>Categoría</th>
                <th>Unidad</th>
                <th className="is-number">Cantidad</th>
                <th className="is-number">Precio unit.</th>
                <th className="is-number">Valor</th>
                <th>Stock</th>
                <th>Estado</th>
                <th className="mca-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="mca-table__empty">
                    <EmptyState
                      icon={PackageOpen}
                      title="Sin materiales para mostrar"
                      message="Ajusta los filtros o registra un nuevo material en el inventario."
                      action={
                        <Button size="sm" icon={Plus} onClick={abrirNuevo}>
                          Nuevo material
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtrados.map((material) => (
                  <tr key={material.id} className={claseFilaMaterial(material)}>
                    <td
                      className="is-muted is-nowrap"
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                    >
                      {material.id}
                    </td>
                    <td className="is-primary">{material.nombre}</td>
                    <td>
                      <Badge tone="neutral">{material.categoria}</Badge>
                    </td>
                    <td className="is-muted">{material.unidad}</td>
                    <td className="is-number mca-strong">
                      {material.stock.toLocaleString('es-CO')}
                    </td>
                    <td className="is-number">
                      {formatearMoneda(material.precioUnitario, 'COP')}
                    </td>
                    <td className="is-number">
                      {formatearMoneda(material.stock * material.precioUnitario, 'COP')}
                    </td>
                    <td className="is-nowrap">
                      {/* La alerta ahora es el color de la fila completa, no una pastilla roja. */}
                      <div className="is-primary">{material.estado}</div>
                      <div className="mca-soft" style={{ fontSize: 10.5, marginTop: 2 }}>
                        mín. {material.stockMinimo} · medio {material.stockMedio}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`mca-estado mca-estado--${
                          material.estadoInventario === 'Activo' ? 'success' : 'danger'
                        }`}
                        style={{ width: 104 }}
                        title="Haz clic para activar o inactivar el material"
                        onClick={() => handleCambiarEstadoRegistro(material)}
                      >
                        {material.estadoInventario}
                      </button>
                    </td>
                    <td className="mca-center">
                      <AccionesFila
                        onVer={() => setMaterialDetalle(material)}
                        onEditar={() => abrirEditar(material)}
                        onEliminar={() => setMaterialEliminar(material)}
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
        title={materialEditando ? 'Editar material' : 'Nuevo material'}
        subtitle={
          materialEditando
            ? `Código ${materialEditando.id}`
            : 'El código, la unidad y el estado se completan automáticamente.'
        }
        icon={PackageOpen}
        footer={
          <>
            <Button onClick={cerrarFormulario}>Cancelar</Button>
            <Button
              variant="primary"
              type="submit"
              form="form-material"
              icon={materialEditando ? undefined : Plus}
            >
              {materialEditando ? 'Guardar cambios' : 'Registrar material'}
            </Button>
          </>
        }
      >
        <form id="form-material" onSubmit={handleGuardar} noValidate>
          <div className="mca-form-grid">
            <Field
              label="Nombre del material"
              required
              full
              error={errores.nombre}
              tooltip="Nombre comercial del elemento, con su referencia o calibre; es el que se ve en las cotizaciones."
            >
              <input
                className="mca-input"
                type="text"
                autoFocus
                placeholder="Ej: Cable XLPE 4C 25mm²"
                value={formulario.nombre}
                onChange={(event) => {
                  setFormulario((actual) => ({ ...actual, nombre: event.target.value }));
                  setErrores((actual) => ({ ...actual, nombre: '' }));
                }}
              />
            </Field>

            {/* Al crear no se muestra el código: se genera solo y aparece en el listado al guardar. */}
            {materialEditando && (
              <Field label="Código" hint="Se genera automáticamente según la categoría.">
                <input
                  className="mca-input"
                  type="text"
                  value={codigoSugerido}
                  disabled
                />
              </Field>
            )}

            <Field label="Categoría" required error={errores.categoria}>
              <div className="mca-input-group">
                <select
                  className="mca-select"
                  value={formulario.categoria}
                  onChange={(event) => {
                    cambiarCategoria(event.target.value);
                    setErrores((actual) => ({ ...actual, categoria: '' }));
                  }}
                >
                  {categorias.length === 0 && <option value="">Sin categorías</option>}
                  {categorias.map((categoria) => (
                    <option key={categoria.id || categoria.nombre} value={categoria.nombre}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
                <Button size="sm" icon={FolderPlus} onClick={abrirCategoria}>
                  Nueva
                </Button>
              </div>
            </Field>

            <Field
              label="Unidad de medida"
              hint="Se sugiere según la categoría y puedes ajustarla."
            >
              <select
                className="mca-select"
                value={formulario.unidad}
                onChange={(event) =>
                  setFormulario((actual) => ({ ...actual, unidad: event.target.value }))
                }
              >
                {UNIDADES_MEDIDA.map((unidad) => (
                  <option key={unidad} value={unidad}>
                    {unidad}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Cantidad" required error={errores.cantidad}>
              <input
                className="mca-input"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={formulario.cantidad}
                onChange={(event) => {
                  setFormulario((actual) => ({ ...actual, cantidad: event.target.value }));
                  setErrores((actual) => ({ ...actual, cantidad: '' }));
                }}
              />
            </Field>

            <Field
              label="Stock mínimo"
              error={errores.stockMinimo}
              hint="Define cuándo el material pasa a Bajo Stock."
              tooltip="Con esta cantidad o menos la fila se pinta de amarillo; en 0 se pinta de rojo."
            >
              <input
                className="mca-input"
                type="number"
                min="0"
                step="1"
                placeholder="10"
                value={formulario.stockMinimo}
                onChange={(event) => {
                  setFormulario((actual) => ({ ...actual, stockMinimo: event.target.value }));
                  setErrores((actual) => ({ ...actual, stockMinimo: '' }));
                }}
              />
            </Field>

            <Field
              label="Stock medio"
              error={errores.stockMedio}
              hint="Hasta esta cantidad el stock se marca como Medio."
              tooltip="Es el límite del buen stock: por encima de este número la fila queda gris normal."
            >
              <input
                className="mca-input"
                type="number"
                min="0"
                step="1"
                placeholder="20"
                value={formulario.stockMedio}
                onChange={(event) => {
                  setFormulario((actual) => ({ ...actual, stockMedio: event.target.value }));
                  setErrores((actual) => ({ ...actual, stockMedio: '' }));
                }}
              />
            </Field>

            <Field
              label="Precio unitario (COP)"
              error={errores.precioUnitario}
              hint="Si el material ya se usó en una cotización, la API conserva su precio."
            >
              <input
                className="mca-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={formulario.precioUnitario}
                onChange={(event) => {
                  setFormulario((actual) => ({ ...actual, precioUnitario: event.target.value }));
                  setErrores((actual) => ({ ...actual, precioUnitario: '' }));
                }}
              />
            </Field>

            <Field
              label="Estado del material"
              hint="Un material inactivo no se puede cotizar."
              tooltip="Activo o Inactivo lo decides tú; el color de la fila depende solo del stock."
            >
              <select
                className="mca-select"
                value={formulario.estadoInventario}
                onChange={(event) =>
                  setFormulario((actual) => ({ ...actual, estadoInventario: event.target.value }))
                }
              >
                {ESTADOS_REGISTRO.map((estado) => (
                  <option key={estado.nombre} value={estado.nombre}>
                    {estado.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <div className="mca-field mca-field--full">
              <span className="mca-label">Nivel de stock</span>
              <div className="mca-row">
                {estadoSugerido ? (
                  <Badge tone={TONO_ESTADO[estadoSugerido]}>{estadoSugerido}</Badge>
                ) : (
                  <Badge tone="neutral">Sin calcular</Badge>
                )}
                <span className="mca-hint">
                  Automático: 0 = Crítico (fila roja) · hasta el stock mínimo = Bajo Stock (fila amarilla) ·
                  hasta el stock medio = Medio (fila amarilla) · por encima = Óptimo (fila gris).
                </span>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={modalCategoria}
        onClose={() => setModalCategoria(false)}
        title="Nueva categoría"
        subtitle="Se agrega al inventario y define la unidad por defecto."
        icon={FolderPlus}
        size="sm"
        footer={
          <>
            <Button onClick={() => setModalCategoria(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" form="form-categoria">
              Crear categoría
            </Button>
          </>
        }
      >
        <form id="form-categoria" onSubmit={handleCrearCategoria} noValidate>
          <div className="mca-form-grid">
            <Field label="Nombre de la categoría" required full error={errorCategoria}>
              <input
                className="mca-input"
                type="text"
                autoFocus
                placeholder="Ej: Tableros eléctricos"
                value={nuevaCategoria.nombre}
                onChange={(event) => {
                  setNuevaCategoria((actual) => ({ ...actual, nombre: event.target.value }));
                  setErrorCategoria('');
                }}
              />
            </Field>
            <Field
              label="Unidad por defecto"
              full
              hint="Al seleccionar esta categoría en un material, la unidad se asigna automáticamente."
            >
              <select
                className="mca-select"
                value={nuevaCategoria.unidad}
                onChange={(event) =>
                  setNuevaCategoria((actual) => ({ ...actual, unidad: event.target.value }))
                }
              >
                {UNIDADES_MEDIDA.map((unidad) => (
                  <option key={unidad} value={unidad}>
                    {unidad}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(materialDetalle)}
        onClose={() => setMaterialDetalle(null)}
        title={materialDetalle?.nombre || 'Detalle del material'}
        subtitle={materialDetalle ? `Código ${materialDetalle.id}` : ''}
        icon={PackageOpen}
        footer={
          <>
            <Button onClick={() => setMaterialDetalle(null)}>Cerrar</Button>
            <Button
              variant="primary"
              onClick={() => {
                const material = materialDetalle;
                setMaterialDetalle(null);
                abrirEditar(material);
              }}
            >
              Editar material
            </Button>
          </>
        }
      >
        {materialDetalle && (
          <div className="mca-stack">
            <div className="mca-row">
              <Badge tone={TONO_ESTADO[materialDetalle.estado] || 'neutral'}>
                Stock {materialDetalle.estado}
              </Badge>
              <Badge tone="neutral">{materialDetalle.categoria}</Badge>
              <Badge tone={materialDetalle.estadoInventario === 'Activo' ? 'success' : 'danger'}>
                Estado {materialDetalle.estadoInventario}
              </Badge>
            </div>

            <DetailGrid>
              <DetailItem label="Código">{materialDetalle.id}</DetailItem>
              <DetailItem label="Categoría">{materialDetalle.categoria}</DetailItem>
              <DetailItem label="Cantidad">
                {materialDetalle.stock.toLocaleString('es-CO')} {materialDetalle.unidad.toLowerCase()}
              </DetailItem>
              <DetailItem label="Stock mínimo">
                {Number(materialDetalle.stockMinimo ?? 10).toLocaleString('es-CO')}
              </DetailItem>
              <DetailItem label="Stock medio">
                {Number(materialDetalle.stockMedio ?? 20).toLocaleString('es-CO')}
              </DetailItem>
              <DetailItem label="Unidad de medida">{materialDetalle.unidad}</DetailItem>
              <DetailItem label="Precio unitario">
                {formatearMoneda(materialDetalle.precioUnitario, 'COP')}
              </DetailItem>
              <DetailItem label="Valor en inventario">
                {formatearMoneda(
                  materialDetalle.stock * materialDetalle.precioUnitario,
                  'COP',
                )}
              </DetailItem>
              <DetailItem label="Nivel de stock">{materialDetalle.estado}</DetailItem>
              <DetailItem label="Estado">
                <button
                  type="button"
                  className={`mca-estado mca-estado--${
                    materialDetalle.estadoInventario === 'Activo' ? 'success' : 'danger'
                  }`}
                  style={{ width: 104 }}
                  title="Haz clic para activar o inactivar el material"
                  onClick={() => handleCambiarEstadoRegistro(materialDetalle)}
                >
                  {materialDetalle.estadoInventario}
                </button>
              </DetailItem>
              <DetailItem label="Última actualización">
                {materialDetalle.actualizadoEn
                  ? formatearFecha(materialDetalle.actualizadoEn)
                  : 'Sin cambios registrados'}
              </DetailItem>
            </DetailGrid>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(materialEliminar)}
        title="Eliminar material"
        message={
          materialEliminar
            ? `Se eliminará "${materialEliminar.nombre}" (${materialEliminar.id}) del inventario.`
            : ''
        }
        onCancel={() => setMaterialEliminar(null)}
        onConfirm={confirmarEliminar}
      />

      <Toast toast={toast} onClose={close} />
    </PageShell>
  );
}

export default Materiales;
