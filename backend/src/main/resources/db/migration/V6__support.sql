-- Relatos enviados pelo botão "Relatar problema". Se a conta for apagada (visitante), o relato fica.
create table support_reports (
    id            uuid primary key,
    user_id       uuid          references users (id) on delete set null,
    user_name     varchar(80)   not null,
    kind          varchar(10)   not null check (kind in ('BUG', 'IDEA', 'OTHER')),
    message       varchar(2000) not null,
    contact_email varchar(160),
    page          varchar(300),
    user_agent    varchar(300),
    resolved      boolean       not null default false,
    created_at    timestamptz   not null default now()
);
create index support_reports_created_idx on support_reports (created_at desc);

-- Erros do front e da API, agrupados: o mesmo erro só soma ocorrências.
create table app_errors (
    id          uuid primary key,
    fingerprint varchar(64)   not null unique,
    source      varchar(10)   not null check (source in ('WEB', 'API')),
    message     varchar(500)  not null,
    detail      varchar(4000),
    page        varchar(300),
    user_agent  varchar(300),
    occurrences int           not null default 1,
    resolved    boolean       not null default false,
    first_seen  timestamptz   not null default now(),
    last_seen   timestamptz   not null default now()
);

-- Quem usou o app em cada dia. Sem chave estrangeira de propósito: a contagem de visitantes
-- continua no histórico mesmo depois que a conta temporária é apagada.
create table user_activity (
    day       date    not null,
    user_id   uuid    not null,
    temporary boolean not null,
    primary key (day, user_id)
);
