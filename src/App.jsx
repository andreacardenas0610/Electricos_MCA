import { useEffect, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { SplashScreen } from './components/SplashScreen.jsx';
import './styles/theme.css';
import './styles/splash.css';

export default function App() {
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const temporizador = window.setTimeout(() => setCargando(false), 1800);
    return () => window.clearTimeout(temporizador);
  }, []);

  return (
    <ThemeProvider>
      {cargando ? <SplashScreen /> : <Dashboard />}
    </ThemeProvider>
  );
}