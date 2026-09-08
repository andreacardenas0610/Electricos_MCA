
import React, { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';

export function SistemaAbonos() {
  // =========================================================
  // CONTROL DE TEMA
  // Se guarda en localStorage para que persista al recargar
  // =========================================================
  const { theme: temaGlobal, toggleTheme } = useContext(ThemeContext);
  const esOscuro = temaGlobal === 'dark';

  // =========================================================
  // CAMBIAR TEMA Y GUARDARLO
  // =========================================================
  const cambiarTema = toggleTheme;

  // CONTROL DE VISTAS
  const [vistaActual, setVistaActual] = useState('dashboard');
  const [filtro, setFiltro] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');

  // ESTADOS PARA MODALES
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [modoModal, setModoModal] = useState(null);

  const [formEditar, setFormEditar] = useState({
    montoTotal: '',
    abonosRealizados: '',
    metodoPago: '',
  });

  // =========================================================
  // BASE DE DATOS LOCAL
  // =========================================================
  const [transacciones, setTransacciones] = useState([
    {
      idPago: '#PAG-9482',
      codigo: 'OS-2023-EL-1102',
      montoTotal: 15200.00,
      abonosRealizados: 12000.00,
      saldoPendiente: 3200.00,
      metodoPago: 'Transferencia',
      estado: 'ABONO PARCIAL',
    },
    {
      idPago: '#PAG-9485',
      codigo: 'COT-2023-EL-1105',
      montoTotal: 8450.00,
      abonosRealizados: 8450.00,
      saldoPendiente: 0.00,
      metodoPago: 'Tarjeta',
      estado: 'LIQUIDADO',
    },
    {
      idPago: '#PAG-9489',
      codigo: 'OS-2023-EL-1109',
      montoTotal: 24000.00,
      abonosRealizados: 0.00,
      saldoPendiente: 24000.00,
      metodoPago: 'Efectivo',
      estado: 'PENDIENTE',
    },
    {
      idPago: '#PAG-9492',
      codigo: 'COT-2023-EL-1112',
      montoTotal: 5700.00,
      abonosRealizados: 5700.00,
      saldoPendiente: 0.00,
      metodoPago: 'Transferencia',
      estado: 'LIQUIDADO',
    },
  ]);

  // =========================================================
  // REGISTRO DE PAGOS
  // =========================================================
  const [registroPagos, setRegistroPagos] = useState([
    {
      id: '1',
      metodo: 'Transferencia Bancaria',
      abonoRef: 'Abono a #PAG-9482',
      monto: 4500.00,
      fecha: '24 Oct, 2023 - 14:20',
      icon: '💳'
    },
    {
      id: '2',
      metodo: 'Tarjeta Débito (POS)',
      abonoRef: 'Abono a #PAG-8100',
      monto: 2100.50,
      fecha: '23 Oct, 2023 - 09:15',
      icon: '💳'
    },
    {
      id: '3',
      metodo: 'Efectivo Caja Central',
      abonoRef: 'Abono a #PAG-9489',
      monto: 850.00,
      fecha: '22 Oct, 2023 - 17:45',
      icon: '💵'
    },
  ]);

  // =========================================================
  // FORMULARIO NUEVO ABONO
  // =========================================================
  const [formData, setFormData] = useState({
    idPago: 'PAY-2023-00451',
    fecha: '24 Oct, 2023',
    documentoSeleccionado: '',
    metodoPago: 'Efectivo',
    montoNuevoAbono: '',
  });

  // =========================================================
  // PALETA DINÁMICA
  // =========================================================
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

  // =========================================================
  // MÉTRICAS
  // =========================================================
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

  // =========================================================
  // DOCUMENTO SELECCIONADO
  // =========================================================
  const docSeleccionado = transacciones.find(
    (t) => t.idPago === formData.documentoSeleccionado
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
    montoTotalDoc - (abonadoAnteriorDoc + abonoIngresado)
  );

  // =========================================================
  // GUARDAR ABONO
  // =========================================================
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

    setTransacciones(
      transacciones.map((t) => {
        if (t.idPago === formData.documentoSeleccionado) {
          const nuevosAbonos =
            t.abonosRealizados + abonoIngresado;

          const nuevoSaldo = Math.max(
            0,
            t.montoTotal - nuevosAbonos
          );

          return {
            ...t,
            abonosRealizados: nuevosAbonos,
            saldoPendiente: nuevoSaldo,
            metodoPago: formData.metodoPago,
            estado:
              nuevoSaldo === 0
                ? 'LIQUIDADO'
                : 'ABONO PARCIAL',
          };
        }

        return t;
      })
    );

    setRegistroPagos([
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
      ...registroPagos,
    ]);

    setVistaActual('dashboard');

    setFormData({
      ...formData,
      documentoSeleccionado: '',
      montoNuevoAbono: '',
    });
  };

  // =========================================================
  // VER DETALLE
  // =========================================================
  const handleVer = (item) => {
    setItemSeleccionado(item);
    setModoModal('ver');
  };

  // =========================================================
  // ABRIR EDITAR
  // =========================================================
  const handleAbrirEditar = (item) => {
    setItemSeleccionado(item);

    setFormEditar({
      montoTotal: item.montoTotal,
      abonosRealizados: item.abonosRealizados,
      metodoPago: item.metodoPago,
    });

    setModoModal('editar');
  };

  // =========================================================
  // GUARDAR EDICIÓN
  // =========================================================
  const handleGuardarEdicion = (e) => {
    e.preventDefault();

    const montoTotalNum =
      parseFloat(formEditar.montoTotal) || 0;

    const abonosNum =
      parseFloat(formEditar.abonosRealizados) || 0;

    const nuevoSaldo = Math.max(
      0,
      montoTotalNum - abonosNum
    );

    let nuevoEstado = 'PENDIENTE';

    if (nuevoSaldo === 0 && montoTotalNum > 0) {
      nuevoEstado = 'LIQUIDADO';
    } else if (abonosNum > 0) {
      nuevoEstado = 'ABONO PARCIAL';
    }

    setTransacciones(
      transacciones.map((t) =>
        t.idPago === itemSeleccionado.idPago
          ? {
              ...t,
              montoTotal: montoTotalNum,
              abonosRealizados: abonosNum,
              saldoPendiente: nuevoSaldo,
              metodoPago: formEditar.metodoPago,
              estado: nuevoEstado,
            }
          : t
      )
    );

    setModoModal(null);
    setItemSeleccionado(null);
  };

  // =========================================================
  // ELIMINAR
  // =========================================================
  const handleEliminar = (idPago) => {
    if (
      window.confirm(
        `¿Estás seguro de que deseas eliminar la transacción ${idPago}?`
      )
    ) {
      setTransacciones(
        transacciones.filter(
          (t) => t.idPago !== idPago
        )
      );
    }
  };

  // =========================================================
  // FILTROS
  // =========================================================
  const transaccionesFiltradas = transacciones.filter(
    (t) => {
      const coincide =
        t.idPago
          .toLowerCase()
          .includes(busqueda.toLowerCase()) ||
        t.codigo
          .toLowerCase()
          .includes(busqueda.toLowerCase());

      if (filtro === 'Pendientes') {
        return coincide && t.saldoPendiente > 0;
      }

      if (filtro === 'Liquidadas') {
        return coincide && t.saldoPendiente === 0;
      }

      return coincide;
    }
  );

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div
      style={{
        ...styles.appWrapper,
        backgroundColor: theme.bgApp,
        color: theme.textMain,
      }}
    >

      {/* =====================================================
          DASHBOARD
      ===================================================== */}
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
                backgroundColor: theme.bgCard,
                borderColor: theme.border,
                color: theme.textMain,
              }}
            />

            <div
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >

              {/* BOTÓN TEMA */}
              <button
                onClick={cambiarTema}
                style={{
                  ...styles.btnThemeToggle,
                  backgroundColor: theme.bgCard,
                  borderColor: theme.border,
                  color: theme.textMain,
                }}
                title="Cambiar tema"
              >
                {esOscuro
                  ? '☀️ Claro'
                  : '🌙 Oscuro'}
              </button>

              <button style={styles.btnTopVenta}>
                Registrar Venta Eléctrica
              </button>

              <span style={{ cursor: 'pointer' }}>
                🔔
              </span>

              <span style={{ cursor: 'pointer' }}>
                ❓
              </span>

              <div
                style={{
                  ...styles.userAvatar,
                  backgroundColor: theme.border,
                }}
              >
                👤
              </div>

            </div>
          </header>

          {/* ENCABEZADO */}
          <div style={styles.headerSection}>

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
                Administración de flujos de pago y
                recuperación de cartera.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '10px',
              }}
            >

              <button
                style={{
                  ...styles.btnExportar,
                  backgroundColor: theme.bgCard,
                  borderColor: theme.border,
                  color: theme.textMain,
                }}
              >
                📥 Exportar Reporte
              </button>

              <button
                style={styles.btnRegistrarAbono}
                onClick={() =>
                  setVistaActual('agregar')
                }
              >
                ➕ Registrar Abono
              </button>

            </div>
          </div>

          {/* MÉTRICAS */}
          <div style={styles.metricsGrid}>

            <div
              style={{
                ...styles.metricCard,
                backgroundColor: theme.bgCard,
                borderColor: theme.border,
              }}
            >

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>⚡</span>

                <span style={styles.badgeGreen}>
                  +12.5%
                </span>
              </div>

              <div
                style={{
                  ...styles.metricLabel,
                  color: theme.textMuted,
                }}
              >
                Monto Total Facturado
              </div>

              <div style={styles.metricValue}>
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
                backgroundColor: theme.bgCard,
                borderColor: theme.border,
              }}
            >

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>🪙</span>

                <span
                  style={{
                    ...styles.metaText,
                    color: theme.textMuted,
                  }}
                >
                  Meta: 90%
                </span>
              </div>

              <div
                style={{
                  ...styles.metricLabel,
                  color: theme.textMuted,
                }}
              >
                Monto Total Abonado
              </div>

              <div style={styles.metricValue}>
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
                backgroundColor: theme.bgCard,
                borderColor: theme.border,
              }}
            >

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>📁</span>

                <span style={styles.badgeWarning}>
                  Requiere Atención
                </span>
              </div>

              <div
                style={{
                  ...styles.metricLabel,
                  color: theme.textMuted,
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

          {/* TABLA */}
          <div
            style={{
              ...styles.cardSection,
              backgroundColor: theme.bgCard,
              borderColor: theme.border,
            }}
          >

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >

              <h3 style={styles.sectionTitle}>
                Abonos y Ventas Eléctricas Recientes
              </h3>

              <div
                style={{
                  ...styles.filterGroup,
                  backgroundColor: theme.bgInner,
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
                            fontWeight: 'bold',
                          }
                        : {}),
                    }}
                  >
                    {tab}
                  </button>

                ))}

              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>

              <table style={styles.table}>

                <thead>

                  <tr>

                    <th
                      style={{
                        ...styles.th,
                        color: theme.textMuted,
                        borderColor: theme.border,
                      }}
                    >
                      ID PAGO
                    </th>

                    <th
                      style={{
                        ...styles.th,
                        color: theme.textMuted,
                        borderColor: theme.border,
                      }}
                    >
                      CÓDIGO OS/COTIZACIÓN
                    </th>

                    <th
                      style={{
                        ...styles.th,
                        color: theme.textMuted,
                        borderColor: theme.border,
                      }}
                    >
                      MONTO TOTAL
                    </th>

                    <th
                      style={{
                        ...styles.th,
                        color: theme.textMuted,
                        borderColor: theme.border,
                      }}
                    >
                      ABONOS REALIZADOS
                    </th>

                    <th
                      style={{
                        ...styles.th,
                        color: theme.textMuted,
                        borderColor: theme.border,
                      }}
                    >
                      SALDO PENDIENTE
                    </th>

                    <th
                      style={{
                        ...styles.th,
                        color: theme.textMuted,
                        borderColor: theme.border,
                      }}
                    >
                      MÉTODO DE PAGO
                    </th>

                    <th
                      style={{
                        ...styles.th,
                        color: theme.textMuted,
                        borderColor: theme.border,
                        textAlign: 'center',
                      }}
                    >
                      ESTADO DEL PAGO
                    </th>

                    <th
                      style={{
                        ...styles.th,
                        color: theme.textMuted,
                        borderColor: theme.border,
                        textAlign: 'center',
                      }}
                    >
                      ACCIONES
                    </th>

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
                            fontWeight: 'bold',
                          }}
                        >
                          {item.idPago}
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            borderColor:
                              theme.borderSoft,
                            color: theme.textSub,
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
                              item.saldoPendiente > 0
                                ? '#ef4444'
                                : '#22c55e',
                            fontWeight: 'bold',
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
                            textAlign: 'center',
                          }}
                        >
                          <span
                            style={getBadgeStatusStyle(
                              item.estado
                            )}
                          >
                            {item.estado}
                          </span>
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            borderColor:
                              theme.borderSoft,
                            textAlign: 'center',
                          }}
                        >

                          <button
                            style={styles.actionIconBtn}
                            onClick={() =>
                              handleVer(item)
                            }
                            title="Ver"
                          >
                            👁️
                          </button>

                          <button
                            style={styles.actionIconBtn}
                            onClick={() =>
                              handleAbrirEditar(item)
                            }
                            title="Editar"
                          >
                            ✏️
                          </button>

                          <button
                            style={styles.actionIconBtn}
                            onClick={() =>
                              handleEliminar(
                                item.idPago
                              )
                            }
                            title="Eliminar"
                          >
                            🗑️
                          </button>

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

      {/* =====================================================
          FORMULARIO REGISTRAR ABONO
      ===================================================== */}
      {vistaActual === 'agregar' && (

        <main style={styles.mainContainer}>

          <header style={styles.topBar}>

            <input
              type="text"
              placeholder="🔍 Buscar transacción..."
              style={{
                ...styles.topSearchInput,
                backgroundColor: theme.bgCard,
                borderColor: theme.border,
                color: theme.textMain,
              }}
            />

            <div
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >

              {/* MISMO BOTÓN DE TEMA */}
              <button
                onClick={cambiarTema}
                style={{
                  ...styles.btnThemeToggle,
                  backgroundColor: theme.bgCard,
                  borderColor: theme.border,
                  color: theme.textMain,
                }}
                title="Cambiar tema"
              >
                {esOscuro
                  ? '☀️ Claro'
                  : '🌙 Oscuro'}
              </button>

              <span style={{ cursor: 'pointer' }}>
                🔔
              </span>

              <span style={{ cursor: 'pointer' }}>
                ❓
              </span>

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
                  <div style={{ fontWeight: 'bold' }}>
                    Admin Usuario
                  </div>

                  <div
                    style={{
                      color: theme.textSub,
                    }}
                  >
                    Administrador
                  </div>
                </div>

                <div
                  style={{
                    ...styles.userAvatar,
                    backgroundColor: theme.border,
                  }}
                >
                  👤
                </div>

              </div>

            </div>

          </header>

          {/* ENCABEZADO */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
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
                Ingrese los detalles del pago recibido
                para actualizar el estado de cuenta.
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
            style={styles.formGridLayout}
          >

            {/* PANEL IZQUIERDO */}
            <div
              style={{
                ...styles.cardSection,
                backgroundColor: theme.bgCard,
                borderColor: theme.border,
              }}
            >

              <h3
                style={{
                  ...styles.sectionTitle,
                  marginBottom: '20px',
                  borderBottom:
                    `1px solid ${theme.border}`,
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
                      color: theme.textSub,
                    }}
                  >
                    ID DE PAGO
                  </label>

                  <input
                    type="text"
                    readOnly
                    value={formData.idPago}
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
                      color: theme.textSub,
                    }}
                  >
                    FECHA DE REGISTRO
                  </label>

                  <input
                    type="text"
                    readOnly
                    value={formData.fecha}
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
                    color: theme.textSub,
                  }}
                >
                  OS / COTIZACIÓN ASOCIADA
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

                  {transacciones.map((t) => (

                    <option
                      key={t.idPago}
                      value={t.idPago}
                    >
                      {t.idPago} - {t.codigo}
                    </option>

                  ))}

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
                    color: theme.textSub,
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
                          metodoPago: metodo,
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
                    color: theme.textSub,
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
                      fontWeight: 'bold',
                      color: theme.textMain,
                    }}
                  >
                    $
                  </span>

                  <input
                    type="number"
                    step="0.01"
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
                      color: theme.textMain,
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
                  style={styles.btnConfirmarAbono}
                >
                  ✔ Registrar Abono
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setVistaActual('dashboard')
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

            {/* PANEL DERECHO */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
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
                      color: theme.textMuted,
                    }}
                  >
                    MONTO TOTAL
                  </span>

                  <div
                    style={styles.summaryValue}
                  >
                    ${montoTotalDoc.toFixed(2)}
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
                      alignItems:
                        'center',
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

                    <span
                      style={{
                        fontSize: '12px',
                        color:
                          theme.textMuted,
                      }}
                    >
                      🔄
                    </span>

                  </div>

                  <div
                    style={{
                      ...styles.summaryValue,
                      color:
                        theme.textSub,
                    }}
                  >
                    ${abonadoAnteriorDoc.toFixed(2)}
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
                      alignItems:
                        'center',
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
                        fontSize: '12px',
                        color: '#22c55e',
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
                    ${abonoIngresado.toFixed(2)}
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
                      fontWeight: 'bold',
                    }}
                  >
                    SALDO PENDIENTE FINAL
                  </span>

                  <div
                    style={{
                      fontSize: '26px',
                      fontWeight: 'bold',
                      color: '#f87171',
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
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color:
                          theme.textMain,
                      }}
                    >
                      Política de Pagos
                    </div>

                    <div
                      style={{
                        fontSize: '11px',
                        color:
                          theme.textSub,
                        marginTop: '4px',
                        lineHeight: '1.4',
                      }}
                    >
                      Los abonos registrados se
                      reflejan inmediatamente en el
                      balance del cliente. Asegúrese
                      de que el comprobante físico o
                      digital coincida con el monto
                      ingresado.
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </form>

        </main>
      )}

      {/* =====================================================
          MODAL VER
      ===================================================== */}
      {modoModal === 'ver' &&
        itemSeleccionado && (

          <div style={styles.modalOverlay}>

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
                  marginBottom: '16px',
                }}
              >
                Detalles de la Transacción
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontSize: '13px',
                }}
              >

                <div>
                  <strong>ID Pago:</strong>{' '}
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
                  ${itemSeleccionado.montoTotal.toFixed(
                    2
                  )}
                </div>

                <div>
                  <strong>
                    Abonos Realizados:
                  </strong>{' '}
                  ${itemSeleccionado.abonosRealizados.toFixed(
                    2
                  )}
                </div>

                <div>
                  <strong>
                    Saldo Pendiente:
                  </strong>{' '}
                  ${itemSeleccionado.saldoPendiente.toFixed(
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
                  <strong>Estado:</strong>{' '}

                  <span
                    style={getBadgeStatusStyle(
                      itemSeleccionado.estado
                    )}
                  >
                    {itemSeleccionado.estado}
                  </span>

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

      {/* =====================================================
          MODAL EDITAR
      ===================================================== */}
      {modoModal === 'editar' &&
        itemSeleccionado && (

          <div style={styles.modalOverlay}>

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
                  marginBottom: '16px',
                }}
              >
                Editar {itemSeleccionado.idPago}
              </h3>

              <form
                onSubmit={handleGuardarEdicion}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
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

// =========================================================
// BADGES DE ESTADO
// =========================================================
const getBadgeStatusStyle = (estado) => {

  const base = {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: 'bold',
    display: 'inline-block',
  };

  if (estado === 'LIQUIDADO') {
    return {
      ...base,
      backgroundColor: '#14532d',
      color: '#4ade80',
    };
  }

  if (estado === 'ABONO PARCIAL') {
    return {
      ...base,
      backgroundColor: '#713f12',
      color: '#fde047',
    };
  }

  return {
    ...base,
    backgroundColor: '#451a03',
    color: '#f87171',
  };
};

// =========================================================
// ESTILOS
// =========================================================
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

  btnTopVenta: {
    backgroundColor: '#facc15',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '6px',
    fontWeight: 'bold',
    color: '#0b1329',
    cursor: 'pointer',
    fontSize: '12px',
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

  actionIconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
  },

  formGridLayout: {
    display: 'grid',
    gridTemplateColumns:
      '2fr 1fr',
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
    border:
      '1px solid #facc15',
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

export default SistemaAbonos;

