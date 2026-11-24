import { useEffect, useState } from 'react';
import { ThemeProvider } from './shared/context/ThemeContext.jsx';
import { GlobalTooltip } from './shared/components/ui.jsx';
import Dashboard from './app/components/Dashboard.jsx';
import { SplashScreen } from './shared/components/SplashScreen.jsx';
import './shared/styles/theme.css';
import './shared/styles/ui.css';
import './shared/styles/splash.css';

export default function App() {
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const temporizador = window.setTimeout(() => setCargando(false), 1800);
    return () => window.clearTimeout(temporizador);
  }, []);

  return (
    <ThemeProvider>
      <div className="app-root">
        <GlobalTooltip />
        {cargando ? <SplashScreen /> : <Dashboard />}
      </div>
    </ThemeProvider>
  );
}
