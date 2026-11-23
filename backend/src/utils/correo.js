import nodemailer from 'nodemailer';

const TIEMPO_LIMITE_MS = 15000;

// El remitente debe ser una cuenta autorizada por el proveedor. En Gmail es la
// misma cuenta SMTP_USER; en Resend es un dominio verificado (o onboarding@resend.dev).
export function remitenteCorreo() {
  return process.env.CORREO_FROM
    || process.env.SMTP_FROM
    || process.env.SMTP_USER
    || 'Eléctricos MCA <onboarding@resend.dev>';
}

// Solo informa qué hay configurado, nunca los valores (usuario, clave, API key).
export function configuracionCorreo() {
  if (process.env.RESEND_API_KEY) return { configurado: true, proveedor: 'resend' };
  if (process.env.SMTP_HOST || process.env.SMTP_SERVICE) return { configurado: true, proveedor: 'smtp' };
  return { configurado: false, proveedor: 'ninguno' };
}

async function enviarConResend(destinatario, subject, text) {
  const respuesta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: remitenteCorreo(),
      to: [destinatario],
      subject,
      text,
    }),
    signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '');
    throw new Error(`Resend rechazó el envío (${respuesta.status}). ${detalle.slice(0, 200)}`.trim());
  }
}

async function enviarConSmtp(destinatario, subject, text) {
  const transporte = nodemailer.createTransport({
    ...(process.env.SMTP_SERVICE
      ? { service: process.env.SMTP_SERVICE }
      : {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      }),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: TIEMPO_LIMITE_MS,
    greetingTimeout: TIEMPO_LIMITE_MS,
    socketTimeout: TIEMPO_LIMITE_MS,
  });

  await transporte.sendMail({
    from: remitenteCorreo(),
    to: destinatario,
    subject,
    text,
  });
}

// Lanza un error con mensaje entendible si el proveedor rechaza el envío.
export async function enviarCorreo({ destinatario, subject, text }) {
  if (!configuracionCorreo().configurado) {
    const error = new Error('El envío de correo no está configurado en el servidor.');
    error.status = 503;
    throw error;
  }

  if (process.env.RESEND_API_KEY) {
    await enviarConResend(destinatario, subject, text);
    return;
  }

  await enviarConSmtp(destinatario, subject, text);
}
