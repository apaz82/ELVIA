-- 1. Asegurar que las columnas existen
alter table public.profiles
  add column if not exists role text default 'user',
  add column if not exists is_admin boolean default false,
  add column if not exists suspended boolean default false;

-- 2. Crear o Actualizar el usuario como super_admin
-- Reemplaza 'optimacv1@gmail.com' con el email deseado si es diferente.
-- Nota: El usuario ya debe estar registrado en Supabase Auth.
update public.profiles
set 
  role = 'super_admin',
  is_admin = true,
  suspended = false
where email_principal = 'optimacv1@gmail.com'
   or id = (select id from auth.users where email = 'optimacv1@gmail.com');

-- 3. Si el usuario no existe en profiles pero sí en auth.users (caso raro), insertar:
-- insert into public.profiles (id, email_principal, role, is_admin)
-- select id, email, 'super_admin', true 
-- from auth.users 
-- where email = 'optimacv1@gmail.com'
-- on conflict (id) do update set role = 'super_admin', is_admin = true;
