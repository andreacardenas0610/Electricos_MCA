import { formatearFecha, formatearMoneda } from '../services/base.js';
import { fechaVencimiento } from '../services/cotizacionesService.js';

const EMPRESA = {
  nombre: 'Eléctricos MCA',
  nit: '901.456.789-0',
  direccion: 'Calle 100 # 15-20, Bogotá D.C.',
  telefono: '+57 601 555 0101',
  correo: 'contacto@electricosmca.com',
  web: 'www.electricosmca.com',
};

const escapar = (valor) => String(valor ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const COLOR_ESTADO = {
  Aprobado: '#15803d',
  Pendiente: '#b45309',
  Rechazado: '#b42318',
};

export function generarPdfCotizacion(cotizacion) {
  if (!cotizacion) throw new Error('No hay una cotización para imprimir.');

  const ventana = window.open('', '_blank', 'width=980,height=1040');
  if (!ventana) {
    throw new Error('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes e intenta de nuevo.');
  }

  const filas = (cotizacion.items || []).map((item, indice) => `
    <tr>
      <td class="center">${indice + 1}</td>
      <td>
        <strong>${escapar(item.descripcion)}</strong>
        <span class="tag">${item.tipo === 'servicio' ? 'Servicio' : 'Material'}</span>
      </td>
      <td class="center">${escapar(item.unidad || '—')}</td>
      <td class="right">${Number(item.cantidad || 0).toLocaleString('es-CO')}</td>
      <td class="right">${formatearMoneda(item.precioUnit, 'COP')}</td>
      <td class="right">${formatearMoneda(Number(item.cantidad || 0) * Number(item.precioUnit || 0), 'COP')}</td>
    </tr>
  `).join('');

  const total = Number(cotizacion.total || 0);
  const abonado = Number(cotizacion.abonado || 0);
  const saldo = Math.max(0, total - abonado);
  const estado = cotizacion.estadoCotizacion || 'Pendiente';
  const colorEstado = COLOR_ESTADO[estado] || '#334155';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapar(cotizacion.id)} — Eléctricos MCA</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 28px 18px 48px;
      background: #eef2f7;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .toolbar {
      max-width: 820px;
      margin: 0 auto 14px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .toolbar button {
      border: 0;
      border-radius: 8px;
      padding: 10px 18px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      background: #facc15;
      color: #0b1329;
    }
    .toolbar button.secondary {
      background: #ffffff;
      color: #334155;
      border: 1px solid #d7dee8;
    }
    .sheet {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      padding: 42px 46px 36px;
      border-radius: 6px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
    }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      padding-bottom: 22px;
      border-bottom: 3px solid #facc15;
    }
    .brand h1 {
      margin: 0;
      font-size: 25px;
      letter-spacing: -0.6px;
      color: #0b1329;
    }
    .brand .bolt { color: #ca8a04; }
    .brand p {
      margin: 3px 0 0;
      font-size: 10.5px;
      color: #64748b;
      line-height: 1.55;
    }
    .brand .slogan {
      margin-top: 5px;
      font-size: 9px;
      letter-spacing: 1.6px;
      text-transform: uppercase;
      color: #94a3b8;
      font-weight: 700;
    }
    .doc {
      text-align: right;
      min-width: 210px;
    }
    .doc .type {
      font-size: 9px;
      letter-spacing: 1.6px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
    }
    .doc .number {
      font-size: 21px;
      font-weight: 800;
      color: #0b1329;
      margin: 3px 0 4px;
    }
    .doc .status {
      display: inline-block;
      margin-top: 5px;
      padding: 4px 11px;
      border-radius: 14px;
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: ${colorEstado};
      border: 1px solid ${colorEstado}55;
      background: ${colorEstado}14;
    }
    .meta {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 18px;
      margin: 24px 0;
    }
    .box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px 16px;
    }
    .box h3 {
      margin: 0 0 8px;
      font-size: 8.5px;
      letter-spacing: 1.3px;
      text-transform: uppercase;
      color: #94a3b8;
      font-weight: 800;
    }
    .box p { margin: 2px 0; line-height: 1.55; }
    .box .strong { font-weight: 800; font-size: 13px; color: #0f172a; }
    .box .muted { color: #64748b; }
    .grid2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 14px;
      font-size: 11px;
    }
    .grid2 span { color: #64748b; }
    .grid2 b { color: #0f172a; }
    h2.section {
      margin: 26px 0 10px;
      font-size: 10px;
      letter-spacing: 1.3px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 800;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    thead th {
      background: #0b1329;
      color: #ffffff;
      text-align: left;
      padding: 9px 8px;
      font-size: 8.5px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    thead th:first-child { border-radius: 4px 0 0 0; }
    thead th:last-child { border-radius: 0 4px 0 0; }
    tbody td {
      padding: 9px 8px;
      border-bottom: 1px solid #eef2f7;
      vertical-align: top;
      line-height: 1.45;
    }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .tag {
      display: inline-block;
      margin-left: 6px;
      padding: 1px 6px;
      border-radius: 8px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      font-size: 8px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .right { text-align: right; }
    .center { text-align: center; }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
    .totals table {
      width: 300px;
      font-size: 11px;
    }
    .totals td { padding: 6px 8px; border: 0; }
    .totals .label { color: #64748b; }
    .totals .value { text-align: right; font-weight: 700; }
    .totals tr.grand td {
      border-top: 2px solid #0b1329;
      padding-top: 10px;
      font-size: 14px;
      font-weight: 800;
      color: #0b1329;
    }
    .notes {
      margin-top: 26px;
      padding: 13px 16px;
      border-left: 3px solid #facc15;
      background: #fffbeb;
      color: #475569;
      font-size: 10.5px;
      line-height: 1.6;
      border-radius: 0 5px 5px 0;
    }
    .notes strong { color: #0b1329; }
    .signs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 52px;
    }
    .sign {
      border-top: 1px solid #94a3b8;
      padding-top: 7px;
      text-align: center;
      font-size: 9px;
      color: #64748b;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .foot {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 8.5px;
      color: #94a3b8;
    }
    @page {
      size: A4;
      margin: 12mm;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .toolbar { display: none; }
      .sheet {
        max-width: none;
        margin: 0;
        padding: 0;
        box-shadow: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="secondary" onclick="window.close()">Cerrar</button>
    <button onclick="window.print()">Imprimir / Guardar PDF</button>
  </div>

  <main class="sheet">
    <header class="top">
      <div class="brand">
        <h1><span class="bolt">⚡</span> ${EMPRESA.nombre}</h1>
        <p>NIT ${EMPRESA.nit}<br />${EMPRESA.direccion}<br />${EMPRESA.telefono} · ${EMPRESA.correo}</p>
        <div class="slogan">Soluciones eléctricas industriales</div>
      </div>
      <div class="doc">
        <div class="type">Cotización</div>
        <div class="number">${escapar(cotizacion.id)}</div>
        <div class="muted">Emitida el ${formatearFecha(cotizacion.fechaEmision)}</div>
        <div class="status">${escapar(estado)}</div>
      </div>
    </header>

    <section class="meta">
      <div class="box">
        <h3>Cliente</h3>
        <p class="strong">${escapar(cotizacion.cliente)}</p>
        <p class="muted">${escapar(cotizacion.documento || 'Documento no registrado')}</p>
        <p>${escapar(cotizacion.direccion || 'Dirección no registrada')}</p>
        <div class="grid2" style="margin-top:8px">
          <span>Contacto</span><b>${escapar(cotizacion.contacto || '—')}</b>
          <span>Teléfono</span><b>${escapar(cotizacion.telefono || '—')}</b>
          <span>Correo</span><b>${escapar(cotizacion.correo || '—')}</b>
        </div>
      </div>
      <div class="box">
        <h3>Detalle de la cotización</h3>
        <div class="grid2">
          <span>Proyecto</span><b>${escapar(cotizacion.proyecto)}</b>
          <span>Emisión</span><b>${formatearFecha(cotizacion.fechaEmision)}</b>
          <span>Vigencia</span><b>${cotizacion.diasVigencia} días</b>
          <span>Vence</span><b>${formatearFecha(fechaVencimiento(cotizacion))}</b>
          <span>Moneda</span><b>COP</b>
          <span>Ítems</span><b>${(cotizacion.items || []).length}</b>
        </div>
      </div>
    </section>

    <h2 class="section">Servicios y materiales</h2>
    <table>
      <thead>
        <tr>
          <th style="width:34px" class="center">#</th>
          <th>Descripción</th>
          <th style="width:80px" class="center">Unidad</th>
          <th style="width:58px" class="right">Cant.</th>
          <th style="width:95px" class="right">Vr. unitario</th>
          <th style="width:108px" class="right">Vr. total</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>

    <div class="totals">
      <table>
        <tr><td class="label">Subtotal</td><td class="value">${formatearMoneda(cotizacion.subtotal, 'COP')}</td></tr>
        ${Number(cotizacion.montoDescuento) > 0 ? `<tr><td class="label">Descuento (${cotizacion.descuento}%)</td><td class="value">− ${formatearMoneda(cotizacion.montoDescuento, 'COP')}</td></tr>` : ''}
        <tr><td class="label">IVA (${cotizacion.ivaPorcentaje}%)</td><td class="value">${formatearMoneda(cotizacion.montoImpuesto, 'COP')}</td></tr>
        <tr class="grand"><td>Total</td><td class="value">${formatearMoneda(total, 'COP')}</td></tr>
      </table>
    </div>

    ${abonado > 0 ? `
      <div class="notes">
        <strong>Control de pagos:</strong> abonado ${formatearMoneda(abonado, 'COP')} ·
        saldo pendiente ${formatearMoneda(saldo, 'COP')}.
      </div>
    ` : ''}

    ${cotizacion.notas ? `
      <div class="notes">
        <strong>Observaciones:</strong> ${escapar(cotizacion.notas)}
      </div>
    ` : ''}

    <div class="signs">
      <div class="sign">Firma del cliente</div>
      <div class="sign">Eléctricos MCA · Área comercial</div>
    </div>

    <footer class="foot">
      <span>${EMPRESA.nombre} · NIT ${EMPRESA.nit} · ${EMPRESA.web}</span>
      <span>Documento generado electrónicamente · ${formatearFecha(cotizacion.fechaEmision)}</span>
    </footer>
  </main>

  <script>
    window.addEventListener('load', function () {
      window.setTimeout(function () { window.print(); }, 350);
    });
  </script>
</body>
</html>`;

  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();
  ventana.focus();
}
