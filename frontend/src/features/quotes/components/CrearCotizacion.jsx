
import { useState, useContext } from 'react';

import { ThemeContext } from '../../../shared/context/ThemeContext.jsx';

// --- CATÁLOGO BASE DE DATOS: CLIENTES (REPRESENTACIÓN DE FK) ---

const CATALOGO_CLIENTES = [
  {
    id: 'CLI-001',
    nombre: 'Residencial "Las Palmas" - Administración',
    nit: '900.123.456-1',
    direccion: 'Av. Insurgentes Sur 1450, Ciudad de México',
  },
  {
    id: 'CLI-002',
    nombre: 'Constructora Horizonte S.A.',
    nit: '800.987.654-3',
    direccion: 'Calle 50 # 12-34, Parque Industrial, Bogotá',
  },
  {
    id: 'CLI-003',
    nombre: 'Comercializadora del Norte Ltda.',
    nit: '901.555.222-8',
    direccion: 'Av. Las Américas 88-10, Medellín',
  },
];

// --- CATÁLOGO BASE DE DATOS: MATERIALES (REPRESENTACIÓN DE FK) ---

const CATALOGO_MATERIALES = [
  {
    id: 'EL-BUS-585',
    sku: 'ELE-BUS-585-MOD',
    ean: '7701234567890',
    descripcion: 'Instalación de Tablero de Distribución Principal',
    precioUnit: 4500,
    categoria: 'Mano de Obra',
  },
  {
    id: 'EL-CAB-254',
    sku: 'ELE-CAB-254-PWR',
    ean: '7704567890123',
    descripcion: 'Cable de Cobre THHN Calibre 8 AWG (Rollo x 100m)',
    precioUnit: 2800,
    categoria: 'Conductores',
  },
  {
    id: 'EL-INT-101',
    sku: 'ELE-INT-101-BRK',
    ean: '7709876543210',
    descripcion: 'Interruptor Termomagnético 20A 2P Carga Alta',
    precioUnit: 650,
    categoria: 'Protección',
  },
  {
    id: 'EL-CON-012',
    sku: 'ELE-CON-012-DUX',
    ean: '7705554443332',
    descripcion: 'Tubo Conduit Pared Gruesa 3/4" (Tramo 3m)',
    precioUnit: 320,
    categoria: 'Canalización',
  },
];

// --- CATÁLOGO BASE DE DATOS: SERVICIOS (REPRESENTACIÓN DE FK) ---

const CATALOGO_SERVICIOS = [
  {
    id: 'SER-001',
    codigo: 'SERV-ELE-001',
    nombre: 'Instalación de Red Eléctrica Residencial',
    descripcion: 'Instalación completa de red eléctrica residencial',
    valor: 180000,
    categoria: 'Instalación',
  },
  {
    id: 'SER-002',
    codigo: 'SERV-ELE-002',
    nombre: 'Mantenimiento Preventivo Eléctrico',
    descripcion: 'Revisión y mantenimiento preventivo de instalaciones eléctricas',
    valor: 120000,
    categoria: 'Mantenimiento',
  },
  {
    id: 'SER-003',
    codigo: 'SERV-ELE-003',
    nombre: 'Diagnóstico y Reparación de Fallas',
    descripcion: 'Diagnóstico técnico y reparación de fallas eléctricas',
    valor: 95000,
    categoria: 'Reparación',
  },
  {
    id: 'SER-004',
    codigo: 'SERV-ELE-004',
    nombre: 'Instalación de Tablero Eléctrico',
    descripcion: 'Instalación y configuración de tablero eléctrico',
    valor: 150000,
    categoria: 'Instalación',
  },
];

export function CrearCotizacion({
  cotizacionInicial,
  esSoloLectura = false,
  onVolver,
  onGuardar,
}) {
  const { theme: temaGlobal, toggleTheme } = useContext(ThemeContext);

  const esOscuro = temaGlobal === 'dark';

  // --- ESTADO FK CLIENTE ---

  const [clienteId, setClienteId] = useState(
    cotizacionInicial?.clienteId || CATALOGO_CLIENTES[0].id
  );

  const [clienteNombre, setClienteNombre] = useState(
    cotizacionInicial?.clienteNombre || CATALOGO_CLIENTES[0].nombre
  );

  const [direccion, setDireccion] = useState(
    cotizacionInicial?.direccion || CATALOGO_CLIENTES[0].direccion
  );

  // --- ESTADO FK SERVICIO ---

  const [servicioId, setServicioId] = useState(
    cotizacionInicial?.servicioId || CATALOGO_SERVICIOS[0].id
  );

  const [servicioNombre, setServicioNombre] = useState(
    cotizacionInicial?.servicioNombre || CATALOGO_SERVICIOS[0].nombre
  );

  const [valorServicio, setValorServicio] = useState(
    cotizacionInicial?.valorServicio ?? CATALOGO_SERVICIOS[0].valor
  );

  // --- ESTADOS GENERALES ---

  const [fechaEmision, setFechaEmision] = useState(
    cotizacionInicial?.fechaEmision || '2026-09-26'
  );

  const [diasVigencia, setDiasVigencia] = useState(
    cotizacionInicial?.diasVigencia || 30
  );

  const [ivaPorcentaje, setIvaPorcentaje] = useState(
    cotizacionInicial?.ivaPorcentaje ?? 16
  );

  const [descuento, setDescuento] = useState(
    cotizacionInicial?.descuento || 0
  );

  const [notas, setNotas] = useState(
    cotizacionInicial?.notas || 'Garantía de 12 meses en mano de obra.'
  );

  const [estadoDocumento, setEstadoDocumento] = useState(
    cotizacionInicial?.estadoDocumento || 'Aprobado'
  );

  const [fkSeleccionadaCatalogo, setFkSeleccionadaCatalogo] = useState(
    CATALOGO_MATERIALES[0].id
  );

  const [items, setItems] = useState(
    cotizacionInicial?.items || [
      {
        id: 1,
        materialId: 'EL-BUS-585',
        sku: 'ELE-BUS-585-MOD',
        ean: '7701234567890',
        descripcion: 'Instalación de Tablero de Distribución Principal',
        cantidad: 1,
        precioUnit: 4500,
      },
    ]
  );

  const primerItem = items[0] || {
    materialId: 'GRAL',
    sku: '001',
  };

  const numeroCotizacion =
    cotizacionInicial?.id ||
    `COT-${primerItem.materialId}-${primerItem.sku}`;

  const theme = {
    bg: esOscuro ? '#0b1329' : '#f1f5f9',
    cardBg: esOscuro ? '#182642' : '#ffffff',
    inputBg: esOscuro ? '#0f172a' : '#f8fafc',
    borderColor: esOscuro ? '#213459' : '#e2e8f0',
    inputBorder: esOscuro ? '#243556' : '#cbd5e1',
    textColor: esOscuro ? '#ffffff' : '#0f172a',
    subtextColor: esOscuro ? '#94a3b8' : '#64748b',
    accentYellow: '#facc15',
  };

  // --- CÁLCULOS ---

  const subtotalMateriales = items.reduce(
    (acc, curr) => acc + curr.cantidad * curr.precioUnit,
    0
  );

  const subtotalBruto = subtotalMateriales + valorServicio;

  const baseImponible = Math.max(subtotalBruto - descuento, 0);

  const montoImpuesto = (baseImponible * ivaPorcentaje) / 100;

  const totalNeto = baseImponible + montoImpuesto;

  const formatearMoneda = (val) =>
    '$ ' +
    Number(val).toLocaleString('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // --- MANEJADOR DE CAMBIO DE FK CLIENTE ---

  const handleCambiarClienteFK = (nuevaFk) => {
    const cli = CATALOGO_CLIENTES.find((c) => c.id === nuevaFk);

    if (cli) {
      setClienteId(cli.id);
      setClienteNombre(cli.nombre);
      setDireccion(cli.direccion);
    }
  };

  // --- MANEJADOR DE CAMBIO DE FK SERVICIO ---

  const handleCambiarServicioFK = (nuevaFk) => {
    const servicio = CATALOGO_SERVICIOS.find(
      (s) => s.id === nuevaFk
    );

    if (servicio) {
      setServicioId(servicio.id);
      setServicioNombre(servicio.nombre);
      setValorServicio(servicio.valor);
    }
  };

  // --- FK MATERIAL ---

  const cambiarFKItem = (idFila, nuevaFK) => {
    const mat = CATALOGO_MATERIALES.find(
      (m) => m.id === nuevaFK
    );

    setItems(
      items.map((item) =>
        item.id === idFila
          ? {
              ...item,
              materialId: nuevaFK,
              sku: mat?.sku || '',
              ean: mat?.ean || '',
              descripcion:
                mat?.descripcion || item.descripcion,
              precioUnit:
                mat?.precioUnit || item.precioUnit,
            }
          : item
      )
    );
  };

  const agregarItemDesdeCatalogo = () => {
    const mat =
      CATALOGO_MATERIALES.find(
        (m) => m.id === fkSeleccionadaCatalogo
      ) || CATALOGO_MATERIALES[0];

    setItems([
      ...items,
      {
        id: Date.now(),
        materialId: mat.id,
        sku: mat.sku,
        ean: mat.ean,
        descripcion: mat.descripcion,
        cantidad: 1,
        precioUnit: mat.precioUnit,
      },
    ]);
  };

  const eliminarItem = (id) =>
    setItems(items.filter((item) => item.id !== id));

  const actualizarCampo = (id, campo, valor) =>
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              [campo]: valor,
            }
          : item
      )
    );

  // --- GUARDAR COTIZACIÓN ---

  const guardarProceso = () => {
    const cotizacionObjeto = {
      id: numeroCotizacion,

      // FK CLIENTE
      clienteId,
      clienteNombre,
      direccion,

      // FK SERVICIO
      servicioId,
      servicioNombre,
      valorServicio,

      // DATOS GENERALES
      fechaEmision,
      diasVigencia,
      ivaPorcentaje,
      descuento,
      notas,
      estadoDocumento,

      // MATERIALES
      items,

      // TOTALES
      subtotalMateriales,
      subtotalBruto,
      montoImpuesto,
      totalNeto,
    };

    onGuardar(cotizacionObjeto);
  };

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        color: theme.textColor,
        minHeight: '100vh',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '11px',
              color: theme.subtextColor,
              fontWeight: 'bold',
            }}
          >
            {esSoloLectura
              ? 'MODO LECTURA / DETALLE'
              : 'NUEVA COTIZACIÓN'}
          </span>

          <h1
            style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 'bold',
            }}
          >
            {numeroCotizacion}
          </h1>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
          }}
        >
          <button
            onClick={toggleTheme}
            style={{
              backgroundColor: theme.cardBg,
              color: theme.textColor,
              border: `1px solid ${theme.borderColor}`,
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            {esOscuro ? '☀️ Claro' : '🌙 Oscuro'}
          </button>

          <button
            onClick={onVolver}
            style={{
              backgroundColor: theme.cardBg,
              color: theme.textColor,
              border: `1px solid ${theme.borderColor}`,
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            ← Volver al Listado
          </button>

          {!esSoloLectura && (
            <button
              onClick={guardarProceso}
              style={{
                backgroundColor: theme.accentYellow,
                color: '#000',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              💾 Guardar Cotización
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '20px',
        }}
      >
        {/* COLUMNA IZQUIERDA */}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* SECCIÓN CLIENTE */}

          <div
            style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.borderColor}`,
              borderRadius: '12px',
              padding: '18px',
            }}
          >
            <h3
              style={{
                margin: '0 0 14px 0',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              👤 Datos del Cliente (FK Externa)
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
              }}
            >
              {/* SELECTOR FK CLIENTE */}

              <div style={{ gridColumn: 'span 2' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    color: theme.subtextColor,
                    fontWeight: 'bold',
                    marginBottom: '4px',
                  }}
                >
                  CLAVE FORÁNEA CLIENTE (FK)
                </label>

                <select
                  disabled={esSoloLectura}
                  value={clienteId}
                  onChange={(e) =>
                    handleCambiarClienteFK(e.target.value)
                  }
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: theme.inputBg,
                    border: `1px solid ${theme.inputBorder}`,
                    color: theme.accentYellow,
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    outline: 'none',
                  }}
                >
                  {CATALOGO_CLIENTES.map((cli) => (
                    <option
                      key={cli.id}
                      value={cli.id}
                    >
                      [{cli.id}] - {cli.nombre} ({cli.nit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    color: theme.subtextColor,
                    fontWeight: 'bold',
                    marginBottom: '4px',
                  }}
                >
                  NOMBRE / RAZÓN SOCIAL
                </label>

                <input
                  disabled
                  type="text"
                  value={clienteNombre}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: theme.inputBg,
                    border: `1px solid ${theme.inputBorder}`,
                    color: theme.subtextColor,
                    padding: '6px',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    color: theme.subtextColor,
                    fontWeight: 'bold',
                    marginBottom: '4px',
                  }}
                >
                  DIRECCIÓN REGISTRADA
                </label>

                <input
                  disabled
                  type="text"
                  value={direccion}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: theme.inputBg,
                    border: `1px solid ${theme.inputBorder}`,
                    color: theme.subtextColor,
                    padding: '6px',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN SERVICIO CON FK */}

          <div
            style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.borderColor}`,
              borderRadius: '12px',
              padding: '18px',
            }}
          >
            <h3
              style={{
                margin: '0 0 14px 0',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              🔧 Servicio (FK Catálogo de Servicios)
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <div style={{ gridColumn: 'span 2' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    color: theme.subtextColor,
                    fontWeight: 'bold',
                    marginBottom: '4px',
                  }}
                >
                  CLAVE FORÁNEA SERVICIO (FK)
                </label>

                <select
                  disabled={esSoloLectura}
                  value={servicioId}
                  onChange={(e) =>
                    handleCambiarServicioFK(e.target.value)
                  }
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: theme.inputBg,
                    border: `1px solid ${theme.inputBorder}`,
                    color: theme.accentYellow,
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    outline: 'none',
                  }}
                >
                  {CATALOGO_SERVICIOS.map((servicio) => (
                    <option
                      key={servicio.id}
                      value={servicio.id}
                    >
                      [{servicio.id}] {servicio.nombre} -{' '}
                      {formatearMoneda(servicio.valor)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    color: theme.subtextColor,
                    fontWeight: 'bold',
                    marginBottom: '4px',
                  }}
                >
                  SERVICIO SELECCIONADO
                </label>

                <input
                  disabled
                  type="text"
                  value={servicioNombre}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: theme.inputBg,
                    border: `1px solid ${theme.inputBorder}`,
                    color: theme.subtextColor,
                    padding: '6px',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    color: theme.subtextColor,
                    fontWeight: 'bold',
                    marginBottom: '4px',
                  }}
                >
                  VALOR DEL SERVICIO
                </label>

                <input
                  disabled
                  type="text"
                  value={formatearMoneda(valorServicio)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: theme.inputBg,
                    border: `1px solid ${theme.inputBorder}`,
                    color: theme.accentYellow,
                    padding: '6px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
              </div>
            </div>
          </div>

          {/* AGREGAR MATERIAL CON FK */}

          {!esSoloLectura && (
            <div
              style={{
                backgroundColor: theme.cardBg,
                border: `1px dashed ${theme.accentYellow}`,
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <select
                value={fkSeleccionadaCatalogo}
                onChange={(e) =>
                  setFkSeleccionadaCatalogo(e.target.value)
                }
                style={{
                  flex: 1,
                  backgroundColor: theme.inputBg,
                  color: theme.textColor,
                  border: `1px solid ${theme.inputBorder}`,
                  padding: '6px',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                {CATALOGO_MATERIALES.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    [{item.id}] {item.descripcion}
                  </option>
                ))}
              </select>

              <button
                onClick={agregarItemDesdeCatalogo}
                style={{
                  backgroundColor: theme.accentYellow,
                  color: '#000',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                + Agregar Ítem
              </button>
            </div>
          )}

          {/* TABLA ÍTEMS */}

          <div
            style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.borderColor}`,
              borderRadius: '12px',
              padding: '18px',
            }}
          >
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
              }}
            >
              📦 Detalle de Materiales y Servicios
            </h3>

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px',
              }}
            >
              <thead>
                <tr
                  style={{
                    color: theme.subtextColor,
                    borderBottom: `1px solid ${theme.borderColor}`,
                    textAlign: 'left',
                  }}
                >
                  <th style={{ padding: '8px' }}>
                    FK / SKU
                  </th>

                  <th style={{ padding: '8px' }}>
                    DESCRIPCIÓN
                  </th>

                  <th
                    style={{
                      padding: '8px',
                      textAlign: 'center',
                    }}
                  >
                    CANT.
                  </th>

                  <th
                    style={{
                      padding: '8px',
                      textAlign: 'right',
                    }}
                  >
                    P. UNIT
                  </th>

                  <th
                    style={{
                      padding: '8px',
                      textAlign: 'right',
                    }}
                  >
                    SUBTOTAL
                  </th>

                  {!esSoloLectura && (
                    <th
                      style={{
                        padding: '8px',
                        textAlign: 'center',
                      }}
                    >
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: `1px solid ${theme.borderColor}`,
                    }}
                  >
                    <td
                      style={{
                        padding: '8px',
                        color: theme.accentYellow,
                        fontWeight: 'bold',
                      }}
                    >
                      {item.materialId}
                    </td>

                    <td style={{ padding: '8px' }}>
                      {item.descripcion}
                    </td>

                    <td
                      style={{
                        padding: '8px',
                        textAlign: 'center',
                      }}
                    >
                      {item.cantidad}
                    </td>

                    <td
                      style={{
                        padding: '8px',
                        textAlign: 'right',
                      }}
                    >
                      {formatearMoneda(item.precioUnit)}
                    </td>

                    <td
                      style={{
                        padding: '8px',
                        textAlign: 'right',
                        fontWeight: 'bold',
                      }}
                    >
                      {formatearMoneda(
                        item.cantidad * item.precioUnit
                      )}
                    </td>

                    {!esSoloLectura && (
                      <td
                        style={{
                          padding: '8px',
                          textAlign: 'center',
                        }}
                      >
                        <button
                          onClick={() =>
                            eliminarItem(item.id)
                          }
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          ❌
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {/* SERVICIO EN LA TABLA */}

                <tr
                  style={{
                    borderBottom: `1px solid ${theme.borderColor}`,
                  }}
                >
                  <td
                    style={{
                      padding: '8px',
                      color: theme.accentYellow,
                      fontWeight: 'bold',
                    }}
                  >
                    {servicioId}
                  </td>

                  <td style={{ padding: '8px' }}>
                    {servicioNombre}
                  </td>

                  <td
                    style={{
                      padding: '8px',
                      textAlign: 'center',
                    }}
                  >
                    1
                  </td>

                  <td
                    style={{
                      padding: '8px',
                      textAlign: 'right',
                    }}
                  >
                    {formatearMoneda(valorServicio)}
                  </td>

                  <td
                    style={{
                      padding: '8px',
                      textAlign: 'right',
                      fontWeight: 'bold',
                    }}
                  >
                    {formatearMoneda(valorServicio)}
                  </td>

                  {!esSoloLectura && (
                    <td
                      style={{
                        padding: '8px',
                        textAlign: 'center',
                      }}
                    >
                      🔧
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMNA DERECHA */}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.borderColor}`,
              borderRadius: '12px',
              padding: '18px',
            }}
          >
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
              }}
            >
              💳 Resumen
            </h3>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '12px',
              }}
            >
              {/* MATERIALES */}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Materiales:</span>

                <span>
                  {formatearMoneda(subtotalMateriales)}
                </span>
              </div>

              {/* SERVICIO */}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Servicio:</span>

                <span>
                  {formatearMoneda(valorServicio)}
                </span>
              </div>

              {/* SUBTOTAL */}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold',
                }}
              >
                <span>Subtotal:</span>

                <span>
                  {formatearMoneda(subtotalBruto)}
                </span>
              </div>

              {/* IVA */}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  IVA ({ivaPorcentaje}%):
                </span>

                <span>
                  {formatearMoneda(montoImpuesto)}
                </span>
              </div>

              {/* TOTAL */}

              <div
                style={{
                  backgroundColor: theme.accentYellow,
                  color: '#000',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  marginTop: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                  }}
                >
                  TOTAL A PAGAR
                </span>

                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                  }}
                >
                  {formatearMoneda(totalNeto)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CrearCotizacion;