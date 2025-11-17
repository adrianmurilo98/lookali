-- Trigger para criar perfil automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Função para gerar número de pedido único
create or replace function generate_order_number()
returns text
language plpgsql
as $$
declare
  new_number text;
  exists_check boolean;
begin
  loop
    new_number := 'LKL-' || lpad(floor(random() * 999999)::text, 6, '0');
    select exists(select 1 from orders where order_number = new_number) into exists_check;
    exit when not exists_check;
  end loop;
  return new_number;
end;
$$;

-- Trigger para gerar número do pedido automaticamente
create or replace function set_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := generate_order_number();
  end if;
  return new;
end;
$$;

drop trigger if exists before_order_insert on orders;

create trigger before_order_insert
  before insert on orders
  for each row
  execute function set_order_number();

-- Trigger para atualizar updated_at
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_partners_updated_at before update on partners
  for each row execute function update_updated_at_column();

create trigger update_products_updated_at before update on products
  for each row execute function update_updated_at_column();

create trigger update_services_updated_at before update on services
  for each row execute function update_updated_at_column();

create trigger update_rental_items_updated_at before update on rental_items
  for each row execute function update_updated_at_column();

create trigger update_reservable_spaces_updated_at before update on reservable_spaces
  for each row execute function update_updated_at_column();

create trigger update_customers_updated_at before update on customers
  for each row execute function update_updated_at_column();

create trigger update_suppliers_updated_at before update on suppliers
  for each row execute function update_updated_at_column();

create trigger update_orders_updated_at before update on orders
  for each row execute function update_updated_at_column();

create trigger update_accounts_payable_updated_at before update on accounts_payable
  for each row execute function update_updated_at_column();

create trigger update_accounts_receivable_updated_at before update on accounts_receivable
  for each row execute function update_updated_at_column();

-- Trigger para atualizar rating do parceiro baseado nas avaliações
create or replace function update_partner_rating()
returns trigger
language plpgsql
as $$
declare
  new_rating numeric;
begin
  select coalesce(avg(rating), 0) into new_rating
  from reviews
  where partner_id = coalesce(new.partner_id, old.partner_id);
  
  update partners
  set rating = new_rating
  where id = coalesce(new.partner_id, old.partner_id);
  
  return coalesce(new, old);
end;
$$;

drop trigger if exists after_review_change on reviews;

create trigger after_review_change
  after insert or update or delete on reviews
  for each row
  execute function update_partner_rating();

-- Trigger para atualizar rating de produtos
create or replace function update_product_rating()
returns trigger
language plpgsql
as $$
declare
  new_rating numeric;
begin
  if new.product_id is not null or (tg_op = 'DELETE' and old.product_id is not null) then
    select coalesce(avg(rating), 0) into new_rating
    from reviews
    where product_id = coalesce(new.product_id, old.product_id);
    
    update products
    set rating = new_rating
    where id = coalesce(new.product_id, old.product_id);
  end if;
  
  return coalesce(new, old);
end;
$$;

drop trigger if exists after_review_change_product on reviews;

create trigger after_review_change_product
  after insert or update or delete on reviews
  for each row
  execute function update_product_rating();
