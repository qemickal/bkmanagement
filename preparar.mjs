// Basta con servir los archivos entregados. Sólo se necesita Node si se modifica el código.
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
const home = path.dirname(fileURLToPath(import.meta.url));
const read = (n) => readFileSync(path.join(home, n));
const uri = (n, t) => `data:${t};base64,${read(n).toString("base64")}`;
const bundle = await build({
  absWorkingDir: home,
  entryPoints: ["app.js"],
  bundle: true,
  write: false,
  minify: true,
  format: "iife",
  target: "es2021",
  charset: "utf8",
  legalComments: "none",
});
const js = bundle.outputFiles[0].text
  .replaceAll("./assets/vinilo.webp", uri("assets/vinilo.webp", "image/webp"))
  .replace(/<\/script/gi, "<\\/script");
const css = read("studio.css")
  .toString()
  .replace(
    /url\((['"]?)(\.\/assets\/fonts\/[^\s'")]+\.woff2)\1\)/g,
    (_, q, f) => `url('${uri(f, "font/woff2")}')`,
  );
const html = read("shell.html")
  .toString()
  .replace(/<link\b[^>]*rel="preload"[^>]*>/i, "")
  .replace(/<link\b[^>]*rel="stylesheet"[^>]*>/i, () => `<style>${css}</style>`)
  .replace(
    /<script\b[^>]*src="\.\/app\.js"[^>]*><\/script>/i,
    () => `<script>${js}</script>`,
  )
  .replace(
    'href="./assets/icon-192.png"',
    `href="${uri("assets/icon-192.png", "image/png")}"`,
  );
writeFileSync(path.join(home, "index.html"), html);
const files = [
  "index.html",
  "manifest.webmanifest",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/maskable-512.png",
  "assets/apple-icon.png",
];
const hash = createHash("sha256");
for (const n of files) hash.update(read(n));
const v = hash.digest("hex").slice(0, 14);
writeFileSync(
  path.join(home, "sw.js"),
  `// Autogenerado por preparar.mjs. Nunca almacena los datos personales en Cache Storage.
const BASE=self.registration.scope,PREFIX='btk-shell-'+new URL(BASE).pathname+'-',CACHE=PREFIX+'${v}';
const ASSETS=${JSON.stringify(files)}.map(p=>new URL(p,BASE).href),HOME=new URL('index.html',BASE).href;
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(ASSETS.map(url=>new Request(url,{cache:'reload',credentials:'same-origin'})));await self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith(PREFIX)&&k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==self.location.origin)return;const u=new URL(r.url);if(r.mode==='navigate'&&[new URL(BASE).pathname,new URL(HOME).pathname].includes(u.pathname)){e.respondWith(caches.open(CACHE).then(async c=>(await c.match(HOME))||fetch(r)));return}if(ASSETS.includes(u.href)){e.respondWith(caches.open(CACHE).then(async c=>(await c.match(r))||fetch(r)))}});
`,
);
console.log(
  `Estudio listo · ${Math.round(Buffer.byteLength(html) / 1024)} KB · caché ${v}`,
);
