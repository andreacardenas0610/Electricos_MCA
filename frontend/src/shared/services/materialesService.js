import { hasStore, numero, readStore, writeStore } from './base.js';
import {
  CATEGORIAS_MATERIALES_INICIALES,
  prefijoPorCategoria,
  unidadSugeridaPorCategoria,
} from './catalogos.js';

export const MATERIALES_KEY = 'mca_materiales';
export const CATEGORIAS_MATERIALES_KEY = 'mca_materiales_categorias';

const LIMITE_STOCK_BAJO = 10;
const LIMITE_STOCK_MEDIO = 20;

// El usuario configura los dos parámetros de la alerta:
// 0 = Crítico (rojo) · hasta stockMinimo = Bajo Stock (amarillo) ·
// hasta stockMedio = Medio (amarillo) · por encima = Óptimo (gris).
export function calcularEstadoStock(
  stock,
  minimo = LIMITE_STOCK_BAJO,
  medio = LIMITE_STOCK_MEDIO,
) {
  const cantidad = numero(stock);
  const umbralBajo = numero(minimo) > 0 ? numero(minimo) : LIMITE_STOCK_BAJO;
  const umbralMedio = numero(medio) > 0
    ? Math.max(numero(medio), umbralBajo)
    : Math.max(umbralBajo * 2, LIMITE_STOCK_MEDIO);
  if (cantidad <= 0) return 'Crítico';
  if (cantidad <= umbralBajo) return 'Bajo Stock';
  if (cantidad <= umbralMedio) return 'Medio';
  return 'Óptimo';
}

const MATERIALES_INICIALES = [
  {
    id: 'EL-BUS-585',
    nombre: 'Barra de Cobre 50x5mm',
    categoria: 'Conductores',
    stock: 142,
    unidad: 'Metro',
    precioUnitario: 4500,
  },
  {
    id: 'EL-APA-001',
    nombre: 'Interruptor 3P 100A',
    categoria: 'Aparamenta',
    stock: 0,
    unidad: 'Unidad',
    precioUnitario: 650000,
  },
  {
    id: 'EL-CAB-254',
    nombre: 'Cable XLPE 4C 25mm²',
    categoria: 'Cables',
    stock: 450,
    unidad: 'Metro',
    precioUnitario: 28000,
  },
  {
    id: 'EL-CAN-025',
    nombre: 'Conducto PVC 25mm',
    categoria: 'Canalización',
    stock: 1200,
    unidad: 'Metro',
    precioUnitario: 3200,
  },
  {
    id: 'EL-TRF-002',
    nombre: 'Transformador Control 2kVA',
    categoria: 'Transformadores',
    stock: 2,
    unidad: 'Unidad',
    precioUnitario: 825000,
  },
  {
    id: 'EL-ACC-TRM4',
    nombre: 'Bloques Terminales 4mm²',
    categoria: 'Accesorios',
    stock: 2400,
    unidad: 'Pieza',
    precioUnitario: 12000,
  },
];

const normalizarUnidad = (unidad = '') => {
  const valor = String(unidad).trim().toLowerCase();
  if (['m', 'metro', 'metros'].includes(valor)) return 'Metro';
  if (['unidad', 'unidades', 'und'].includes(valor)) return 'Unidad';
  if (['pz', 'pieza', 'piezas'].includes(valor)) return 'Pieza';
  if (!valor) return 'Unidad';
  return unidad;
};

export function normalizarMaterial(material) {
  const stock = numero(material.stock);
  const stockMinimo = numero(material.stockMinimo ?? material.stock_minimo) || LIMITE_STOCK_BAJO;
  const stockMedio = numero(material.stockMedio ?? material.stock_medio) || Math.max(stockMinimo * 2, LIMITE_STOCK_MEDIO);
  return {
    ...material,
    id: String(material.id),
    nombre: String(material.nombre || '').trim(),
    categoria: material.categoria || 'Accesorios',
    stock,
    unidad: normalizarUnidad(material.unidad),
    precioUnitario: numero(material.precioUnitario),
    stockMinimo,
    stockMedio,
    estadoInventario: material.estadoInventario || material.estado_inventario || 'Activo',
    estado: material.estado || calcularEstadoStock(stock, stockMinimo, stockMedio),
  };
}

export function obtenerCategorias() {
  const guardadas = readStore(CATEGORIAS_MATERIALES_KEY, null);
  if (Array.isArray(guardadas) && guardadas.length) return guardadas;
  return CATEGORIAS_MATERIALES_INICIALES;
}

export function obtenerCategoria(nombre) {
  return obtenerCategorias().find(
    (categoria) => String(categoria.nombre).toLowerCase() === String(nombre).toLowerCase(),
  );
}

export function crearCategoria({ nombre, unidad }) {
  const limpio = String(nombre || '').trim();
  if (!limpio) throw new Error('Escribe el nombre de la categoría.');

  const categorias = obtenerCategorias();
  if (categorias.some((categoria) => categoria.nombre.toLowerCase() === limpio.toLowerCase())) {
    throw new Error('Ya existe una categoría con ese nombre.');
  }

  const categoria = {
    id: `cat-${Date.now().toString(36)}`,
    nombre: limpio,
    unidad: unidad || unidadSugeridaPorCategoria(limpio),
    prefijo: prefijoPorCategoria(limpio),
  };

  writeStore(CATEGORIAS_MATERIALES_KEY, [...categorias, categoria]);
  return categoria;
}

export function obtenerMateriales() {
  const guardados = readStore(MATERIALES_KEY, null);
  const base = Array.isArray(guardados) ? guardados : MATERIALES_INICIALES;
  return base.map(normalizarMaterial);
}

export function generarCodigoMaterial(categoriaNombre) {
  const categoria = obtenerCategoria(categoriaNombre);
  const prefijo = categoria?.prefijo || prefijoPorCategoria(categoriaNombre);
  const patron = new RegExp(`^${prefijo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`, 'i');

  const ultimo = obtenerMateriales().reduce((mayor, material) => {
    const coincidencia = String(material.id).match(patron);
    return coincidencia ? Math.max(mayor, Number(coincidencia[1])) : mayor;
  }, 0);

  return `${prefijo}-${String(ultimo + 1).padStart(3, '0')}`;
}

export function guardarMaterial(datos, idOriginal = null) {
  const materiales = obtenerMateriales();
  const nombre = String(datos.nombre || '').trim();
  const categoria = String(datos.categoria || '').trim();
  const stock = numero(datos.stock);

  if (!nombre) throw new Error('El nombre del material es obligatorio.');
  if (!categoria) throw new Error('Selecciona una categoría.');
  if (stock < 0) throw new Error('La cantidad no puede ser negativa.');

  const categoriaInfo = obtenerCategoria(categoria);
  const unidad = datos.unidad || categoriaInfo?.unidad || unidadSugeridaPorCategoria(categoria);
  const precioUnitario = numero(datos.precioUnitario);
  if (precioUnitario < 0) throw new Error('El precio unitario no puede ser negativo.');

  if (idOriginal) {
    const existente = materiales.find((material) => material.id === String(idOriginal));
    if (!existente) throw new Error('No se encontró el material a editar.');

    const actualizado = normalizarMaterial({
      ...existente,
      ...datos,
      id: existente.id,
      nombre,
      categoria,
      stock,
      unidad,
      precioUnitario,
      estado: calcularEstadoStock(stock, datos.stockMinimo, datos.stockMedio),
      actualizadoEn: new Date().toISOString(),
    });

    writeStore(
      MATERIALES_KEY,
      materiales.map((material) => (material.id === actualizado.id ? actualizado : material)),
    );
    return actualizado;
  }

  const codigo = generarCodigoMaterial(categoria);
  if (materiales.some((material) => material.id === codigo)) {
    throw new Error('Ya existe un material con ese código.');
  }

  const nuevo = normalizarMaterial({
    ...datos,
    id: codigo,
    nombre,
    categoria,
    stock,
    unidad,
    precioUnitario,
    creadoEn: new Date().toISOString(),
  });

  writeStore(MATERIALES_KEY, [nuevo, ...materiales]);
  return nuevo;
}

export function eliminarMaterial(id) {
  const materiales = obtenerMateriales();
  if (!materiales.some((material) => material.id === String(id))) {
    throw new Error('No se encontró el material.');
  }
  writeStore(MATERIALES_KEY, materiales.filter((material) => material.id !== String(id)));
}

export function asegurarMateriales() {
  if (!hasStore(CATEGORIAS_MATERIALES_KEY)) {
    writeStore(CATEGORIAS_MATERIALES_KEY, CATEGORIAS_MATERIALES_INICIALES);
  }
  if (!hasStore(MATERIALES_KEY)) {
    writeStore(MATERIALES_KEY, MATERIALES_INICIALES.map(normalizarMaterial));
  }
}
