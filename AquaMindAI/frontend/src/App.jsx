// App.jsx
// Componente raíz: envuelve la app con FilterProvider (datos del filtro) y el
// enrutador, y define la ruta principal hacia el dashboard. Aplica el fondo
// oscuro global al contenedor raíz.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FilterProvider } from './context/FilterContext';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <FilterProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-950">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            {/* Cualquier ruta desconocida redirige al dashboard. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </FilterProvider>
  );
}

export default App;
