// main.jsx
// Punto de entrada de la aplicación React: monta <App /> en el DOM y carga los
// estilos globales (Tailwind CSS).

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
