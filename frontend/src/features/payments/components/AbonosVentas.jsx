import { useMemo, useState } from 'react';
import {
  Banknote,
  CircleDollarSign,
  Clock3,
  Coins,
  Download,
  History,
  Plus,
  ReceiptText,
  Wallet,
} from 'lucide-react';

import { AccionesFila } from '../../../shared/components/AccionesFila.jsx';
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
  useToast,
} from '../../../shared/components/ui.jsx';
import {
  fechaISO,
  formatearFecha,
  formatearMoneda,
  useData,
} from '../../../shared/services/base.js';
import { formatearHora12 } from '../../../shared/services/catalogos.js';
import { COTIZACIONES_KEY } from '../../../shared/services/cotizacionesService.js';
import {
  METODOS_PAGO,
  PAGOS_KEY,
  actualizarPago,
  buscarCuentas,
  eliminarPago,
  obtenerCuentas,
  registrarAbono,
  resumenPagos,
} from '../../../shared/services/pagosService.js';

const horaActual = () => {
  const ahora = new Date();
  return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
};

const FORMULARIO_PAGO = () => ({
  cotizacionId: '',
  monto: '',
  metodo: 'Efectivo',
  fecha: fechaISO(),
  hora: horaActual(),
  referencia: '',
  nota: '',
});

const escaparCsv = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;

export default function AbonosVentas() {
  const cuentas = useData([PAGOS_KEY, COTIZACIONES_KEY], obtenerCuentas);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todas');

  const [detalleClave, setDetalleClave] = useState(null);
  const [modalPago, setModalPago] = useState(false);
  const [modoPago, setModoPago] = useState('crear');
  const [pagoEditando, setPagoEditando] = useState(null);
  const [formPago, setFormPago] = useState(FORMULARIO_PAGO);
  const [erroresPago, setErroresPago] = useState({});
  const [pagoEliminar, setPagoEliminar] = useState(null);

  const { toast, notify, close } = useToast();

  const filtradas = useMemo(() => {
    const base = buscarCuentas(busqueda, cuentas);
    if (filtroEstado === 'Todas') return base;
    if (filtroEstado === 'Históricas') return base.filter((cuenta) => cuenta.esHistorica);
    return base.filter((cuenta) => !cuenta.esHistorica && cuenta.estado === filtroEstado);
  }, [cuentas, busqueda, filtroEstado]);

  const resumen = useMemo(() => resumenPagos(cuentas), [cuentas]);
  const historicas = useMemo(
    () => cuentas.filter((cuenta) => cuenta.esHistorica).length,
    [cuentas],
  );

  const cuentaDetalle = useMemo(
    () => cuentas.find((cuenta) => cuenta.clave === detalleClave) || null,
    [cuentas, detalleClave],
  );

  const opcionesCuentas = useMemo(
    () => cuentas
      .filter((cuenta) => !cuenta.esHistorica && cuenta.saldo > 0)
      .map((cuenta) => ({
        value: String(cuenta.cotizacionId),
        label: `${cuenta.cotizacionId} · ${cuenta.cliente}`,
        meta: `${cuenta.proyecto} · Saldo ${formatearMoneda(cuenta.saldo, 'COP')}`,
        search: `${cuenta.documento} ${cuenta.proyecto}`,
      })),
    [cuentas],
  );

  const cuentaFormulario = useMemo(() => {
    if (modoPago === 'editar' && pagoEditando) {
      const actual = cuentas.find(
        (cuenta) => String(cuenta.cotizacionId) === String(pagoEditando.cotizacionId),
      );
      if (actual) return actual;

      const snapshot = pagoEditando.cotizacion || {};
      const montoTotal = Number(snapshot.montoTotal) || 0;
      return {
        clave: `HIS:${pagoEditando.cotizacionId}`,
        cotizacionId: pagoEditando.cotizacionId,
        cliente: snapshot.cliente || 'Cliente',
        documento: snapshot.documento || '',
        proyecto: snapshot.proyecto || '',
        montoTotal,
        abonado: pagoEditando.monto,
        saldo: Math.max(0, montoTotal - pagoEditando.monto),
        pagos: [pagoEditando],
        esHistorica: true,
      };
    }

    return cuentas.find(
      (cuenta) => String(cuenta.cotizacionId) === String(formPago.cotizacionId),
    ) || null;
  }, [modoPago, pagoEditando, cuentas, formPago.cotizacionId]);

  const disponibleFormulario = useMemo(() => {
    if (modoPago === 'editar' && pagoEditando) {
      if (cuentaFormulario?.pagos) {
        const otros = cuentaFormulario.pagos
          .filter((pago) => String(pago.id) !== String(pagoEditando.id))
          .reduce((total, pago) => total + pago.monto, 0);
        return Math.max(0, (cuentaFormulario.montoTotal || 0) - otros);
      }
      return Math.max(0, (pagoEditando.cotizacion?.montoTotal || 0) - pagoEditando.monto);
    }
    return cuentaFormulario?.saldo || 0;
  }, [modoPago, pagoEditando, cuentaFormulario]);

  const abrirRegistrar = (cuenta = null) => {
    if (cuenta && cuenta.saldo <= 0) {
      notify('info', 'Cuenta liquidada', `${cuenta.cotizacionId} no tiene saldo pendiente.`);
      return;
    }

    setModoPago('crear');
    setPagoEditando(null);
    setErroresPago({});
    setFormPago({
      ...FORMULARIO_PAGO(),
      cotizacionId: cuenta ? String(cuenta.cotizacionId) : '',
    });
    setDetalleClave(null);
    setModalPago(true);
  };

  const abrirEditarPago = (pago) => {
    setModoPago('editar');
    setPagoEditando(pago);
    setErroresPago({});
    setFormPago({
      cotizacionId: String(pago.cotizacionId),
      monto: String(pago.monto),
      metodo: pago.metodo,
      fecha: pago.fecha,
      hora: pago.hora,
      referencia: pago.referencia,
      nota: pago.nota,
    });
    setModalPago(true);
  };

  const cerrarModalPago = () => {
    setModalPago(false);
    setPagoEditando(null);
    setErroresPago({});
  };

  const handleGuardarPago = (event) => {
    event.preventDefault();

    const monto = Number(formPago.monto);
    const nuevosErrores = {};

    if (modoPago === 'crear' && !formPago.cotizacionId) {
      nuevosErrores.cotizacionId = 'Selecciona la cotización que recibe el abono.';
    }
    if (!Number.isFinite(monto) || monto <= 0) {
      nuevosErrores.monto = 'Ingresa un monto mayor que cero.';
    } else if (monto > disponibleFormulario + 0.01) {
      nuevosErrores.monto = `El monto supera el disponible (${formatearMoneda(disponibleFormulario, 'COP')}).`;
    }
    if (!formPago.metodo) nuevosErrores.metodo = 'Selecciona el método de pago.';
    if (!formPago.fecha) nuevosErrores.fecha = 'Selecciona la fecha del pago.';
    if (!formPago.hora) nuevosErrores.hora = 'Indica la hora del pago.';

    setErroresPago(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    try {
      if (modoPago === 'editar') {
        actualizarPago(pagoEditando.id, {
          monto,
          metodo: formPago.metodo,
          fecha: formPago.fecha,
          hora: formPago.hora,
          referencia: formPago.referencia.trim(),
          nota: formPago.nota.trim(),
        });
        notify(
          'success',
          'Abono actualizado',
          `${pagoEditando.id} · ${formatearMoneda(monto, 'COP')} en ${pagoEditando.cotizacionId}.`,
        );
      } else {
        const pago = registrarAbono({
          cotizacionId: formPago.cotizacionId,
          monto,
          metodo: formPago.metodo,
          fecha: formPago.fecha,
          hora: formPago.hora,
          referencia: formPago.referencia.trim(),
          nota: formPago.nota.trim(),
        });
        notify(
          'success',
          'Abono registrado',
          `${pago.id} · ${formatearMoneda(monto, 'COP')} aplicado a ${pago.cotizacionId}.`,
        );
      }
      cerrarModalPago();
    } catch (error) {
      notify('error', 'No se pudo guardar el abono', error.message);
    }
  };

  const confirmarEliminarPago = () => {
    if (!pagoEliminar) return;
    try {
      eliminarPago(pagoEliminar.id);
      notify(
        'success',
        'Abono eliminado',
        `${pagoEliminar.id} fue eliminado. El saldo de la cotización se recalculó.`,
      );
    } catch (error) {
      notify('error', 'No se pudo eliminar el abono', error.message);
    } finally {
      setPagoEliminar(null);
    }
  };

  const exportarReporte = () => {
    const filas = [[
      'Cotización',
      'Cliente',
      'Documento',
      'Proyecto',
      'Facturado',
      'Abonado',
      'Saldo',
      'Estado',
      'ID pago',
      'Fecha pago',
      'Hora',
      'Método',
      'Referencia',
      'Nota',
    ]];

    filtradas.forEach((cuenta) => {
      if (cuenta.pagos.length === 0) {
        filas.push([
          cuenta.cotizacionId,
          cuenta.cliente,
          cuenta.documento,
          cuenta.proyecto,
          cuenta.montoTotal,
          cuenta.abonado,
          cuenta.saldo,
          cuenta.estado,
          '',
          '',
          '',
          '',
          '',
          '',
        ]);
        return;
      }

      cuenta.pagos.forEach((pago) => {
        filas.push([
          cuenta.cotizacionId,
          cuenta.cliente,
          cuenta.documento,
          cuenta.proyecto,
          cuenta.montoTotal,
          cuenta.abonado,
          cuenta.saldo,
          cuenta.estado,
          pago.id,
          pago.fecha,
          pago.hora,
          pago.metodo,
          pago.referencia,
          pago.nota,
        ]);
      });
    });

    const contenido = `\uFEFF${filas.map((fila) => fila.map(escaparCsv).join(';')).join('\r\n')}`;
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `Abonos_Ventas_${fechaISO()}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);

    notify('info', 'Reporte exportado', `${filtradas.length} cuentas incluidas en el archivo CSV.`);
  };

  const aplicarPorcentaje = (porcentaje) => {
    const valor = porcentaje === 1
      ? disponibleFormulario
      : Math.round(disponibleFormulario * porcentaje);
    setFormPago((prev) => ({ ...prev, monto: String(valor) }));
    setErroresPago((prev) => ({ ...prev, monto: undefined }));
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Abonos y Ventas"
        title="Abonos y Ventas"
        subtitle="Controla los pagos recibidos, el saldo de cada cotización y el historial incluso de cotizaciones eliminadas."
        icon={Coins}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => abrirRegistrar()}>
            Registrar abono
          </Button>
        }
      />

      <div className="mca-kpis">
        <KpiCard
          label="Total facturado"
          value={formatearMoneda(resumen.facturado, 'COP')}
          hint={`${cuentas.length} cuentas registradas`}
          icon={ReceiptText}
          tone="info"
        />
        <KpiCard
          label="Total abonado"
          value={formatearMoneda(resumen.abonado, 'COP')}
          hint={`${resumen.liquidadas} cuentas liquidadas`}
          icon={CircleDollarSign}
          tone="success"
        />
        <KpiCard
          label="Saldo por cobrar"
          value={formatearMoneda(resumen.saldo, 'COP')}
          hint={`${resumen.parciales} en abono parcial`}
          icon={Clock3}
          tone="warning"
        />
        <KpiCard
          label="Cuentas activas"
          value={cuentas.length - historicas}
          hint={`${resumen.pendientes} pendientes · ${historicas} históricas`}
          icon={Wallet}
          tone="yellow"
        />
      </div>

      <Panel
        title="Cuentas por cobrar"
        subtitle={`${filtradas.length} de ${cuentas.length} cuentas`}
        actions={
          <>
            <SearchInput
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar por ID de cotización, ID de pago, cliente o proyecto..."
            />
            <select
              className="mca-select"
              style={{ width: 170 }}
              value={filtroEstado}
              onChange={(event) => setFiltroEstado(event.target.value)}
              aria-label="Filtrar cuentas por estado"
            >
              <option value="Todas">Todos los estados</option>
              {ESTADOS.pago.map((estado) => (
                <option key={estado.nombre} value={estado.nombre}>
                  {estado.nombre}
                </option>
              ))}
              <option value="Históricas">Históricas</option>
            </select>
            <Button icon={Download} onClick={exportarReporte} disabled={filtradas.length === 0}>
              Exportar
            </Button>
          </>
        }
        flush
      >
        <div className="mca-table-wrap">
          <table className="mca-table">
            <thead>
              <tr>
                <th>Cotización</th>
                <th>Cliente / Proyecto</th>
                <th className="is-number">Facturado</th>
                <th className="is-number">Abonado</th>
                <th className="is-number">Saldo</th>
                <th>Estado</th>
                <th>Último movimiento</th>
                <th className="mca-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="mca-table__empty">
                    <EmptyState
                      icon={Coins}
                      title="Sin cuentas para mostrar"
                      message="Ajusta los filtros o registra un abono sobre una cotización aprobada."
                      action={
                        <Button size="sm" icon={Plus} onClick={() => abrirRegistrar()}>
                          Registrar abono
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtradas.map((cuenta) => (
                  <tr key={cuenta.clave}>
                    <td className="is-nowrap">
                      <div className="mca-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <Badge tone="yellow">{cuenta.cotizacionId}</Badge>
                        {cuenta.esHistorica && <Badge tone="danger">Histórica</Badge>}
                      </div>
                    </td>
                    <td>
                      <div className="is-primary">{cuenta.cliente}</div>
                      <div className="mca-soft" style={{ fontSize: 11, marginTop: 2 }}>
                        {cuenta.proyecto || 'Sin proyecto'}
                        {cuenta.documento ? ` · ${cuenta.documento}` : ''}
                      </div>
                    </td>
                    <td className="is-number">{formatearMoneda(cuenta.montoTotal, 'COP')}</td>
                    <td className="is-number mca-strong">
                      {formatearMoneda(cuenta.abonado, 'COP')}
                    </td>
                    <td className="is-number">
                      <span className={cuenta.saldo > 0 ? 'mca-yellow mca-strong' : 'mca-muted'}>
                        {formatearMoneda(cuenta.saldo, 'COP')}
                      </span>
                    </td>
                    <td>
                      <EstadoToggle estado={cuenta.estado} estados={ESTADOS.pago} width={118} />
                    </td>
                    <td className="is-nowrap">
                      {cuenta.ultimoPago ? (
                        <>
                          <div className="is-primary" style={{ fontSize: 12 }}>
                            {formatearFecha(cuenta.ultimoPago.fecha)}
                          </div>
                          <div className="mca-soft" style={{ fontSize: 11, marginTop: 2 }}>
                            {cuenta.ultimoPago.metodo} · {formatearHora12(cuenta.ultimoPago.hora)}
                          </div>
                        </>
                      ) : (
                        <span className="mca-muted">Sin abonos</span>
                      )}
                    </td>
                    <td className="mca-center">
                      <div className="mca-row" style={{ justifyContent: 'center', gap: 6, flexWrap: 'nowrap' }}>
                        <button
                          type="button"
                          className="mca-icon-btn"
                          title={cuenta.esHistorica ? 'Cotización eliminada' : 'Registrar abono'}
                          onClick={() => abrirRegistrar(cuenta)}
                          disabled={cuenta.esHistorica || cuenta.saldo <= 0}
                          style={{
                            opacity: cuenta.esHistorica || cuenta.saldo <= 0 ? 0.35 : 1,
                            cursor: cuenta.esHistorica || cuenta.saldo <= 0 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Plus size={15} strokeWidth={1.9} />
                        </button>
                        <AccionesFila onVer={() => setDetalleClave(cuenta.clave)} />
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
        open={Boolean(cuentaDetalle)}
        onClose={() => setDetalleClave(null)}
        title={`Cuenta ${cuentaDetalle?.cotizacionId || ''}`}
        subtitle={cuentaDetalle ? `${cuentaDetalle.cliente} · ${cuentaDetalle.proyecto || 'Sin proyecto'}` : ''}
        icon={History}
        size="lg"
        footer={
          cuentaDetalle && (
            <>
              <Button onClick={() => setDetalleClave(null)}>Cerrar</Button>
              {!cuentaDetalle.esHistorica && cuentaDetalle.saldo > 0 && (
                <Button variant="primary" icon={Plus} onClick={() => abrirRegistrar(cuentaDetalle)}>
                  Registrar abono
                </Button>
              )}
            </>
          )
        }
      >
        {cuentaDetalle && (
          <div className="mca-stack">
            {cuentaDetalle.esHistorica && (
              <div className="mca-notice is-warning">
                <div>
                  <strong>Cotización eliminada.</strong> El historial de pagos se conserva y la cuenta
                  sigue siendo localizable por su ID desde el buscador.
                </div>
              </div>
            )}

            <DetailGrid>
              <DetailItem label="Cliente">{cuentaDetalle.cliente}</DetailItem>
              <DetailItem label="Documento">{cuentaDetalle.documento || '—'}</DetailItem>
              <DetailItem label="Proyecto" full>{cuentaDetalle.proyecto || '—'}</DetailItem>
              <DetailItem label="Facturado">
                {formatearMoneda(cuentaDetalle.montoTotal, 'COP')}
              </DetailItem>
              <DetailItem label="Abonado">
                <span className="mca-strong">{formatearMoneda(cuentaDetalle.abonado, 'COP')}</span>
              </DetailItem>
              <DetailItem label="Saldo pendiente">
                <span className={cuentaDetalle.saldo > 0 ? 'mca-yellow mca-strong' : 'mca-strong'}>
                  {formatearMoneda(cuentaDetalle.saldo, 'COP')}
                </span>
              </DetailItem>
              <DetailItem label="Estado de la cuenta">
                <EstadoToggle estado={cuentaDetalle.estado} estados={ESTADOS.pago} width={118} />
              </DetailItem>
              <DetailItem label="Estado de la cotización">
                {cuentaDetalle.cotizacionEstado || '—'}
              </DetailItem>
              <DetailItem label="Abonos registrados">{cuentaDetalle.pagos.length}</DetailItem>
            </DetailGrid>

            <div>
              <h3 className="mca-panel__title" style={{ fontSize: 13, marginBottom: 10 }}>
                Historial de abonos
              </h3>

              {cuentaDetalle.pagos.length === 0 ? (
                <div className="mca-notice is-info">
                  <div>Esta cuenta todavía no registra abonos.</div>
                </div>
              ) : (
                <div className="mca-table-wrap">
                  <table className="mca-table">
                    <thead>
                      <tr>
                        <th>ID pago</th>
                        <th>Fecha / hora</th>
                        <th>Método</th>
                        <th>Referencia</th>
                        <th className="is-number">Monto</th>
                        <th className="mca-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cuentaDetalle.pagos.map((pago) => (
                        <tr key={pago.id}>
                          <td className="is-nowrap">
                            <Badge tone="info">{pago.id}</Badge>
                          </td>
                          <td className="is-nowrap">
                            <div className="is-primary" style={{ fontSize: 12 }}>
                              {formatearFecha(pago.fecha)}
                            </div>
                            <div className="mca-soft" style={{ fontSize: 11, marginTop: 2 }}>
                              {formatearHora12(pago.hora)}
                            </div>
                          </td>
                          <td>{pago.metodo}</td>
                          <td>
                            <div>{pago.referencia || '—'}</div>
                            {pago.nota && (
                              <div className="mca-soft" style={{ fontSize: 11, marginTop: 2 }}>
                                {pago.nota}
                              </div>
                            )}
                          </td>
                          <td className="is-number mca-strong">
                            {formatearMoneda(pago.monto, 'COP')}
                          </td>
                          <td className="mca-center">
                            <AccionesFila
                              onEditar={() => abrirEditarPago(pago)}
                              onEliminar={() => setPagoEliminar(pago)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={modalPago}
        onClose={cerrarModalPago}
        title={modoPago === 'editar' ? 'Editar abono' : 'Registrar abono'}
        subtitle={
          modoPago === 'editar'
            ? `Actualiza los datos del pago ${pagoEditando?.id || ''}.`
            : 'Selecciona la cotización y registra el pago recibido.'
        }
        icon={Banknote}
        footer={
          <>
            <Button onClick={cerrarModalPago}>Cancelar</Button>
            <Button variant="primary" type="submit" form="form-abono">
              {modoPago === 'editar' ? 'Guardar cambios' : 'Registrar abono'}
            </Button>
          </>
        }
      >
        <form id="form-abono" className="mca-form-grid" onSubmit={handleGuardarPago}>
          {modoPago === 'crear' && (
            <Field
              label="Cotización"
              required
              full
              error={erroresPago.cotizacionId}
              hint="Solo se listan cotizaciones aprobadas con saldo pendiente."
            >
              <Combobox
                value={formPago.cotizacionId}
                onChange={(valor) => {
                  setFormPago((prev) => ({ ...prev, cotizacionId: valor }));
                  setErroresPago((prev) => ({ ...prev, cotizacionId: undefined, monto: undefined }));
                }}
                options={opcionesCuentas}
                placeholder="Buscar por ID, cliente o documento..."
                emptyText="No hay cuentas con saldo pendiente"
              />
            </Field>
          )}

          {cuentaFormulario && (
            <div className="mca-field mca-field--full">
              <div className="mca-notice is-info">
                <div>
                  <strong>{cuentaFormulario.cliente}</strong>
                  {cuentaFormulario.documento ? ` · ${cuentaFormulario.documento}` : ''}
                  <br />
                  {cuentaFormulario.proyecto || 'Sin proyecto'}
                  <br />
                  Facturado {formatearMoneda(cuentaFormulario.montoTotal, 'COP')} · Abonado{' '}
                  {formatearMoneda(cuentaFormulario.abonado, 'COP')} ·{' '}
                  <strong>Disponible {formatearMoneda(disponibleFormulario, 'COP')}</strong>
                </div>
              </div>
            </div>
          )}

          <Field
            label="Monto del abono"
            required
            error={erroresPago.monto}
            hint={`Disponible para aplicar: ${formatearMoneda(disponibleFormulario, 'COP')}`}
          >
            <input
              className="mca-input"
              type="number"
              min="0"
              step="0.01"
              value={formPago.monto}
              onChange={(event) => {
                setFormPago((prev) => ({ ...prev, monto: event.target.value }));
                setErroresPago((prev) => ({ ...prev, monto: undefined }));
              }}
              placeholder="0"
            />
            <div className="mca-row" style={{ gap: 6, marginTop: 6 }}>
              <Button size="sm" variant="ghost" onClick={() => aplicarPorcentaje(0.5)}>
                50%
              </Button>
              <Button size="sm" variant="ghost" onClick={() => aplicarPorcentaje(1)}>
                Saldo total
              </Button>
            </div>
          </Field>

          <Field label="Método de pago" required error={erroresPago.metodo}>
            <select
              className="mca-select"
              value={formPago.metodo}
              onChange={(event) => setFormPago((prev) => ({ ...prev, metodo: event.target.value }))}
            >
              {METODOS_PAGO.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Fecha del pago" required error={erroresPago.fecha}>
            <input
              className="mca-input"
              type="date"
              value={formPago.fecha}
              onChange={(event) => {
                setFormPago((prev) => ({ ...prev, fecha: event.target.value }));
                setErroresPago((prev) => ({ ...prev, fecha: undefined }));
              }}
            />
          </Field>

          <Field label="Hora del pago" required error={erroresPago.hora}>
            <input
              className="mca-input"
              type="time"
              value={formPago.hora}
              onChange={(event) => {
                setFormPago((prev) => ({ ...prev, hora: event.target.value }));
                setErroresPago((prev) => ({ ...prev, hora: undefined }));
              }}
            />
          </Field>

          <Field label="Referencia" full hint="Número de transacción, comprobante o soporte del pago.">
            <input
              className="mca-input"
              type="text"
              value={formPago.referencia}
              onChange={(event) => setFormPago((prev) => ({ ...prev, referencia: event.target.value }))}
              placeholder="Ej. TRF-84920, comprobante Nequi..."
            />
          </Field>

          <Field label="Nota" full>
            <textarea
              className="mca-textarea"
              rows={2}
              value={formPago.nota}
              onChange={(event) => setFormPago((prev) => ({ ...prev, nota: event.target.value }))}
              placeholder="Observaciones del abono (opcional)"
            />
          </Field>

          <div className="mca-field mca-field--full">
            <div className="mca-notice is-info">
              <div>
                El estado de la cuenta (Pendiente, Abono parcial o Liquidado) se calcula
                automáticamente con la suma de los abonos registrados.
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pagoEliminar)}
        title="Eliminar abono"
        message={
          pagoEliminar
            ? `Se eliminará el abono ${pagoEliminar.id} por ${formatearMoneda(pagoEliminar.monto, 'COP')} de la cuenta ${pagoEliminar.cotizacionId}. El saldo pendiente se recalculará automáticamente.`
            : ''
        }
        confirmLabel="Eliminar abono"
        onCancel={() => setPagoEliminar(null)}
        onConfirm={confirmarEliminarPago}
      />

      <Toast toast={toast} onClose={close} />
    </PageShell>
  );
}
