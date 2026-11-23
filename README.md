# fintrack

Controle financeiro pessoal: receitas, despesas, metas de gasto por categoria e um painel mensal.
Front em **Angular 22** e API em **Java 21 + Spring Boot 4**, com PostgreSQL.

> **Entrar como visitante:** a tela de login tem um botão que cria uma conta temporária com seis meses de
> dados de exemplo, sem cadastro. A conta é apagada automaticamente depois de 24 horas.

## O que dá para fazer

- **Lançamento rápido em linguagem natural:** escreva `mercado 230,50 ontem` ou `uber 18,9 #transporte` e o app
  mostra, enquanto você digita, a categoria, o valor e a data que entendeu. Enter grava.
- **Fluxo do mês:** um diagrama de Sankey mostra o caminho do dinheiro, das entradas até cada categoria de gasto e o que sobrou.
- **Painel vivo:** saldo que "conta" até o valor, metas em anéis de progresso, calendário com a cor de quanto se gastou
  em cada dia, curvas dos últimos 6 meses e frases de destaque ("você gastou 5% menos que em outubro").
- **Ritmo do mês:** o saldo acumulado dia a dia e a projeção tracejada de como o mês termina se o gasto médio continuar.
- **Cofrinhos:** objetivos de economia (viagem, reserva) num pote que enche com animação de onda; ao guardar, uma
  moeda cai no pote; com prazo, o app diz quanto guardar por mês; ao completar, confete.
- **Retrospectiva do mês** em telas cheias, no estilo stories: categoria campeã, dia mais caro, maior gasto,
  dias sem gastar e comparação com o mês anterior. Avança sozinha, pausa ao segurar, responde a toques e às setas.
- **Contas recorrentes:** aluguel, internet, salário... cadastrados uma vez e lançados sozinhos todo mês, no dia certo
  (dia 31 vira o último dia em meses curtos). Uma "linha do mês" mostra onde cada conta cai, o painel lista as
  próximas e o formulário de lançamento tem a opção "repetir todo mês".
- **Importar extrato (CSV ou OFX):** a API reconhece o layout de vários bancos (separador, colunas, formato de número,
  ISO-8859-1), marca o que já foi lançado e o app sugere a categoria de cada linha antes de gravar tudo de uma vez.
  Tem um extrato de exemplo para testar sem arquivo.
- **Busca rápida (`Ctrl+K` / `⌘K`):** lançamentos de qualquer mês, categorias, cofrinhos, páginas e ações, pelo teclado.
- **Foto de perfil ilustrada:** sete personagens desenhados em SVG (porquinho, raposa, coruja, gato, panda, sapo e coala),
  salvos na conta; quem não escolhe fica com as iniciais.
- **Modo discreto:** um clique (ou a tecla `H`) borra todos os valores, para abrir o app em público.
- **Linha do tempo de lançamentos** agrupada por dia, com filtros em chips, busca, rolagem infinita e exclusão com "Desfazer".
- **Categorias** com ícone, cor e meta mensal de gastos; a API impede apagar uma categoria que tem lançamentos.
- **Tema claro e escuro**, com a troca se abrindo em círculo a partir do clique; atalho `N` para novo lançamento;
  no celular, barra inferior e um botão flutuante que mostra "Lançar" no topo e encolhe para "+" ao rolar.
- Conta própria (JWT, senha com BCrypt) ou **entrada como visitante**, com seis meses de dados de exemplo.

## Stack

| Camada | Tecnologias |
|---|---|
| Front | Angular 22 (standalone components, signals, novo control flow), **Reactive Forms**, **RxJS**, Angular Material, Vitest |
| API | Java 21, Spring Boot 4, Spring Security (OAuth2 Resource Server com JWT), Spring Data JPA, Bean Validation, springdoc/OpenAPI |
| Dados | PostgreSQL, Flyway |
| Testes | JUnit 5, Mockito, AssertJ, Testcontainers (PostgreSQL real), MockMvc, Vitest |
| Entrega | GitHub Actions, Docker, GitHub Pages (front), Render + Neon (API e banco) |

## Decisões que valem a conversa

**Front**
- **Signals em tudo:** `httpResource` para o resumo e as categorias (trocar o mês já refaz a busca), `computed` para
  os gráficos e `model()` para o seletor de mês com two-way binding.
- **RxJS onde ele brilha:** a lista de lançamentos junta filtros e páginas num fluxo com `debounceTime` na busca e
  `switchMap` para descartar respostas antigas.
- **Animações nativas do Angular** (`animate.enter` / `animate.leave`), **View Transitions** entre páginas e
  **deferrable views** (`@defer (on viewport)`) para o gráfico do fim do painel.
- **Gráficos em SVG feitos à mão** (Sankey, curvas suaves, anéis, calendário), sem biblioteca de gráficos.
- **Diretivas próprias:** número animado (`appCountUp`) e rolagem infinita com `IntersectionObserver`.
- **Formulários reativos** com validação própria (valor em formato brasileiro) e erros da API (Problem Details)
  embaixo do campo certo.
- **Interceptor funcional** põe o token só nas chamadas à própria API e encerra a sessão quando ela responde 401;
  **guards** separam as rotas públicas das internas, e todas as páginas são carregadas sob demanda.
- Identidade visual própria em tokens CSS (Bricolage Grotesque + Instrument Sans, papel quente, verde-pinho e tomate),
  com o Angular Material recolorido por esses tokens; respeita `prefers-reduced-motion`.

**API**
- Toda consulta filtra pelo dono do dado. O recurso de outro usuário responde **404**, não 403, para não revelar que ele existe.
- O JWT é validado pelo próprio Spring Security (resource server), sem filtro escrito à mão.
- Os erros seguem o padrão **RFC 9457** (`application/problem+json`).
- Os totais do painel (por categoria, por dia e por mês) são agregados no banco com `group by`; o serviço só completa
  com zero os dias e meses sem lançamento.
- A listagem usa `Specification` para combinar filtros opcionais e `@EntityGraph` para evitar o problema N+1.
- Contas recorrentes viram lançamentos por um gerador **idempotente** (guarda até que mês já lançou, e um índice único
  em `(recurring_id, date)` impede duplicar). Ele roda de hora em hora e também quando o painel abre, porque o servidor
  gratuito dorme.
- A importação de extrato usa o padrão **Strategy** (um leitor por formato, escolhido pelo conteúdo) e grava em lote
  numa transação só: se uma linha for inválida, nada entra.
- Cofrinhos guardam um histórico de movimentos (depósito positivo, resgate negativo); o saldo é a soma, calculada
  no banco, e o valor mensal sugerido divide o que falta pelos meses até o prazo.
- Regras de negócio: não se apaga categoria com lançamentos, nem se troca o tipo dela; meta só existe em despesas.

## Rodando localmente

Pré-requisitos: JDK 21+, Node 24 e Docker.

```bash
# API em http://localhost:8080 (o Spring sobe o PostgreSQL sozinho pelo Docker Compose)
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# Front em http://localhost:4200
cd frontend && npm install && npm start
```

A documentação da API fica em http://localhost:8080/api/docs.

## Testes

```bash
cd backend && ./mvnw verify          # unitários (Mockito) + integração (Testcontainers)
cd frontend && npm test -- --watch=false
```

## Endpoints

| Método | Caminho | O que faz |
|---|---|---|
| POST | `/api/auth/register` · `/api/auth/login` · `/api/auth/demo` | Cadastro, login e conta de visitante |
| GET / POST | `/api/categories` | Lista e cria categorias |
| PUT / DELETE | `/api/categories/{id}` | Edita e apaga categoria |
| GET / POST | `/api/transactions?month=&type=&categoryId=&search=&page=&size=` | Lista com filtros e cria lançamento |
| PUT / DELETE | `/api/transactions/{id}` | Edita e apaga lançamento |
| PUT | `/api/me/avatar` | Troca o personagem da foto de perfil |
| GET | `/api/summary?month=2026-11` | Resumo do mês: totais por categoria, por dia e evolução dos últimos 6 meses |
| GET / POST | `/api/savings` | Lista e cria cofrinhos (com saldo e valor mensal sugerido) |
| PUT / DELETE | `/api/savings/{id}` | Edita e apaga cofrinho |
| POST | `/api/savings/{id}/moves` | Guarda ou resgata (não deixa resgatar mais do que há no cofrinho) |
| GET / POST | `/api/recurring` | Lista (com a próxima data) e cria contas recorrentes |
| PUT / DELETE | `/api/recurring/{id}` | Edita, pausa ou remove (o histórico já lançado fica) |
| POST | `/api/statements/preview` | Lê um extrato CSV/OFX e devolve a prévia, com duplicados marcados |
| POST | `/api/transactions/batch` | Grava até 500 lançamentos numa transação só |

---

Feito por [João Vitor Vale](https://www.linkedin.com/in/joaovitorvale) · [Portfólio](https://joaovale23.github.io/hexfolio/)
