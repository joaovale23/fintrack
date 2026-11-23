-- Contas recorrentes (aluguel, internet, salário): viram lançamentos sozinhas, todo mês, no dia combinado.
create table recurring_bills (
    id                   uuid primary key,
    user_id              uuid           not null references users (id) on delete cascade,
    category_id          uuid           not null references categories (id),
    description          varchar(120)   not null,
    amount               numeric(12, 2) not null check (amount > 0),
    day_of_month         integer        not null check (day_of_month between 1 and 31),
    start_month          date           not null,
    last_generated_month date,
    active               boolean        not null default true,
    created_at           timestamptz    not null default now()
);

create index recurring_bills_user_idx on recurring_bills (user_id);
create index recurring_bills_category_idx on recurring_bills (category_id);

-- O lançamento lembra de qual conta recorrente veio; apagar a conta não apaga o histórico.
alter table transactions add column recurring_id uuid references recurring_bills (id) on delete set null;

-- Garante que a mesma conta não seja lançada duas vezes na mesma data, mesmo com duas gerações simultâneas.
create unique index transactions_recurring_date_uq on transactions (recurring_id, date) where recurring_id is not null;
