-- BOMBATRONIK · Estudio operativo
-- Esquema mínimo para que el tablero sólo se pueda leer con una cuenta autorizada.
--
-- Ejecuta este archivo en Dashboard → SQL Editor → New query.
-- Después ejecuta supabase/privado/catalogo.sql, que inserta el contenido del charter.
--
-- Idea: los datos del plan viven en Postgres, no en el HTML. La llave pública
-- (anon) puede estar en el navegador sin riesgo porque las políticas RLS
-- devuelven vacío a cualquier visitante sin sesión.

begin;

-- 1. Catálogo: una fila por proyecto con el plan completo (semanas, canciones,
--    hitos y tareas). Es de sólo lectura para el cliente.
create table if not exists public.catalogo (
  proyecto    text primary key,
  version     text not null,
  payload     jsonb not null,
  actualizado timestamptz not null default now()
);

-- 2. Miembros: quién puede entrar a qué proyecto.
create table if not exists public.miembros (
  proyecto text not null,
  user_id  uuid not null references auth.users (id) on delete cascade,
  rol      text not null default 'editor' check (rol in ('owner', 'editor', 'lector')),
  creado   timestamptz not null default now(),
  primary key (proyecto, user_id)
);

alter table public.catalogo enable row level security;
alter table public.miembros enable row level security;

-- 3. Políticas. Nada es visible sin sesión: `to authenticated` deja fuera a `anon`.
drop policy if exists "miembros leen el catálogo" on public.catalogo;
create policy "miembros leen el catálogo"
  on public.catalogo
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.miembros m
      where m.user_id = auth.uid()
        and m.proyecto = catalogo.proyecto
    )
  );

-- Sólo el dueño puede reemplazar el catálogo (normalmente se cambia por SQL,
-- con la llave de servicio, y estas políticas no estorban).
drop policy if exists "dueños escriben el catálogo" on public.catalogo;
create policy "dueños escriben el catálogo"
  on public.catalogo
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.miembros m
      where m.user_id = auth.uid()
        and m.proyecto = catalogo.proyecto
        and m.rol = 'owner'
    )
  )
  with check (
    exists (
      select 1
      from public.miembros m
      where m.user_id = auth.uid()
        and m.proyecto = catalogo.proyecto
        and m.rol = 'owner'
    )
  );

-- Cada persona sólo ve su propia fila de membresía.
drop policy if exists "cada quien ve su membresía" on public.miembros;
create policy "cada quien ve su membresía"
  on public.miembros
  for select
  to authenticated
  using (user_id = auth.uid());

-- 4. Permisos. Sin esto, PostgREST no expone las tablas ni con RLS bien puesto.
revoke all on public.catalogo from anon, authenticated;
grant select on public.catalogo to authenticated;
grant update on public.catalogo to authenticated;

revoke all on public.miembros from anon, authenticated;
grant select on public.miembros to authenticated;

commit;

-- Notas de operación
-- · Los avances (bitácora, estados, fechas reales) siguen guardándose en el
--   navegador de cada persona, como antes. Sincronizarlos entre dispositivos es
--   una fase aparte: requiere tabla de eventos con idempotencia y cola offline.
-- · Para retirar el acceso a alguien: delete from public.miembros where user_id = '...';
-- · Para revisar quién entra: select m.user_id, u.email, m.rol
--   from public.miembros m join auth.users u on u.id = m.user_id;
