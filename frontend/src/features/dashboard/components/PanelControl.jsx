import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Gauge,
  Handshake,
  PackageOpen,
  Plus,
  ReceiptText,
  UsersRound,
  Wallet,
  Wrench,
} from 'lucide-react';

import { AccionesFila } from '../../../shared/components/AccionesFila.jsx';
import { apiRequest } from '../../../shared/api.js';
import { useApiData } from '../../../shared/useApiData.js';
import { EstadoToggle, ESTADOS } from '../../../shared/components/EstadoToggle.jsx';
import {
  Badge,
  Button,
  DetailGrid,
  DetailItem,
  EmptyState,
  KpiCard,
  Modal,
  PageHeader,
  PageShell,
  Panel,
  Toast,
  useToast,
} from '../../../shared/components/ui.jsx';
import {
  fechaISO,
  formatearFecha,
  formatearMoneda,
} from '../../../shared/services/base.js';
import { formatearHora12 } from '../../../shared/services/catalogos.js';
import {
  estadoSiguienteAgenda,
  resumenAgenda,
  validarAgendaCompleta,
} from '../../../shared/services/agendaService.js';
import { normalizarCliente } from '../../../shared/services/clientesService.js';
import {
  cotizacionVencida,
  fechaVencimiento,
  normalizarCotizacion,
  resumenCotizaciones,
} from '../../../shared/services/cotizacionesService.js';
import { normalizarMaterial } from '../../../shared/services/materialesService.js';
import {
  resumenPagos,
} from '../../../shared/services/pagosService.js';
import { normalizarServicio } from '../../../shared/services/serviciosService.js';
import { normalizarTecnico } from '../../../shared/services/tercerosService.js';
import { claseFilaEstado } from '../../../shared/utils/estadosFila.js';

const ESTADOS_ACTIVOS = ['Programada', 'En proceso'];

const valorCompacto = (valor) => {
  const numero = Number(valor) || 0;
  if (numero >= 1000000) return `$${(numero / 1000000).toFixed(1).replace('.', ',')}M`;
  if (numero >= 1000) return `$${Math.round(numero / 1000)}k`;
  return numero > 0 ? `$${numero}` : '—';
};

export function PanelControl({ onNavegar }) {
  const {
    data: datos,
    error,
    loading,
    reload: cargarDatos,
  } = useApiData(async () => {
    const [cotizaciones, cuentas, pagos, actividades, materiales, servicios, clientes, terceros] = await Promise.all([
      apiRequest('/cotizaciones'),
      apiRequest('/pagos/cuentas'),
      apiRequest('/pagos'),
      apiRequest('/agenda'),
      apiRequest('/materiales'),
      apiRequest('/servicios'),
      apiRequest('/clientes'),
      apiRequest('/terceros'),
    ]);
    return {
      cotizaciones: cotizaciones.map(normalizarCotizacion),
      cuentas,
      pagos,
      actividades,
      materiales: materiales.map(normalizarMaterial),
      servicios: servicios.map(normalizarServicio),
      clientes: clientes.map(normalizarCliente),
      tecnicos: terceros.map(normalizarTecnico).filter((tecnico) => tecnico.estado !== 'Inactivo'),
      incidencias: validarAgendaCompleta(actividades),
    };
  }, {
    cotizaciones: [],
    cuentas: [],
    pagos: [],
    actividades: [],
    materiales: [],
    servicios: [],
    clientes: [],
    tecnicos: [],
    incidencias: [],
  });

  const [rangoMeses, setRangoMeses] = useState(6);
  const [detalleId, setDetalleId] = useState(null);
  const { toast, notify, close } = useToast();

  const navegar = (seccion) => {
    if (typeof onNavegar === 'function') onNavegar(seccion);
  };

  const cuentasActivas = useMemo(
    () => datos.cuentas.filter((cuenta) => !cuenta.esHistorica),
    [datos.cuentas],
  );
  const resumenCobro = useMemo(() => resumenPagos(cuentasActivas), [cuentasActivas]);
  const resumenCot = useMemo(
    () => resumenCotizaciones(datos.cotizaciones),
    [datos.cotizaciones],
  );
  const resumenAg = useMemo(() => resumenAgenda(datos.actividades), [datos.actividades]);

  const hoy = fechaISO();
  const agendaHoy = useMemo(
    () => datos.actividades.filter(
      (actividad) => actividad.fecha === hoy && ESTADOS_ACTIVOS.includes(actividad.estado),
    ),
    [datos.actividades, hoy],
  );
  const proximas = useMemo(
    () => datos.actividades
      .filter(
        (actividad) => actividad.fecha >= hoy && ESTADOS_ACTIVOS.includes(actividad.estado),
      )
      .sort((a, b) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`))
      .slice(0, 5),
    [datos.actividades, hoy],
  );

  const pendientes = useMemo(
    () => datos.cotizaciones.filter((cotizacion) => cotizacion.estadoCotizacion === 'Pendiente'),
    [datos.cotizaciones],
  );
  const valorPendiente = useMemo(
    () => pendientes.reduce((total, cotizacion) => total + cotizacion.total, 0),
    [pendientes],
  );
  const stockCritico = useMemo(
    () => datos.materiales
      .filter((material) => material.estado !== 'Óptimo')
      .sort((a, b) => a.stock - b.stock),
    [datos.materiales],
  );

  const cuentasConSaldo = cuentasActivas.filter((cuenta) => cuenta.saldo > 0).length;
  const serviciosActivos = datos.servicios.filter((servicio) => servicio.estado === 'Activo').length;
  const clientesActivos = datos.clientes.filter((cliente) => cliente.estado !== 'Inactivo').length;
  const totalAlertas = datos.incidencias.length + stockCritico.length;
  const porcentajeRecaudo = resumenCobro.facturado > 0
    ? Math.min(100, Math.round((resumenCobro.abonado / resumenCobro.facturado) * 100))
    : 0;

  const meses = useMemo(() => {
    const ahora = new Date();
    return Array.from({ length: rangoMeses }, (_, indice) => {
      const fecha = new Date(
        ahora.getFullYear(),
        ahora.getMonth() - (rangoMeses - 1 - indice),
        1,
      );
      const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const total = datos.pagos.reduce(
        (suma, pago) => (
          String(pago.fecha).slice(0, 7) === clave ? suma + pago.monto : suma
        ),
        0,
      );
      return {
        clave,
        etiqueta: fecha.toLocaleDateString('es-CO', { month: 'short' }).replace('.', ''),
        anio: fecha.getFullYear(),
        total,
      };
    });
  }, [datos.pagos, rangoMeses]);

  const totalPeriodo = meses.reduce((total, mes) => total + mes.total, 0);
  const clavesPeriodo = new Set(meses.map((mes) => mes.clave));
  const abonosPeriodo = datos.pagos.filter(
    (pago) => clavesPeriodo.has(String(pago.fecha).slice(0, 7)),
  ).length;
  const maxRecaudo = Math.max(...meses.map((mes) => mes.total), 1);
  const mesActual = meses[meses.length - 1]?.clave;

  const actividadDetalle = datos.actividades.find(
    (actividad) => String(actividad.id) === String(detalleId),
  );

  const cambiarEstado = async (actividad) => {
    try {
      const actualizada = await apiRequest(`/agenda/${encodeURIComponent(actividad.id)}/estado`, {
        method: 'PATCH',
        body: { estado: estadoSiguienteAgenda(actividad.estado) },
      });
      await cargarDatos();
      notify('success', 'Estado actualizado', `${actualizada.codigo} · ${actualizada.estado}.`);
    } catch (error) {
      notify('error', 'No se pudo actualizar', error.message);
    }
  };

  return (
    <PageShell>
      {error && <p role="alert" style={{ color: '#b91c1c' }}>No se pudo cargar el panel desde la API: {error}</p>}
      {loading && <p role="status">Cargando resumen desde la API...</p>}
      <PageHeader
        eyebrow="Panel de Control"
        title="Panel de Control"
        subtitle="Resumen consolidado de agenda, cotizaciones, inventario y recaudo en tiempo real."
        icon={Gauge}
        actions={
          <>
            <Button icon={CalendarDays} onClick={() => navegar('programacion')}>
              Ver agenda
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => navegar('Cotizacion')}>
              Nueva cotización
            </Button>
          </>
        }
      />

      <div className="mca-kpis">
        <KpiCard
          label="Facturación aprobada"
          value={formatearMoneda(resumenCobro.facturado, 'COP')}
          hint={`${resumenCot.aprobadas} cotizaciones · ${resumenCobro.liquidadas} liquidadas`}
          icon={ReceiptText}
          tone="info"
        />
        <KpiCard
          label="Recaudado"
          value={formatearMoneda(resumenCobro.abonado, 'COP')}
          hint={`${abonosPeriodo} abonos en los últimos ${rangoMeses} meses`}
          icon={Wallet}
          tone="success"
        />
        <KpiCard
          label="Saldo por cobrar"
          value={formatearMoneda(resumenCobro.saldo, 'COP')}
          hint={`${cuentasConSaldo} cuentas con saldo pendiente`}
          icon={Clock3}
          tone="warning"
        />
        <KpiCard
          label="Servicios activos"
          value={resumenAg.programadas + resumenAg.proceso}
          hint={`${agendaHoy.length} hoy · ${totalAlertas} alertas operativas`}
          icon={CalendarCheck}
          tone={totalAlertas > 0 ? 'danger' : 'yellow'}
        />
      </div>

      <div className="mca-dashboard-grid">
        <div className="mca-stack">
          <Panel
            title="Recaudo por mes"
            subtitle={`Abonos recibidos en los últimos ${rangoMeses} meses`}
            actions={
              <div className="mca-row" style={{ gap: 6 }}>
                <Button
                  size="sm"
                  variant={rangoMeses === 6 ? 'primary' : 'ghost'}
                  onClick={() => setRangoMeses(6)}
                >
                  6M
                </Button>
                <Button
                  size="sm"
                  variant={rangoMeses === 12 ? 'primary' : 'ghost'}
                  onClick={() => setRangoMeses(12)}
                >
                  12M
                </Button>
              </div>
            }
          >
            <div className="mca-row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div className="mca-chart-caption">Recaudado en el periodo</div>
                <div className="mca-chart-total">{formatearMoneda(totalPeriodo, 'COP')}</div>
                <div className="mca-soft" style={{ fontSize: 11, marginTop: 2 }}>
                  {abonosPeriodo} abonos registrados
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Badge tone="success">{porcentajeRecaudo}% recaudado</Badge>
                <div className="mca-progress" style={{ width: 150, marginTop: 8 }}>
                  <div className="mca-progress__bar" style={{ width: `${porcentajeRecaudo}%` }} />
                </div>
                <div className="mca-soft" style={{ fontSize: 10, marginTop: 4 }}>
                  {formatearMoneda(resumenCobro.saldo, 'COP')} por cobrar
                </div>
              </div>
            </div>

            <div className="mca-chart" role="img" aria-label="Recaudo mensual">
              {meses.map((mes) => (
                <div
                  key={mes.clave}
                  className={`mca-chart__col ${mes.clave === mesActual ? 'is-current' : ''}`}
                  title={`${mes.etiqueta} ${mes.anio}: ${formatearMoneda(mes.total, 'COP')}`}
                >
                  <span className="mca-chart__value">{valorCompacto(mes.total)}</span>
                  <div className="mca-chart__plot">
                    <div
                      className="mca-chart__bar"
                      style={{ height: `${Math.max(3, Math.round((mes.total / maxRecaudo) * 100))}%` }}
                    />
                  </div>
                  <span className="mca-chart__label">{mes.etiqueta}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Próximos servicios"
            subtitle={`${agendaHoy.length} para hoy · margen de 30 min entre servicios del mismo técnico`}
            actions={
              <Button
                variant="ghost"
                size="sm"
                icon={CalendarDays}
                onClick={() => navegar('programacion')}
              >
                Ver agenda
              </Button>
            }
            flush
          >
            {proximas.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="Sin servicios próximos"
                message="Agenda un servicio para verlo reflejado en el panel."
                action={
                  <Button size="sm" icon={Plus} onClick={() => navegar('programacion')}>
                    Agendar servicio
                  </Button>
                }
              />
            ) : (
              <div className="mca-table-wrap">
                <table className="mca-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Cliente / Servicio</th>
                      <th>Fecha</th>
                      <th>Técnico</th>
                      <th>Estado</th>
                      <th className="mca-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proximas.map((actividad) => (
                      <tr key={actividad.id} className={claseFilaEstado(actividad.estado, 'actividad')}>
                        <td className="is-nowrap">
                          <Badge tone="yellow">{actividad.codigo}</Badge>
                        </td>
                        <td>
                          <div className="is-primary">{actividad.cliente}</div>
                          <div className="mca-soft" style={{ fontSize: 11, marginTop: 2 }}>
                            {actividad.servicio}
                          </div>
                        </td>
                        <td className="is-nowrap">
                          <div className="is-primary" style={{ fontSize: 12 }}>
                            {formatearFecha(actividad.fecha)}
                          </div>
                          <div className="mca-soft" style={{ fontSize: 11, marginTop: 2 }}>
                            {formatearHora12(actividad.horaInicio)} – {formatearHora12(actividad.horaFin)}
                          </div>
                        </td>
                        <td>{actividad.tecnico}</td>
                        <td>
                          <EstadoToggle
                            estado={actividad.estado}
                            estados={ESTADOS.actividad}
                            width={112}
                            onClick={() => cambiarEstado(actividad)}
                          />
                        </td>
                        <td className="mca-center">
                          <div className="mca-row" style={{ justifyContent: 'center', flexWrap: 'nowrap' }}>
                            <AccionesFila
                              onVer={() => setDetalleId(actividad.id)}
                              onEditar={() => navegar('programacion')}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <div className="mca-stack">
          <Panel
            title="Cotizaciones por aprobar"
            subtitle="Pipeline esperando decisión del cliente"
            actions={<Badge tone={pendientes.length ? 'warning' : 'success'}>{pendientes.length}</Badge>}
          >
            <div className="mca-row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div className="mca-chart-caption">Valor potencial</div>
                <div className="mca-chart-total" style={{ fontSize: 24 }}>
                  {formatearMoneda(valorPendiente, 'COP')}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navegar('Cotizacion')}>
                Revisar
              </Button>
            </div>

            {pendientes.length === 0 ? (
              <div className="mca-notice is-success" style={{ marginTop: 14 }}>
                <CheckCircle2 size={16} strokeWidth={2} />
                <div>No hay cotizaciones pendientes de aprobación.</div>
              </div>
            ) : (
              <div className="mca-list" style={{ marginTop: 12 }}>
                {pendientes.slice(0, 4).map((cotizacion) => (
                  <button
                    key={cotizacion.id}
                    type="button"
                    className="mca-list__item mca-list__item--button"
                    onClick={() => navegar('Cotizacion')}
                  >
                    <div className="mca-list__icon">
                      <FileText size={16} strokeWidth={1.9} />
                    </div>
                    <div className="mca-list__body">
                      <div className="mca-list__title">{cotizacion.cliente}</div>
                      <div className="mca-list__meta">
                        {cotizacion.id} · {cotizacion.proyecto}
                      </div>
                    </div>
                    <div className="mca-list__value">
                      <div className="mca-list__amount">
                        {formatearMoneda(cotizacion.total, 'COP')}
                      </div>
                      <div className="mca-list__hint">
                        {cotizacionVencida(cotizacion)
                          ? <span className="mca-danger">Vencida</span>
                          : `Vence ${formatearFecha(fechaVencimiento(cotizacion))}`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Alertas de operación"
            subtitle="Puntos que requieren atención"
            actions={<Badge tone={totalAlertas ? 'danger' : 'success'}>{totalAlertas}</Badge>}
          >
            {totalAlertas === 0 ? (
              <div className="mca-notice is-success">
                <CheckCircle2 size={16} strokeWidth={2} />
                <div>Sin incidencias de agenda ni materiales en nivel crítico.</div>
              </div>
            ) : (
              <div className="mca-stack" style={{ gap: 10 }}>
                {datos.incidencias.slice(0, 2).map((incidencia, indice) => (
                  <div
                    key={`${incidencia.codigo}-${indice}`}
                    className={`mca-notice is-${incidencia.severidad === 'error' ? 'danger' : 'warning'}`}
                  >
                    <AlertTriangle size={16} strokeWidth={2} />
                    <div>
                      <strong>{incidencia.codigo}</strong> · {incidencia.mensaje}
                    </div>
                  </div>
                ))}
                {stockCritico.slice(0, 2).map((material) => (
                  <div key={material.id} className="mca-notice is-warning">
                    <PackageOpen size={16} strokeWidth={2} />
                    <div>
                      <strong>{material.nombre}</strong> · {material.stock} {material.unidad.toLowerCase()} en
                      inventario ({material.estado}).
                    </div>
                  </div>
                ))}
                <div className="mca-row" style={{ gap: 6 }}>
                  {datos.incidencias.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => navegar('programacion')}>
                      Revisar agenda
                    </Button>
                  )}
                  {stockCritico.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => navegar('materiales')}>
                      Ver inventario
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Resumen general" subtitle="Datos maestros conectados">
            <div className="mca-list">
              <button
                type="button"
                className="mca-list__item mca-list__item--button"
                onClick={() => navegar('clientes')}
              >
                <div className="mca-list__icon"><UsersRound size={16} strokeWidth={1.9} /></div>
                <div className="mca-list__body">
                  <div className="mca-list__title">Clientes registrados</div>
                  <div className="mca-list__meta">{clientesActivos} activos</div>
                </div>
                <div className="mca-list__value">
                  <div className="mca-list__amount">{datos.clientes.length}</div>
                </div>
              </button>
              <button
                type="button"
                className="mca-list__item mca-list__item--button"
                onClick={() => navegar('servicios')}
              >
                <div className="mca-list__icon"><Wrench size={16} strokeWidth={1.9} /></div>
                <div className="mca-list__body">
                  <div className="mca-list__title">Servicios en catálogo</div>
                  <div className="mca-list__meta">{serviciosActivos} activos</div>
                </div>
                <div className="mca-list__value">
                  <div className="mca-list__amount">{datos.servicios.length}</div>
                </div>
              </button>
              <button
                type="button"
                className="mca-list__item mca-list__item--button"
                onClick={() => navegar('materiales')}
              >
                <div className="mca-list__icon"><PackageOpen size={16} strokeWidth={1.9} /></div>
                <div className="mca-list__body">
                  <div className="mca-list__title">Materiales</div>
                  <div className="mca-list__meta">
                    {stockCritico.length} requieren reposición
                  </div>
                </div>
                <div className="mca-list__value">
                  <div className="mca-list__amount">{datos.materiales.length}</div>
                </div>
              </button>
              <button
                type="button"
                className="mca-list__item mca-list__item--button"
                onClick={() => navegar('terceros')}
              >
                <div className="mca-list__icon"><Handshake size={16} strokeWidth={1.9} /></div>
                <div className="mca-list__body">
                  <div className="mca-list__title">Técnicos activos</div>
                  <div className="mca-list__meta">Equipo de campo disponible</div>
                </div>
                <div className="mca-list__value">
                  <div className="mca-list__amount">{datos.tecnicos.length}</div>
                </div>
              </button>
            </div>
          </Panel>
        </div>
      </div>

      <Modal
        open={Boolean(actividadDetalle)}
        onClose={() => setDetalleId(null)}
        title={actividadDetalle?.codigo}
        subtitle={
          actividadDetalle
            ? `${actividadDetalle.cliente} · ${actividadDetalle.servicio}`
            : ''
        }
        icon={CalendarDays}
        size="lg"
        footer={
          actividadDetalle && (
            <>
              <Button onClick={() => setDetalleId(null)}>Cerrar</Button>
              <Button
                variant="primary"
                icon={CalendarDays}
                onClick={() => {
                  setDetalleId(null);
                  navegar('programacion');
                }}
              >
                Gestionar en agenda
              </Button>
            </>
          )
        }
      >
        {actividadDetalle && (
          <DetailGrid>
            <DetailItem label="Cliente">{actividadDetalle.cliente}</DetailItem>
            <DetailItem label="Teléfono">{actividadDetalle.telefono || '—'}</DetailItem>
            <DetailItem label="Servicio" full>{actividadDetalle.servicio}</DetailItem>
            <DetailItem label="Técnico">{actividadDetalle.tecnico}</DetailItem>
            <DetailItem label="Fecha">{formatearFecha(actividadDetalle.fecha)}</DetailItem>
            <DetailItem label="Horario">
              {actividadDetalle.horaInicio} – {actividadDetalle.horaFin} · {actividadDetalle.horas} h
            </DetailItem>
            <DetailItem label="Prioridad">{actividadDetalle.prioridad}</DetailItem>
            <DetailItem label="Estado">
              <EstadoToggle
                estado={actividadDetalle.estado}
                estados={ESTADOS.actividad}
                width={112}
              />
            </DetailItem>
            <DetailItem label="Dirección" full>{actividadDetalle.direccion || '—'}</DetailItem>
            <DetailItem label="Descripción" full>{actividadDetalle.descripcion || '—'}</DetailItem>
          </DetailGrid>
        )}
      </Modal>

      <Toast toast={toast} onClose={close} />
    </PageShell>
  );
}

export default PanelControl;
