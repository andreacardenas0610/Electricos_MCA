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
import { formatearFecha, formatearMoneda, useData } from '../../../shared/services/base.js';
import {
  UNIDADES_MEDIDA,
  unidadSugeridaPorCategoria,
} from '../../../shared/services/catalogos.js';
import {
  CATEGORIAS_MATERIALES_KEY,
  MATERIALES_KEY,
  calcularEstadoStock,
  crearCategoria,
  eliminarMaterial,
  generarCodigoMaterial,
  guardarMaterial,
  obtenerCategorias,
  obtenerMateriales,
} from '../../../shared/services/materialesService.js';

const TONO_ESTADO = {
  Óptimo: 'success',
  'Bajo Stock': 'warning',
  Crítico: 'danger',
};

const FORMULARIO_VACIO = {
  nombre: '',
  categoria: '',
  unidad: 'Unidad',
  cantidad: '',
  precioUnitario: '',
};

export function Materiales() {
  const materiales = useData(
    [MATERIALES_KEY, CATEGORIAS_MATERIALES_KEY],
    obtenerMateriales,
  );
  const categorias = useData([CATEGORIAS_MATERIALES_KEY], obtenerCategorias);

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

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
      precioUnitario: String(material.precioUnitario ?? ''),
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

  const handleGuardar = (event) => {
    event.preventDefault();

    const nuevosErrores = {};
    const cantidad = Number(formulario.cantidad);
    const precio = Number(formulario.precioUnitario);

    if (!formulario.nombre.trim()) nuevosErrores.nombre = 'Escribe el nombre del material.';
    if (!formulario.categoria) nuevosErrores.categoria = 'Selecciona o crea una categoría.';
    if (formulario.cantidad === '' || !Number.isFinite(cantidad) || cantidad < 0) {
      nuevosErrores.cantidad = 'Ingresa una cantidad válida.';
    }
    if (formulario.precioUnitario !== '' && (!Number.isFinite(precio) || precio < 0)) {
      nuevosErrores.precioUnitario = 'Ingresa un precio válido.';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      const guardado = guardarMaterial(
        {
          nombre: formulario.nombre,
          categoria: formulario.categoria,
          unidad: formulario.unidad,
          stock: cantidad,
          precioUnitario: Number.isFinite(precio) ? precio : 0,
        },
        materialEditando?.id,
      );

      notify(
        'success',
        materialEditando ? 'Material actualizado' : 'Material registrado',
        `${guardado.nombre} · ${guardado.id} · Estado ${guardado.estado}.`,
      );
      cerrarFormulario();
    } catch (error) {
      notify('error', 'No se pudo guardar el material', error.message);
    }
  };

  const handleCrearCategoria = (event) => {
    event.preventDefault();

    try {
      const categoria = crearCategoria(nuevaCategoria);
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
    }
  };

  const confirmarEliminar = () => {
    if (!materialEliminar) return;

    try {
      eliminarMaterial(materialEliminar.id);
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
        (filtroEstado === 'Todos' || material.estado === filtroEstado)
      );
    });
  }, [materiales, busqueda, filtroCategoria, filtroEstado]);

  const valorInventario = useMemo(
    () => materiales.reduce((total, material) => total + material.stock * material.precioUnitario, 0),
    [materiales],
  );

  const criticos = materiales.filter((material) => material.estado === 'Crítico').length;
  const bajos = materiales.filter((material) => material.estado === 'Bajo Stock').length;

  const codigoSugerido = useMemo(() => {
    if (materialEditando) return materialEditando.id;
    if (!formulario.categoria) return '—';
    return generarCodigoMaterial(formulario.categoria);
  }, [materialEditando, formulario.categoria, materiales]);

  const estadoSugerido =
    formulario.cantidad === '' ? null : calcularEstadoStock(formulario.cantidad);

  return (
    <PageShell>
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
          hint="Sin existencias disponibles"
          icon={AlertTriangle}
          tone="danger"
        />
        <KpiCard
          label="Bajo stock"
          value={bajos}
          hint="10 unidades o menos"
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
              aria-label="Filtrar por estado"
            >
              <option value="Todos">Todos los estados</option>
              {ESTADOS.inventario.map((estado) => (
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
                <th>Estado</th>
                <th className="mca-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="mca-table__empty">
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
                  <tr key={material.id}>
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
                    <td>
                      <EstadoToggle
                        estado={material.estado}
                        estados={ESTADOS.inventario}
                        width={118}
                      />
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

            <Field label="Código" hint="Se genera automáticamente según la categoría.">
              <input
                className="mca-input"
                type="text"
                value={codigoSugerido}
                disabled
              />
            </Field>

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

            <Field label="Precio unitario (COP)" error={errores.precioUnitario}>
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

            <div className="mca-field mca-field--full">
              <span className="mca-label">Estado del inventario</span>
              <div className="mca-row">
                {estadoSugerido ? (
                  <Badge tone={TONO_ESTADO[estadoSugerido]}>{estadoSugerido}</Badge>
                ) : (
                  <Badge tone="neutral">Sin calcular</Badge>
                )}
                <span className="mca-hint">
                  Automático: 0 = Crítico · 1 a 10 = Bajo stock · más de 10 = Óptimo.
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
              <EstadoToggle
                estado={materialDetalle.estado}
                estados={ESTADOS.inventario}
                width={125}
              />
              <Badge tone="neutral">{materialDetalle.categoria}</Badge>
            </div>

            <DetailGrid>
              <DetailItem label="Código">{materialDetalle.id}</DetailItem>
              <DetailItem label="Categoría">{materialDetalle.categoria}</DetailItem>
              <DetailItem label="Cantidad">
                {materialDetalle.stock.toLocaleString('es-CO')} {materialDetalle.unidad.toLowerCase()}
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
              <DetailItem label="Estado">{materialDetalle.estado}</DetailItem>
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
