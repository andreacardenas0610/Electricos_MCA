import { Zap } from 'lucide-react';

export function SplashScreen() {
  return (
    <main className="splash-screen" aria-label="Cargando Eléctricos MCA">
      <div className="splash-content">
        <div className="splash-mark" aria-hidden="true">
          <Zap size={30} strokeWidth={2.2} />
        </div>
        <h1>ELÉCTRICOS MCA</h1>
        <p>GESTIÓN INDUSTRIAL</p>
        <span className="splash-loader" aria-hidden="true" />
      </div>
    </main>
  );
}
