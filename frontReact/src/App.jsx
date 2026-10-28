import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';

// Importando as páginas
import LandingPage from './pages/LandingPage';
import Paciente from './pages/Paciente';
import Painel from './pages/Painel';
import Profissional from './pages/Profissional';

function AppRoutes() {
  return (
    <Routes>
      {/* Cada Route liga um caminho na URL ao seu respectivo componente */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/paciente" element={<Paciente />} />
      <Route path="/painel" element={<Painel />} />
      <Route path="/profissional" element={<Profissional />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </BrowserRouter>
  );
}