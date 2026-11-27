import { useCallback, useEffect, useRef, useState } from 'react';

export function useApiData(loader, initialData, options = {}) {
  const loaderRef = useRef(loader);
  const mountedRef = useRef(false);
  const intervaloMs = Number(options.intervaloMs) > 0 ? Number(options.intervaloMs) : 0;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  loaderRef.current = loader;

  const reload = useCallback(async () => {
    if (mountedRef.current) setLoading(true);

    try {
      const result = await loaderRef.current();
      if (mountedRef.current) {
        setData(result);
        setError('');
        setUltimaActualizacion(new Date());
      }
    } catch (requestError) {
      if (mountedRef.current) {
        setError(requestError.message || 'No se pudieron cargar los datos.');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Refresco silencioso: actualiza sin mostrar el estado de carga. Si falla,
  // conserva los datos que ya estaban en pantalla y espera al siguiente ciclo.
  const refrescar = useCallback(async () => {
    try {
      const result = await loaderRef.current();
      if (mountedRef.current) {
        setData(result);
        setError('');
        setUltimaActualizacion(new Date());
      }
    } catch {
      // Sin ruido: el refresco automático no debe romper la vista actual.
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void reload();

    let temporizador = null;
    let alVolver = null;
    if (intervaloMs > 0) {
      temporizador = setInterval(() => {
        if (document.visibilityState === 'visible') void refrescar();
      }, intervaloMs);
      alVolver = () => {
        if (document.visibilityState === 'visible') void refrescar();
      };
      document.addEventListener('visibilitychange', alVolver);
    }

    return () => {
      mountedRef.current = false;
      if (temporizador) clearInterval(temporizador);
      if (alVolver) document.removeEventListener('visibilitychange', alVolver);
    };
  }, [reload, refrescar, intervaloMs]);

  return { data, error, loading, reload, refrescar, ultimaActualizacion };
}
