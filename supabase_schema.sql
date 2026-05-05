-- Tabela para perfis adicionais de usuário (opcional, já que a autenticação principal fica em auth.users)
create table public.profiles (
  id uuid references auth.users not null,
  full_name text,
  role text check (role in ('professor', 'monitor', 'marketing', 'gestao')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Habilitar RLS (Row Level Security)
alter table public.profiles enable row level security;

-- Criar políticas
create policy "Usuários podem ver o próprio perfil."
  on profiles for select
  using ( auth.uid() = id );

create policy "Usuários podem atualizar o próprio perfil."
  on profiles for update
  using ( auth.uid() = id );

-- Função para criar automaticamente um perfil na tabela pública assim que o usuário se registrar
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  return new;
end;
$$;

-- Trigger para rodar a função acima
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
