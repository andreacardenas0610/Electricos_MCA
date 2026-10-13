export function SistemaAbonos() {
  const [esOscuro, setEsOscuro] = useState(true);

  const [transacciones, setTransacciones] = useState([
    {
      id: '#PAG-9482',
      total: 15200,
      abonado: 12000,
      saldo: 3200,
      metodo: 'Transferencia',
      estado: 'ABONO PARCIAL'
    },
    {
      id: '#PAG-9485',
      total: 8450,
      abonado: 8450,
      saldo: 0,
      metodo: 'Tarjeta',
      estado: 'LIQUIDADO'
    },
    {
      id: '#PAG-9489',
      total: 24000,
      abonado: 0,
      saldo: 24000,
      metodo: 'Efectivo',
      estado: 'PENDIENTE'
    },
    {
      id: '#PAG-9492',
      total: 5700,
      abonado: 5700,
      saldo: 0,
      metodo: 'Transferencia',
      estado: 'LIQUIDADO'
    }
  ]);

  const exportarReporte = () => {
    const encabezados = [
      'ID',
      'Total',
      'Abonado',
      'Saldo',
      'Método',
      'Estado'
    ];

    const filas = transacciones.map((item) => [
      item.id,
      item.total,
      item.abonado,
      item.saldo,
      item.metodo,
      item.estado
    ]);

    const contenido = [
      encabezados,
      ...filas
    ]
      .map((fila) =>
        fila
          .map((dato) => `"${String(dato).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const blob = new Blob(
      ['\ufeff' + contenido],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'Reporte_Abonos_Ventas.csv';

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    URL.revokeObjectURL(url);
  };

  return (
    <div>

      {/* TODO TU DISEÑO ACTUAL */}

      <button onClick={exportarReporte}>
        Exportar Reporte
      </button>

      {/* RESTO DE TU DISEÑO */}

    </div>
  );
}