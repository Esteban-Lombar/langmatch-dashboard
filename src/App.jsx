// LangMatch Dashboard (solo front, Tailwind CDN)
// Requisitos: index.html incluye <script src="https://cdn.tailwindcss.com"></script>

import { useEffect, useState, useMemo } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://lang-match-back.vercel.app";

// --- API helpers ---
const getJSON = async (path) => {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
  return res.json();
};

const fetchGlobalStats    = () => getJSON("/sala/stats/global");
const fetchUserStats      = (userId) => getJSON(`/user/stats/${userId}`);
const fetchUsersList      = () => getJSON("/user/listaUsers");
const fetchActiveSessions = () => getJSON("/sala/activas");
const exportSessionPDFUrl = (sessionId) => `${API_URL}/sala/session/${sessionId}/export-pdf`;

// --- UI helpers ---
const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : "-");
const cx  = (...a) => a.filter(Boolean).join(" ");

// Convierte arrays mixtos (strings | objetos) a un string legible
const listify = (arr, keys = ["name", "language", "level", "valor", "value"]) => {
  if (!Array.isArray(arr) || arr.length === 0) return "-";
  return arr
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") return String(item);
      if (item && typeof item === "object") {
        for (const k of keys) if (item[k]) return String(item[k]);
        // Si no coincide ninguna key conocida, como fallback:
        return JSON.stringify(item);
      }
      return "";
    })
    .filter(Boolean)
    .join(", ");
};

export default function App() {
  // global
  const [globalStats, setGlobalStats] = useState(null);
  const [globalErr, setGlobalErr] = useState("");

  // users
  const [users, setUsers] = useState([]);
  const [usersErr, setUsersErr] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);

  // sessions
  const [sessions, setSessions] = useState([]);
  const [sessionsErr, setSessionsErr] = useState("");
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // user stats
  const [userId, setUserId] = useState("");
  const [userStats, setUserStats] = useState(null);
  const [userStatsErr, setUserStatsErr] = useState("");
  const [userStatsLoading, setUserStatsLoading] = useState(false);

  // export
  const [sessionId, setSessionId] = useState("");

  // filtros simples (client-side)
  const [langFilter, setLangFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  // ---- load global stats ----
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setGlobalErr("");
        const data = await fetchGlobalStats();
        if (alive) setGlobalStats(data);
      } catch (e) {
        if (alive) setGlobalErr("No se pudieron cargar las métricas globales.");
      }
    };
    load();
    const id = setInterval(load, 20000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // ---- load users ----
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersErr("");
      const data = await fetchUsersList();
      // se espera { total, usuarios: [ { userId, firstName, lastName, email, createdAt } ] }
      setUsers(Array.isArray(data?.usuarios) ? data.usuarios : []);
    } catch (e) {
      setUsersErr("No se pudo cargar la lista de usuarios.");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // ---- load active sessions ----
  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      setSessionsErr("");
      const data = await fetchActiveSessions();
      // se espera { total, sesiones: [ { sessionId, userId, usuario, language, level, startedAt } ] }
      setSessions(Array.isArray(data?.sesiones) ? data.sesiones : []);
    } catch (e) {
      setSessionsErr("No se pudieron cargar las sesiones activas.");
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadSessions();
    const id = setInterval(() => {
      loadUsers();
      loadSessions();
    }, 20000);
    return () => clearInterval(id);
  }, []);

  // ---- user stats search ----
  const onSearchUser = async () => {
    if (!userId) return;
    try {
      setUserStatsLoading(true);
      setUserStatsErr("");
      const data = await fetchUserStats(userId);
      setUserStats(data);
    } catch (e) {
      setUserStatsErr("No se pudieron cargar las métricas del usuario.");
      setUserStats(null);
    } finally {
      setUserStatsLoading(false);
    }
  };

  // ---- filters for sessions (client side) ----
  const langs = useMemo(() => Array.from(new Set(sessions.map((s) => s.language))), [sessions]);
  const levels = useMemo(() => Array.from(new Set(sessions.map((s) => s.level))), [sessions]);
  const filteredSessions = useMemo(() => {
    return sessions.filter(
      (s) =>
        (!langFilter || s.language === langFilter) &&
        (!levelFilter || s.level === levelFilter)
    );
  }, [sessions, langFilter, levelFilter]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-blue-700">LangMatch – Dashboard</h1>
              <p className="text-xs text-gray-500">Front-only · conectado a {API_URL}</p>
            </div>
          </div>
          <button
            onClick={() => {
              loadUsers();
              loadSessions();
            }}
            className="text-sm px-3 py-1.5 rounded-lg border hover:bg-white"
          >
            Refrescar
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Métricas globales */}
        <section className="lg:col-span-2 bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">📊 Métricas Globales</h2>
          {globalErr && <p className="text-red-600 text-sm mb-2">{globalErr}</p>}
          {!globalStats ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <CardStat label="Mensajes Totales" value={globalStats.totalMensajes} />
              <CardStat label="Sesiones Totales" value={globalStats.totalSesiones} />
              <CardStat label="Usuarios Registrados" value={globalStats.totalUsuarios} />
              <CardStat label="Idioma Más Usado" value={globalStats.idiomaMasPracticado} />
              <CardStat label="Nivel Más Elegido" value={globalStats.nivelMasElegido} />
              <CardStat
                label="Duración Promedio"
                value={
                  typeof globalStats.promedioDuracionMin === "number"
                    ? `${Number(globalStats.promedioDuracionMin).toFixed(2)} min`
                    : `${globalStats.promedioDuracionMin} min`
                }
              />
            </div>
          )}
        </section>

        {/* Métricas por usuario */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">👤 Métricas por Usuario</h2>
          <div className="flex gap-2 mb-3">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="userId (pega un ID)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <button
              onClick={onSearchUser}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-700"
            >
              {userStatsLoading ? "Consultando..." : "Consultar"}
            </button>
          </div>
          {userStatsErr && <p className="text-red-600 text-sm mb-2">{userStatsErr}</p>}
          {userStats ? (
            <div className="bg-gray-50 p-3 rounded-lg text-sm leading-6">
              <p>
                <b>Total de Sesiones:</b> {userStats.totalSesiones ?? "-"}
              </p>
              <p>
                <b>Total Mensajes Usuario:</b> {userStats.totalMensajesUsuario ?? "-"}
              </p>
              <p>
                <b>Total Mensajes Bot:</b> {userStats.totalMensajesBot ?? "-"}
              </p>
              <p>
                <b>Promedio Duración:</b>{" "}
                {typeof userStats.promedioDuracionMin === "number"
                  ? `${Number(userStats.promedioDuracionMin).toFixed(2)} min`
                  : `${userStats.promedioDuracionMin ?? "-"} min`}
              </p>
              <p>
                <b>Idiomas:</b> {listify(userStats.idiomas)}
              </p>
              <p>
                <b>Niveles:</b> {listify(userStats.niveles)}
              </p>
              <p>
                <b>Última sesión:</b> {userStats.ultimaSesion || "-"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Ingresa un <b>userId</b> y presiona Consultar.
            </p>
          )}
        </section>

        {/* Lista de usuarios */}
        <section className="lg:col-span-2 bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">👥 Usuarios</h2>
            <button
              onClick={loadUsers}
              className="text-sm px-3 py-1 rounded-lg border hover:bg-white"
            >
              {usersLoading ? "Cargando..." : "Recargar"}
            </button>
          </div>
          {usersErr && <p className="text-red-600 text-sm mb-2">{usersErr}</p>}
          <div className="overflow-auto border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2">UserID</th>
                  <th className="text-left px-3 py-2">Nombre</th>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">Creado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.userId} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{u.userId}</td>
                    <td className="px-3 py-2">
                      {`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "-"}
                    </td>
                    <td className="px-3 py-2">{u.email ?? "-"}</td>
                    <td className="px-3 py-2">{fmt(u.createdAt)}</td>
                  </tr>
                ))}
                {users.length === 0 && !usersLoading && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                      Sin usuarios
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sesiones activas + filtros */}
        <section className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">🟢 Sesiones activas</h2>
            <button
              onClick={loadSessions}
              className="text-sm px-3 py-1 rounded-lg border hover:bg-white"
            >
              {sessionsLoading ? "Cargando..." : "Recargar"}
            </button>
          </div>

          {/* filtros client-side */}
          <div className="flex gap-2 mb-3">
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
            >
              <option value="">Idioma (todos)</option>
              {langs.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="">Nivel (todos)</option>
              {levels.map((lv) => (
                <option key={lv} value={lv}>
                  {lv}
                </option>
              ))}
            </select>
            {(langFilter || levelFilter) && (
              <button
                onClick={() => {
                  setLangFilter("");
                  setLevelFilter("");
                }}
                className="text-sm px-3 py-2 rounded-lg border hover:bg-white"
              >
                Limpiar
              </button>
            )}
          </div>

          {sessionsErr && <p className="text-red-600 text-sm mb-2">{sessionsErr}</p>}

          <div className="overflow-auto border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2">SessionID</th>
                  <th className="text-left px-3 py-2">Usuario</th>
                  <th className="text-left px-3 py-2">UserID</th>
                  <th className="text-left px-3 py-2">Idioma</th>
                  <th className="text-left px-3 py-2">Nivel</th>
                  <th className="text-left px-3 py-2">Inicio</th>
                  <th className="text-left px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSessions.map((s) => (
                  <tr key={s.sessionId} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{s.sessionId}</td>
                    <td className="px-3 py-2">{s.usuario}</td>
                    <td className="px-3 py-2">{s.userId}</td>
                    <td className="px-3 py-2">{s.language}</td>
                    <td className="px-3 py-2">{s.level}</td>
                    <td className="px-3 py-2">{fmt(s.startedAt)}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          className="text-xs px-2 py-1 rounded border hover:bg-white"
                          onClick={() => setUserId(s.userId)}
                          title="Cargar métricas del usuario"
                        >
                          Ver usuario
                        </button>
                        <button
                          className="text-xs px-2 py-1 rounded border hover:bg-white"
                          onClick={() => setSessionId(s.sessionId)}
                          title="Seleccionar para exportar PDF"
                        >
                          Seleccionar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSessions.length === 0 && !sessionsLoading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-gray-500">
                      Sin sesiones activas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* export quick action */}
          <div className="flex gap-2 mt-4">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              placeholder="SessionID para exportar PDF"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            />
            <button
              onClick={() => sessionId && window.open(exportSessionPDFUrl(sessionId), "_blank")}
              className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-green-700"
            >
              Exportar PDF
            </button>
          </div>
        </section>
      </main>

      <footer className="text-center text-xs text-gray-500 mt-10">
        © 2025 LangMatch Dashboard – React + Tailwind CDN
      </footer>
    </div>
  );
}

function CardStat({ label, value }) {
  return (
    <div className="p-3 border rounded-lg text-center">
      <p
        className={cx(
          "font-semibold",
          typeof value === "number" ? "text-2xl text-blue-600" : "text-lg text-blue-600"
        )}
      >
        {value ?? "-"}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
