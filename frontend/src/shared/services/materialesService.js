import { numero } from './base.js';

const LIMITE_STOCK_BAJO = 10;
const LIMITE_STOCK_MEDIO = 20;

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

function normalizarUnidad(unidad = '') {
  const valor = String(unidad).trim().toLowerCase();
  if (['m', 'metro', 'metros'].includes(valor)) return 'Metro';
  if (['unidad', 'unidades', 'und'].includes(valor)) return 'Unidad';
  if (['pz', 'pieza', 'piezas'].includes(valor)) return 'Pieza';
  if (!valor) return 'Unidad';
  return unidad;
}

export function normalizarMaterial(material) {
  const stock = numero(material.stock);
  const stockMinimo = numero(material.stockMinimo ?? material.stock_minimo) || LIMITE_STOCK_BAJO;
  const stockMedio = numero(material.stockMedio ?? material.stock_medio)
    || Math.max(stockMinimo * 2, LIMITE_STOCK_MEDIO);
  return {
    ...material,
    id: String(material.id),
    nombre: String(material.nombre || '').trim(),
    categoria: material.categoria || 'Accesorios',
    stock,
    unidad: normalizarUnidad(material.unidad),
    precioUnitario: numero(material.precioUnitario ?? material.precio_unitario),
    stockMinimo,
    stockMedio,
    estadoInventario: material.estadoInventario || material.estado_inventario || 'Activo',
    estado: material.estado || calcularEstadoStock(stock, stockMinimo, stockMedio),
  };
}
