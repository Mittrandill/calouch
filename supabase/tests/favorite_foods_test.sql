-- Implements: MVP-06
-- PRD §09: "Her migration pozitif/negatif RLS testi taşır."

begin;
select plan(11);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('ff111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'ayse_fav@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now()),
  ('ff222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'burak_fav@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now());

set local role authenticated;
set local request.jwt.claims = '{"sub":"ff111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- ---------------------------------------------------------------------------
-- POZİTİF
-- ---------------------------------------------------------------------------
insert into public.favorite_foods (user_id, food_id) values
  ('ff111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001');

select is(
  (select count(*)::int from public.favorite_foods where user_id = 'ff111111-1111-1111-1111-111111111111'),
  1, 'POZİTİF: favori eklendi'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: aynı besin iki kez favorilenemez
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.favorite_foods (user_id, food_id)
     values ('ff111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001') $$,
  '23505', null, 'NEGATİF: aynı besin iki kez favorilenemez (unique constraint)'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: başkası adına favori yazma (with check)
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.favorite_foods (user_id, food_id)
     values ('ff222222-2222-2222-2222-222222222222', '10000000-0000-0000-0000-000000000002') $$,
  '42501', null, 'NEGATİF: Ayşe, Burak adına favori yazamaz'
);

-- ---------------------------------------------------------------------------
-- list_favorite_foods — search_foods ile aynı şekilde doğru veri döner
-- ---------------------------------------------------------------------------
select is(
  (select matched_name from public.list_favorite_foods('tr')
   where food_id = '10000000-0000-0000-0000-000000000001'),
  'Tavuk göğsü (ızgara)', 'list_favorite_foods: TR ad doğru döner'
);
select is(
  (select energy_kcal from public.list_favorite_foods('tr')
   where food_id = '10000000-0000-0000-0000-000000000001'),
  165, 'list_favorite_foods: kalori doğru döner'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: Burak Ayşe'nin favorisini göremez
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"ff222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (select count(*)::int from public.favorite_foods where user_id = 'ff111111-1111-1111-1111-111111111111'),
  0, 'NEGATİF: Burak Ayşe''nin favorisini SELECT ile göremez'
);
select is(
  (select count(*)::int from public.list_favorite_foods()),
  0, 'NEGATİF: Burak''ın kendi favori listesi boş (Ayşe''ninkini görmez)'
);

-- ---------------------------------------------------------------------------
-- Unfavorite (DELETE) — yalnız kendi satırını silebilir
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"ff111111-1111-1111-1111-111111111111","role":"authenticated"}';

delete from public.favorite_foods
where user_id = 'ff111111-1111-1111-1111-111111111111'
  and food_id = '10000000-0000-0000-0000-000000000001';

select is(
  (select count(*)::int from public.favorite_foods where user_id = 'ff111111-1111-1111-1111-111111111111'),
  0, 'unfavorite: satır silindi'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: anon
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok(
  $$ select * from public.favorite_foods $$,
  '42501', null, 'NEGATİF: anon favorite_foods okuyamaz'
);
select throws_ok(
  $$ insert into public.favorite_foods (user_id, food_id)
     values ('ff111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001') $$,
  '42501', null, 'NEGATİF: anon favorite_foods yazamaz'
);
select throws_ok(
  $$ select public.list_favorite_foods() $$,
  '42501', null, 'NEGATİF: anon list_favorite_foods çalıştıramaz'
);
reset role;

select * from finish();
rollback;
