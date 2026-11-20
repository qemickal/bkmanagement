// Sesión y catálogo remotos (Supabase).
//
// Usa la API REST de Supabase directamente, sin SDK: el paquete entregado es
// autocontenido y necesita muy pocas llamadas (entrar, renovar, bajar catálogo).
//
// La llave `anon` es pública por diseño; lo que protege el plan son las
// políticas RLS del servidor: sin sesión, `select` devuelve cero filas.
// Se rellenan al compilar (preparar.mjs) con las variables de entorno. En las
// pruebas y en `shell.html` se pueden fijar con configurar().
let baseUrl = (
  typeof __SUPABASE_URL__ === "undefined" ? "" : __SUPABASE_URL__
).replace(/\/+$/, "");
let anonKey = typeof __SUPABASE_ANON_KEY__ === "undefined" ? "" : __SUPABASE_ANON_KEY__;

export const urlServidor = () => baseUrl;
export const configurado = () => Boolean(baseUrl && anonKey);
export function configurar(url, key) {
  baseUrl = String(url || "").replace(/\/+$/, "");
  anonKey = String(key || "");
}

const CLAVE = "btk-sesion-v1";
export const SIN_SESION = "sin-sesion";
export const SIN_CONEXION = "sin-conexion";

const fallo = (codigo, mensaje) => {
  const e = new Error(mensaje);
  e.codigo = codigo;
  return e;
};

export function sesion() {
  try {
    const s = JSON.parse(localStorage.getItem(CLAVE) || "null");
    return s && typeof s.access_token === "string" ? s : null;
  } catch {
    return null;
  }
}

function guardar(r) {
  if (!r?.access_token) return null;
  const s = {
    access_token: r.access_token,
    refresh_token: r.refresh_token || "",
    expira: new Date(Date.now() + (r.expires_in || 3600) * 1000).toISOString(),
    correo: r.user?.email || "",
    id: r.user?.id || "",
  };
  try {
    localStorage.setItem(CLAVE, JSON.stringify(s));
  } catch {}
  return s;
}

export function salir() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {}
}

async function pedir(url, opciones) {
  let r;
  try {
    r = await fetch(url, opciones);
  } catch {
    throw fallo(SIN_CONEXION, "No hay conexión con el servidor.");
  }
  const texto = await r.text();
  let cuerpo = null;
  try {
    cuerpo = texto ? JSON.parse(texto) : null;
  } catch {}
  if (!r.ok) {
    if (r.status === 401) throw fallo(SIN_SESION, "La sesión terminó. Vuelve a entrar.");
    if (r.status === 429)
      throw fallo("limite", "Demasiados intentos seguidos. Espera un momento.");
    const detalle = cuerpo?.msg || cuerpo?.error_description || cuerpo?.message || "";
    if (/invalid login credentials/i.test(detalle))
      throw fallo("credenciales", "Correo o contraseña incorrectos.");
    if (/email not confirmed/i.test(detalle))
      throw fallo("sin-confirmar", "Confirma tu correo antes de entrar.");
    if (/invalid api key/i.test(detalle))
      throw fallo("config", "La llave pública del servidor no es válida.");
    throw fallo("servidor", detalle || `El servidor respondió ${r.status}.`);
  }
  return cuerpo;
}

const auth = (extra = {}) => ({
  apikey: anonKey,
  "Content-Type": "application/json",
  ...extra,
});

export async function entrar(correo, clave) {
  if (!configurado())
    throw fallo(
      "config",
      "Falta la configuración de Supabase en este despliegue.",
    );
  const correo_ = String(correo || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo_))
    throw fallo("credenciales", "Escribe un correo válido.");
  if (!clave) throw fallo("credenciales", "Escribe tu contraseña.");
  const r = await pedir(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify({ email: correo_, password: clave }),
  });
  return guardar(r);
}

async function renovar(s) {
  if (!s?.refresh_token) throw fallo(SIN_SESION, "La sesión terminó. Vuelve a entrar.");
  const r = await pedir(
    `${baseUrl}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: auth(),
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    },
  );
  return guardar(r);
}

// Devuelve la sesión vigente, renovándola si está por caducar. null si no hay.
export async function sesionActiva() {
  const s = sesion();
  if (!s) return null;
  if (Date.parse(s.expira) - Date.now() > 60_000) return s;
  try {
    return await renovar(s);
  } catch (e) {
    if (e?.codigo === SIN_CONEXION) return s; // sin red pero con token previo
    salir();
    return null;
  }
}

// Baja el catálogo del proyecto. Con sesión válida y membresía activa, RLS
// devuelve la fila; sin membresía devuelve vacío (no un error de permisos).
export async function bajarCatalogo(proyecto) {
  const s = await sesionActiva();
  if (!s) throw fallo(SIN_SESION, "Necesitas iniciar sesión.");
  const url = `${baseUrl}/rest/v1/catalogo?proyecto=eq.${encodeURIComponent(
    proyecto,
  )}&select=payload,version`;
  const filas = await pedir(url, {
    headers: { apikey: anonKey, Authorization: `Bearer ${s.access_token}` },
  });
  if (!Array.isArray(filas) || !filas.length)
    throw fallo(
      "sin-acceso",
      "Esta cuenta no tiene acceso a este proyecto. Pide que te agreguen como miembro.",
    );
  const fila = filas[0];
  if (!fila?.payload) throw fallo("servidor", "El catálogo del servidor está vacío.");
  return fila.payload;
}
