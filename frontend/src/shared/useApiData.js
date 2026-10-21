import { useCallback, useEffect, useRef, useState } from 'react';

export function useApiData(loader, initialData) {
  const loaderRef = useRef(loader);
  const mountedRef = useRef(false);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  loaderRef.current = loader;

  const reload = useCallback(async () => {
    if (mountedRef.current) setLoading(true);

    try {
      const result = await loaderRef.current();
      if (mountedRef.current) {
        setData(result);
        setError('');
      }
    } catch (requestError) {
      if (mountedRef.current) {
        setError(requestError.message || 'No se pudieron cargar los datos.');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void reload();
    return () => {
      mountedRef.current = false;
    };
  }, [reload]);

  return { data, error, loading, reload };
}
