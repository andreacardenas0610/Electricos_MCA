import React, { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { EstadoToggle, ESTADOS } from '../components/EstadoToggle.jsx';
import { AccionesFila } from '../components/AccionesFila.jsx';

export function Materiales() {
  const { theme: temaGlobal, toggleTheme } = useContext(ThemeContext);
  const [busqueda, setBusqueda] = useState('');
  const [itemEditar, setItemEditar] = useState(null);
  const esModoOscuro = temaGlobal === 'dark';

  const [modalNuevaEntrada, setModalNuevaEntrada] = useState(false);

  const [nuevoMaterial, setNuevoMaterial] = useState({
    nombre: '',
    categoria: 'Conductores',
    id: '',
    stock: 0,
    unidad: 'unidades',
    estado: 'Óptimo'
  });

  const [materiales, setMateriales] = useState([
    {
      id: 'EL-BUS-585',
      nombre: 'Barra de Cobre 50x5mm',
      categoria: 'Conductores',
      stock: 142,
      unidad: 'm',
      estado: 'Óptimo'
    },
    {
      id: 'EL-CB-1003',
      nombre: 'Interruptor 3P 100A',
      categoria: 'Aparamenta',
      stock: 0,
      unidad: 'unidades',
      estado: 'Bajo Stock'
    },
    {
      id: 'EL-CAB-254',
      nombre: 'Cable XLPE 4C 25mm²',
      categoria: 'Cables',
      stock: 450,
      unidad: 'm',
      estado: 'Óptimo'
    },
    {
      id: 'EL-CON-025',
      nombre: 'Conducto PVC 25mm',
      categoria: 'Canalización',
      stock: 1200,
      unidad: 'm',
      estado: 'Óptimo'
    },
    {
      id: 'EL-TRF-002',
      nombre: 'Transformador Control 2kVA',
      categoria: 'Transformadores',
      stock: 2,
      unidad: 'unidades',
      estado: 'Crítico'
    },
    {
      id: 'EL-ACC-TRM4',
      nombre: 'Bloques Terminales 4mm²',
      categoria: 'Accesorios',
      stock: 2400,
      unidad: 'pz',
      estado: 'Óptimo'
    }
  ]);

  const theme = {
    bg: esModoOscuro ? '#0f172a' : '#f8fafc',
    cardBg: esModoOscuro ? '#182642' : '#ffffff',
    inputBg: esModoOscuro ? '#0b1329' : '#f1f5f9',
    borderColor: esModoOscuro ? '#213459' : '#e2e8f0',
    inputBorder: esModoOscuro ? '#243556' : '#cbd5e1',
    textColor: esModoOscuro ? '#ffffff' : '#0f172a',
    subtextColor: esModoOscuro ? '#94a3b8' : '#64748b',
    labelColor: esModoOscuro ? '#64748b' : '#475569',
    btnPrimaryBg: esModoOscuro ? '#facc15' : '#eab308',
    btnPrimaryText: esModoOscuro ? '#0f172a' : '#ffffff',
    btnSecBg: esModoOscuro ? '#1b2a47' : '#e2e8f0',
    btnSecText: esModoOscuro ? '#ffffff' : '#1e293b',
    tableBorder: esModoOscuro ? '#1b2a47' : '#f1f5f9',
    cardShadow: esModoOscuro
      ? 'none'
      : '0 1px 3px rgba(0,0,0,0.08)'
  };

  const toggleEstado = (id) => {
    setMateriales((actuales) =>
      actuales.map((item) => {
        if (item.id === id) {
          let siguienteEstado = 'Óptimo';

          if (item.estado === 'Óptimo') {
            siguienteEstado = 'Bajo Stock';
          } else if (item.estado === 'Bajo Stock') {
            siguienteEstado = 'Crítico';
          } else if (item.estado === 'Crítico') {
            siguienteEstado = 'Óptimo';
          }

          return {
            ...item,
            estado: siguienteEstado
          };
        }

        return item;
      })
    );
  };

  const handleEliminarMaterial = (id) => {
    const confirmar = window.confirm(
      '¿Estás seguro de que deseas eliminar este material?'
    );

    if (!confirmar) return;

    setMateriales((actuales) =>
      actuales.filter((item) => item.id !== id)
    );
  };

  const handleGuardarEdicion = (e) => {
    e.preventDefault();

    setMateriales((actuales) =>
      actuales.map((material) =>
        material.id === itemEditar.id
          ? itemEditar
          : material
      )
    );

    setItemEditar(null);
  };

  const handleCrearMaterial = (e) => {
    e.preventDefault();

    if (!nuevoMaterial.nombre || !nuevoMaterial.id) {
      alert(
        'Por favor completa los campos obligatorios (Nombre e ID).'
      );
      return;
    }

    const existe = materiales.some(
      (material) => material.id === nuevoMaterial.id
    );

    if (existe) {
      alert('Ya existe un material con ese ID.');
      return;
    }

    setMateriales((actuales) => [
      {
        ...nuevoMaterial,
        stock: Number(nuevoMaterial.stock) || 0
      },
      ...actuales
    ]);

    setNuevoMaterial({
      nombre: '',
      categoria: 'Conductores',
      id: '',
      stock: 0,
      unidad: 'unidades',
      estado: 'Óptimo'
    });

    setModalNuevaEntrada(false);
  };

  const materialesFiltrados = materiales.filter((material) => {
    const texto = busqueda.toLowerCase();

    return (
      material.nombre.toLowerCase().includes(texto) ||
      material.categoria.toLowerCase().includes(texto) ||
      material.id.toLowerCase().includes(texto)
    );
  });

  const materialesStockBajo = materiales.filter(
    (material) =>
      material.estado === 'Crítico' ||
      material.estado === 'Bajo Stock'
  ).length;

  return (
    <div
      style={{
        ...styles.container,
        backgroundColor: theme.bg,
        color: theme.textColor
      }}
    >
      {/* HEADER */}

      <div style={styles.topHeader}>
        <div>
          <h1
            style={{
              ...styles.title,
              color: theme.textColor
            }}
          >
            Gestión de Materiales
          </h1>

          <p
            style={{
              ...styles.subtitle,
              color: theme.subtextColor
            }}
          >
            Monitoreo y administración de componentes eléctricos
            industriales y flujo de inventario.
          </p>
        </div>

        <div style={styles.headerButtons}>
          <button
            onClick={toggleTheme}
            style={{
              ...styles.themeButton,
              backgroundColor: theme.cardBg,
              color: theme.textColor,
              borderColor: theme.borderColor
            }}
          >
            {esModoOscuro
              ? '☀️ Modo Claro'
              : '🌙 Modo Oscuro'}
          </button>

          <button
            style={{
              ...styles.btnNuevaEntrada,
              backgroundColor: theme.btnPrimaryBg,
              color: theme.btnPrimaryText
            }}
            onClick={() => setModalNuevaEntrada(true)}
          >
            ➕ Nueva Entrada
          </button>
        </div>
      </div>

      {/* MÉTRICAS */}

      <div style={styles.metricsGrid}>
        <div
          style={{
            ...styles.metricCard,
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
            boxShadow: theme.cardShadow
          }}
        >
          <div style={styles.metricHeader}>
            <span style={styles.iconBox}>📦</span>

            <span style={styles.badgeGreen}>
              +2.4%
            </span>
          </div>

          <div
            style={{
              ...styles.metricLabel,
              color: theme.subtextColor
            }}
          >
            SKUS TOTALES
          </div>

          <div
            style={{
              ...styles.metricValue,
              color: theme.textColor
            }}
          >
            {materiales.length}
          </div>
        </div>

        <div
          style={{
            ...styles.metricCard,
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
            boxShadow: theme.cardShadow
          }}
        >
          <div style={styles.metricHeader}>
            <span
              style={{
                ...styles.iconBox,
                color: '#ef4444'
              }}
            >
              ⚠️
            </span>

            <span style={styles.badgeRed}>
              {materialesStockBajo > 0
                ? 'Revisar'
                : 'Normal'}
            </span>
          </div>

          <div
            style={{
              ...styles.metricLabel,
              color: theme.subtextColor
            }}
          >
            STOCK BAJO
          </div>

          <div
            style={{
              ...styles.metricValue,
              color:
                materialesStockBajo > 0
                  ? esModoOscuro
                    ? '#f87171'
                    : '#dc2626'
                  : theme.textColor
            }}
          >
            {materialesStockBajo}
          </div>
        </div>

        <div
          style={{
            ...styles.metricCard,
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
            boxShadow: theme.cardShadow
          }}
        >
          <div style={styles.metricHeader}>
            <span style={styles.iconBox}>📤</span>

            <span
              style={{
                ...styles.timeText,
                color: theme.subtextColor
              }}
            >
              Act. hace 10m
            </span>
          </div>

          <div
            style={{
              ...styles.metricLabel,
              color: theme.subtextColor
            }}
          >
            SALIDAS HOY
          </div>

          <div
            style={{
              ...styles.metricValue,
              color: theme.textColor
            }}
          >
            48
          </div>
        </div>
      </div>

      {/* INVENTARIO */}

      <div style={styles.mainGrid}>
        <div
          style={{
            ...styles.card,
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
            boxShadow: theme.cardShadow
          }}
        >
          <div style={styles.inventoryHeader}>
            <div>
              <h3
                style={{
                  ...styles.cardTitle,
                  color: theme.textColor
                }}
              >
                Inventario en Vivo
              </h3>

              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '11px',
                  color: theme.subtextColor
                }}
              >
                Consulta y administra todos los materiales.
              </p>
            </div>

            <input
              type="text"
              placeholder="🔍 Buscar materiales, IDs..."
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              style={{
                ...styles.searchInput,
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.textColor
              }}
            />
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th
                    style={{
                      ...styles.th,
                      color: theme.subtextColor,
                      borderColor: theme.inputBorder
                    }}
                  >
                    NOMBRE DEL ÍTEM
                  </th>

                  <th
                    style={{
                      ...styles.th,
                      color: theme.subtextColor,
                      borderColor: theme.inputBorder
                    }}
                  >
                    CATEGORÍA
                  </th>

                  <th
                    style={{
                      ...styles.th,
                      color: theme.subtextColor,
                      borderColor: theme.inputBorder
                    }}
                  >
                    ID
                  </th>

                  <th
                    style={{
                      ...styles.th,
                      color: theme.subtextColor,
                      borderColor: theme.inputBorder,
                      textAlign: 'right'
                    }}
                  >
                    NIVEL DE STOCK
                  </th>

                  <th
                    style={{
                      ...styles.th,
                      color: theme.subtextColor,
                      borderColor: theme.inputBorder,
                      textAlign: 'center'
                    }}
                  >
                    ESTADO
                  </th>

                  <th
                    style={{
                      ...styles.th,
                      color: theme.subtextColor,
                      borderColor: theme.inputBorder,
                      textAlign: 'center'
                    }}
                  >
                    ACCIONES
                  </th>
                </tr>
              </thead>

              <tbody>
                {materialesFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        padding: '35px',
                        textAlign: 'center',
                        color: theme.subtextColor
                      }}
                    >
                      No se encontraron materiales.
                    </td>
                  </tr>
                ) : (
                  materialesFiltrados.map((item) => (
                    <tr key={item.id}>
                      <td
                        style={{
                          ...styles.tdName,
                          color: theme.textColor,
                          borderColor: theme.tableBorder
                        }}
                      >
                        {item.nombre}
                      </td>

                      <td
                        style={{
                          ...styles.tdCategory,
                          color: theme.subtextColor,
                          borderColor: theme.tableBorder
                        }}
                      >
                        {item.categoria}
                      </td>

                      <td
                        style={{
                          ...styles.tdId,
                          color: theme.subtextColor,
                          borderColor: theme.tableBorder
                        }}
                      >
                        {item.id}
                      </td>

                      <td
                        style={{
                          ...styles.td,
                          textAlign: 'right',
                          fontWeight: 'bold',
                          color: theme.textColor,
                          borderColor: theme.tableBorder
                        }}
                      >
                        {item.stock} {item.unidad}
                      </td>

                      <td
                        style={{
                          ...styles.td,
                          textAlign: 'center',
                          borderColor: theme.tableBorder
                        }}
                      >
                        <EstadoToggle
                          estado={item.estado}
                          estados={ESTADOS.inventario}
                          onClick={() =>
                            toggleEstado(item.id)
                          }
                        />
                      </td>

                      <td
                        style={{
                          ...styles.td,
                          textAlign: 'center',
                          borderColor: theme.tableBorder
                        }}
                      >
                        <AccionesFila
                          onEditar={() =>
                            setItemEditar({
                              ...item
                            })
                          }
                          onEliminar={() =>
                            handleEliminarMaterial(
                              item.id
                            )
                          }
                          color={
                            esModoOscuro
                              ? '#cbd5e1'
                              : '#475569'
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.tableFooter}>
            <span
              style={{
                color: theme.subtextColor
              }}
            >
              Mostrando {materialesFiltrados.length} de{' '}
              {materiales.length} materiales
            </span>

            <div style={styles.pagination}>
              <button
                style={{
                  ...styles.btnPaging,
                  backgroundColor: theme.btnSecBg,
                  color: theme.btnSecText,
                  borderColor: theme.borderColor
                }}
              >
                Anterior
              </button>

              <button
                style={{
                  ...styles.btnPaging,
                  backgroundColor: theme.btnSecBg,
                  color: theme.btnSecText,
                  borderColor: theme.borderColor
                }}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL NUEVA ENTRADA */}

      {modalNuevaEntrada && (
        <div style={styles.modalOverlay}>
          <div
            style={{
              ...styles.modalCard,
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
              color: theme.textColor
            }}
          >
            <h3
              style={{
                margin: '0 0 18px',
                fontSize: '17px',
                color: esModoOscuro
                  ? '#facc15'
                  : '#d97706'
              }}
            >
              ➕ Nueva Entrada de Material
            </h3>

            <form onSubmit={handleCrearMaterial}>
              <div style={styles.formGroup}>
                <label
                  style={{
                    ...styles.label,
                    color: theme.labelColor
                  }}
                >
                  NOMBRE DEL MATERIAL
                </label>

                <input
                  type="text"
                  required
                  placeholder="Ej: Cable Cobre 10mm²"
                  value={nuevoMaterial.nombre}
                  onChange={(e) =>
                    setNuevoMaterial({
                      ...nuevoMaterial,
                      nombre: e.target.value
                    })
                  }
                  style={{
                    ...styles.inputModal,
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.textColor
                  }}
                />
              </div>

              <div style={styles.formGrid}>
                <div>
                  <label
                    style={{
                      ...styles.label,
                      color: theme.labelColor
                    }}
                  >
                    CÓDIGO / ID
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="Ej: EL-CAB-99"
                    value={nuevoMaterial.id}
                    onChange={(e) =>
                      setNuevoMaterial({
                        ...nuevoMaterial,
                        id: e.target.value
                      })
                    }
                    style={{
                      ...styles.inputModal,
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.textColor
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      ...styles.label,
                      color: theme.labelColor
                    }}
                  >
                    CATEGORÍA
                  </label>

                  <select
                    value={nuevoMaterial.categoria}
                    onChange={(e) =>
                      setNuevoMaterial({
                        ...nuevoMaterial,
                        categoria: e.target.value
                      })
                    }
                    style={{
                      ...styles.inputModal,
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.textColor
                    }}
                  >
                    <option value="Conductores">
                      Conductores
                    </option>
                    <option value="Aparamenta">
                      Aparamenta
                    </option>
                    <option value="Cables">
                      Cables
                    </option>
                    <option value="Canalización">
                      Canalización
                    </option>
                    <option value="Transformadores">
                      Transformadores
                    </option>
                    <option value="Accesorios">
                      Accesorios
                    </option>
                  </select>
                </div>
              </div>

              <div style={styles.formGrid}>
                <div>
                  <label
                    style={{
                      ...styles.label,
                      color: theme.labelColor
                    }}
                  >
                    STOCK INICIAL
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={nuevoMaterial.stock}
                    onChange={(e) =>
                      setNuevoMaterial({
                        ...nuevoMaterial,
                        stock:
                          parseInt(e.target.value) || 0
                      })
                    }
                    style={{
                      ...styles.inputModal,
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.textColor
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      ...styles.label,
                      color: theme.labelColor
                    }}
                  >
                    UNIDAD DE MEDIDA
                  </label>

                  <input
                    type="text"
                    placeholder="m, pz, unidades"
                    value={nuevoMaterial.unidad}
                    onChange={(e) =>
                      setNuevoMaterial({
                        ...nuevoMaterial,
                        unidad: e.target.value
                      })
                    }
                    style={{
                      ...styles.inputModal,
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.textColor
                    }}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label
                  style={{
                    ...styles.label,
                    color: theme.labelColor
                  }}
                >
                  ESTADO INICIAL
                </label>

                <select
                  value={nuevoMaterial.estado}
                  onChange={(e) =>
                    setNuevoMaterial({
                      ...nuevoMaterial,
                      estado: e.target.value
                    })
                  }
                  style={{
                    ...styles.inputModal,
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.textColor
                  }}
                >
                  <option value="Óptimo">
                    Óptimo
                  </option>

                  <option value="Bajo Stock">
                    Bajo Stock
                  </option>

                  <option value="Crítico">
                    Crítico
                  </option>
                </select>
              </div>

              <div style={styles.modalButtons}>
                <button
                  type="button"
                  onClick={() =>
                    setModalNuevaEntrada(false)
                  }
                  style={{
                    ...styles.btnSecondary,
                    backgroundColor: theme.btnSecBg,
                    color: theme.btnSecText,
                    borderColor: theme.borderColor
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={{
                    ...styles.btnPrimary,
                    backgroundColor: theme.btnPrimaryBg,
                    color: theme.btnPrimaryText
                  }}
                >
                  Registrar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}

      {itemEditar && (
        <div style={styles.modalOverlay}>
          <div
            style={{
              ...styles.modalCard,
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
              color: theme.textColor
            }}
          >
            <h3
              style={{
                margin: '0 0 18px',
                fontSize: '17px',
                color: esModoOscuro
                  ? '#facc15'
                  : '#d97706'
              }}
            >
              ✏️ Actualizar Material
            </h3>

            <form onSubmit={handleGuardarEdicion}>
              <div style={styles.formGroup}>
                <label
                  style={{
                    ...styles.label,
                    color: theme.labelColor
                  }}
                >
                  NOMBRE DEL MATERIAL
                </label>

                <input
                  type="text"
                  value={itemEditar.nombre}
                  onChange={(e) =>
                    setItemEditar({
                      ...itemEditar,
                      nombre: e.target.value
                    })
                  }
                  style={{
                    ...styles.inputModal,
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.textColor
                  }}
                />
              </div>

              <div style={styles.formGrid}>
                <div>
                  <label
                    style={{
                      ...styles.label,
                      color: theme.labelColor
                    }}
                  >
                    NIVEL DE STOCK
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={itemEditar.stock}
                    onChange={(e) =>
                      setItemEditar({
                        ...itemEditar,
                        stock:
                          parseInt(e.target.value) || 0
                      })
                    }
                    style={{
                      ...styles.inputModal,
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.textColor
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      ...styles.label,
                      color: theme.labelColor
                    }}
                  >
                    UNIDAD DE MEDIDA
                  </label>

                  <input
                    type="text"
                    value={itemEditar.unidad}
                    onChange={(e) =>
                      setItemEditar({
                        ...itemEditar,
                        unidad: e.target.value
                      })
                    }
                    style={{
                      ...styles.inputModal,
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.textColor
                    }}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label
                  style={{
                    ...styles.label,
                    color: theme.labelColor
                  }}
                >
                  ESTADO
                </label>

                <select
                  value={itemEditar.estado}
                  onChange={(e) =>
                    setItemEditar({
                      ...itemEditar,
                      estado: e.target.value
                    })
                  }
                  style={{
                    ...styles.inputModal,
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.textColor
                  }}
                >
                  <option value="Óptimo">
                    Óptimo
                  </option>

                  <option value="Bajo Stock">
                    Bajo Stock
                  </option>

                  <option value="Crítico">
                    Crítico
                  </option>
                </select>
              </div>

              <div style={styles.modalButtons}>
                <button
                  type="button"
                  onClick={() => setItemEditar(null)}
                  style={{
                    ...styles.btnSecondary,
                    backgroundColor: theme.btnSecBg,
                    color: theme.btnSecText,
                    borderColor: theme.borderColor
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={{
                    ...styles.btnPrimary,
                    backgroundColor: theme.btnPrimaryBg,
                    color: theme.btnPrimaryText
                  }}
                >
                  Guardar Cambios
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
  container: {
    padding: '24px',
    minHeight: '100vh',
    boxSizing: 'border-box',
    fontFamily: 'sans-serif',
    transition: 'all 0.3s ease'
  },

  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '24px'
  },

  headerButtons: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },

  title: {
    fontSize: '22px',
    margin: 0,
    fontWeight: 'bold'
  },

  subtitle: {
    fontSize: '12px',
    margin: '5px 0 0'
  },

  themeButton: {
    border: '1px solid',
    padding: '9px 14px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600'
  },

  btnNuevaEntrada: {
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px'
  },

  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '20px'
  },

  metricCard: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '16px',
    transition: 'all 0.3s ease'
  },

  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },

  iconBox: {
    fontSize: '16px'
  },

  badgeGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    color: '#22c55e',
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: 'bold'
  },

  badgeRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: 'bold'
  },

  timeText: {
    fontSize: '10px'
  },

  metricLabel: {
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: '0.5px'
  },

  metricValue: {
    fontSize: '26px',
    fontWeight: 'bold',
    marginTop: '4px'
  },

  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '20px'
  },

  card: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.3s ease',
    minWidth: 0
  },

  inventoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '16px'
  },

  cardTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 'bold'
  },

  searchInput: {
    border: '1px solid',
    padding: '9px 12px',
    borderRadius: '7px',
    fontSize: '12px',
    outline: 'none',
    width: '230px',
    boxSizing: 'border-box'
  },

  tableWrapper: {
    width: '100%',
    overflowX: 'auto'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px',
    minWidth: '850px'
  },

  th: {
    fontSize: '10px',
    padding: '10px 8px',
    borderBottom: '1px solid',
    textAlign: 'left',
    fontWeight: 'bold'
  },

  td: {
    padding: '12px 8px',
    borderBottom: '1px solid',
    fontSize: '12px'
  },

  tdName: {
    padding: '12px 8px',
    borderBottom: '1px solid',
    fontSize: '12px',
    fontWeight: 'bold'
  },

  tdCategory: {
    padding: '12px 8px',
    borderBottom: '1px solid',
    fontSize: '12px'
  },

  tdId: {
    padding: '12px 8px',
    borderBottom: '1px solid',
    fontSize: '11px',
    fontFamily: 'monospace'
  },

  tableFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    fontSize: '11px'
  },

  pagination: {
    display: 'flex',
    gap: '6px'
  },

  btnPaging: {
    border: '1px solid',
    padding: '5px 10px',
    borderRadius: '5px',
    fontSize: '11px',
    cursor: 'pointer'
  },

  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },

  modalCard: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '24px',
    width: '420px',
    maxWidth: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
  },

  formGroup: {
    marginBottom: '14px'
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '14px'
  },

  label: {
    display: 'block',
    fontSize: '10px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },

  inputModal: {
    width: '100%',
    border: '1px solid',
    padding: '9px',
    borderRadius: '6px',
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: '12px'
  },

  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px'
  },

  btnSecondary: {
    border: '1px solid',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },

  btnPrimary: {
    border: 'none',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default Materiales;