// App.jsx
// Componente raíz: monta el enrutador y envuelve la app con FilterProvider para
// que toda la UI acceda a los datos del filtro. La UI visual se construirá luego.

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FilterProvider } from './context/FilterContext';

function App() {
  return (
    <FilterProvider>
      <BrowserRouter>
        <Routes>
          {/* Placeholder: se reemplazará por el dashboard y sus páginas. */}
          <Route
            path="/"
            element={<div>AquaMind AI - Cargando dashboard...</div>}
          />
        </Routes>
      </BrowserRouter>
    </FilterProvider>
  );
}

export default App;
