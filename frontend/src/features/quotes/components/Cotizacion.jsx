import { useContext, useEffect, useState } from 'react';
import { CrearCotizacion } from './CrearCotizacion';
import { ThemeContext } from '../../../shared/context/ThemeContext.jsx';
import { EstadoToggle, ESTADOS, estadoSiguiente } from '../../../shared/components/EstadoToggle.jsx';
import { AccionesFila } from '../../../shared/components/AccionesFila.jsx';

const CATALOGO_MATERIALES = [
  {
    id: 'EL-BUS-585',
    sku: 'ELE-BUS-585-MOD',
    ean: '7701234567890',
    descripcion: 'Instalación de Tablero de Distribución Principal',
    precioUnit: 4500,
    categoria: 'Mano de Obra'
  },
  {
    id: 'EL-CAB-254',
    sku: 'ELE-CAB-254-PWR',
    ean: '7704567890123',
    descripcion: 'Cable de Cobre THHN Calibre 8 AWG (Rollo x 100m)',
    precioUnit: 2800,
    categoria: 'Conductores'
  },
  {
    id: 'EL-INT-101',
    sku: 'ELE-INT-101-BRK',
    ean: '7709876543210',
    descripcion: 'Interruptor Termomagnético 20A 2P Carga Alta',
    precioUnit: 650,
    categoria: 'Protección'
  },
  {
    id: 'EL-CON-012',
    sku: 'ELE-CON-012-DUX',
    ean: '7705554443332',
    descripcion: 'Tubo Conduit Pared Gruesa 3/4" (Tramo 3m)',
    precioUnit: 320,
    categoria: 'Canalización'
  }
];

const CATALOGO_SERVICIOS = [
  {
    id: 'SER-001',
    codigo: 'SERV-ELE-001',
    nombre: 'Instalación de Red Eléctrica Residencial',
    valor: 180000
  },
  {
    id: 'SER-002',
    codigo: 'SERV-ELE-002',
    nombre: 'Mantenimiento Preventivo Eléctrico',
    valor: 120000
  },
  {
    id: 'SER-003',
    codigo: 'SERV-ELE-003',
    nombre: 'Diagnóstico y Reparación de Fallas',
    valor: 95000
  },
  {
    id: 'SER-004',
    codigo: 'SERV-ELE-004',
    nombre: 'Instalación de Tablero Eléctrico',
    valor: 150000
  }
];

const COTIZACIONES_INICIALES = [
  {
    id: 'COT-2023-0084',
    cliente: 'Constructora Horizonte S.A.',
    clienteId: 'CLI-002',
    proyecto: 'Instalación Eléctrica Edificio Mirador',
    direccion: 'Calle 50 # 12-34, Parque Industrial, Bogotá',
    fecha: '2023-10-27',
    fechaEmision: '2023-10-27',
    diasVigencia: 30,
    ivaPorcentaje: 16,
    descuento: 0,
    servicioId: 'SER-001',
    servicioNombre: 'Instalación de Red Eléctrica Residencial',
    valorServicio: 180000,
    items: [
      {
        id: 1,
        materialId: 'EL-BUS-585',
        sku: 'ELE-BUS-585-MOD',
        ean: '7701234567890',
        descripcion: 'Barra de Cobre 50x5mm',
        cantidad: 1,
        precioUnit: 1918362
      }
    ],
    subtotalMateriales: 1918362,
    subtotalBruto: 2098362,
    montoImpuesto: 0,
    totalNeto: 2095300,
    total: 2095300,
    estadoCotizacion: 'Aprobado',
    notas: 'Garantía de 12 meses en mano de obra.'
  },
  {
    id: 'COT-2023-0083',
    cliente: 'Industrias Alfa S.A.',
    clienteId: 'CLI-003',
    proyecto: 'Mantenimiento de Tableros Industriales',
    direccion: 'Medellín',
    fecha: '2023-10-20',
    fechaEmision: '2023-10-20',
    diasVigencia: 30,
    ivaPorcentaje: 16,
    descuento: 0,
    servicioId: 'SER-002',
    servicioNombre: 'Mantenimiento Preventivo Eléctrico',
    valorServicio: 120000,
    items: [
      {
        id: 2,
        materialId: 'EL-INT-101',
        sku: 'ELE-CB-1003-IND',
        ean: '7709876543210',
        descripcion: 'Interruptor 3P 100A',
        cantidad: 1,
        precioUnit: 4380000
      }
    ],
    subtotalMateriales: 4380000,
    subtotalBruto: 4500000,
    montoImpuesto: 0,
    totalNeto: 4500000,
    total: 4500000,
    estadoCotizacion: 'Pendiente',
    notas: 'Mantenimiento de tableros industriales.'
  },
  {
    id: 'COT-2023-0082',
    cliente: 'Comercializadora del Norte',
    clienteId: 'CLI-003',
    proyecto: 'Acometida Eléctrica Trifásica',
    direccion: 'Av. Las Américas 88-10, Medellín',
    fecha: '2023-10-15',
    fechaEmision: '2023-10-15',
    diasVigencia: 30,
    ivaPorcentaje: 16,
    descuento: 0,
    servicioId: 'SER-004',
    servicioNombre: 'Instalación de Tablero Eléctrico',
    valorServicio: 150000,
    items: [
      {
        id: 3,
        materialId: 'EL-CAB-254',
        sku: 'ELE-CAB-254-PWR',
        ean: '7704567890123',
        descripcion: 'Cable XLPE 4C 25mm²',
        cantidad: 1,
        precioUnit: 1700000
      }
    ],
    subtotalMateriales: 1700000,
    subtotalBruto: 1850000,
    montoImpuesto: 0,
    totalNeto: 1850000,
    total: 1850000,
    estadoCotizacion: 'Aprobado',
    notas: 'Instalación de acometida eléctrica trifásica.'
  },
  {
    id: 'COT-2023-0081',
    cliente: 'Residencial Los Álamos',
    clienteId: 'CLI-001',
    proyecto: 'Iluminación LED Áreas Comunes',
    direccion: 'Bogotá',
    fecha: '2023-10-10',
    fechaEmision: '2023-10-10',
    diasVigencia: 30,
    ivaPorcentaje: 16,
    descuento: 0,
    servicioId: 'SER-003',
    servicioNombre: 'Diagnóstico y Reparación de Fallas',
    valorServicio: 95000,
    items: [
      {
        id: 4,
        materialId: 'EL-TRF-002',
        sku: 'ELE-TRF-002-KVA',
        ean: '7703216549870',
        descripcion: 'Transformador Control 2kVA',
        cantidad: 1,
        precioUnit: 825000
      }
    ],
    subtotalMateriales: 825000,
    subtotalBruto: 920000,
    montoImpuesto: 0,
    totalNeto: 920000,
    total: 920000,
    estadoCotizacion: 'Rechazado',
    notas: 'Proyecto de iluminación LED.'
  }
];

const STORAGE_KEY = 'cotizaciones_electricos_mca';

export function Cotizaciones() {
  const { theme: temaGlobal, toggleTheme } = useContext(ThemeContext);
  const esModoOscuro = temaGlobal === 'dark';

  const [cotizaciones, setCotizaciones] = useState(() => {
    try {
      const guardadas = localStorage.getItem(STORAGE_KEY);

      if (guardadas) {
        const datos = JSON.parse(guardadas);

        return datos.map((cotizacion) => normalizarCotizacion(cotizacion));
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(COTIZACIONES_INICIALES)
      );

      return COTIZACIONES_INICIALES;
    } catch {
      return COTIZACIONES_INICIALES;
    }
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [cotizacionEnEdicion, setCotizacionEnEdicion] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  const [cotizacionDetalle, setCotizacionDetalle] = useState(null);

  const [mensaje, setMensaje] = useState('');

  function normalizarCotizacion(cotizacion) {
    let items = Array.isArray(cotizacion.items)
      ? cotizacion.items
      : [];

    if (items.length === 0 && cotizacion.materialId) {
      items = [
        {
          id: Date.now(),
          materialId: cotizacion.materialId,
          sku: cotizacion.sku || '',
          ean: cotizacion.ean || '',
          descripcion:
            cotizacion.materialNombre || 'Material',
          cantidad: 1,
          precioUnit: Number(cotizacion.total || 0)
        }
      ];
    }

    const servicio =
      CATALOGO_SERVICIOS.find(
        (s) => s.id === cotizacion.servicioId
      );

    const valorServicio = Number(
      cotizacion.valorServicio ??
        servicio?.valor ??
        0
    );

    const subtotalMateriales = items.reduce(
      (acc, item) =>
        acc +
        Number(item.cantidad || 0) *
        Number(item.precioUnit || 0),
      0
    );

    const descuento = Number(cotizacion.descuento || 0);

    const ivaPorcentaje = Number(
      cotizacion.ivaPorcentaje ?? 0
    );

    const subtotalBruto =
      subtotalMateriales + valorServicio;

    const baseImponible = Math.max(
      subtotalBruto - descuento,
      0
    );

    const montoImpuesto =
      (baseImponible * ivaPorcentaje) / 100;

    const totalCalculado =
      baseImponible + montoImpuesto;

    return {
      ...cotizacion,
      items,
      servicioId:
        cotizacion.servicioId ||
        CATALOGO_SERVICIOS[0].id,
      servicioNombre:
        cotizacion.servicioNombre ||
        servicio?.nombre ||
        CATALOGO_SERVICIOS[0].nombre,
      valorServicio,
      subtotalMateriales,
      subtotalBruto,
      montoImpuesto,
      totalNeto:
        cotizacion.totalNeto !== undefined
          ? Number(cotizacion.totalNeto)
          : Number(
              cotizacion.total || totalCalculado
            ),
      total:
        cotizacion.totalNeto !== undefined
          ? Number(cotizacion.totalNeto)
          : Number(
              cotizacion.total || totalCalculado
            )
    };
  }

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(cotizaciones)
    );
  }, [cotizaciones]);

  const formatearCOP = (valor) => {
    return (
      '$ ' +
      Number(valor || 0).toLocaleString('es-CO')
    );
  };

  const mostrarMensaje = (texto, tiempo = 2500) => {
    setMensaje(texto);

    setTimeout(() => {
      setMensaje('');
    }, tiempo);
  };

  const abrirEditar = (cotizacion) => {
    setCotizacionEnEdicion(
      normalizarCotizacion(cotizacion)
    );

    setModoEdicion(true);
  };

  const volverDeCrear = () => {
    setModoEdicion(false);
    setCotizacionEnEdicion(null);
  };

  const guardarCotizacionDesdeCrear = (
    nuevaCotizacion
  ) => {
    const datosNormalizados =
      normalizarCotizacion({
        ...nuevaCotizacion,

        cliente:
          nuevaCotizacion.cliente ||
          nuevaCotizacion.clienteNombre ||
          'Cliente sin nombre',

        proyecto:
          nuevaCotizacion.proyecto ||
          'Proyecto sin nombre',

        fecha:
          nuevaCotizacion.fecha ||
          nuevaCotizacion.fechaEmision ||
          new Date()
            .toISOString()
            .split('T')[0],

        total:
          nuevaCotizacion.totalNeto ??
          nuevaCotizacion.total ??
          0,

        totalNeto:
          nuevaCotizacion.totalNeto ??
          nuevaCotizacion.total ??
          0,

        estadoCotizacion:
          nuevaCotizacion.estadoCotizacion ||
          nuevaCotizacion.estadoDocumento ||
          'Pendiente'
      });

    if (cotizacionEnEdicion) {
      setCotizaciones((prev) =>
        prev.map((item) =>
          item.id === cotizacionEnEdicion.id
            ? {
                ...datosNormalizados,
                id: cotizacionEnEdicion.id
              }
            : item
        )
      );

      mostrarMensaje(
        'Cotización actualizada correctamente.'
      );
    } else {
      setCotizaciones((prev) => [
        datosNormalizados,
        ...prev
      ]);

      mostrarMensaje(
        'Nueva cotización creada y guardada correctamente.',
        3000
      );
    }

    setModoEdicion(false);
    setCotizacionEnEdicion(null);
  };

  const cambiarEstadoSiguiente = (id) => {
    setCotizaciones((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            estadoCotizacion: estadoSiguiente(
              ESTADOS.cotizacion,
              item.estadoCotizacion
            )
          };
        }

        return item;
      })
    );
  };

  const cotizacionesFiltradas =
    cotizaciones.filter((c) => {
      const term = busqueda.toLowerCase();

      const coincideTexto =
        String(c.cliente || '')
          .toLowerCase()
          .includes(term) ||
        String(c.id || '')
          .toLowerCase()
          .includes(term) ||
        String(c.proyecto || '')
          .toLowerCase()
          .includes(term) ||
        String(c.servicioId || '')
          .toLowerCase()
          .includes(term) ||
        String(c.servicioNombre || '')
          .toLowerCase()
          .includes(term);

      const coincideEstado =
        filtroEstado === 'Todos' ||
        c.estadoCotizacion === filtroEstado;

      return coincideTexto && coincideEstado;
    });

  const totalCotizado = cotizaciones.reduce(
    (acc, curr) =>
      acc + Number(curr.totalNeto ?? curr.total ?? 0),
    0
  );

  const aprobadasCount = cotizaciones.filter(
    (c) => c.estadoCotizacion === 'Aprobado'
  ).length;

  const pendientesCount = cotizaciones.filter(
    (c) => c.estadoCotizacion === 'Pendiente'
  ).length;

  const eliminarCotizacion = (id) => {
    if (
      confirm(
        `¿Estás seguro de eliminar la cotización ${id}?`
      )
    ) {
      setCotizaciones((prev) =>
        prev.filter((c) => c.id !== id)
      );

      mostrarMensaje(
        'Cotización eliminada correctamente.'
      );
    }
  };

  const prepararCotizacionParaEditar = () => {
    if (!cotizacionEnEdicion) {
      return undefined;
    }

    const cotizacion =
      normalizarCotizacion(cotizacionEnEdicion);

    return {
      ...cotizacion,

      clienteId:
        cotizacion.clienteId || 'CLI-001',

      clienteNombre:
        cotizacion.cliente ||
        cotizacion.clienteNombre ||
        'Cliente sin nombre',

      direccion:
        cotizacion.direccion || '',

      fechaEmision:
        cotizacion.fechaEmision ||
        cotizacion.fecha ||
        new Date()
          .toISOString()
          .split('T')[0],

      diasVigencia:
        cotizacion.diasVigencia || 30,

      ivaPorcentaje:
        cotizacion.ivaPorcentaje ?? 0,

      descuento:
        cotizacion.descuento || 0,

      notas:
        cotizacion.notas || '',

      estadoDocumento:
        cotizacion.estadoCotizacion ||
        'Pendiente',

      servicioId:
        cotizacion.servicioId ||
        CATALOGO_SERVICIOS[0].id,

      servicioNombre:
        cotizacion.servicioNombre ||
        CATALOGO_SERVICIOS[0].nombre,

      valorServicio:
        Number(cotizacion.valorServicio || 0),

      items:
        cotizacion.items || []
    };
  };

  if (modoEdicion) {
    return (
      <CrearCotizacion
        cotizacionInicial={
          prepararCotizacionParaEditar()
        }
        esSoloLectura={false}
        onVolver={volverDeCrear}
        onGuardar={guardarCotizacionDesdeCrear}
      />
    );
  }

  const theme = {
    bg: esModoOscuro
      ? '#0b1329'
      : '#f8fafc',

    cardBg: esModoOscuro
      ? '#182642'
      : '#ffffff',

    inputBg: esModoOscuro
      ? '#0f172a'
      : '#f1f5f9',

    borderColor: esModoOscuro
      ? '#213459'
      : '#e2e8f0',

    inputBorder: esModoOscuro
      ? '#243556'
      : '#cbd5e1',

    textColor: esModoOscuro
      ? '#ffffff'
      : '#0f172a',

    subtextColor: esModoOscuro
      ? '#94a3b8'
      : '#64748b',

    btnPrimaryBg: esModoOscuro
      ? '#facc15'
      : '#ca8a04',

    btnPrimaryText: esModoOscuro
      ? '#0f172a'
      : '#ffffff'
  };

  return (
    <div
      style={{
        padding: '28px',
        color: theme.textColor,
        backgroundColor: theme.bg,
        minHeight: '100vh',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {mensaje && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: esModoOscuro
              ? '#facc15'
              : '#ca8a04',
            color: esModoOscuro
              ? '#0f172a'
              : '#ffffff',
            padding: '12px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 'bold',
            zIndex: 3000,
            boxShadow:
              '0 8px 20px rgba(0,0,0,0.25)'
          }}
        >
          ✓ {mensaje}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 'bold'
            }}
          >
            Gestión de Cotizaciones
          </h1>

          <p
            style={{
              margin: '4px 0 0',
              fontSize: '13px',
              color: theme.subtextColor
            }}
          >
            Administra, consulta y modifica tus cotizaciones.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}
        >
          <button
            onClick={toggleTheme}
            style={{
              backgroundColor: theme.cardBg,
              color: theme.textColor,
              border: `1px solid ${theme.borderColor}`,
              padding: '8px 14px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            {esModoOscuro
              ? '☀️ Modo Claro'
              : '🌙 Modo Oscuro'}
          </button>

          <button
            onClick={() => {
              setCotizacionEnEdicion(null);
              setModoEdicion(true);
            }}
            style={{
              backgroundColor: theme.btnPrimaryBg,
              color: theme.btnPrimaryText,
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            ➕ Nueva Cotización
          </button>
        </div>
      </div>

      {/* MÉTRICAS */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.borderColor}`,
            borderRadius: '12px',
            padding: '16px'
          }}
        >
          <span
            style={{
              fontSize: '11px',
              color: theme.subtextColor,
              fontWeight: 'bold'
            }}
          >
            TOTAL COTIZADO
          </span>

          <div
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginTop: '4px'
            }}
          >
            {formatearCOP(totalCotizado)}
          </div>
        </div>

        <div
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.borderColor}`,
            borderRadius: '12px',
            padding: '16px'
          }}
        >
          <span
            style={{
              fontSize: '11px',
              color: theme.subtextColor,
              fontWeight: 'bold'
            }}
          >
            APROBADAS
          </span>

          <div
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginTop: '4px',
              color: '#16a34a'
            }}
          >
            {aprobadasCount}
          </div>
        </div>

        <div
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.borderColor}`,
            borderRadius: '12px',
            padding: '16px'
          }}
        >
          <span
            style={{
              fontSize: '11px',
              color: theme.subtextColor,
              fontWeight: 'bold'
            }}
          >
            PENDIENTES
          </span>

          <div
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginTop: '4px',
              color: '#d97706'
            }}
          >
            {pendientesCount}
          </div>
        </div>
      </div>

      {/* FILTROS */}

      <div
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.borderColor}`,
          borderRadius: '12px 12px 0 0',
          padding: '16px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <input
          type="text"
          placeholder="🔍 Buscar por N° Cotización, Cliente, Servicio..."
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
          style={{
            flex: 1,
            minWidth: '280px',
            backgroundColor: theme.inputBg,
            border: `1px solid ${theme.inputBorder}`,
            color: theme.textColor,
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            outline: 'none'
          }}
        />

        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: theme.subtextColor,
              fontWeight: 'bold'
            }}
          >
            Estado:
          </span>

          <select
            value={filtroEstado}
            onChange={(e) =>
              setFiltroEstado(e.target.value)
            }
            style={{
              backgroundColor: theme.inputBg,
              border: `1px solid ${theme.inputBorder}`,
              color: theme.textColor,
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          >
            <option value="Todos">Todos</option>
            <option value="Aprobado">
              Aprobado
            </option>
            <option value="Pendiente">
              Pendiente
            </option>
            <option value="Rechazado">
              Rechazado
            </option>
          </select>
        </div>
      </div>

      {/* LISTADO GENERAL */}

      <div
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.borderColor}`,
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          overflowX: 'auto'
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            textAlign: 'left'
          }}
        >
          <thead>
            <tr
              style={{
                color: theme.subtextColor,
                borderBottom: `1px solid ${theme.borderColor}`,
                backgroundColor: theme.inputBg,
                fontSize: '10px'
              }}
            >
              <th
                style={{
                  padding: '12px 16px'
                }}
              >
                CÓDIGO
              </th>

              <th
                style={{
                  padding: '12px 16px'
                }}
              >
                CLIENTE / PROYECTO
              </th>

              <th
                style={{
                  padding: '12px 16px'
                }}
              >
                SERVICIO
              </th>

              <th
                style={{
                  padding: '12px 16px'
                }}
              >
                FECHA
              </th>

              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'center'
                }}
              >
                ESTADO
              </th>

              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'right'
                }}
              >
                TOTAL
              </th>

              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'center'
                }}
              >
                ACCIONES
              </th>
            </tr>
          </thead>

          <tbody>
            {cotizacionesFiltradas.length > 0 ? (
              cotizacionesFiltradas.map((item) => {
                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: `1px solid ${theme.borderColor}`
                    }}
                  >
                    <td
                      style={{
                        padding: '12px 16px',
                        fontWeight: 'bold',
                        color: esModoOscuro
                          ? '#facc15'
                          : '#ca8a04'
                      }}
                    >
                      {item.id}
                    </td>

                    <td
                      style={{
                        padding: '12px 16px'
                      }}
                    >
                      <div
                        style={{
                          fontWeight: '600'
                        }}
                      >
                        {item.cliente}
                      </div>

                      <div
                        style={{
                          fontSize: '11px',
                          color: theme.subtextColor
                        }}
                      >
                        {item.proyecto}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: '12px 16px'
                      }}
                    >
                      <div
                        style={{
                          fontWeight: '600'
                        }}
                      >
                        {item.servicioNombre ||
                          'Sin servicio'}
                      </div>

                      <div
                        style={{
                          fontSize: '10px',
                          color: theme.subtextColor
                        }}
                      >
                        {item.servicioId ||
                          'SIN-FK'}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: '12px 16px'
                      }}
                    >
                      {item.fecha ||
                        item.fechaEmision ||
                        '—'}
                    </td>

                    <td
                      style={{
                        padding: '12px 16px',
                        textAlign: 'center'
                      }}
                    >
                      <EstadoToggle
                        estado={item.estadoCotizacion}
                        estados={ESTADOS.cotizacion}
                        onClick={() =>
                          cambiarEstadoSiguiente(item.id)
                        }
                      />
                    </td>

                    <td
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        fontSize: '13px'
                      }}
                    >
                      {formatearCOP(
                        item.totalNeto ??
                          item.total
                      )}
                    </td>

                    <td
                      style={{
                        padding: '12px 16px',
                        textAlign: 'center'
                      }}
                    >
                      <AccionesFila
                        onVer={() =>
                          setCotizacionDetalle(
                            normalizarCotizacion(item)
                          )
                        }
                        onEditar={() =>
                          abrirEditar(item)
                        }
                        onEliminar={() =>
                          eliminarCotizacion(item.id)
                        }
                        color={
                          esModoOscuro
                            ? '#cbd5e1'
                            : '#475569'
                        }
                      />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: 'center',
                    padding: '32px',
                    color: theme.subtextColor
                  }}
                >
                  No se encontraron cotizaciones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* =====================================================
          MODAL DETALLE
      ===================================================== */}

      {cotizacionDetalle && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor:
              'rgba(0,0,0,0.65)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: theme.cardBg,
              color: theme.textColor,
              width: '850px',
              maxWidth: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '14px',
              border: `1px solid ${theme.borderColor}`,
              boxShadow:
                '0 15px 40px rgba(0,0,0,0.4)'
            }}
          >
            {/* HEADER DETALLE */}

            <div
              style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${theme.borderColor}`,
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '18px'
                  }}
                >
                  Detalle de Cotización
                </h2>

                <span
                  style={{
                    fontSize: '11px',
                    color: theme.subtextColor
                  }}
                >
                  {cotizacionDetalle.id}
                </span>
              </div>

              <button
                onClick={() =>
                  setCotizacionDetalle(null)
                }
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.textColor,
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                padding: '24px'
              }}
            >
              {/* DATOS GENERALES */}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(2, 1fr)',
                  gap: '16px',
                  marginBottom: '24px'
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      color:
                        theme.subtextColor,
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}
                  >
                    CLIENTE
                  </span>

                  <strong>
                    {cotizacionDetalle.cliente ||
                      cotizacionDetalle.clienteNombre ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      color:
                        theme.subtextColor,
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}
                  >
                    PROYECTO
                  </span>

                  <strong>
                    {cotizacionDetalle.proyecto ||
                      '—'}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      color:
                        theme.subtextColor,
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}
                  >
                    FECHA DE EMISIÓN
                  </span>

                  {cotizacionDetalle.fechaEmision ||
                    cotizacionDetalle.fecha ||
                    '—'}
                </div>

                <div>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      color:
                        theme.subtextColor,
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}
                  >
                    VIGENCIA
                  </span>

                  {cotizacionDetalle.diasVigencia ||
                    30}{' '}
                  días
                </div>

                <div
                  style={{
                    gridColumn:
                      'span 2'
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      color:
                        theme.subtextColor,
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}
                  >
                    DIRECCIÓN
                  </span>

                  {cotizacionDetalle.direccion ||
                    '—'}
                </div>

                <div
                  style={{
                    gridColumn:
                      'span 2'
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      color:
                        theme.subtextColor,
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}
                  >
                    ESTADO
                  </span>

                  <strong>
                    {cotizacionDetalle.estadoCotizacion ||
                      '—'}
                  </strong>
                </div>
              </div>

              {/* SERVICIO */}

              <div
                style={{
                  backgroundColor:
                    theme.inputBg,
                  border: `1px solid ${theme.borderColor}`,
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '24px'
                }}
              >
                <h3
                  style={{
                    margin:
                      '0 0 14px 0',
                    fontSize: '14px'
                  }}
                >
                  🔧 Servicio contratado
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '150px 1fr 160px',
                    gap: '14px',
                    alignItems:
                      'center'
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '9px',
                        color:
                          theme.subtextColor,
                        fontWeight: 'bold'
                      }}
                    >
                      FK SERVICIO
                    </span>

                    <strong
                      style={{
                        color:
                          esModoOscuro
                            ? '#facc15'
                            : '#ca8a04'
                      }}
                    >
                      {cotizacionDetalle.servicioId ||
                        'SIN-FK'}
                    </strong>
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '9px',
                        color:
                          theme.subtextColor,
                        fontWeight: 'bold'
                      }}
                    >
                      SERVICIO
                    </span>

                    <strong>
                      {cotizacionDetalle.servicioNombre ||
                        'Sin servicio'}
                    </strong>
                  </div>

                  <div
                    style={{
                      textAlign:
                        'right'
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        fontSize: '9px',
                        color:
                          theme.subtextColor,
                        fontWeight: 'bold'
                      }}
                    >
                      VALOR
                    </span>

                    <strong
                      style={{
                        fontSize:
                          '15px'
                      }}
                    >
                      {formatearCOP(
                        cotizacionDetalle.valorServicio
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              {/* MATERIALES */}

              <div
                style={{
                  marginBottom: '24px'
                }}
              >
                <h3
                  style={{
                    margin:
                      '0 0 12px 0',
                    fontSize: '14px'
                  }}
                >
                  📦 Materiales utilizados
                </h3>

                <div
                  style={{
                    overflowX:
                      'auto',
                    border: `1px solid ${theme.borderColor}`,
                    borderRadius: '8px'
                  }}
                >
                  <table
                    style={{
                      width: '100%',
                      borderCollapse:
                        'collapse',
                      fontSize:
                        '11px'
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          backgroundColor:
                            theme.inputBg,
                          color:
                            theme.subtextColor
                        }}
                      >
                        <th
                          style={{
                            padding:
                              '10px',
                            textAlign:
                              'left'
                          }}
                        >
                          FK MATERIAL
                        </th>

                        <th
                          style={{
                            padding:
                              '10px',
                            textAlign:
                              'left'
                          }}
                        >
                          DESCRIPCIÓN
                        </th>

                        <th
                          style={{
                            padding:
                              '10px',
                            textAlign:
                              'center'
                          }}
                        >
                          CANT.
                        </th>

                        <th
                          style={{
                            padding:
                              '10px',
                            textAlign:
                              'right'
                          }}
                        >
                          P. UNIT.
                        </th>

                        <th
                          style={{
                            padding:
                              '10px',
                            textAlign:
                              'right'
                          }}
                        >
                          TOTAL
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {cotizacionDetalle.items &&
                      cotizacionDetalle.items.length >
                        0 ? (
                        cotizacionDetalle.items.map(
                          (material) => (
                            <tr
                              key={
                                material.id
                              }
                              style={{
                                borderTop: `1px solid ${theme.borderColor}`
                              }}
                            >
                              <td
                                style={{
                                  padding:
                                    '10px',
                                  color:
                                    esModoOscuro
                                      ? '#facc15'
                                      : '#ca8a04',
                                  fontWeight:
                                    'bold'
                                }}
                              >
                                {
                                  material.materialId
                                }
                              </td>

                              <td
                                style={{
                                  padding:
                                    '10px'
                                }}
                              >
                                {
                                  material.descripcion
                                }

                                <div
                                  style={{
                                    fontSize:
                                      '9px',
                                    color:
                                      theme.subtextColor,
                                    marginTop:
                                      '3px'
                                  }}
                                >
                                  SKU:{' '}
                                  {
                                    material.sku
                                  }{' '}
                                  | EAN:{' '}
                                  {
                                    material.ean
                                  }
                                </div>
                              </td>

                              <td
                                style={{
                                  padding:
                                    '10px',
                                  textAlign:
                                    'center'
                                }}
                              >
                                {
                                  material.cantidad
                                }
                              </td>

                              <td
                                style={{
                                  padding:
                                    '10px',
                                  textAlign:
                                    'right'
                                }}
                              >
                                {formatearCOP(
                                  material.precioUnit
                                )}
                              </td>

                              <td
                                style={{
                                  padding:
                                    '10px',
                                  textAlign:
                                    'right',
                                  fontWeight:
                                    'bold'
                                }}
                              >
                                {formatearCOP(
                                  Number(
                                    material.cantidad ||
                                      0
                                  ) *
                                    Number(
                                      material.precioUnit ||
                                        0
                                    )
                                )}
                              </td>
                            </tr>
                          )
                        )
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            style={{
                              padding:
                                '20px',
                              textAlign:
                                'center',
                              color:
                                theme.subtextColor
                            }}
                          >
                            No hay materiales
                            registrados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* NOTAS */}

              {cotizacionDetalle.notas && (
                <div
                  style={{
                    backgroundColor:
                      theme.inputBg,
                    border: `1px solid ${theme.borderColor}`,
                    borderRadius: '8px',
                    padding: '14px',
                    marginBottom: '20px'
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      color:
                        theme.subtextColor,
                      fontWeight: 'bold',
                      marginBottom:
                        '5px'
                    }}
                  >
                    NOTAS
                  </span>

                  {cotizacionDetalle.notas}
                </div>
              )}

              {/* RESUMEN */}

              <div
                style={{
                  marginLeft:
                    'auto',
                  width: '320px',
                  maxWidth:
                    '100%',
                  borderTop: `1px solid ${theme.borderColor}`,
                  paddingTop:
                    '14px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    marginBottom:
                      '8px',
                    fontSize:
                      '12px'
                  }}
                >
                  <span>
                    Materiales:
                  </span>

                  <span>
                    {formatearCOP(
                      cotizacionDetalle.subtotalMateriales
                    )}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    marginBottom:
                      '8px',
                    fontSize:
                      '12px'
                  }}
                >
                  <span>
                    Servicio:
                  </span>

                  <span>
                    {formatearCOP(
                      cotizacionDetalle.valorServicio
                    )}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    marginBottom:
                      '8px',
                    fontSize:
                      '12px'
                  }}
                >
                  <span>
                    Subtotal:
                  </span>

                  <span>
                    {formatearCOP(
                      cotizacionDetalle.subtotalBruto
                    )}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    marginBottom:
                      '8px',
                    fontSize:
                      '12px'
                  }}
                >
                  <span>
                    Descuento:
                  </span>

                  <span>
                    -{' '}
                    {formatearCOP(
                      cotizacionDetalle.descuento
                    )}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    marginBottom:
                      '12px',
                    fontSize:
                      '12px'
                  }}
                >
                  <span>
                    IVA (
                    {cotizacionDetalle.ivaPorcentaje ??
                      0}
                    %):
                  </span>

                  <span>
                    {formatearCOP(
                      cotizacionDetalle.montoImpuesto
                    )}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor:
                      theme.btnPrimaryBg,
                    color:
                      theme.btnPrimaryText,
                    padding:
                      '14px',
                    borderRadius:
                      '8px',
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'center'
                  }}
                >
                  <strong>
                    TOTAL
                  </strong>

                  <strong
                    style={{
                      fontSize:
                        '18px'
                    }}
                  >
                    {formatearCOP(
                      cotizacionDetalle.totalNeto ??
                        cotizacionDetalle.total
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '16px 24px',
                borderTop: `1px solid ${theme.borderColor}`
              }}
            >
              <button
                onClick={() =>
                  setCotizacionDetalle(null)
                }
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor:
                    theme.btnPrimaryBg,
                  color:
                    theme.btnPrimaryText,
                  border: 'none',
                  borderRadius: '7px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cotizaciones;