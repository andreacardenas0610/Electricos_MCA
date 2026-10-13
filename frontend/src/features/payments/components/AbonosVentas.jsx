import React, { useContext, useState } from 'react';
import { Bell } from 'lucide-react';

import { ThemeContext } from '../../../shared/context/ThemeContext.jsx';

import {
  EstadoToggle,
  ESTADOS,
} from '../../../shared/components/EstadoToggle.jsx';
import { AccionesFila } from '../../../shared/components/AccionesFila.jsx';

export function AbonoVentas() {
  const { theme: temaGlobal, toggleTheme } =
    useContext(ThemeContext);

  const esOscuro = temaGlobal === 'dark';

  const [vistaActual, setVistaActual] =
    useState('dashboard');

  const [filtro, setFiltro] = useState('Todas');

  const [busqueda, setBusqueda] = useState('');

  const [itemSeleccionado, setItemSeleccionado] =
    useState(null);

  const [modoModal, setModoModal] = useState(null);

  const [formEditar, setFormEditar] = useState({
    montoTotal: '',
    abonosRealizados: '',
    metodoPago: '',
  });

  const [transacciones, setTransacciones] = useState([
    {
      idPago: '#PAG-9482',
      codigo: 'OS-2023-EL-1102',
      montoTotal: 15200.0,
      abonosRealizados: 12000.0,
      saldoPendiente: 3200.0,
      metodoPago: 'Transferencia',
      estado: 'ABONO PARCIAL',
    },
    {
      idPago: '#PAG-9485',
      codigo: 'COT-2023-EL-1105',
      montoTotal: 8450.0,
      abonosRealizados: 8450.0,
      saldoPendiente: 0.0,
      metodoPago: 'Tarjeta',
      estado: 'LIQUIDADO',
    },
    {
      idPago: '#PAG-9489',
      codigo: 'OS-2023-EL-1109',
      montoTotal: 24000.0,
      abonosRealizados: 0.0,
      saldoPendiente: 24000.0,
      metodoPago: 'Efectivo',
      estado: 'PENDIENTE',
    },
    {
      idPago: '#PAG-9492',
      codigo: 'COT-2023-EL-1112',
      montoTotal: 5700.0,
      abonosRealizados: 5700.0,
      saldoPendiente: 0.0,
      metodoPago: 'Transferencia',
      estado: 'LIQUIDADO',
    },
  ]);

  const [registroPagos, setRegistroPagos] =
    useState([
      {
        id: '1',
        metodo: 'Transferencia Bancaria',
        abonoRef: 'Abono a #PAG-9482',
        monto: 4500.0,
        fecha: '24 Oct, 2023 - 14:20',
        icon: '💳',
      },
      {
        id: '2',
        metodo: 'Tarjeta Débito (POS)',
        abonoRef: 'Abono a #PAG-8100',
        monto: 2100.5,
        fecha: '23 Oct, 2023 - 09:15',
        icon: '💳',
      },
      {
        id: '3',
        metodo: 'Efectivo Caja Central',
        abonoRef: 'Abono a #PAG-9489',
        monto: 850.0,
        fecha: '22 Oct, 2023 - 17:45',
        icon: '💵',
      },
    ]);

  const [formData, setFormData] = useState({
    idPago: 'PAY-2023-00451',
    fecha: '24 Oct, 2023',
    documentoSeleccionado: '',
    metodoPago: 'Efectivo',
    montoNuevoAbono: '',
  });

  const theme = {
    bgApp: esOscuro ? '#0b1329' : '#f1f5f9',
    bgCard: esOscuro ? '#111c38' : '#ffffff',
    bgInner: esOscuro ? '#0b1329' : '#f8fafc',
    border: esOscuro ? '#1e2d4a' : '#e2e8f0',
    borderSoft: esOscuro ? '#162447' : '#f1f5f9',
    textMain: esOscuro ? '#ffffff' : '#0f172a',
    textSub: esOscuro ? '#94a3b8' : '#64748b',
    textMuted: esOscuro ? '#64748b' : '#94a3b8',
    inputBg: esOscuro ? '#0b1329' : '#ffffff',
    activeTab: esOscuro ? '#1e2d4a' : '#e2e8f0',
  };

  const totalFacturado = transacciones.reduce(
    (acc, t) => acc + t.montoTotal,
    0
  );

  const totalAbonado = transacciones.reduce(
    (acc, t) => acc + t.abonosRealizados,
    0
  );

  const saldoPendienteTotal = transacciones.reduce(
    (acc, t) => acc + t.saldoPendiente,
    0
  );

  const docSeleccionado = transacciones.find(
    (t) =>
      t.idPago === formData.documentoSeleccionado
  );

  const montoTotalDoc = docSeleccionado
    ? docSeleccionado.montoTotal
    : 0;

  const abonadoAnteriorDoc = docSeleccionado
    ? docSeleccionado.abonosRealizados
    : 0;

  const abonoIngresado =
    parseFloat(formData.montoNuevoAbono) || 0;

  const saldoPendienteFinal = Math.max(
    0,
    montoTotalDoc -
      (abonadoAnteriorDoc + abonoIngresado)
  );

  const obtenerEstadoPorMonto = (
    montoTotal,
    abonos
  ) => {
    if (montoTotal <= 0 || abonos <= 0) {
      return 'PENDIENTE';
    }

    const porcentaje =
      (abonos / montoTotal) * 100;

    if (porcentaje >= 100) {
      return 'LIQUIDADO';
    }

    return 'ABONO PARCIAL';
  };

  const handleGuardarAbono = (e) => {
    e.preventDefault();

    if (!formData.documentoSeleccionado) {
      alert(
        'Por favor selecciona una Orden o Cotización asociada.'
      );
      return;
    }

    if (abonoIngresado <= 0) {
      alert('Ingresa un monto de abono válido.');
      return;
    }

    if (
      abonoIngresado >
      docSeleccionado.saldoPendiente
    ) {
      alert(
        `El abono no puede ser mayor al saldo pendiente de $${docSeleccionado.saldoPendiente.toFixed(
          2
        )}.`
      );
      return;
    }

    setTransacciones(
      (transaccionesActuales) =>
        transaccionesActuales.map((t) => {
          if (
            t.idPago ===
            formData.documentoSeleccionado
          ) {
            const nuevosAbonos =
              t.abonosRealizados +
              abonoIngresado;

            const nuevoSaldo = Math.max(
              0,
              t.montoTotal - nuevosAbonos
            );

            const nuevoEstado =
              obtenerEstadoPorMonto(
                t.montoTotal,
                nuevosAbonos
              );

            return {
              ...t,
              abonosRealizados: nuevosAbonos,
              saldoPendiente: nuevoSaldo,
              metodoPago:
                formData.metodoPago,
              estado: nuevoEstado,
            };
          }

          return t;
        })
    );

    setRegistroPagos((pagosActuales) => [
      {
        id: Date.now().toString(),
        metodo: formData.metodoPago,
        abonoRef: `Abono a ${formData.documentoSeleccionado}`,
        monto: abonoIngresado,
        fecha: 'Hoy, Reciente',
        icon:
          formData.metodoPago === 'Efectivo'
            ? '💵'
            : '💳',
      },
      ...pagosActuales,
    ]);

    alert('Abono registrado correctamente.');

    setVistaActual('dashboard');

    setFormData({
      ...formData,
      documentoSeleccionado: '',
      montoNuevoAbono: '',
    });
  };

  const handleVer = (item) => {
    setItemSeleccionado(item);
    setModoModal('ver');
  };

  const handleAbrirEditar = (item) => {
    setItemSeleccionado(item);

    setFormEditar({
      montoTotal: item.montoTotal,
      abonosRealizados: item.abonosRealizados,
      metodoPago: item.metodoPago,
    });

    setModoModal('editar');
  };

  const handleGuardarEdicion = (e) => {
    e.preventDefault();

    const montoTotalNum =
      parseFloat(formEditar.montoTotal) || 0;

    const abonosNum =
      parseFloat(
        formEditar.abonosRealizados
      ) || 0;

    if (montoTotalNum <= 0) {
      alert(
        'El monto total debe ser mayor a cero.'
      );
      return;
    }

    if (abonosNum < 0) {
      alert(
        'Los abonos no pueden ser negativos.'
      );
      return;
    }

    if (abonosNum > montoTotalNum) {
      alert(
        'Los abonos realizados no pueden superar el monto total.'
      );
      return;
    }

    const nuevoSaldo = Math.max(
      0,
      montoTotalNum - abonosNum
    );

    const nuevoEstado =
      obtenerEstadoPorMonto(
        montoTotalNum,
        abonosNum
      );

    setTransacciones(
      (transaccionesActuales) =>
        transaccionesActuales.map((t) =>
          t.idPago ===
          itemSeleccionado.idPago
            ? {
                ...t,
                montoTotal: montoTotalNum,
                abonosRealizados: abonosNum,
                saldoPendiente: nuevoSaldo,
                metodoPago:
                  formEditar.metodoPago,
                estado: nuevoEstado,
              }
            : t
        )
    );

    setModoModal(null);
    setItemSeleccionado(null);
  };

  const handleEliminar = (idPago) => {
    if (
      window.confirm(
        `¿Estás seguro de que deseas eliminar la transacción ${idPago}?`
      )
    ) {
      setTransacciones(
        (transaccionesActuales) =>
          transaccionesActuales.filter(
            (t) => t.idPago !== idPago
          )
      );
    }
  };

  /*
   * CAMBIO DE ESTADO
   *
   * PENDIENTE
   * 0% abonado
   *
   * ABONO PARCIAL
   * 1% - 99% abonado
   *
   * LIQUIDADO
   * 100% abonado
   *
   * Cada clic mueve el estado:
   *
   * PENDIENTE
   *      ↓
   * ABONO PARCIAL
   *      ↓
   * LIQUIDADO
   *      ↓
   * PENDIENTE
   */
  const cambiarEstadoPago = (idPago) => {
    setTransacciones(
      (transaccionesActuales) =>
        transaccionesActuales.map((t) => {
          if (t.idPago !== idPago) {
            return t;
          }

          let nuevoEstado;
          let nuevosAbonos;
          let nuevoSaldo;

          if (t.estado === 'PENDIENTE') {
            nuevoEstado = 'ABONO PARCIAL';

            nuevosAbonos =
              Math.round(
                (t.montoTotal * 0.5) * 100
              ) / 100;

            nuevoSaldo =
              Math.round(
                (t.montoTotal -
                  nuevosAbonos) *
                  100
              ) / 100;
          } else if (
            t.estado === 'ABONO PARCIAL'
          ) {
            nuevoEstado = 'LIQUIDADO';

            nuevosAbonos = t.montoTotal;

            nuevoSaldo = 0;
          } else {
            nuevoEstado = 'PENDIENTE';

            nuevosAbonos = 0;

            nuevoSaldo = t.montoTotal;
          }

          return {
            ...t,
            abonosRealizados: nuevosAbonos,
            saldoPendiente: nuevoSaldo,
            estado: nuevoEstado,
          };
        })
    );
  };

  const handleExportarReporte = () => {
    if (transacciones.length === 0) {
      alert(
        'No hay transacciones para exportar.'
      );
      return;
    }

    const encabezados = [
      'ID PAGO',
      'CÓDIGO OS/COTIZACIÓN',
      'MONTO TOTAL',
      'ABONOS REALIZADOS',
      'SALDO PENDIENTE',
      'MÉTODO DE PAGO',
      'ESTADO DEL PAGO',
    ];

    const filas = transacciones.map((item) => [
      item.idPago,
      item.codigo,
      item.montoTotal.toFixed(2),
      item.abonosRealizados.toFixed(2),
      item.saldoPendiente.toFixed(2),
      item.metodoPago,
      item.estado,
    ]);

    const contenidoCSV = [
      encabezados,
      ...filas,
    ]
      .map((fila) =>
        fila
          .map(
            (dato) =>
              `"${String(dato).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(',')
      )
      .join('\n');

    const blob = new Blob(
      ['\ufeff' + contenidoCSV],
      {
        type: 'text/csv;charset=utf-8;',
      }
    );

    const url =
      URL.createObjectURL(blob);

    const enlace =
      document.createElement('a');

    enlace.href = url;

    enlace.download = `Reporte_Abonos_Ventas_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(enlace);

    enlace.click();

    document.body.removeChild(enlace);

    URL.revokeObjectURL(url);
  };

  const transaccionesFiltradas =
    transacciones.filter((t) => {
      const textoBusqueda =
        busqueda.toLowerCase();

      const coincide =
        t.idPago
          .toLowerCase()
          .includes(textoBusqueda) ||
        t.codigo
          .toLowerCase()
          .includes(textoBusqueda);

      if (filtro === 'Pendientes') {
        return (
          coincide &&
          t.saldoPendiente > 0
        );
      }

      if (filtro === 'Liquidadas') {
        return (
          coincide &&
          t.saldoPendiente === 0
        );
      }

      return coincide;
    });

  return (
    <div
      style={{
        ...styles.appWrapper,
        backgroundColor: theme.bgApp,
        color: theme.textMain,
      }}
    >
      {vistaActual === 'dashboard' && (
        <main style={styles.mainContainer}>
          <header style={styles.topBar}>
            <input
              type="text"
              placeholder="🔍 Buscar pago o cotización..."
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              style={{
                ...styles.topSearchInput,
                backgroundColor:
                  theme.bgCard,
                borderColor:
                  theme.border,
                color:
                  theme.textMain,
              }}
            />

            <div
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <button
                onClick={toggleTheme}
                style={{
                  ...styles.btnThemeToggle,
                  backgroundColor:
                    theme.bgCard,
                  borderColor:
                    theme.border,
                  color:
                    theme.textMain,
                }}
                title="Cambiar tema"
              >
                {esOscuro
                  ? '☀️ Claro'
                  : '🌙 Oscuro'}
              </button>

              <span
                style={{
                  cursor: 'pointer',
                  color: esOscuro ? '#cbd5e1' : '#475569',
                }}
              >
                <Bell size={20} strokeWidth={1.8} />
              </span>

              <span
                style={{
                  cursor: 'pointer',
                }}
              >
                ❓
              </span>

              <div
                style={{
                  ...styles.userAvatar,
                  backgroundColor:
                    theme.border,
                }}
              >
                👤
              </div>
            </div>
          </header>

          <div
            style={styles.headerSection}
          >
            <div>
              <h1 style={styles.pageTitle}>
                Abonos y Ventas Eléctricas
              </h1>

              <p
                style={{
                  ...styles.pageSubtitle,
                  color: theme.textSub,
                }}
              >
                Administración de flujos de
                pago y recuperación de cartera.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={
                  handleExportarReporte
                }
                style={{
                  ...styles.btnExportar,
                  backgroundColor:
                    theme.bgCard,
                  borderColor:
                    theme.border,
                  color:
                    theme.textMain,
                }}
              >
                📥 Exportar Reporte
              </button>

              <button
                type="button"
                style={
                  styles.btnRegistrarAbono
                }
                onClick={() =>
                  setVistaActual('agregar')
                }
              >
                ➕ Registrar Abono
              </button>
            </div>
          </div>

          <div style={styles.metricsGrid}>
            <div
              style={{
                ...styles.metricCard,
                backgroundColor:
                  theme.bgCard,
                borderColor:
                  theme.border,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                }}
              >
                <span>⚡</span>

                <span
                  style={
                    styles.badgeGreen
                  }
                >
                  +12.5%
                </span>
              </div>

              <div
                style={{
                  ...styles.metricLabel,
                  color:
                    theme.textMuted,
                }}
              >
                Monto Total Facturado
              </div>

              <div
                style={styles.metricValue}
              >
                $
                {totalFacturado.toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </div>
            </div>

            <div
              style={{
                ...styles.metricCard,
                backgroundColor:
                  theme.bgCard,
                borderColor:
                  theme.border,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                }}
              >
                <span>🪙</span>

                <span
                  style={{
                    ...styles.metaText,
                    color:
                      theme.textMuted,
                  }}
                >
                  Meta: 90%
                </span>
              </div>

              <div
                style={{
                  ...styles.metricLabel,
                  color:
                    theme.textMuted,
                }}
              >
                Monto Total Abonado
              </div>

              <div
                style={styles.metricValue}
              >
                $
                {totalAbonado.toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </div>
            </div>

            <div
              style={{
                ...styles.metricCard,
                backgroundColor:
                  theme.bgCard,
                borderColor:
                  theme.border,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                }}
              >
                <span>📁</span>

                <span
                  style={
                    styles.badgeWarning
                  }
                >
                  Requiere Atención
                </span>
              </div>

              <div
                style={{
                  ...styles.metricLabel,
                  color:
                    theme.textMuted,
                }}
              >
                Saldo Pendiente Total
              </div>

              <div
                style={{
                  ...styles.metricValue,
                  color: '#ef4444',
                }}
              >
                $
                {saldoPendienteTotal.toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              ...styles.cardSection,
              backgroundColor:
                theme.bgCard,
              borderColor:
                theme.border,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3
                style={styles.sectionTitle}
              >
                Abonos y Ventas Eléctricas
                Recientes
              </h3>

              <div
                style={{
                  ...styles.filterGroup,
                  backgroundColor:
                    theme.bgInner,
                }}
              >
                {[
                  'Todas',
                  'Pendientes',
                  'Liquidadas',
                ].map((tab) => (
                  <button
                    key={tab}
                    onClick={() =>
                      setFiltro(tab)
                    }
                    style={{
                      ...styles.filterBtn,
                      color:
                        filtro === tab
                          ? theme.textMain
                          : theme.textMuted,
                      ...(filtro === tab
                        ? {
                            backgroundColor:
                              theme.activeTab,
                            fontWeight:
                              'bold',
                          }
                        : {}),
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                overflowX: 'auto',
              }}
            >
              <table style={styles.table}>
                <thead>
                  <tr>
                    {[
                      'ID PAGO',
                      'CÓDIGO OS/COTIZACIÓN',
                      'MONTO TOTAL',
                      'ABONOS REALIZADOS',
                      'SALDO PENDIENTE',
                      'MÉTODO DE PAGO',
                      'ESTADO DEL PAGO',
                      'ACCIONES',
                    ].map(
                      (titulo, index) => (
                        <th
                          key={titulo}
                          style={{
                            ...styles.th,
                            color:
                              theme.textMuted,
                            borderColor:
                              theme.border,
                            textAlign:
                              index >= 6
                                ? 'center'
                                : 'left',
                          }}
                        >
                          {titulo}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {transaccionesFiltradas.map(
                    (item) => (
                      <tr key={item.idPago}>
                        <td
                          style={{
                            ...styles.td,
                            borderColor:
                              theme.borderSoft,
                            fontWeight:
                              'bold',
                          }}
                        >
                          {item.idPago}
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            borderColor:
                              theme.borderSoft,
                            color:
                              theme.textSub,
                          }}
                        >
                          {item.codigo}
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            borderColor:
                              theme.borderSoft,
                          }}
                        >
                          $
                          {item.montoTotal.toLocaleString(
                            'en-US',
                            {
                              minimumFractionDigits: 2,
                            }
                          )}
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            borderColor:
                              theme.borderSoft,
                          }}
                        >
                          $
                          {item.abonosRealizados.toLocaleString(
                            'en-US',
                            {
                              minimumFractionDigits: 2,
                            }
                          )}
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            borderColor:
                              theme.borderSoft,
                            color:
                              item.saldoPendiente >
                              0
                                ? '#ef4444'
                                : '#22c55e',
                            fontWeight:
                              'bold',
                          }}
                        >
                          $
                          {item.saldoPendiente.toLocaleString(
                            'en-US',
                            {
                              minimumFractionDigits: 2,
                            }
                          )}
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            borderColor:
                              theme.borderSoft,
                          }}
                        >
                          {item.metodoPago}
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            borderColor:
                              theme.borderSoft,
                            textAlign:
                              'center',
                          }}
                        >
                          <EstadoToggle
                            estado={
                              item.estado
                            }
                            estados={
                              ESTADOS.pago
                            }
                            width={140}
                            onClick={() =>
                              cambiarEstadoPago(
                                item.idPago
                              )
                            }
                          />
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            borderColor:
                              theme.borderSoft,
                            textAlign:
                              'center',
                            whiteSpace:
                              'nowrap',
                          }}
                        >
                          <AccionesFila
                            onVer={() =>
                              handleVer(item)
                            }
                            onEditar={() =>
                              handleAbrirEditar(
                                item
                              )
                            }
                            onEliminar={() =>
                              handleEliminar(
                                item.idPago
                              )
                            }
                            color={
                              esOscuro
                                ? '#cbd5e1'
                                : '#475569'
                            }
                          />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {vistaActual === 'agregar' && (
        <main style={styles.mainContainer}>
          <header style={styles.topBar}>
            <input
              type="text"
              placeholder="🔍 Buscar transacción..."
              style={{
                ...styles.topSearchInput,
                backgroundColor:
                  theme.bgCard,
                borderColor:
                  theme.border,
                color:
                  theme.textMain,
              }}
            />

            <div
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <button
                onClick={toggleTheme}
                style={{
                  ...styles.btnThemeToggle,
                  backgroundColor:
                    theme.bgCard,
                  borderColor:
                    theme.border,
                  color:
                    theme.textMain,
                }}
                title="Cambiar tema"
              >
                {esOscuro
                  ? '☀️ Claro'
                  : '🌙 Oscuro'}
              </button>

              <span style={{ color: esOscuro ? '#cbd5e1' : '#475569' }} title="Notificaciones"><Bell size={20} strokeWidth={1.8} /></span>

              <span>❓</span>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    textAlign: 'right',
                    fontSize: '11px',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 'bold',
                    }}
                  >
                    Admin Usuario
                  </div>

                  <div
                    style={{
                      color:
                        theme.textSub,
                    }}
                  >
                    Administrador
                  </div>
                </div>

                <div
                  style={{
                    ...styles.userAvatar,
                    backgroundColor:
                      theme.border,
                  }}
                >
                  👤
                </div>
              </div>
            </div>
          </header>

          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              marginTop: '10px',
            }}
          >
            <div>
              <h1 style={styles.pageTitle}>
                Registrar Nuevo Abono y Ventas
              </h1>

              <p
                style={{
                  ...styles.pageSubtitle,
                  color: theme.textSub,
                }}
              >
                Ingrese los detalles del pago
                recibido para actualizar el
                estado de cuenta.
              </p>
            </div>

            <button
              style={{
                ...styles.btnVolver,
                color: theme.textSub,
              }}
              onClick={() =>
                setVistaActual('dashboard')
              }
            >
              ← Volver a Finanzas
            </button>
          </div>

          <form
            onSubmit={handleGuardarAbono}
            style={
              styles.formGridLayout
            }
          >
            <div
              style={{
                ...styles.cardSection,
                backgroundColor:
                  theme.bgCard,
                borderColor:
                  theme.border,
              }}
            >
              <h3
                style={{
                  ...styles.sectionTitle,
                  marginBottom: '20px',
                  borderBottom: `1px solid ${theme.border}`,
                  paddingBottom: '10px',
                }}
              >
                Datos de la Transacción
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <label
                    style={{
                      ...styles.fieldLabel,
                      color:
                        theme.textSub,
                    }}
                  >
                    ID DE PAGO
                  </label>

                  <input
                    type="text"
                    readOnly
                    value={
                      formData.idPago
                    }
                    style={{
                      ...styles.readOnlyInput,
                      backgroundColor:
                        theme.bgInner,
                      borderColor:
                        theme.border,
                      color:
                        theme.textSub,
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      ...styles.fieldLabel,
                      color:
                        theme.textSub,
                    }}
                  >
                    FECHA DE REGISTRO
                  </label>

                  <input
                    type="text"
                    readOnly
                    value={
                      formData.fecha
                    }
                    style={{
                      ...styles.readOnlyInput,
                      backgroundColor:
                        theme.bgInner,
                      borderColor:
                        theme.border,
                      color:
                        theme.textSub,
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  marginBottom: '20px',
                }}
              >
                <label
                  style={{
                    ...styles.fieldLabel,
                    color:
                      theme.textSub,
                  }}
                >
                  COTIZACIÓN ASOCIADA
                </label>

                <select
                  value={
                    formData.documentoSeleccionado
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      documentoSeleccionado:
                        e.target.value,
                    })
                  }
                  style={{
                    ...styles.selectInput,
                    backgroundColor:
                      theme.inputBg,
                    borderColor:
                      theme.border,
                    color:
                      theme.textMain,
                  }}
                >
                  <option value="">
                    Seleccione un documento...
                  </option>

                  {transacciones.map(
                    (t) => (
                      <option
                        key={t.idPago}
                        value={t.idPago}
                      >
                        {t.idPago} -{' '}
                        {t.codigo}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div
                style={{
                  marginBottom: '20px',
                }}
              >
                <label
                  style={{
                    ...styles.fieldLabel,
                    color:
                      theme.textSub,
                  }}
                >
                  MÉTODO DE PAGO
                </label>

                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '6px',
                  }}
                >
                  {[
                    'Efectivo',
                    'Transferencia',
                    'Tarjeta',
                  ].map((metodo) => (
                    <button
                      type="button"
                      key={metodo}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          metodoPago:
                            metodo,
                        })
                      }
                      style={{
                        ...styles.btnMetodoPago,
                        backgroundColor:
                          theme.inputBg,
                        borderColor:
                          theme.border,
                        color:
                          theme.textSub,
                        ...(formData.metodoPago ===
                        metodo
                          ? styles.btnMetodoPagoActive
                          : {}),
                      }}
                    >
                      {metodo}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  marginBottom: '24px',
                }}
              >
                <label
                  style={{
                    ...styles.fieldLabel,
                    color:
                      theme.textSub,
                  }}
                >
                  MONTO DEL NUEVO ABONO
                </label>

                <div
                  style={{
                    ...styles.montoInputContainer,
                    backgroundColor:
                      theme.inputBg,
                    borderColor:
                      theme.border,
                  }}
                >
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight:
                        'bold',
                      color:
                        theme.textMain,
                    }}
                  >
                    $
                  </span>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={
                      formData.montoNuevoAbono
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        montoNuevoAbono:
                          e.target.value,
                      })
                    }
                    style={{
                      ...styles.montoInput,
                      color:
                        theme.textMain,
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <button
                  type="submit"
                  style={
                    styles.btnConfirmarAbono
                  }
                >
                  ✔ Registrar Abono
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setVistaActual(
                      'dashboard'
                    )
                  }
                  style={{
                    ...styles.btnCancelarForm,
                    borderColor:
                      theme.border,
                    color:
                      theme.textMain,
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection:
                  'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  ...styles.cardSection,
                  backgroundColor:
                    theme.bgCard,
                  borderColor:
                    theme.border,
                }}
              >
                <div
                  style={{
                    ...styles.summaryItem,
                    borderColor:
                      theme.border,
                  }}
                >
                  <span
                    style={{
                      ...styles.summaryLabel,
                      color:
                        theme.textMuted,
                    }}
                  >
                    MONTO TOTAL
                  </span>

                  <div
                    style={
                      styles.summaryValue
                    }
                  >
                    $
                    {montoTotalDoc.toFixed(
                      2
                    )}
                  </div>
                </div>

                <div
                  style={{
                    ...styles.summaryItem,
                    borderColor:
                      theme.border,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                    }}
                  >
                    <span
                      style={{
                        ...styles.summaryLabel,
                        color:
                          theme.textMuted,
                      }}
                    >
                      ABONADO ANTERIOR
                    </span>

                    <span>🔄</span>
                  </div>

                  <div
                    style={{
                      ...styles.summaryValue,
                      color:
                        theme.textSub,
                    }}
                  >
                    $
                    {abonadoAnteriorDoc.toFixed(
                      2
                    )}
                  </div>
                </div>

                <div
                  style={{
                    ...styles.summaryItem,
                    borderColor:
                      theme.border,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                    }}
                  >
                    <span
                      style={{
                        ...styles.summaryLabel,
                        color:
                          theme.textMuted,
                      }}
                    >
                      ABONO ACTUAL
                    </span>

                    <span
                      style={{
                        color:
                          '#22c55e',
                      }}
                    >
                      ➕
                    </span>
                  </div>

                  <div
                    style={{
                      ...styles.summaryValue,
                      color:
                        theme.textMain,
                    }}
                  >
                    $
                    {abonoIngresado.toFixed(
                      2
                    )}
                  </div>
                </div>

                <div
                  style={{
                    ...styles.saldoFinalContainer,
                    backgroundColor:
                      theme.bgInner,
                    borderColor:
                      theme.border,
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      color:
                        theme.textMuted,
                      fontWeight:
                        'bold',
                    }}
                  >
                    SALDO PENDIENTE FINAL
                  </span>

                  <div
                    style={{
                      fontSize: '26px',
                      fontWeight:
                        'bold',
                      color:
                        '#f87171',
                      marginTop: '4px',
                    }}
                  >
                    $
                    {saldoPendienteFinal.toFixed(
                      2
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  ...styles.policyCard,
                  backgroundColor:
                    theme.bgInner,
                  borderColor:
                    theme.border,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <span>ℹ️</span>

                  <div>
                    <div
                      style={{
                        fontSize:
                          '12px',
                        fontWeight:
                          'bold',
                        color:
                          theme.textMain,
                      }}
                    >
                      Política de Pagos
                    </div>

                    <div
                      style={{
                        fontSize:
                          '11px',
                        color:
                          theme.textSub,
                        marginTop:
                          '4px',
                        lineHeight:
                          '1.4',
                      }}
                    >
                      Los abonos registrados
                      se reflejan
                      inmediatamente en el
                      balance del cliente.
                      Asegúrese de que el
                      comprobante físico o
                      digital coincida con el
                      monto ingresado.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </main>
      )}

      {modoModal === 'ver' &&
        itemSeleccionado && (
          <div
            style={
              styles.modalOverlay
            }
          >
            <div
              style={{
                ...styles.modalContent,
                backgroundColor:
                  theme.bgCard,
                borderColor:
                  theme.border,
                color:
                  theme.textMain,
              }}
            >
              <h3
                style={{
                  ...styles.sectionTitle,
                  marginBottom:
                    '16px',
                }}
              >
                Detalles de la
                Transacción
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection:
                    'column',
                  gap: '10px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <strong>
                    ID Pago:
                  </strong>{' '}
                  {itemSeleccionado.idPago}
                </div>

                <div>
                  <strong>
                    Código OS/COT:
                  </strong>{' '}
                  {itemSeleccionado.codigo}
                </div>

                <div>
                  <strong>
                    Monto Total:
                  </strong>{' '}
                  $
                  {itemSeleccionado.montoTotal.toFixed(
                    2
                  )}
                </div>

                <div>
                  <strong>
                    Abonos Realizados:
                  </strong>{' '}
                  $
                  {itemSeleccionado.abonosRealizados.toFixed(
                    2
                  )}
                </div>

                <div>
                  <strong>
                    Saldo Pendiente:
                  </strong>{' '}
                  $
                  {itemSeleccionado.saldoPendiente.toFixed(
                    2
                  )}
                </div>

                <div>
                  <strong>
                    Método de Pago:
                  </strong>{' '}
                  {itemSeleccionado.metodoPago}
                </div>

                <div>
                  <strong>
                    Estado:
                  </strong>{' '}

                  <EstadoToggle
                    estado={
                      (
                        transacciones.find(
                          (t) =>
                            t.idPago ===
                            itemSeleccionado?.idPago
                        ) ||
                        itemSeleccionado
                      )?.estado
                    }
                    estados={
                      ESTADOS.pago
                    }
                    width={140}
                    onClick={() =>
                      cambiarEstadoPago(
                        itemSeleccionado.idPago
                      )
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: '20px',
                  textAlign: 'right',
                }}
              >
                <button
                  style={{
                    ...styles.btnExportar,
                    backgroundColor:
                      theme.bgInner,
                    borderColor:
                      theme.border,
                    color:
                      theme.textMain,
                  }}
                  onClick={() =>
                    setModoModal(null)
                  }
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      {modoModal === 'editar' &&
        itemSeleccionado && (
          <div
            style={
              styles.modalOverlay
            }
          >
            <div
              style={{
                ...styles.modalContent,
                backgroundColor:
                  theme.bgCard,
                borderColor:
                  theme.border,
                color:
                  theme.textMain,
              }}
            >
              <h3
                style={{
                  ...styles.sectionTitle,
                  marginBottom:
                    '16px',
                }}
              >
                Editar{' '}
                {itemSeleccionado.idPago}
              </h3>

              <form
                onSubmit={
                  handleGuardarEdicion
                }
                style={{
                  display: 'flex',
                  flexDirection:
                    'column',
                  gap: '12px',
                }}
              >
                <div>
                  <label
                    style={{
                      ...styles.fieldLabel,
                      color:
                        theme.textSub,
                    }}
                  >
                    MONTO TOTAL
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      formEditar.montoTotal
                    }
                    onChange={(e) =>
                      setFormEditar({
                        ...formEditar,
                        montoTotal:
                          e.target.value,
                      })
                    }
                    style={{
                      ...styles.selectInput,
                      backgroundColor:
                        theme.inputBg,
                      borderColor:
                        theme.border,
                      color:
                        theme.textMain,
                    }}
                    required
                  />
                </div>

                <div>
                  <label
                    style={{
                      ...styles.fieldLabel,
                      color:
                        theme.textSub,
                    }}
                  >
                    ABONOS REALIZADOS
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      formEditar.abonosRealizados
                    }
                    onChange={(e) =>
                      setFormEditar({
                        ...formEditar,
                        abonosRealizados:
                          e.target.value,
                      })
                    }
                    style={{
                      ...styles.selectInput,
                      backgroundColor:
                        theme.inputBg,
                      borderColor:
                        theme.border,
                      color:
                        theme.textMain,
                    }}
                    required
                  />
                </div>

                <div>
                  <label
                    style={{
                      ...styles.fieldLabel,
                      color:
                        theme.textSub,
                    }}
                  >
                    MÉTODO DE PAGO
                  </label>

                  <select
                    value={
                      formEditar.metodoPago
                    }
                    onChange={(e) =>
                      setFormEditar({
                        ...formEditar,
                        metodoPago:
                          e.target.value,
                      })
                    }
                    style={{
                      ...styles.selectInput,
                      backgroundColor:
                        theme.inputBg,
                      borderColor:
                        theme.border,
                      color:
                        theme.textMain,
                    }}
                  >
                    <option value="Efectivo">
                      Efectivo
                    </option>

                    <option value="Transferencia">
                      Transferencia
                    </option>

                    <option value="Tarjeta">
                      Tarjeta
                    </option>
                  </select>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '10px',
                  }}
                >
                  <button
                    type="submit"
                    style={
                      styles.btnRegistrarAbono
                    }
                  >
                    Guardar Cambios
                  </button>

                  <button
                    type="button"
                    style={{
                      ...styles.btnCancelarForm,
                      borderColor:
                        theme.border,
                      color:
                        theme.textMain,
                    }}
                    onClick={() =>
                      setModoModal(null)
                    }
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}

const styles = {
  appWrapper: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'sans-serif',
    transition:
      'background-color 0.2s, color 0.2s',
  },

  mainContainer: {
    flex: 1,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  topSearchInput: {
    border: '1px solid',
    padding: '8px 14px',
    borderRadius: '6px',
    width: '260px',
    outline: 'none',
    fontSize: '12px',
  },

  btnThemeToggle: {
    border: '1px solid',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
  },

  userAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  pageTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 'bold',
  },

  pageSubtitle: {
    margin: '4px 0 0 0',
    fontSize: '12px',
  },

  btnExportar: {
    border: '1px solid',
    padding: '8px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },

  btnRegistrarAbono: {
    backgroundColor: '#facc15',
    border: 'none',
    color: '#0b1329',
    padding: '8px 14px',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '12px',
    cursor: 'pointer',
  },

  btnVolver: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
  },

  metricsGrid: {
    display: 'grid',
    gridTemplateColumns:
      '1fr 1fr 1fr',
    gap: '16px',
  },

  metricCard: {
    border: '1px solid',
    borderRadius: '10px',
    padding: '16px',
  },

  badgeGreen: {
    backgroundColor:
      'rgba(34,197,94,0.15)',
    color: '#22c55e',
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '8px',
    fontWeight: 'bold',
  },

  metaText: {
    fontSize: '10px',
  },

  badgeWarning: {
    backgroundColor:
      'rgba(239,68,68,0.15)',
    color: '#ef4444',
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '8px',
    fontWeight: 'bold',
  },

  metricLabel: {
    fontSize: '11px',
    marginTop: '12px',
  },

  metricValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginTop: '4px',
  },

  cardSection: {
    border: '1px solid',
    borderRadius: '10px',
    padding: '20px',
  },

  sectionTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 'bold',
  },

  filterGroup: {
    display: 'flex',
    gap: '4px',
    padding: '3px',
    borderRadius: '6px',
  },

  filterBtn: {
    background: 'none',
    border: 'none',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    cursor: 'pointer',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px',
  },

  th: {
    fontSize: '10px',
    padding: '10px 8px',
    borderBottom: '1px solid',
    textAlign: 'left',
  },

  td: {
    padding: '12px 8px',
    borderBottom: '1px solid',
    fontSize: '12px',
  },

  formGridLayout: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px',
    marginTop: '10px',
  },

  fieldLabel: {
    display: 'block',
    fontSize: '10px',
    fontWeight: 'bold',
    marginBottom: '6px',
  },

  readOnlyInput: {
    width: '100%',
    border: '1px solid',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '12px',
    outline: 'none',
    boxSizing: 'border-box',
  },

  selectInput: {
    width: '100%',
    border: '1px solid',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '12px',
    outline: 'none',
    boxSizing: 'border-box',
  },

  btnMetodoPago: {
    flex: 1,
    border: '1px solid',
    padding: '10px',
    borderRadius: '20px',
    fontSize: '12px',
    cursor: 'pointer',
  },

  btnMetodoPagoActive: {
    backgroundColor: '#facc15',
    color: '#0b1329',
    fontWeight: 'bold',
    border: '1px solid #facc15',
  },

  montoInputContainer: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid',
    borderRadius: '6px',
    padding: '0 12px',
  },

  montoInput: {
    width: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    padding: '12px 8px',
    fontSize: '16px',
    outline: 'none',
    fontWeight: 'bold',
  },

  btnConfirmarAbono: {
    backgroundColor: '#facc15',
    border: 'none',
    color: '#0b1329',
    padding: '12px 24px',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer',
    flex: 2,
  },

  btnCancelarForm: {
    backgroundColor: 'transparent',
    border: '1px solid',
    padding: '12px 20px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    flex: 1,
  },

  summaryItem: {
    borderBottom: '1px solid',
    paddingBottom: '12px',
    marginBottom: '12px',
  },

  summaryLabel: {
    fontSize: '10px',
    fontWeight: 'bold',
  },

  summaryValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginTop: '4px',
  },

  saldoFinalContainer: {
    border: '1px dashed',
    borderRadius: '6px',
    padding: '12px',
    marginTop: '16px',
  },

  policyCard: {
    border: '1px solid',
    borderRadius: '8px',
    padding: '14px',
  },

  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  modalContent: {
    border: '1px solid',
    borderRadius: '10px',
    padding: '24px',
    width: '400px',
    maxWidth: '90%',
  },
};

export default AbonoVentas;