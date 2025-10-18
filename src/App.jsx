// LangMatch Dashboard (solo front, con Tailwind CDN)
import { useState, useEffect } from "react";

// URL del backend (usa tu .env o ponla fija aquí)
const API_URL = import.meta.env.VITE_API_URL || "https://lang-match-back.vercel.app";

// Endpoints del backend
const fetchGlobalStats = async () => {
  const res = await fetch(`${API_URL}/sala/stats/global`);
  return res.json();
};

const fetchUserStats = async (userId) => {
  const res = await fetch(`${API_URL}/user/stats/${userId}`);
  return res.json();
};

const exportSessionPDFUrl = (sessionId) =>
  `${API_URL}/sala/session/${sessionId}/export-pdf`;

export default function App() {
  const [globalStats, setGlobalStats] = useState(null);
  const [userId, setUserId] = useState("");
  const [userStats, setUserStats] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- Cargar métricas globales ---
  useEffect(() => {
    const loadGlobal = async () => {
      try {
        const data = await fetchGlobalStats();
        setGlobalStats(data);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las métricas globales");
      }
    };
    loadGlobal();
  }, []);

  // --- Consultar métricas por usuario ---
  const handleSearchUser = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError("");
      const data = await fetchUserStats(userId);
      setUserStats(data);
    } catch (err) {
      setError("Error al consultar el usuario");
    } finally {
      setLoading(false);
    }
  };

  // --- Exportar PDF de una sesión ---
  const handleExportPDF = () => {
    if (!sessionId) return;
    window.open(exportSessionPDFUrl(sessionId), "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* ENCABEZADO */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-600">LangMatch Dashboard</h1>
        <p className="text-gray-600">Visualización de datos del chatbot educativo multilingüe</p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MÉTRICAS GLOBALES */}
        <section className="lg:col-span-2 bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">📊 Métricas Globales</h2>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          {!globalStats ? (
            <p className="text-gray-500 text-sm">Cargando métricas...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div className="p-3 border rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{globalStats.totalMensajes}</p>
                <p className="text-sm text-gray-500">Mensajes Totales</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{globalStats.totalSesiones}</p>
                <p className="text-sm text-gray-500">Sesiones Totales</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{globalStats.totalUsuarios}</p>
                <p className="text-sm text-gray-500">Usuarios Registrados</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-lg font-semibold text-blue-600">{globalStats.idiomaMasPracticado}</p>
                <p className="text-sm text-gray-500">Idioma Más Usado</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-lg font-semibold text-blue-600">{globalStats.nivelMasElegido}</p>
                <p className="text-sm text-gray-500">Nivel Más Elegido</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-lg font-semibold text-blue-600">{globalStats.promedioDuracionMin} min</p>
                <p className="text-sm text-gray-500">Duración Promedio</p>
              </div>
            </div>
          )}
        </section>

        {/* CONSULTA POR USUARIO */}
        <section className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">👤 Consultar Usuario</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="ID del usuario"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearchUser}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {userStats ? (
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p><b>Total de Sesiones:</b> {userStats.totalSesiones}</p>
              <p><b>Total de Mensajes:</b> {userStats.totalMensajesUsuario}</p>
              <p><b>Promedio Duración:</b> {userStats.promedioDuracionMin} min</p>
              <p><b>Idiomas practicados:</b> {userStats.idiomas?.join(", ")}</p>
              <p><b>Niveles:</b> {userStats.niveles?.join(", ")}</p>
              <p><b>Última sesión:</b> {userStats.ultimaSesion}</p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Introduce un ID y presiona “Buscar”.</p>
          )}
        </section>

        {/* EXPORTAR PDF DE SESIÓN */}
        <section className="lg:col-span-3 bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">🗂️ Exportar PDF de una Sesión</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="ID de sesión"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleExportPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Exportar PDF
            </button>
          </div>
          <p className="text-gray-500 text-sm">
            Ingresa el ID de una sesión activa o pasada para descargar el PDF.
          </p>
        </section>

        {/* PLACEHOLDERS */}
        <section className="lg:col-span-3 bg-gray-50 rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500 text-sm">
          <p>📋 “Lista de usuarios” y “Sesiones activas” estarán disponibles cuando el backend exponga sus endpoints.</p>
        </section>
      </div>

      <footer className="text-center text-xs text-gray-500 mt-10">
        © 2025 LangMatch Dashboard – Desarrollado con React y Tailwind CDN
      </footer>
    </div>
  );
}
