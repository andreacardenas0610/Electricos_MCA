import { ThemeProvider } from './context/ThemeContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import './styles/theme.css';

export default function App() {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
}