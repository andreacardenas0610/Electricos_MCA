import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const DEMO_PASSWORD = '12345678';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

const q = (text, params = []) => client.query(text, params);

async function idOf(table, whereCol, value) {
  const { rows } = await q(`SELECT id FROM ${table} WHERE ${whereCol} = $1`, [value]);
  if (!rows.length) throw new Error(`No encontrado: ${table}.${whereCol}=${value}`);
  return rows[0].id;
}

async function insertIfMissing(table, keyCol, columns, values) {
  if (values.length !== columns.length + 1) {
    throw new Error(`${table}: ${values.length} valores para ${columns.length + 1} columnas`);
  }
  const all = [keyCol, ...columns];
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  await q(
    `INSERT INTO ${table} (${all.join(', ')})
     SELECT ${placeholders}
     WHERE NOT EXISTS (SELECT 1 FROM ${table} WHERE ${keyCol} = $${values.length + 1}::text)`,
    [...values, values[0]]
  );
}

await client.connect();

// ── Roles (10 nuevos) ─────────────────────────────────────────
const roles = [
  ['Supervisor de Mantenimiento', 'ROL-SUPERVISOR-MANT', 'Operativo', 'Coordina programas de mantenimiento eléctrico preventivo'],
  ['Coordinador de Proyectos Eléctricos', 'ROL-COORD-PROY', 'Gestión', 'Planifica y hace seguimiento de proyectos de instalación'],
  ['Analista de Compras e Inventario', 'ROL-ANAL-COMPRAS', 'Operativo', 'Gestiona materiales, stock y proveedores'],
  ['Asesor Comercial Senior', 'ROL-ASESOR-COM', 'Comercial', 'Genera cotizaciones y cierra ventas de servicios'],
  ['Técnico Electricista Instalador', 'ROL-TEC-INST', 'Operativo', 'Ejecuta instalaciones residenciales e industriales'],
  ['Técnico Especialista RETIE', 'ROL-TEC-RETIE', 'Operativo', 'Certificación y cumplimiento normativo RETIE'],
  ['Jefe de Bodega', 'ROL-JEFE-BODEGA', 'Operativo', 'Control de entradas y salidas de materiales'],
  ['Auxiliar Administrativo', 'ROL-AUX-ADMIN', 'Operativo', 'Apoyo en facturación, archivos y soporte interno'],
  ['Analista de Calidad y Seguridad', 'ROL-ANAL-CAL', 'Gestión', 'Auditoría de servicios y seguridad eléctrica en campo'],
  ['Gerente de Operaciones', 'ROL-GERTE-OPER', 'Directivo', 'Visión global de operación, indicadores y presupuesto'],
];
for (const [nombre, codigo, acceso, desc] of roles) {
  await insertIfMissing('roles', 'codigo',
    ['nombre', 'descripcion', 'tipo_acceso', 'estado', 'plataformas', 'permisos'],
    [codigo, nombre, desc, acceso, 'Activo', ['Web'], '{}']);
}

// ── Usuarios (10 nuevos) ──────────────────────────────────────
const zonaIds = (await q('SELECT id FROM zonas ORDER BY id')).rows.map((r) => r.id);
const usuarios = [
  ['Andrés Felipe Rojas', '1020345678', 'arojas@electricosmca.com', 'arojas', 'ROL-SUPERVISOR-MANT', '310 456 7890'],
  ['Camila Andrea Restrepo', '1025874369', 'crestrepo@electricosmca.com', 'crestrepo', 'ROL-COORD-PROY', '311 234 5678'],
  ['Santiago Ochoa Villa', '1112233445', 'sochoa@electricosmca.com', 'sochoa', 'ROL-ANAL-COMPRAS', '312 987 6543'],
  ['Valentina Cárdenas Ruiz', '1028765432', 'vcardenas@electricosmca.com', 'vcardenas', 'ROL-ASESOR-COM', '313 111 2233'],
  ['Mateo Gutiérrez León', '1031223344', 'mgutierrez@electricosmca.com', 'mgutierrez', 'ROL-TEC-INST', '314 555 6677'],
  ['Isabella Moreno Patiño', '1035445566', 'imoreno@electricosmca.com', 'imoreno', 'ROL-TEC-RETIE', '315 888 9900'],
  ['Juan Pablo Escobar', '1040112233', 'jescobar@electricosmca.com', 'jescobar', 'ROL-JEFE-BODEGA', '316 333 4455'],
  ['Mariana Tabares Gil', '1044556677', 'mtabares@electricosmca.com', 'mtabares', 'ROL-AUX-ADMIN', '317 666 7788'],
  ['Sebastián Henao Marín', '1048990011', 'shenao@electricosmca.com', 'shenao', 'ROL-ANAL-CAL', '318 222 3344'],
  ['Lucía Fernanda Arroyave', '1052334455', 'larroyave@electricosmca.com', 'larroyave', 'ROL-GERTE-OPER', '319 999 0011'],
];
for (const [nombre, doc, correo, usuario, rolCodigo, telefono] of usuarios) {
  const rolId = await idOf('roles', 'codigo', rolCodigo);
  const zonaId = zonaIds[Number(doc.slice(-1)) % zonaIds.length];
  await insertIfMissing('usuarios', 'documento_n',
    ['nombre_completo', 'correo_electronico', 'telefono', 'password_hash',
     'rol_id', 'zona_id', 'estado', 'usuario', 'zona'],
    [doc, nombre, correo, telefono, hash, rolId, zonaId, 'Activo', usuario, 'General']);
}

// ── Terceros / técnicos (10 nuevos) ───────────────────────────
const terceros = [
  ['Carlos Emilio Vargas', '1056778899', 'Servicios Eléctricos Andina S.A.S.', '300 123 4567', 'cvargas@elecandina.com', 'tec_cvargas'],
  ['Natalia Bedoya Salazar', '1060112200', 'Ingeniería y Montajes NB', '301 234 5678', 'nbedoya@inmontajes.com', 'tec_nbedoya'],
  ['Federico Castaño Ríos', '1064556600', 'Electricidad Total del Hogar', '302 345 6789', 'fcastano@electotal.com', 'tec_fcastano'],
  ['Gloria Milena Arce', '1022334400', 'Consultoría RETIE GMA', '303 456 7890', 'garce@retiegma.com', 'tec_garce'],
  ['Óscar Mauricio Molina', '1068990000', 'Mantenimientos Industriales OM', '304 567 8901', 'omolina@mantindustriales.com', 'tec_omolina'],
  ['Adriana Lucía Franco', '1072334400', 'Iluminación y Diseños ADA', '305 678 9012', 'afranco@ilumada.com', 'tec_afranco'],
  ['Ricardo Sierra Cardona', '1076778800', 'Redes Eléctricas RS', '306 789 0123', 'rsierra@redeselec.com', 'tec_rsierra'],
  ['Paula Andrea Niño', '1080112299', 'Automatización y Control PN', '307 890 1234', 'pninio@autcont.com', 'tec_pninio'],
  ['Héctor Jaime Osuna', '1084556699', 'Acometidas y Puesta a Tierra HO', '308 901 2345', 'hosuna@acometiasho.com', 'tec_hosuna'],
  ['Sandra Milena Quintero', '1088990099', 'Diagnóstico Termográfico SMQ', '309 012 3456', 'squintero@termosm.com', 'tec_squintero'],
];
for (const [nombre, doc, empresa, tel, correo, usuario] of terceros) {
  await insertIfMissing('terceros', 'documento',
    ['nombre_completo', 'empresa', 'telefono', 'correo_electronico',
     'usuario', 'password_hash', 'estado'],
    [doc, nombre, empresa, tel, correo, usuario, hash, 'Activo']);
}

// ── Servicios (10 nuevos) ─────────────────────────────────────
const catServ = { 'Mantenimiento Preventivo': 1, 'Reparación de Emergencia': 2, 'Instalación Nueva': 3 };
const unidadByName = (await q('SELECT id, nombre FROM unidades_medida')).rows;
const uId = Object.fromEntries(unidadByName.map((r) => [r.nombre, r.id]));
const servicios = [
  ['SERV-DEMO-01', 'Termografía de Tablero Eléctrico', 'Mantenimiento Preventivo', 'Hora Servicio', 180000, 2],
  ['SERV-DEMO-02', 'Instalación de Alumbrado Público', 'Instalación Nueva', 'Unidad', 350000, 6],
  ['SERV-DEMO-03', 'Reparación de Cortocircuito Residencial', 'Reparación de Emergencia', 'Hora Servicio', 90000, 1.5],
  ['SERV-DEMO-04', 'Prueba de Resistencia de Tierra', 'Mantenimiento Preventivo', 'Unidad', 220000, 3],
  ['SERV-DEMO-05', 'Suministro e Instalación de Breaker', 'Instalación Nueva', 'Unidad', 45000, 0.5],
  ['SERV-DEMO-06', 'Adecuación de Cuarto de Medidores', 'Instalación Nueva', 'Unidad', 980000, 16],
  ['SERV-DEMO-07', 'Certificación RETIE de Instalación', 'Mantenimiento Preventivo', 'Unidad', 650000, 8],
  ['SERV-DEMO-08', 'Reparación de Motor Trifásico', 'Reparación de Emergencia', 'Hora Servicio', 120000, 4],
  ['SERV-DEMO-09', 'Instalación de Cableado Estructurado', 'Instalación Nueva', 'Metro', 28000, 1],
  ['SERV-DEMO-10', 'Balanceo de Cargas Eléctricas', 'Mantenimiento Preventivo', 'Unidad', 275000, 3.5],
];
for (const [codigo, nombre, categoria, unidad, precio, horas] of servicios) {
  await insertIfMissing('servicios', 'codigo',
    ['nombre', 'categoria_id', 'descripcion', 'unidad_medida_id', 'precio_base',
     'tiempo_estimado_minutos', 'estado', 'unidad', 'precio_numerico', 'moneda', 'categoria', 'horas'],
    [codigo, nombre, catServ[categoria],
     `${nombre}: servicio estándar de Eléctricos MCA con personal certificado.`,
     uId[unidad], precio, Math.round(horas * 60), 'Activo', unidad, precio, 'COP', categoria, horas]);
}

// ── Clientes (10 nuevos) con contacto y dirección ─────────────
const clientes = [
  ['Comercializadora Eléctrica Los Alfiles S.A.S.', '901.220.101-5', 'Jurídico', 2, 'Bogotá', 'Cundinamarca', 'Zona Norte', 'Jorge Ramírez', '310 111 2200', 'ventas@losalfiles.com'],
  ['Construcciones Robles & Cía Ltda', '901.220.102-3', 'Jurídico', 3, 'Medellín', 'Antioquia', 'Zona Centro', 'Ana Robles', '310 222 3300', 'contacto@roblescia.com'],
  ['Hotel Mirador del Valle', '901.220.103-1', 'Jurídico', 2, 'Cali', 'Valle del Cauca', 'Zona Sur', 'Luis Fernando Salcedo', '310 333 4400', 'mantenimiento@hotelmirador.com'],
  ['Julián Andrés Cuervo', '1093223300', 'Natural', 1, 'Bucaramanga', 'Santander', 'Zona Norte', 'Julián Cuervo', '310 444 5500', 'jcuervo@correo.com'],
  ['Diagnóstico Clínico Vida Sana', '901.220.104-9', 'Jurídico', 3, 'Pereira', 'Risaralda', 'Zona Centro', 'Marcela Ochoa', '310 555 6600', 'administrativa@vidasana.com'],
  ['Transportes Meridian S.A.S.', '911.220.105-7', 'Jurídico', 2, 'Barranquilla', 'Atlántico', 'Zona Sur', 'Alberto Paternina', '310 666 7700', 'operaciones@transmeridian.com'],
  ['Restaurante La Trova Gourmet', '900.220.106-4', 'Jurídico', 1, 'Cartagena', 'Bolívar', 'Zona Norte', 'Silvia Londoño', '310 777 8800', 'latrova@correo.com'],
  ['Universidad Popular del Oriente', '900.220.107-2', 'Jurídico', 3, 'Villavicencio', 'Meta', 'Zona Centro', 'Ing. Raúl Beltrán', '310 888 9900', 'infraestructura@unporiente.edu'],
  ['Paola Andrea Sáenz', '1097667700', 'Natural', 1, 'Manizales', 'Caldas', 'Zona Sur', 'Paola Sáenz', '310 999 0000', 'psaenz@correo.com'],
  ['Metalúrgica Hércules S.A.S.', '901.220.108-0', 'Jurídico', 2, 'Armenia', 'Quindío', 'Zona Norte', 'Wilson Agudelo', '310 000 1100', 'compras@methercules.com'],
];
const clienteIds = [];
for (const [nombre, nit, tipo, prop, municipio, dpto, zona, contacto, tel, correo] of clientes) {
  let fila = (await q('SELECT id FROM clientes WHERE documento_nit = $1', [nit])).rows[0];
  if (!fila) {
    fila = (await q(
      `INSERT INTO clientes (nombre_razon_social, documento_nit, tipo_cliente, tipo_propiedad_id, estado)
       VALUES ($1, $2, $3, $4, 'Activo') RETURNING id`,
      [nombre, nit, tipo, prop])).rows[0];
    const zonaId = (await q('SELECT id FROM zonas WHERE lower(nombre) = lower($1)', [zona])).rows[0]?.id ?? null;
    await q(
      `INSERT INTO contactos_cliente (cliente_id, nombre, telefono, correo_electronico, cargo, es_principal)
       VALUES ($1, $2, $3, $4, 'Contacto principal', TRUE)`,
      [fila.id, contacto, tel, correo]);
    await q(
      `INSERT INTO direcciones_cliente (cliente_id, direccion, barrio, municipio, departamento, zona_id, es_principal)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
      [fila.id, `Calle ${40 + clienteIds.length * 3} # ${15 + clienteIds.length}`, `Barrio Central`, municipio, dpto, zonaId]);
  }
  clienteIds.push(fila.id);
}

// ── Materiales (10 nuevos) ────────────────────────────────────
const catMat = Object.fromEntries(
  (await q('SELECT lower(nombre) AS n, id FROM categorias_materiales')).rows.map((r) => [r.n, r.id])
);
const materiales = [
  ['EL-BUS-101', 'Busbar de Cobre 10x1/4"', 'conductores', 45, 'Metro', 92000],
  ['EL-APA-102', 'Tablero Metálico 8 Circuitos', 'aparamenta', 30, 'Unidad', 135000],
  ['EL-CAB-103', 'Cable THHN 12 AWG Verde', 'cables', 800, 'Metro', 4200],
  ['EL-CAN-104', 'Canalización HT 3/4" Conduit', 'canalización', 320, 'Metro', 8500],
  ['EL-TRF-105', 'Transformador Monofásico 10 kVA', 'transformadores', 4, 'Unidad', 3200000],
  ['EL-ACC-106', 'Cintarjeta Adhesiva 3M Negra', 'accesorios', 150, 'Pieza', 3500],
  ['EL-ILU-107', 'Panel LED 120W Luz Fría', 'iluminación', 60, 'Unidad', 210000],
  ['EL-HER-108', 'Peluca Aislante Clase 00', 'herramientas', 12, 'Unidad', 480000],
  ['CBL-109', 'Cable Multiconductor 2x14 Calibre', 'cableado y conectores', 500, 'Metro', 5600],
  ['TUB-110', 'Tubería Corrugada 3/4" Antiflama', 'tubería y conexiones', 260, 'Metro', 3900],
];
for (const [codigo, nombre, cat, stock, unidad, precio] of materiales) {
  await insertIfMissing('materiales', 'codigo',
    ['nombre', 'categoria_id', 'stock', 'unidad', 'precio_unitario'],
    [codigo, nombre, catMat[cat], stock, unidad, precio]);
}

// ── Cotizaciones (10 nuevos) con ítems ────────────────────────
const contactosByCliente = new Map(
  (await q('SELECT cliente_id, nombre, telefono, correo_electronico FROM contactos_cliente WHERE es_principal = TRUE'))
    .rows.map((r) => [r.cliente_id, r])
);
const direccionesByCliente = new Map(
  (await q('SELECT cliente_id, direccion FROM direcciones_cliente WHERE es_principal = TRUE'))
    .rows.map((r) => [r.cliente_id, r.direccion])
);
const cotizaciones = [
  ['COT-2026-2001', 'Instalación eléctrica sede administrativa', 'Aprobado', 0, 16],
  ['COT-2026-2002', 'Mantenimiento preventivo planta 3', 'Aprobado', 5, 16],
  ['COT-2026-2003', 'Ampliación circuitos bodega', 'Pendiente', 0, 19],
  ['COT-2026-2004', 'Termografía tableros principales', 'Aprobado', 10, 16],
  ['COT-2026-2005', 'Renovación de alumbrado exterior', 'Pendiente', 0, 16],
  ['COT-2026-2006', 'Certificación RETIE sede alterna', 'Rechazado', 0, 16],
  ['COT-2026-2007', 'Reparación de emergencia alimentador', 'Aprobado', 0, 19],
  ['COT-2026-2008', 'Balanceo de cargas y compensación', 'Pendiente', 8, 16],
  ['COT-2026-2009', 'Cableado estructurado piso 5', 'Aprobado', 12, 19],
  ['COT-2026-2010', 'Adecuación cuarto de medidores', 'Pendiente', 0, 16],
];
const srvRows = (await q("SELECT codigo, nombre, precio_numerico, unidad FROM servicios WHERE codigo LIKE 'SERV-%' ORDER BY codigo")).rows;
const matRows = (await q('SELECT codigo, nombre, precio_unitario, unidad FROM materiales ORDER BY codigo')).rows;
for (let i = 0; i < cotizaciones.length; i += 1) {
  const [codigo, proyecto, estado, descuento, iva] = cotizaciones[i];
  const clienteId = clienteIds[i % clienteIds.length];
  const cliente = (await q('SELECT nombre_razon_social FROM clientes WHERE id = $1', [clienteId])).rows[0];
  const contacto = contactosByCliente.get(clienteId) ?? {};
  const direccion = direccionesByCliente.get(clienteId) ?? '';
  const srv1 = srvRows[i % srvRows.length];
  const srv2 = srvRows[(i + 3) % srvRows.length];
  const mat = matRows[i % matRows.length];
  const items = [
    ['servicio', srv1.codigo, srv1.nombre, 1 + (i % 3), Number(srv1.precio_numerico), srv1.unidad, null],
    ['servicio', srv2.codigo, srv2.nombre, 1, Number(srv2.precio_numerico), srv2.unidad, null],
    ['material', mat.codigo, mat.nombre, 1 + (i % 20), Number(mat.precio_unitario), mat.unidad, null],
  ];
  const subtotal = items.reduce((acc, it) => acc + it[3] * it[4], 0);
  const montoDescuento = Math.round(subtotal * descuento / 100 * 100) / 100;
  const base = subtotal - montoDescuento;
  const montoImpuesto = Math.round(base * iva / 100 * 100) / 100;
  const total = base + montoImpuesto;
  const existe = (await q('SELECT 1 FROM cotizaciones WHERE codigo = $1', [codigo])).rows.length;
  if (!existe) {
    await q(
      `INSERT INTO cotizaciones (codigo, cliente_id, cliente_nombre, documento, contacto,
          telefono, correo, direccion, proyecto, fecha_emision, dias_vigencia,
          iva_porcentaje, descuento, estado, notas, subtotal, monto_descuento,
          monto_impuesto, total)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, CURRENT_DATE + $10::integer, 30, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [codigo, clienteId, cliente.nombre_razon_social, '',
       contacto.nombre ?? '', contacto.telefono ?? '', contacto.correo_electronico ?? '',
       direccion, proyecto, i * 3 - 25, iva, descuento, estado,
       `Cotización de demostración generada para el proyecto ${proyecto.toLowerCase()}.`,
       subtotal, montoDescuento, montoImpuesto, total]);
    for (let ord = 0; ord < items.length; ord += 1) {
      const [tipo, ref, desc, cant, precio, unidad, moneda] = items[ord];
      await q(
        `INSERT INTO cotizacion_items (cotizacion_codigo, tipo, referencia_id, descripcion,
            cantidad, precio_unitario, unidad, moneda_servicio, orden)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [codigo, tipo, ref, desc, cant, precio, unidad, moneda, ord]);
    }
    console.log(`Cotización ${codigo}: subtotal=${subtotal} iva=${iva}% total=${total}`);
  }
}

// ── Pagos (10 nuevos) sobre las cotizaciones demo ─────────────
const metodos = ['Transferencia', 'Efectivo', 'Tarjeta Crédito', 'Cheque'];
const pagos = [];
for (let i = 0; i < cotizaciones.length; i += 1) {
  const [codigo] = cotizaciones[i];
  const cot = (await q('SELECT cliente_nombre, documento, proyecto, total, estado FROM cotizaciones WHERE codigo = $1', [codigo])).rows[0];
  if (!cot) continue;
  if (cot.estado === 'Rechazado') {
    pagos.push([`${codigo}-P1`, codigo, cot.cliente_nombre, cot.documento, cot.proyecto, Number(cot.total), 0, metodos[i % metodos.length]]);
    continue;
  }
  const anticipo = Math.round(Number(cot.total) * 0.4 * 100) / 100;
  const saldo = Math.round((Number(cot.total) - anticipo) * 100) / 100;
  pagos.push([`${codigo}-P1`, codigo, cot.cliente_nombre, cot.documento, cot.proyecto, Number(cot.total), anticipo, metodos[i % metodos.length]]);
  if (cot.estado === 'Aprobado') {
    pagos.push([`${codigo}-P2`, codigo, cot.cliente_nombre, cot.documento, cot.proyecto, Number(cot.total), saldo, metodos[(i + 1) % metodos.length]]);
  }
}
let pagCounter = 1;
for (const [codigo, cotCodigo, clienteNombre, documento, proyecto, montoTotal, monto, metodo] of pagos) {
  if (monto <= 0) continue;
  await insertIfMissing('pagos', 'codigo',
    ['cotizacion_codigo', 'cotizacion_referencia', 'cliente_nombre', 'documento',
     'proyecto', 'monto_total', 'monto', 'fecha', 'hora', 'metodo', 'referencia', 'nota'],
    [codigo, cotCodigo, cotCodigo, clienteNombre, documento, proyecto, montoTotal, monto,
     `2026-10-${String(1 + (pagCounter % 28)).padStart(2, '0')}`,
     `${String(8 + (pagCounter % 9)).padStart(2, '0')}:30`, metodo,
     `REF-${90000 + pagCounter}`, 'Pago de demostración']);
  pagCounter += 1;
}

// ── Órdenes de servicio (10 nuevos) ───────────────────────────
const terceroIds = (await q("SELECT id FROM terceros WHERE usuario LIKE 'tec_%' ORDER BY id")).rows.map((r) => r.id);
const ordenEstados = [1, 2, 2, 4, 4, 3, 2, 4, 1, 4];
const ordenPrioridades = [3, 2, 4, 1, 2, 3, 4, 2, 1, 3];
const srvIds = (await q("SELECT id, codigo FROM servicios WHERE codigo LIKE 'SERV-DEMO%' ORDER BY codigo")).rows;
for (let i = 0; i < 10; i += 1) {
  const codigo = `OS-DEMO-${String(i + 1).padStart(4, '0')}`;
  const srv = srvIds[i % srvIds.length];
  const dia = `2026-10-${String(1 + i * 2).padStart(2, '0')}`;
  await insertIfMissing('ordenes_servicio', 'codigo',
    ['cliente_id', 'prioridad_id', 'estado_id', 'descripcion', 'fecha_creacion',
     'fecha_inicio', 'fecha_finalizacion', 'servicio_id', 'tercero_id', 'fecha_programada'],
    [codigo, clienteIds[i % clienteIds.length], ordenPrioridades[i], ordenEstados[i],
     `Orden de servicio demo: ejecución de ${srv.codigo} en sede del cliente.`,
     `${dia} 08:00`,
     ordenEstados[i] === 1 ? null : `${dia} 09:00`,
     ordenEstados[i] === 4 ? `${dia} 16:30` : null,
     srv.id, terceroIds[i % terceroIds.length], dia]);
}

// ── Agenda de actividades (10 nuevos) ─────────────────────────
const estadosAgenda = ['Programada', 'En proceso', 'Completada', 'Completada', 'Programada', 'Programada', 'En proceso', 'Completada', 'Cancelada', 'Programada'];
const prioridadesAgenda = ['Media', 'Alta', 'Baja', 'Media', 'Alta', 'Media', 'Alta', 'Baja', 'Media', 'Alta'];
for (let i = 0; i < 10; i += 1) {
  const codigo = `ACT-DEMO-${String(i + 1).padStart(4, '0')}`;
  const srv = srvIds[i % srvIds.length];
  const ini = 7 + (i % 8);
  await insertIfMissing('agenda_actividades', 'codigo',
    ['cliente_id', 'servicio_id', 'tercero_id', 'fecha', 'hora_inicio', 'hora_fin',
     'horas', 'estado', 'prioridad', 'descripcion'],
    [codigo, clienteIds[i % clienteIds.length], srv.id,
     terceroIds[i % terceroIds.length], `2026-10-${String(20 + (i % 9)).padStart(2, '0')}`,
     `${String(ini).padStart(2, '0')}:00`, `${String(ini + 2).padStart(2, '0')}:00`,
     2, estadosAgenda[i], prioridadesAgenda[i],
     `Actividad programada de demostración para el servicio ${srv.codigo}.`]);
}

// ── Resumen ───────────────────────────────────────────────────
const resumen = [
  'roles', 'usuarios', 'terceros', 'servicios', 'clientes',
  'materiales', 'cotizaciones', 'cotizacion_items', 'pagos',
  'ordenes_servicio', 'agenda_actividades',
];
for (const t of resumen) {
  const { rows } = await q(`SELECT count(*)::int AS n FROM ${t}`);
  console.log(`${t}: ${rows[0].n} registros`);
}
await client.end();
console.log(`\nSiembra completada. Contraseña de cuentas demo: ${DEMO_PASSWORD}`);
