-- Caixinhas: objetivos de economia (viagem, reserva...) e o histórico do que foi guardado ou resgatado.
create table savings_goals (
    id         uuid primary key,
    user_id    uuid           not null references users (id) on delete cascade,
    name       varchar(60)    not null,
    icon       varchar(40)    not null,
    color      varchar(7)     not null,
    target     numeric(12, 2) not null check (target > 0),
    deadline   date,
    created_at timestamptz    not null default now()
);

-- amount > 0 é depósito; amount < 0 é resgate.
create table savings_moves (
    id         uuid primary key,
    goal_id    uuid           not null references savings_goals (id) on delete cascade,
    amount     numeric(12, 2) not null check (amount <> 0),
    date       date           not null,
    created_at timestamptz    not null default now()
);

create index savings_goals_user_idx on savings_goals (user_id);
create index savings_moves_goal_idx on savings_moves (goal_id, date desc);
