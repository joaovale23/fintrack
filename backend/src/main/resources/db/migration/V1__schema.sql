create table users (
    id            uuid primary key,
    name          varchar(80)  not null,
    email         varchar(160) not null unique,
    password_hash varchar(100) not null,
    demo          boolean      not null default false,
    created_at    timestamptz  not null default now()
);

create table categories (
    id            uuid primary key,
    user_id       uuid          not null references users (id) on delete cascade,
    name          varchar(40)   not null,
    type          varchar(10)   not null check (type in ('INCOME', 'EXPENSE')),
    color         varchar(7)    not null,
    monthly_limit numeric(12, 2) check (monthly_limit > 0),
    unique (user_id, name)
);

-- Sem cascade a partir da categoria: a API impede apagar uma categoria que tem lançamentos.
create table transactions (
    id          uuid primary key,
    user_id     uuid           not null references users (id) on delete cascade,
    category_id uuid           not null references categories (id),
    description varchar(120)   not null,
    amount      numeric(12, 2) not null check (amount > 0),
    date        date           not null,
    created_at  timestamptz    not null default now()
);

create index transactions_user_date_idx on transactions (user_id, date desc);
create index transactions_category_idx on transactions (category_id);
create index users_demo_created_idx on users (created_at) where demo;
