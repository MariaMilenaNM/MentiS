import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importando as páginas
import LandingPage from './pages/LandingPage';
import Paciente from './pages/Paciente';
import Painel from './pages/Painel';
import Profissional from './pages/Profissional';

export default function App() {
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