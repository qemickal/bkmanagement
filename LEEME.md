# BOMBATRONIK · Estudio operativo

**Versión 1.1 · personal · en español.** Un tablero de trabajo para el relanzamiento Bogotá–CDMX. No es un visor de PDF ni un servicio compartido.

**Cambio de la v1.1:** el contenido del charter (calendario, hitos, canciones y tareas) ya no viaja dentro de la página. Se guarda en Postgres, en tu proyecto de Supabase, y la app lo pide con una cuenta y contraseña. Sin sesión no hay plan que mostrar. Los avances que registras siguen guardándose sólo en tu navegador.

## Pruébalo en una sesión

1. Entra con tu correo y contraseña. La primera vez verás la pantalla de acceso; si el despliegue no tiene configurado el servidor, verás una pantalla de configuración pendiente.
2. Abre **Mesa de control**. En **Ajustes y respaldo**, escribe tu nombre o firma. En el celular se llega tocando la inicial de la esquina superior derecha.
3. Ve a **Disco → Contradicción**. Elige un estado para Voz o Mezcla, añade el enlace de la versión que se trabajó y el siguiente paso. Pulsa **Guardar control**. No se sube el audio.
4. Usa **Registrar avance** para escribir una nota con fecha y vincularla al proyecto, a una pista, a una tarea o a un hito. La **Bitácora** distingue notas escritas y cambios del tablero.
5. En **Hitos**, marca un cumplimiento con el círculo, o abre la ficha para especificar la fecha real y reprogramar la fecha planeada. La fecha original no cambia. Las tareas que corresponden al mismo hito reflejan su cumplimiento; entregar un single **no** marca su estreno.
6. Antes de cerrar una prueba importante, usa **Ajustes y respaldo → Exportar JSON**. El respaldo contiene tus avances, **no** el catálogo del charter.

## Acceso y servidor

El estudio funciona con un proyecto de **Supabase** (plan gratuito suficiente). Pasos, en orden:

1. **Crea el proyecto** en [supabase.com](https://supabase.com) y anota dos datos de *Project Settings → API*: **Project URL** y **anon public key**.
2. **Crea las tablas y las reglas.** Abre *SQL Editor → New query*, pega el contenido de **`supabase/esquema.sql`** y ejecútalo. Crea `catalogo` y `miembros`, activa RLS y deja el catálogo visible **sólo** para miembros autenticados.
3. **Carga el plan.** Con Node 20+, en esta carpeta:

   ```sh
   node supabase/generar-catalogo.mjs
   ```

   Escribe `supabase/privado/catalogo.json` y `supabase/privado/catalogo.sql`. Pega el `.sql` en el editor SQL y ejecútalo. Antes de correrlo, cambia el correo de ejemplo por el tuyo: ese `insert` te convierte en miembro con rol `owner`.

   El generador necesita `supabase/fuente.js`, la copia local del charter que **no** está en git. Si partes de un clon nuevo no la tendrás: usa el `catalogo.sql` que ya generaste, o vuelve a crear ese archivo con los mismos datos y ejecuta el generador de nuevo.
4. **Crea tu cuenta.** *Authentication → Users → Add user*: correo y contraseña, con **Auto Confirm User** activado. Repite por cada persona que deba entrar y agrega su fila en `miembros`.
5. **Conecta el sitio.** El build lee dos variables de entorno:

   ```sh
   SUPABASE_URL=https://TU-PROYECTO.supabase.co SUPABASE_ANON_KEY=eyJ... npm run build
   ```

   En Vercel van en *Settings → Environment Variables*, y hacen falta las dos para que el despliegue funcione.

La llave `anon` es pública a propósito: no da acceso a nada por sí sola, porque las políticas RLS devuelven cero filas sin sesión. Lo que protege el plan es la combinación **RLS + tabla de miembros**, no el secreto de esa llave.

### Qué se guarda dónde

| Dato | Dónde | Quién lo ve |
|---|---|---|
| Calendario, canciones, hitos, tareas | Postgres (`catalogo`) | Sólo miembros con sesión |
| Cuentas | Supabase Auth | Sólo tú, desde el panel |
| Avances, estados, fechas reales, firma | IndexedDB de cada navegador | Sólo ese navegador |
| Sesión (tokens) | `localStorage` de ese navegador | Sólo ese navegador |

Al **cerrar sesión** se borran los tokens y la copia local del plan; tus avances se conservan. Tras la primera carga con internet, el plan queda en caché y puedes trabajar sin señal.

## Qué viene del charter

- **52 tareas iniciales** en el sprint que va del 22 nov 2026 al 19 feb 2027 (12 semanas + tramo de cierre). Las tareas sin día límite explícito conservan la semana. Las fechas concretas se muestran en la semana a la que pertenecen.
- **22 hitos**, a partir de la ruta y las secciones de gobernanza, distribución y análisis. El plan operativo y las lecturas posteriores no se confunden: 19 feb es el corte del sprint; 2 sep es D90 **del LP**. La entrega del disco está prevista idealmente para el 23 abr, con límite del plan el 7 may.
- **14 canciones**, en el orden aprobado. Control de letra, voz, arreglo, mezcla, máster, splits, registro y QC. «No aplica» es una decisión explícita disponible únicamente para splits y registro.
- Pausa protegida del **21 dic al 10 ene**; las dos semanas completas de descanso no contienen tareas obligatorias. Pendiente no significa atraso ni evidencia de que algo ya se hizo.

Fuente: [BOMBATRONIK — Project Charter · Relanzamiento](https://drive.google.com/file/d/1e1yDD8sCn8s4pFNLY2rd5JjXNfPCxMDr/view?usp=drivesdk), especialmente pp. 7, 10, 16, 26–30, 32 y 53–55. El PDF permanece en Drive. El visual del vinilo es una ilustración fotográfica generada para el tablero; no representa una portada oficial.

> **Sobre la privacidad del repositorio.** Hasta la v1.0 el catálogo completo estaba en `seed.js`, y ese archivo sigue en el historial de git. Si el repositorio es público, el charter es público. Para cerrarlo de verdad: pon el repositorio en privado y, si te importa el historial, reescríbelo (por ejemplo con `git filter-repo`) para eliminar `seed.js`. El despliegue ya no depende de ese archivo.

## Abrir e instalar

- **Prueba rápida:** abre el despliegue e inicia sesión. Para ver la app en tu computadora sin desplegar: `npm run build` con las variables configuradas y luego `python -m http.server 8000 --directory .`, y abre `http://localhost:8000/`.
- **Como PWA:** necesita HTTPS (o `localhost`). Safari en iOS: Compartir → Añadir a pantalla de inicio. Android/Chrome: menú → Instalar aplicación.
- En **Ajustes y respaldo**, espera el estado **Lista sin conexión** tras la primera carga con sesión. Con el plan en caché puedes recargar, consultar y escribir sin red. Los enlaces externos como Drive siguen necesitando internet.
- Para alojar sólo hacen falta **`index.html`, `manifest.webmanifest`, `sw.js` y los cuatro PNG en `assets/`**. Mantén la misma dirección entre sesiones: los avances están ligados al origen.

## Datos, privacidad y respaldos

- El almacenamiento de avances es **IndexedDB**, por navegador y origen. Sin almacenamiento disponible, la app avisa y trabaja sólo en memoria. Borrar datos del sitio, cambiar de origen o usar navegación privada puede dejarte sin la copia anterior.
- El JSON exporta los registros de cambios con sus identificadores, fechas, autor y enlaces. Incluye el historial. **No está cifrado.** Guárdalo en un lugar privado.
- **Importar** valida el proyecto y la versión del catálogo, muestra cuántos registros nuevos hay y pide confirmación. Se agregan en una sola transacción: los registros idénticos no se duplican y los archivos incompatibles no sustituyen tu trabajo. La firma del dispositivo receptor no se cambia.
- El nombre de firma **no es la cuenta**: identifica autoría dentro de este navegador. No hay sincronización entre dispositivos, telemetría, notificaciones push ni escritura automática en Drive. El plan se descarga; los avances no se suben.

## Para evolucionar a Mick + Levi

La interfaz, las constantes, el cliente de sesión y el repositorio están separados (`app.js`, `views.js`, `forms.js`, `seed.js`, `auth.js`, `model.js`, `store.js`). Los elementos del charter tienen IDs estables; los elementos nuevos y eventos usan UUID. El historial guarda actor, instante UTC y reloj lógico; las fechas de agenda se interpretan para Ciudad de México.

Ya resuelto en esta versión: **cuentas verificadas**, **catálogo privado en servidor** y **permisos de lectura por proyecto** (cualquier persona sin fila en `miembros` no recibe datos). Sigue pendiente para uso compartido real: **escritura de avances en servidor** con idempotencia y confirmación, **cola offline** de escrituras, **permisos de edición por rol**, y reglas explícitas para ediciones simultáneas del mismo dato. La firma local debe conservarse como atribución no verificada, nunca como credencial.

### Si modificas el código

Con Node 20+:

```sh
npm ci
npm test        # dominio + cliente de sesión
npm run build   # index.html autocontenido y versión nueva de caché
```

`preparar.mjs` inyecta `SUPABASE_URL` y `SUPABASE_ANON_KEY` en el paquete y avisa si faltan. Para iterar sin compilar, sirve la carpeta y abre `shell.html`: en ese modo no hay variables inyectadas, así que usa `configurar(url, clave)` desde la consola o compila. `supabase/esquema.sql` y `supabase/generar-catalogo.mjs` documentan el servidor; `supabase/fuente.js` y `supabase/privado/` quedan fuera de git por diseño. Las licencias OFL de las cuatro familias tipográficas se incluyen en `assets/fonts/`.
