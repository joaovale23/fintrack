-- Ícone por categoria (nome de um ícone do Material Symbols), usado nas listas e no painel.
alter table categories add column icon varchar(40) not null default 'sell';

update categories set icon = case name
    when 'Salário' then 'payments'
    when 'Freelance' then 'laptop_mac'
    when 'Moradia' then 'home'
    when 'Alimentação' then 'restaurant'
    when 'Transporte' then 'directions_car'
    when 'Lazer' then 'celebration'
    when 'Saúde' then 'favorite'
    when 'Educação' then 'school'
    else icon
end;
