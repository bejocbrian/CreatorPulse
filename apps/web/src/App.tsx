import { Link, Route, Routes } from 'react-router-dom';

import { HealthPage } from './pages/HealthPage';
import { HomePage } from './pages/HomePage';

export function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 24 }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <strong>Acme</strong>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/">Home</Link>
          <Link to="/health">Health</Link>
        </nav>
      </header>

      <main style={{ marginTop: 24 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/health" element={<HealthPage />} />
        </Routes>
      </main>
    </div>
  );
}
