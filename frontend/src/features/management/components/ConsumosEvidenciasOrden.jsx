import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  Eraser,
  Image as ImageIcon,
  Loader2,
  Package,
  PenLine,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';

import { apiBlobUrl, apiRequest } from '../../../shared/api.js';
import { formatearMoneda } from '../../../shared/services/base.js';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
} from '../../../shared/components/ui.jsx';

const INTERVALO_MS = 12000;

const numero = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n.toLocaleString('es-CO', { maximumFractionDigits: 2 }) : '—';
};

const fechaCorta = (valor) => {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

function MiniaturaEvidencia({ evidencia }) {
  const ruta = evidencia.archivoUrl || evidencia.url;
  const [url, setUrl] = useState(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    if (!ruta) return undefined;
    let vigente = true;
    let creada = null;
    apiBlobUrl(ruta)
      .then((resultado) => {
        if (!vigente) {
          if (resultado?.startsWith('blob:')) URL.revokeObjectURL(resultado);
          return;
        }
        creada = resultado;
        setUrl(resultado);
      })
      .catch(() => {
        if (vigente) setFallo(true);
      });
    return () => {
      vigente = false;
      if (creada?.startsWith('blob:')) URL.revokeObjectURL(creada);
    };
  }, [ruta]);

  const esFirma = evidencia.tipo === 'Firma';

  return (
    <div
      style={{
        border: '1px solid var(--border-soft, #e5e7eb)',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'var(--surface-soft, #f8fafc)',
        minWidth: 0,
      }}
    >
      <div style={{ height: 110, display: 'grid', placeItems: 'center', padding: 6 }}>
        {url ? (
          <img
            src={url}
            alt={`Evidencia ${evidencia.tipo || ''}`}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        ) : fallo ? (
          <span style={{ fontSize: 10, color: 'var(--text-muted, #64748b)', textAlign: 'center' }}>
            Archivo guardado en la nube
          </span>
        ) : (
          <Loader2 size={16} className="mca-spin" />
        )}
      </div>
      <div style={{ padding: '6px 8px', borderTop: '1px solid var(--border-soft, #e5e7eb)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          <Badge tone={esFirma ? 'indigo' : 'info'}>
            {esFirma ? 'Firma' : 'Foto'}
          </Badge>
          <span style={{ fontSize: 10, color: 'var(--text-muted, #64748b)' }}>
            {fechaCorta(evidencia.fecha_carga)}
          </span>
        </div>
        {evidencia.observacion && (
          <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--text-muted, #64748b)' }}>
            {evidencia.observacion}
          </p>
        )}
      </div>
    </div>
  );
}

export function ConsumosEvidenciasOrden({ ordenId, bloqueada = false, notify }) {
  const [materiales, setMateriales] = useState([]);
  const [evidencias, setEvidencias] = useState([]);
  const [costos, setCostos] = useState(null);
  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [codigo, setCodigo] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [ocupado, setOcupado] = useState(false);
  const [porEliminar, setPorEliminar] = useState(null);
  const [hayFirma, setHayFirma] = useState(false);
  const [guardandoFirma, setGuardandoFirma] = useState(false);
  const lienzoRef = useRef(null);
  const dibujandoRef = useRef(false);
  const montado = useRef(true);

  const cargar = useCallback(async (silencioso = false) => {
    if (!ordenId) return;
    if (!silencioso) setCargando(true);
    try {
      const [consumidos, evidenciasApi, costosApi] = await Promise.all([
        apiRequest(`/ordenes-servicio/${ordenId}/materiales`),
        apiRequest(`/ordenes-servicio/${ordenId}/evidencias`),
        apiRequest(`/ordenes-servicio/${ordenId}/costos`),
      ]);
      if (!montado.current) return;
      setMateriales(consumidos || []);
      setEvidencias(evidenciasApi || []);
      setCostos(costosApi || null);
      setError('');
    } catch (fallo) {
      if (montado.current && !silencioso) setError(fallo.message);
    } finally {
      if (montado.current && !silencioso) setCargando(false);
    }
  }, [ordenId]);

  useEffect(() => {
    montado.current = true;
    void cargar();
    const temporizador = setInterval(() => {
      if (document.visibilityState === 'visible') void cargar(true);
    }, INTERVALO_MS);
    const alVolver = () => {
      if (document.visibilityState === 'visible') void cargar(true);
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      montado.current = false;
      clearInterval(temporizador);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [cargar]);

  useEffect(() => {
    apiRequest('/materiales')
      .then((lista) => setInventario(lista || []))
      .catch(() => setInventario([]));
  }, []);

  const prepararLienzo = useCallback(() => {
    const lienzo = lienzoRef.current;
    if (!lienzo) return;
    const contexto = lienzo.getContext('2d');
    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, lienzo.width, lienzo.height);
    contexto.strokeStyle = '#111827';
    contexto.lineWidth = 2.6;
    contexto.lineCap = 'round';
    contexto.lineJoin = 'round';
    setHayFirma(false);
  }, []);

  useEffect(() => {
    prepararLienzo();
  }, [prepararLienzo, bloqueada]);

  const posicionFirma = (evento) => {
    const lienzo = lienzoRef.current;
    const rectangulo = lienzo.getBoundingClientRect();
    return {
      x: (evento.clientX - rectangulo.left) * (lienzo.width / rectangulo.width),
      y: (evento.clientY - rectangulo.top) * (lienzo.height / rectangulo.height),
    };
  };

  const empezarFirma = (evento) => {
    const lienzo = lienzoRef.current;
    if (!lienzo) return;
    evento.preventDefault();
    lienzo.setPointerCapture?.(evento.pointerId);
    const contexto = lienzo.getContext('2d');
    const { x, y } = posicionFirma(evento);
    contexto.beginPath();
    contexto.moveTo(x, y);
    dibujandoRef.current = true;
    setHayFirma(true);
  };

  const dibujarFirma = (evento) => {
    if (!dibujandoRef.current) return;
    const lienzo = lienzoRef.current;
    if (!lienzo) return;
    evento.preventDefault();
    const contexto = lienzo.getContext('2d');
    const { x, y } = posicionFirma(evento);
    contexto.lineTo(x, y);
    contexto.stroke();
  };

  const terminarFirma = () => {
    dibujandoRef.current = false;
  };

  const guardarFirma = async () => {
    const lienzo = lienzoRef.current;
    if (!lienzo || !hayFirma) {
      notify?.('warning', 'Firma vacía', 'Pide al cliente que firme antes de guardar.');
      return;
    }
    setGuardandoFirma(true);
    try {
      const firma = await new Promise((resolver) => lienzo.toBlob(resolver, 'image/png'));
      if (!firma) throw new Error('No se pudo preparar la imagen de la firma.');
      const formulario = new FormData();
      formulario.append('tipo', 'Firma');
      formulario.append('observacion', 'Firma del cliente registrada desde la web');
      formulario.append('archivo', firma, 'firma-cliente.png');
      await apiRequest(`/ordenes-servicio/${ordenId}/evidencias`, {
        method: 'POST',
        body: formulario,
      });
      prepararLienzo();
      await cargar(true);
      notify?.('success', 'Firma guardada', 'La firma ya se ve aquí y en la app móvil del técnico.');
    } catch (fallo) {
      notify?.('error', 'No se pudo guardar la firma', fallo.message);
    } finally {
      setGuardandoFirma(false);
    }
  };

  const agregarMaterial = async (evento) => {
    evento.preventDefault();
    const limpio = codigo.trim().toUpperCase();
    const nCantidad = Number(cantidad);
    if (!limpio) {
      notify?.('warning', 'Falta el material', 'Escribe o selecciona un código de material.');
      return;
    }
    if (!Number.isFinite(nCantidad) || nCantidad <= 0) {
      notify?.('warning', 'Cantidad inválida', 'La cantidad debe ser mayor que cero.');
      return;
    }
    setOcupado(true);
    try {
      await apiRequest(`/ordenes-servicio/${ordenId}/materiales`, {
        method: 'POST',
        body: { material_codigo: limpio, cantidad: nCantidad },
      });
      await cargar(true);
      setCodigo('');
      setCantidad('1');
      notify?.('success', 'Material agregado', `Se sumó ${nCantidad} × ${limpio} a los consumidos.`);
    } catch (fallo) {
      notify?.('error', 'No se pudo agregar el material', fallo.message);
    } finally {
      setOcupado(false);
    }
  };

  const eliminarEvidencia = async () => {
    if (!porEliminar) return;
    setOcupado(true);
    try {
      await apiRequest(`/ordenes-servicio/${ordenId}/evidencias/${porEliminar.id}`, {
        method: 'DELETE',
      });
      setPorEliminar(null);
      await cargar(true);
      notify?.('success', 'Evidencia eliminada', 'La evidencia se borró de la orden.');
    } catch (fallo) {
      notify?.('error', 'No se pudo eliminar', fallo.message);
    } finally {
      setOcupado(false);
    }
  };

  const totalMateriales = materiales.length;

  return (
    <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>Consumidos y evidencias</h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted, #64748b)' }}>
            Se sincroniza en vivo con lo que registra el técnico desde el móvil.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Badge tone="success">En vivo</Badge>
          <Button size="sm" icon={RefreshCw} onClick={() => cargar()} disabled={cargando}>
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--danger, #dc2626)' }}>{error}</p>
      )}

      {costos && (
        <div
          style={{
            border: '1px solid rgba(234, 179, 8, 0.45)',
            background: 'rgba(250, 204, 21, 0.08)',
            borderRadius: 12,
            padding: '10px 12px',
            display: 'grid',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <strong style={{ fontSize: 12 }}>Total a abonar</strong>
            <Badge tone="warning">{costos.moneda || 'COP'}</Badge>
          </div>
          <div style={{ fontSize: 21, fontWeight: 800 }}>
            {formatearMoneda(costos.total, costos.moneda || 'COP')}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '2px 10px',
              fontSize: 11,
              color: 'var(--text-muted, #64748b)',
            }}
          >
            <span>Precio del servicio</span>
            <b>{formatearMoneda(costos.precio_servicio, costos.moneda || 'COP')}</b>
            <span>Materiales consumidos</span>
            <b>{formatearMoneda(costos.total_materiales, costos.moneda || 'COP')}</b>
          </div>
          <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted, #64748b)' }}>
            Sube automáticamente con cada material que registra el técnico en la orden.
          </p>
        </div>
      )}

      {costos?.previstos?.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Package size={14} />
            <strong style={{ fontSize: 12 }}>Materiales del servicio</strong>
            <Badge tone="neutral">{numero(costos.previstos.length)}</Badge>
          </div>
          <div className="mca-table-wrap mca-table-wrap--compact">
            <table className="mca-table mca-table--fit">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Previsto</th>
                  <th>Usado</th>
                  <th>Sobrante</th>
                </tr>
              </thead>
              <tbody>
                {costos.previstos.map((material) => (
                  <tr key={material.codigo}>
                    <td>
                      {material.nombre || material.codigo}
                      <div style={{ fontSize: 10, color: 'var(--text-muted, #64748b)' }}>
                        {material.codigo}
                      </div>
                    </td>
                    <td>{numero(material.previsto)} {material.unidad || ''}</td>
                    <td>{numero(material.consumido)} {material.unidad || ''}</td>
                    <td>
                      {material.sobrante > 0 ? (
                        <Badge tone="success">
                          {numero(material.sobrante)} {material.unidad || ''}
                        </Badge>
                      ) : (
                        <Badge tone="neutral">0</Badge>
                      )}
                      {material.exceso > 0 && (
                        <>
                          {' '}
                          <Badge tone="danger">
                            Exceso {numero(material.exceso)}
                          </Badge>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted, #64748b)' }}>
            {costos.sobrantes?.length
              ? `Sobrantes: ${costos.sobrantes
                  .map((material) => `${material.nombre}: ${numero(material.sobrante)} ${material.unidad || ''}`.trim())
                  .join(' · ')}`
              : 'Sin sobrantes: el técnico consumió todo lo previsto.'}
          </p>
        </section>
      )}

      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Package size={14} />
          <strong style={{ fontSize: 12 }}>Materiales consumidos</strong>
          <Badge tone="neutral">{numero(totalMateriales)}</Badge>
        </div>

        {cargando && materiales.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>
            <Loader2 size={12} className="mca-spin" /> Consultando materiales…
          </p>
        ) : materiales.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>
            Todavía no hay materiales registrados en esta orden.
          </p>
        ) : (
          <div className="mca-table-wrap mca-table-wrap--compact">
            <table className="mca-table mca-table--fit">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Código</th>
                  <th>Cantidad</th>
                  <th>Unidad</th>
                </tr>
              </thead>
              <tbody>
                {materiales.map((material) => (
                  <tr key={material.id || `${material.codigo}-${material.creado_en}`}>
                    <td>{material.nombre || '—'}</td>
                    <td>{material.codigo}</td>
                    <td>{numero(material.cantidad)}</td>
                    <td>{material.unidad || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!bloqueada && (
          <form onSubmit={agregarMaterial} style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <input
              className="mca-input"
              list="mca-materiales-disponibles"
              value={codigo}
              onChange={(evento) => setCodigo(evento.target.value.toUpperCase())}
              placeholder="Código de material"
              style={{ flex: '1 1 150px', minWidth: 120 }}
            />
            <datalist id="mca-materiales-disponibles">
              {inventario
                .filter((material) => material.estado !== 'Inactivo')
                .map((material) => (
                  <option key={material.codigo} value={material.codigo}>
                    {`${material.nombre} · stock ${material.stock}`}
                  </option>
                ))}
            </datalist>
            <input
              className="mca-input"
              type="number"
              min="0.01"
              step="any"
              value={cantidad}
              onChange={(evento) => setCantidad(evento.target.value)}
              style={{ width: 84 }}
              aria-label="Cantidad"
            />
            <Button variant="primary" size="sm" type="submit" icon={Plus} disabled={ocupado}>
              Agregar
            </Button>
          </form>
        )}
        {bloqueada && (
          <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted, #64748b)' }}>
            La orden está finalizada: los consumidos quedan en solo lectura.
          </p>
        )}
      </section>

      {!bloqueada && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <PenLine size={14} />
            <strong style={{ fontSize: 12 }}>Firma del cliente</strong>
            <Badge tone="indigo">Desde la web</Badge>
          </div>
          <p style={{ margin: '0 0 6px', fontSize: 10.5, color: 'var(--text-muted, #64748b)' }}>
            El cliente firma con el mouse o con el dedo si la pantalla es táctil. Al guardarla
            queda como evidencia y se ve en la app móvil del técnico.
          </p>
          <canvas
            ref={lienzoRef}
            width={640}
            height={200}
            aria-label="Área para la firma del cliente"
            onPointerDown={empezarFirma}
            onPointerMove={dibujarFirma}
            onPointerUp={terminarFirma}
            onPointerCancel={terminarFirma}
            onPointerLeave={terminarFirma}
            style={{
              width: '100%',
              maxWidth: 640,
              height: 190,
              display: 'block',
              background: '#ffffff',
              borderRadius: 10,
              border: '1px solid var(--border-soft, #e5e7eb)',
              touchAction: 'none',
              cursor: 'crosshair',
            }}
          />
          <div className="mca-row" style={{ gap: 6, marginTop: 8 }}>
            <Button size="sm" icon={Eraser} onClick={prepararLienzo} disabled={guardandoFirma}>
              Limpiar
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={Save}
              onClick={guardarFirma}
              disabled={!hayFirma || guardandoFirma}
            >
              {guardandoFirma ? 'Guardando…' : 'Guardar firma'}
            </Button>
          </div>
        </section>
      )}

      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Camera size={14} />
          <strong style={{ fontSize: 12 }}>Evidencias</strong>
          <Badge tone="neutral">{numero(evidencias.length)}</Badge>
        </div>

        {cargando && evidencias.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>
            <Loader2 size={12} className="mca-spin" /> Consultando evidencias…
          </p>
        ) : evidencias.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="Sin evidencias"
            message="Las fotos y firmas que suba el técnico desde el móvil aparecerán aquí."
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 8,
            }}
          >
            {evidencias.map((evidencia) => (
              <div key={evidencia.id} style={{ position: 'relative' }}>
                <MiniaturaEvidencia evidencia={evidencia} />
                <button
                  type="button"
                  onClick={() => setPorEliminar(evidencia)}
                  disabled={ocupado}
                  title="Eliminar evidencia"
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    border: 'none',
                    borderRadius: 8,
                    padding: '4px 6px',
                    cursor: 'pointer',
                    background: 'rgba(220, 38, 38, 0.92)',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  <Trash2 size={12} /> Borrar
                </button>
              </div>
            ))}
          </div>
        )}

        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <PenLine size={11} /> Las firmas del cliente se borran igual que las fotos.
        </p>
      </section>

      <ConfirmDialog
        open={Boolean(porEliminar)}
        title="Eliminar evidencia"
        message={
          porEliminar
            ? `¿Eliminar la evidencia "${porEliminar.tipo || 'archivo'}"${porEliminar.observacion ? ` (${porEliminar.observacion})` : ''}?`
            : ''
        }
        confirmLabel="Eliminar evidencia"
        onCancel={() => setPorEliminar(null)}
        onConfirm={eliminarEvidencia}
      />
    </div>
  );
}

export default ConsumosEvidenciasOrden;
