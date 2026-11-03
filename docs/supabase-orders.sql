-- 굿즈샵(모의 결제) 주문 저장용 표 — Supabase 의 SQL Editor 에 통째로 붙여 넣고 Run 하세요.
-- 실제 결제·배송은 없고, 주문 내역(닉네임·상품·합계·결제 수단 이름)만 저장합니다. 카드번호·주소는 저장하지 않습니다.
create table if not exists orders (
  id bigint generated always as identity primary key,
  nickname text not null,          -- 오른쪽 위에서 정한 닉네임 (없으면 '익명')
  items jsonb not null,            -- [{ id, name, price, qty }]
  total integer not null,          -- 합계(원)
  method text not null,            -- '카드(모의)' | '간편결제(모의)' | '무통장입금(모의)'
  created_at timestamptz default now()
);

alter table orders enable row level security;
create policy "orders read all"   on orders for select using (true);
create policy "orders insert all" on orders for insert with check (true);
-- 실습용(누구나 읽기·쓰기)입니다. 실제 서비스에서는 로그인한 사용자 본인의 주문만 보이도록 바꿔야 합니다.
