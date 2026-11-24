-- Primeira entrada: escolha do avatar e o tour guiado. Contas que já existiam não veem o tour de novo.
alter table users add column onboarded boolean not null default false;
update users set onboarded = true;
