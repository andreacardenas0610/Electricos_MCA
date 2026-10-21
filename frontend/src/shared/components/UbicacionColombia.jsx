const MUNICIPIOS_POR_DEPARTAMENTO = {
  Amazonas: ['Leticia', 'Puerto Nariño'],
  Antioquia: [
    'Medellín', 'Abejorral', 'Apartadó', 'Bello', 'Caldas', 'Carepa', 'Caucasia',
    'Chigorodó', 'Copacabana', 'Envigado', 'Girardota', 'Itagüí', 'La Ceja',
    'Marinilla', 'Rionegro', 'Sabaneta', 'Turbo',
  ],
  Arauca: ['Arauca', 'Arauquita', 'Saravena', 'Tame'],
  Atlántico: [
    'Barranquilla', 'Baranoa', 'Galapa', 'Malambo', 'Puerto Colombia',
    'Sabanagrande', 'Soledad',
  ],
  'Bogotá D.C.': ['Bogotá'],
  Bolívar: ['Cartagena', 'Magangué', 'Turbaco'],
  Boyacá: ['Tunja', 'Chiquinquirá', 'Duitama', 'Sogamoso', 'Villa de Leyva'],
  Caldas: ['Manizales', 'Anserma', 'Chinchiná', 'La Dorada', 'Villamaría'],
  Caquetá: ['Florencia', 'Belén de los Andaquíes', 'San Vicente del Caguán'],
  Casanare: ['Yopal', 'Aguazul', 'Maní', 'Tauramena', 'Villanueva'],
  Cauca: ['Popayán', 'Guapi', 'Santander de Quilichao'],
  Cesar: ['Valledupar', 'Aguachica', 'Agustín Codazzi', 'Bosconia'],
  Chocó: ['Quibdó', 'Istmina', 'Nuquí'],
  Córdoba: ['Montería', 'Lorica', 'Sahagún', 'Tierralta'],
  Cundinamarca: [
    'Bogotá', 'Cajicá', 'Chía', 'Facatativá', 'Fusagasugá', 'Funza', 'Girardot',
    'La Calera', 'Madrid', 'Mosquera', 'Soacha', 'Zipaquirá',
  ],
  Guainía: ['Inírida'],
  Guaviare: ['San José del Guaviare', 'Calamar', 'El Retorno', 'Miraflores'],
  Huila: ['Neiva', 'Garzón', 'Pitalito', 'La Plata'],
  'La Guajira': ['Riohacha', 'Maicao', 'Manaure', 'Uribia'],
  Magdalena: ['Santa Marta', 'Ciénaga', 'Fundación', 'Plato'],
  Meta: ['Villavicencio', 'Acacías', 'Granada', 'Puerto López'],
  Nariño: ['Pasto', 'Ipiales', 'Tumaco', 'Túquerres'],
  'Norte de Santander': ['Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario'],
  Putumayo: ['Mocoa', 'Orito', 'Puerto Asís', 'Sibundoy'],
  Quindío: ['Armenia', 'Calarcá', 'Montenegro', 'Quimbaya'],
  Risaralda: ['Pereira', 'Dosquebradas', 'La Virginia', 'Santa Rosa de Cabal'],
  'San Andrés y Providencia': ['San Andrés', 'Providencia'],
  Santander: ['Bucaramanga', 'Barrancabermeja', 'Floridablanca', 'Girón', 'Piedecuesta', 'San Gil'],
  Sucre: ['Sincelejo', 'Corozal', 'Sampués', 'Tolú'],
  Tolima: ['Ibagué', 'Espinal', 'Honda', 'Melgar'],
  'Valle del Cauca': [
    'Cali', 'Buenaventura', 'Buga', 'Cartago', 'Jamundí', 'Palmira', 'Tuluá', 'Yumbo',
  ],
  Vaupés: ['Mitú', 'Carurú', 'Taraira'],
  Vichada: ['Puerto Carreño', 'La Primavera', 'Santa Rosalía'],
};

export const DEPARTAMENTOS_COLOMBIA = Object.keys(MUNICIPIOS_POR_DEPARTAMENTO);

export function CampoDepartamento({ value, onChange, ...props }) {
  return (
    <>
      <input
        {...props}
        type="text"
        list="departamentos-colombia"
        value={value}
        onChange={onChange}
        autoComplete="off"
      />
      <datalist id="departamentos-colombia">
        {DEPARTAMENTOS_COLOMBIA.map((departamento) => (
          <option key={departamento} value={departamento} />
        ))}
      </datalist>
    </>
  );
}

export function CampoMunicipio({ departamento, value, onChange, ...props }) {
  const sugerencias = MUNICIPIOS_POR_DEPARTAMENTO[departamento] || [];

  return (
    <>
      <input
        {...props}
        type="text"
        list="municipios-colombia"
        value={value}
        onChange={onChange}
        autoComplete="off"
      />
      <datalist id="municipios-colombia">
        {sugerencias.map((municipio) => (
          <option key={municipio} value={municipio} />
        ))}
      </datalist>
    </>
  );
}
