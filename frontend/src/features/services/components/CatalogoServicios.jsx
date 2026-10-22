import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  PauseCircle,
  Plus,
  Tags,
  Wrench,
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
import { formatearFecha, formatearMoneda } from '../../../shared/services/base.js';
import {
  CATEGORIAS_SERVICIO,
  MONEDAS_SERVICIO,
  UNIDADES_SERVICIO,
  reglaTiempoMoneda,
} from '../../../shared/services/catalogos.js';

const FORMULARIO_VACIO = {
  nombre: '',
  categoria: 'Instalación',
  desc: '',
  unidad: 'Servicio',
  moneda: 'COP',
  precioNumerico: '',
};

const esMonedaUSD = (moneda) => String(moneda).toUpperCase().startsWith('USD');

const formatearPrecioServicio = (servicio) =>
  `${formatearMoneda(
    servicio.precioNumerico,
    esMonedaUSD(servicio.moneda) ? 'USD' : 'COP',
    esMonedaUSD(servicio.moneda) ? 2 : 0,
  )}${String(servicio.moneda).includes('/ H') ? ' / h' : ''}`;

export function CatalogoServicios() {
  const {
    data: servicios,
    error,
    loading,
    reload: cargarServicios,
  } = useApiData(() => apiRequest('/servicios'), []);

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  const [modalFormulario, setModalFormulario] = useState(false);
  const [servicioEditando, setServicioEditando] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});

  const [servicioDetalle, setServicioDetalle] = useState(null);
  const [servicioEliminar, setServicioEliminar] = useState(null);

  const { toast, notify, close } = useToast();

  const abrirNuevo = () => {
    setServicioEditando(null);
    setErrores({});
    setFormulario(FORMULARIO_VACIO);
    setModalFormulario(true);
  };

  const abrirEditar = (servicio) => {
    setServicioEditando(servicio);
    setErrores({});
    setFormulario({
      nombre: servicio.nombre,
      categoria: servicio.categoria,
      desc: servicio.desc,
      unidad: servicio.unidad,
      moneda: servicio.moneda,
      precioNumerico: String(servicio.precioNumerico ?? ''),
    });
    setModalFormulario(true);
  };

  const cerrarFormulario = () => {
    setModalFormulario(false);
    setServicioEditando(null);
    setErrores({});
  };

  const handleGuardar = async (event) => {
    event.preventDefault();

    const nuevosErrores = {};
    const precio = Number(formulario.precioNumerico);

    if (!formulario.nombre.trim()) nuevosErrores.nombre = 'Escribe el nombre del servicio.';
    if (formulario.precioNumerico === '' || !Number.isFinite(precio) || precio < 0) {
      nuevosErrores.precioNumerico = 'Ingresa un precio válido.';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
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
          },
        },
      );

      await cargarServicios();
      notify(
        'success',
        servicioEditando ? 'Servicio actualizado' : 'Servicio registrado',
        `${guardado.nombre} · ${guardado.codigo} · ${guardado.tiempo} estimado.`,
      );
      cerrarFormulario();
    } catch (error) {
      notify('error', 'No se pudo guardar el servicio', error.message);
    }
  };

  const handleCambiarEstado = async (servicio) => {
    try {
      const actualizado = await apiRequest(`/servicios/${encodeURIComponent(servicio.id)}/estado`, {
        method: 'PATCH',
        body: { estado: servicio.estado === 'Activo' ? 'Pausado' : 'Activo' },
      });
      await cargarServicios();
      notify(
        'info',
        'Estado actualizado',
        `${actualizado.nombre} ahora está ${actualizado.estado.toLowerCase()}.`,
      );
    } catch (error) {
      notify('error', 'No se pudo cambiar el estado', error.message);
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
    } catch (error) {
      notify('error', 'No se pudo eliminar', error.message);
    } finally {
      setServicioEliminar(null);
    }
  };

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return servicios.filter((servicio) => {
      const coincideTexto =
        !termino ||
        [servicio.nombre, servicio.codigo, servicio.categoria, servicio.desc].some((valor) =>
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
  const pausados = servicios.length - activos;
  const categoriasUsadas = new Set(servicios.map((servicio) => servicio.categoria)).size;

  const regla = reglaTiempoMoneda(formulario.moneda);
  const codigoSugerido = servicioEditando?.codigo || 'Se asigna al guardar';

  return (
    <PageShell>
      {error && <p role="alert" style={{ color: '#b91c1c' }}>No se pudo cargar el catálogo desde la API: {error}</p>}
      {loading && <p role="status">Cargando servicios desde la API...</p>}
      <PageHeader
        eyebrow="Servicios"
        title="Catálogo de servicios"
        subtitle="Tarifas y tiempos estimados que alimentan automáticamente las cotizaciones y la agenda."
        icon={Wrench}
        actions={
          <Button variant="primary" icon={Plus} onClick={abrirNuevo}>
            Nuevo servicio
          </Button>
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
          hint="Ocultos en nuevas cotizaciones"
          icon={PauseCircle}
          tone="warning"
        />
        <KpiCard
          label="Categorías"
          value={categoriasUsadas}
          hint={`${CATEGORIAS_SERVICIO.length} categorías configuradas`}
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
              {CATEGORIAS_SERVICIO.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
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
                <th>Código</th>
                <th>Servicio</th>
                <th>Categoría</th>
                <th>Unidad</th>
                <th className="is-number">Precio</th>
                <th>Tiempo estimado</th>
                <th>Estado</th>
                <th className="mca-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="mca-table__empty">
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
                filtrados.map((servicio) => (
                  <tr key={servicio.id}>
                    <td
                      className="is-muted is-nowrap"
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                    >
                      {servicio.codigo}
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
                        <span className="is-nowrap">{servicio.tiempo}</span>
                      </div>
                    </td>
                    <td>
                      <EstadoToggle
                        estado={servicio.estado}
                        estados={ESTADOS.servicio}
                        width={108}
                        onClick={() => handleCambiarEstado(servicio)}
                      />
                    </td>
                    <td className="mca-center">
                      <AccionesFila
                        onVer={() => setServicioDetalle(servicio)}
                        onEditar={() => abrirEditar(servicio)}
                        onEliminar={() => setServicioEliminar(servicio)}
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
        title={servicioEditando ? 'Editar servicio' : 'Nuevo servicio'}
        subtitle={
          servicioEditando
            ? `Código ${servicioEditando.codigo}`
            : 'El código y el tiempo estimado se calculan automáticamente.'
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

            <Field label="Código" hint="Se asigna de forma consecutiva.">
              <input className="mca-input" type="text" value={codigoSugerido} disabled />
            </Field>

            <Field label="Categoría">
              <select
                className="mca-select"
                value={formulario.categoria}
                onChange={(event) =>
                  setFormulario((actual) => ({ ...actual, categoria: event.target.value }))
                }
              >
                {CATEGORIAS_SERVICIO.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
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
                onChange={(event) =>
                  setFormulario((actual) => ({ ...actual, moneda: event.target.value }))
                }
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

            <Field
              label="Tiempo estimado"
              hint="Se actualiza automáticamente al cambiar la moneda."
            >
              <input className="mca-input" type="text" value={regla.texto} disabled />
            </Field>

            <div className="mca-field mca-field--full">
              <div className="mca-notice is-info">
                <Clock size={15} strokeWidth={2} />
                <span>
                  <strong>Regla de negocio:</strong> la moneda <strong>{formulario.moneda}</strong>{' '}
                  asigna un tiempo estimado de <strong>{regla.texto}</strong> ({regla.horas} horas).
                  Este tiempo se usará al agendar el servicio.
                </span>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(servicioDetalle)}
        onClose={() => setServicioDetalle(null)}
        title={servicioDetalle?.nombre || 'Detalle del servicio'}
        subtitle={servicioDetalle ? `Código ${servicioDetalle.codigo}` : ''}
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
              <DetailItem label="Código">{servicioDetalle.codigo}</DetailItem>
              <DetailItem label="Categoría">{servicioDetalle.categoria}</DetailItem>
              <DetailItem label="Unidad de cobro">{servicioDetalle.unidad}</DetailItem>
              <DetailItem label="Moneda">{servicioDetalle.moneda}</DetailItem>
              <DetailItem label="Precio">
                {formatearPrecioServicio(servicioDetalle)}
              </DetailItem>
              <DetailItem label="Tiempo estimado">
                {servicioDetalle.tiempo} ({servicioDetalle.horas} h)
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
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(servicioEliminar)}
        title="Eliminar servicio"
        message={
          servicioEliminar
            ? `Se eliminará "${servicioEliminar.nombre}" (${servicioEliminar.codigo}) del catálogo. Las cotizaciones existentes conservarán su copia.`
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
