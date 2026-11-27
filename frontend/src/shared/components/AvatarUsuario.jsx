import { useMemo, useState } from 'react';
import { UserRound } from 'lucide-react';

// El avatar se deriva del género y del usuario (que es único), así cada
// cuenta obtiene una ilustración distinta sin guardar archivos.
const TOPS_MUJER = [
  'longHairBigHair', 'longHairBob', 'longHairBun', 'longHairCurly', 'longHairCurvy',
  'longHairDreads', 'longHairFrida', 'longHairFro', 'longHairFroBand',
  'longHairNotTooLong', 'longHairShavedSides', 'longHairMiaWallace',
  'longHairStraight', 'longHairStraight2', 'longHairStraightStrand',
].join(',');

const TOPS_HOMBRE = [
  'shortHairShortFlat', 'shortHairShortRound', 'shortHairShortWaved',
  'shortHairSides', 'shortHairTheCaesar', 'shortHairTheCaesarSidePart',
  'shortHairDreads01', 'shortHairFrizzle', 'shortHairShaggyMullet', 'shortHairShortCurly',
].join(',');

const FONDOS = 'fef3c7,fde68a,fef08a,fefce8';

export function urlAvatar(genero, semilla) {
  const esMujer = genero === 'Mujer';
  const esHombre = genero === 'Hombre';
  if (!esMujer && !esHombre) return null;
  const seed = encodeURIComponent(String(semilla || genero || 'usuario'));
  const opciones = [
    `seed=${seed}`,
    'size=96',
    'radius=50',
    `backgroundColor=${FONDOS}`,
    `top=${esMujer ? TOPS_MUJER : TOPS_HOMBRE}`,
    `facialHairProbability=${esHombre ? 25 : 0}`,
  ].join('&');
  return `https://api.dicebear.com/9.x/avataaars/png?${opciones}`;
}

// Iniciales del nombre en amarillo + inicial del rol al final. Ej: "CAA".
export function inicialesConRol(nombre = '', rol = '') {
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean);
  const letras = partes
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('') || '?';
  const inicialRol = String(rol || '').trim()[0]?.toUpperCase() || '';
  return `${letras}${inicialRol}`;
}

export function ChipInicialesRol({ nombre, rol, title }) {
  return (
    <span
      title={title || `Iniciales del nombre y del rol`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(250, 204, 21, 0.16)',
        border: '1px solid rgba(250, 204, 21, 0.5)',
        color: '#facc15',
        borderRadius: 8,
        padding: '1px 6px',
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: 0.4,
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
      }}
    >
      {inicialesConRol(nombre, rol)}
    </span>
  );
}

export function AvatarUsuario({
  nombre = '',
  usuario = '',
  genero = 'Prefiere no decirlo',
  rol = '',
  size = 38,
  title = '',
}) {
  const [fallo, setFallo] = useState(false);
  const url = useMemo(() => urlAvatar(genero, usuario || nombre), [genero, usuario, nombre]);
  const base = {
    width: size,
    height: size,
    borderRadius: '50%',
    flex: '0 0 auto',
    display: 'grid',
    placeItems: 'center',
  };

  if (url && !fallo) {
    return (
      <img
        src={url}
        alt={`Avatar de ${nombre || usuario}`}
        title={title || nombre}
        onError={() => setFallo(true)}
        style={{
          ...base,
          objectFit: 'cover',
          backgroundColor: '#fde68a',
          border: '1px solid rgba(250, 204, 21, 0.45)',
        }}
      />
    );
  }

  if (genero === 'Mujer' || genero === 'Hombre') {
    const iniciales = inicialesConRol(nombre, rol).slice(0, 3);
    return (
      <div
        title={title || nombre}
        style={{
          ...base,
          backgroundColor: 'rgba(250, 204, 21, 0.16)',
          border: '1px solid rgba(250, 204, 21, 0.55)',
          color: '#facc15',
          fontWeight: 800,
          fontSize: Math.max(10, Math.round(size * 0.3)),
        }}
      >
        {iniciales}
      </div>
    );
  }

  // Sin imagen, como el usuario gris de WhatsApp.
  return (
    <div
      title={title || 'Sin foto'}
      style={{
        ...base,
        backgroundColor: '#6b7280',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        color: '#e5e7eb',
      }}
    >
      <UserRound size={Math.round(size * 0.55)} strokeWidth={1.8} aria-hidden="true" />
    </div>
  );
}

export default AvatarUsuario;
