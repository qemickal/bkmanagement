// Pruebas del cliente de sesión contra un Supabase simulado.
// Verifican el contrato con la API REST: forma de las peticiones, manejo de
// errores y, sobre todo, que sin sesión o sin membresía no se obtenga catálogo.
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const almacen = new Map();
globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
  setItem: (k, v) => almacen.set(k, String(v)),
  removeItem: (k) => almacen.delete(k),
};

const auth = await import("../auth.js");
const { catalogo } = await import("./catalogo-ficticio.mjs");

const URL_BASE = "https://falso.supabase.co";
const LLAVE = "llave-publica-de-prueba";
auth.configurar(URL_BASE, LLAVE);

const sesionFalsa = (expiraEn = 3600) => ({
  access_token: "jwt-" + randomUUID(),
  refresh_token: "refresco-" + randomUUID(),
  expires_in: expiraEn,
  user: { id: randomUUID(), email: "mick@bombatronik.mx" },
});

// Sesión ya guardada, como después de un login correcto.
const sesionGuardada = () =>
  localStorage.setItem(
    "btk-sesion-v1",
    JSON.stringify({
      access_token: "jwt-guardado",
      refresh_token: "refresco-guardado",
      expira: new Date(Date.now() + 3_600_000).toISOString(),
      correo: "mick@bombatronik.mx",
      id: "u-1",
    }),
  );

const respuesta = (cuerpo, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => (cuerpo === undefined ? "" : JSON.stringify(cuerpo)),
});

const conFetch = (fn) => {
  const previo = globalThis.fetch;
  const llamadas = [];
  globalThis.fetch = async (url, opciones = {}) => {
    llamadas.push({ url, opciones });
    return fn(url, opciones, llamadas.length);
  };
  return { llamadas, restaurar: () => (globalThis.fetch = previo) };
};

test("sin configuración no se puede entrar y se explica por qué", async () => {
  const previa = auth.configurado();
  auth.configurar("", "");
  assert.equal(auth.configurado(), false);
  await assert.rejects(
    () => auth.entrar("mick@bombatronik.mx", "clave"),
    /Falta la configuración de Supabase/,
  );
  auth.configurar(URL_BASE, LLAVE);
  assert.equal(auth.configurado(), true);
  assert.equal(previa, true);
});

test("el alta de sesión manda el correo normalizado y guarda los tokens", async () => {
  almacen.clear();
  const f = conFetch(() => respuesta(sesionFalsa()));
  try {
    const s = await auth.entrar("  Mick@Bombatronik.MX ", "clave-secreta");
    assert.equal(s.correo, "mick@bombatronik.mx");
    const { url, opciones } = f.llamadas[0];
    assert.equal(url, `${URL_BASE}/auth/v1/token?grant_type=password`);
    assert.equal(opciones.method, "POST");
    assert.equal(opciones.headers.apikey, LLAVE);
    assert.deepEqual(JSON.parse(opciones.body), {
      email: "mick@bombatronik.mx",
      password: "clave-secreta",
    });
    assert.equal(auth.sesion().access_token, s.access_token);
  } finally {
    f.restaurar();
  }
});

test("credenciales inválidas y correo mal escrito no filtran detalles del servidor", async () => {
  almacen.clear();
  let f = conFetch(() =>
    respuesta({ msg: "Invalid login credentials" }, 400),
  );
  try {
    await assert.rejects(
      () => auth.entrar("mick@bombatronik.mx", "mala"),
      /Correo o contraseña incorrectos/,
    );
  } finally {
    f.restaurar();
  }
  f = conFetch(() => respuesta(sesionFalsa()));
  try {
    await assert.rejects(
      () => auth.entrar("no-es-correo", "x"),
      /correo válido/,
    );
    assert.equal(f.llamadas.length, 0, "no debe llamar al servidor");
  } finally {
    f.restaurar();
  }
});

test("una sesión a punto de caducar se renueva antes de pedir el catálogo", async () => {
  almacen.clear();
  localStorage.setItem(
    "btk-sesion-v1",
    JSON.stringify({
      access_token: "viejo",
      refresh_token: "refresco-viejo",
      expira: new Date(Date.now() + 1000).toISOString(),
      correo: "mick@bombatronik.mx",
      id: "u1",
    }),
  );
  const f = conFetch((url) =>
    url.includes("grant_type=refresh_token")
      ? respuesta(sesionFalsa())
      : respuesta([{ payload: catalogo, version: catalogo.version }]),
  );
  try {
    const payload = await auth.bajarCatalogo("bombatronik-relanzamiento-2026");
    assert.equal(payload.version, "pruebas.1");
    assert.ok(f.llamadas[0].url.includes("grant_type=refresh_token"));
    const rest = f.llamadas[1];
    assert.ok(rest.url.startsWith(`${URL_BASE}/rest/v1/catalogo?proyecto=eq.`));
    assert.match(rest.opciones.headers.Authorization, /^Bearer jwt-/);
    assert.equal(rest.opciones.headers.apikey, LLAVE);
  } finally {
    f.restaurar();
  }
});

test("sin membresía el servidor devuelve vacío y la app lo informa", async () => {
  almacen.clear();
  sesionGuardada();
  const f = conFetch((url) =>
    url.includes("/auth/v1/")
      ? respuesta(sesionFalsa())
      : respuesta([]),
  );
  try {
    await assert.rejects(
      () => auth.bajarCatalogo("bombatronik-relanzamiento-2026"),
      (e) => e.codigo === "sin-acceso",
    );
  } finally {
    f.restaurar();
  }
});

test("un 401 cierra la sesión en lugar de mostrar datos viejos", async () => {
  almacen.clear();
  const f = conFetch((url) =>
    url.includes("/auth/v1/")
      ? respuesta(sesionFalsa())
      : respuesta({ message: "JWT expired" }, 401),
  );
  try {
    await assert.rejects(
      () => auth.bajarCatalogo("bombatronik-relanzamiento-2026"),
      (e) => e.codigo === "sin-sesion",
    );
    assert.equal(auth.sesion(), null);
  } finally {
    f.restaurar();
  }
});

test("sin red el error se marca como tal para poder usar la caché", async () => {
  almacen.clear();
  sesionGuardada();
  const previo = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  try {
    await assert.rejects(
      () => auth.bajarCatalogo("bombatronik-relanzamiento-2026"),
      (e) => e.codigo === "sin-conexion",
    );
  } finally {
    globalThis.fetch = previo;
  }
});

test("el límite de intentos y el correo sin confirmar se explican en español", async () => {
  almacen.clear();
  let f = conFetch(() => respuesta({ msg: "Request rate limit reached" }, 429));
  try {
    await assert.rejects(
      () => auth.entrar("mick@bombatronik.mx", "x"),
      /Demasiados intentos/,
    );
  } finally {
    f.restaurar();
  }
  f = conFetch(() => respuesta({ msg: "Email not confirmed" }, 400));
  try {
    await assert.rejects(
      () => auth.entrar("mick@bombatronik.mx", "x"),
      /Confirma tu correo/,
    );
  } finally {
    f.restaurar();
  }
});

test("cerrar sesión borra los tokens del navegador", async () => {
  almacen.clear();
  const f = conFetch(() => respuesta(sesionFalsa()));
  try {
    await auth.entrar("mick@bombatronik.mx", "clave");
    assert.ok(auth.sesion());
    auth.salir();
    assert.equal(auth.sesion(), null);
    assert.equal(await auth.sesionActiva(), null);
  } finally {
    f.restaurar();
  }
});
