// DashboardLayout.jsx
// Layout base del dashboard: fondo oscuro global, contenedor centrado y padding
// consistente. Mantiene la UI a ancho completo de laptop con un máximo cómodo.

/**
 * @param {{ children: React.ReactNode }} props
 */
function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <main className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6">
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;
