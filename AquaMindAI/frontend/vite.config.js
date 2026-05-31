// vite.config.js
// Configuración de Vite para el frontend de AquaMind: plugins de React y
// Tailwind CSS v4, con el servidor de desarrollo en el puerto 5173.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
});
