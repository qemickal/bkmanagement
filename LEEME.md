# BOMBATRONIK · Estudio operativo

**Versión 1.0 · personal · en español.** Un tablero de trabajo para el relanzamiento Bogotá–CDMX. No es un visor de PDF ni un servicio compartido.

## Pruébalo en una sesión

1. Abre **Mesa de control**. En **Ajustes y respaldo**, escribe tu nombre o firma. En el celular se llega tocando la inicial de la esquina superior derecha.
2. Ve a **Disco → Contradicción**. Elige un estado para Voz o Mezcla, añade el enlace de la versión que se trabajó y el siguiente paso. Pulsa **Guardar control**. No se sube el audio.
3. Usa **Registrar avance** para escribir una nota con fecha y vincularla al proyecto, a una pista, a una tarea o a un hito. La **Bitácora** distingue notas escritas y cambios del tablero.
4. En **Hitos**, marca un cumplimiento con el círculo, o abre la ficha para especificar la fecha real y reprogramar la fecha planeada. La fecha original no cambia. Las tareas que corresponden al mismo hito reflejan su cumplimiento; entregar un single **no** marca su estreno.
5. Antes de cerrar una prueba importante, usa **Ajustes y respaldo → Exportar JSON**. El ZIP contiene la aplicación, **no** los avances que captures después.

## Qué viene del charter

- **52 tareas iniciales** en el sprint que va del 22 nov 2026 al 19 feb 2027 (12 semanas + tramo de cierre). Las tareas sin día límite explícito conservan la semana. Las fechas concretas se muestran en la semana a la que pertenecen. La asignación inicial de responsables se puede ajustar; A1 en ocasiones nombra al grupo y no a una persona por acción.
- **22 hitos**, a partir de la ruta y las secciones de gobernanza, distribución y análisis. El plan operativo y las lecturas posteriores no se confunden: 19 feb es el corte del sprint; 2 sep es D90 **del LP**. La entrega del disco está prevista idealmente para el 23 abr, con límite del plan el 7 may. La sesión de ciudad del 20 feb queda señalada como condicional.
- **14 canciones**, en el orden aprobado. Control de letra, voz, arreglo, mezcla, máster, splits, registro y QC. «No aplica» es una decisión explícita disponible únicamente para splits y registro.
- Pausa protegida del **21 dic al 10 ene**; las dos semanas completas de descanso no contienen tareas obligatorias. Pendiente no significa atraso ni evidencia de que algo ya se hizo.

Fuente: [BOMBATRONIK — Project Charter · Relanzamiento](https://drive.google.com/file/d/1e1yDD8sCn8s4pFNLY2rd5JjXNfPCxMDr/view?usp=drivesdk), especialmente pp. 7, 10, 16, 26–30, 32 y 53–55. El PDF permanece en Drive y no está incluido en este paquete. El visual del vinilo es una ilustración fotográfica generada para el tablero; no representa una portada oficial.

## Abrir e instalar

- **Prueba rápida:** en Arena abre la **vista previa en vivo**. En un visor aislado puede aparecer un aviso de modo temporal; esa vista sirve para explorar, no para confiarle la única copia de tu trabajo. También puedes abrir el `index.html` descargado: contiene estilos, tipografías, imagen y aplicación. El soporte de almacenamiento para archivos locales depende del navegador.
- **Como PWA:** sirve la carpeta con HTTPS, o utiliza `localhost` en tu computadora. No hay que compilar ni contratar un servicio para probar la versión entregada. Desde esta carpeta, si tienes Python:

  ```sh
  python -m http.server 8000 --bind 127.0.0.1
  ```

  Abre `http://localhost:8000/` en esa computadora. Para instalar en un celular, usa una dirección HTTPS estable y abre la app en una pestaña normal. Safari en iOS: Compartir → Añadir a pantalla de inicio. En Android/Chrome: menú → Instalar aplicación. La disponibilidad depende del navegador.
- En **Ajustes y respaldo**, espera el estado **Lista sin conexión** tras la primera carga. Con la app preparada puedes recargar, consultar y escribir sin red. Enlaces externos como Drive siguen necesitando internet.
- Para un alojamiento estático sólo hacen falta **`index.html`, `manifest.webmanifest`, `sw.js` y los cuatro PNG en `assets/`**. Mantén la misma dirección de acceso entre sesiones. En una instalación privada, protege **también los archivos estáticos**: el calendario y los títulos del disco vienen precargados. Esta entrega no publica un sitio permanente.

## Datos, privacidad y respaldos

- El almacenamiento normal es **IndexedDB**, por navegador y origen. Sin almacenamiento disponible, la app muestra una advertencia y trabaja sólo en memoria. Borrar datos del sitio, cambiar de origen, usar navegación privada o una vista previa nueva puede dejarte sin acceso a la copia anterior.
- El JSON exporta los registros de cambios con sus identificadores, fechas, autor y enlaces. Incluye el historial (también revisiones y bajas lógicas de notas). **No está cifrado.** Guárdalo en un lugar privado.
- **Importar** valida el proyecto y la versión, muestra cuántos registros nuevos hay y pide confirmación. Se agregan en una sola transacción: los registros idénticos no se duplican y los archivos incompatibles no sustituyen tu trabajo. La firma del dispositivo receptor no se cambia. Utiliza la misma versión del plan inicial para restaurar sus cambios.
- El nombre de firma **no es una cuenta**. No hay login, sincronización remota, telemetría, notificaciones push ni escritura automática en Drive. Ningún avance se envía a un servidor. Un respaldo manual no es colaboración en tiempo real.

## Para evolucionar a Mick + Levi

La interfaz, el catálogo inicial y el repositorio están separados (`app.js`, `views.js`, `forms.js`, `seed.js`, `model.js`, `store.js`). Los elementos del charter tienen IDs estables; los elementos nuevos y eventos usan UUID. El historial guarda actor, instante UTC y reloj lógico; las fechas de agenda se interpretan para Ciudad de México. Los títulos no funcionan como claves.

Una siguiente versión puede conservar las pantallas y migrar los registros existentes. Para uso compartido real faltan: **dos identidades verificadas**, permisos por proyecto, almacenamiento privado en servidor, confirmación e idempotencia de escrituras, cola offline y reglas explícitas para ediciones simultáneas del mismo dato. La firma histórica local debe conservarse como atribución no verificada, no usarse como credencial.

### Si modificas el código

Los archivos entregados ya están compilados. Con Node 20+:

```sh
npm ci
npm test
npm run build
```

`preparar.mjs` crea un `index.html` autocontenido y renueva la versión de caché del service worker. Para iterar sin compilación, sirve la carpeta y abre `shell.html`, que carga los módulos y las fuentes locales. Los tests de dominio están en `pruebas/`. Las licencias OFL de las cuatro familias tipográficas se incluyen en `assets/fonts/`.
