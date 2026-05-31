// ConnectionStatus.jsx
// Indicador minimalista del estado del socket en tiempo real (Socket.IO).

/**
 * @param {{ isConnected?: boolean }} props - Estado de la conexión WebSocket.
 */
function ConnectionStatus({ isConnected }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium ${
        isConnected
          ? 'border-green-500/30 bg-green-500/10 text-green-400'
          : 'border-red-500/30 bg-red-500/10 text-red-400'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
        }`}
      />
      {isConnected ? 'En línea' : 'Desconectado'}
    </span>
  );
}

export default ConnectionStatus;
