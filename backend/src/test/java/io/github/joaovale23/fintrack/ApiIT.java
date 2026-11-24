package io.github.joaovale23.fintrack;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** Fluxos completos pela API, com banco real (Testcontainers) e o JWT de verdade. */
@SpringBootTest(properties = "fintrack.admin.emails=" + ApiIT.ADMIN)
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ApiIT {

    static final String ADMIN = "admin-fintrack@teste.dev";

    @Autowired MockMvc mvc;

    @Test
    void rotasProtegidasExigemToken() throws Exception {
        mvc.perform(get("/api/transactions")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/summary").header("Authorization", "Bearer token-falso")).andExpect(status().isUnauthorized());
    }

    @Test
    void cadastroCriaCategoriasIniciaisELoginDevolveToken() throws Exception {
        String email = unique("ana");
        register("Ana", email);

        String token = login(email, "senha-forte-123");
        mvc.perform(auth(get("/api/categories"), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(8))
                .andExpect(jsonPath("$[?(@.name == 'Alimentação')].monthlyLimit").value(1500.0))
                .andExpect(jsonPath("$[?(@.name == 'Alimentação')].icon").value("restaurant"));

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"errada-123\"}".formatted(email)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("E-mail ou senha inválidos"));
    }

    @Test
    void emailDuplicadoEDadosInvalidosSaoRecusados() throws Exception {
        String email = unique("bia");
        register("Bia", email);

        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Outra\",\"email\":\"%s\",\"password\":\"senha-forte-123\"}".formatted(email.toUpperCase())))
                .andExpect(status().isConflict());

        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"email\":\"nao-e-email\",\"password\":\"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.email").value("E-mail inválido"))
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    void lancamentosEntramNoResumoDoMes() throws Exception {
        String token = register("Caio", unique("caio"));
        String salario = categoryId(token, "Salário");
        String lazer = categoryId(token, "Lazer");
        YearMonth month = YearMonth.of(2026, 3);

        createTransaction(token, "Salário de março", "5000.00", month.atDay(5), salario);
        createTransaction(token, "Show", "300.00", month.atDay(12), lazer);
        createTransaction(token, "Viagem", "200.00", month.atDay(20), lazer);
        createTransaction(token, "Fora do mês", "999.00", month.plusMonths(1).atDay(1), lazer);

        mvc.perform(auth(get("/api/summary").param("month", "2026-03"), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.income").value(5000.0))
                .andExpect(jsonPath("$.expense").value(500.0))
                .andExpect(jsonPath("$.balance").value(4500.0))
                .andExpect(jsonPath("$.expensesByCategory[0].name").value("Lazer"))
                .andExpect(jsonPath("$.expensesByCategory[0].limitUsedPercent").value(125))
                .andExpect(jsonPath("$.trend.length()").value(6))
                .andExpect(jsonPath("$.incomesByCategory[0].name").value("Salário"))
                .andExpect(jsonPath("$.daily.length()").value(31))
                .andExpect(jsonPath("$.daily[11].expense").value(300.0));

        mvc.perform(auth(get("/api/transactions").param("month", "2026-03").param("type", "EXPENSE"), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].description").value("Viagem"));

        mvc.perform(auth(get("/api/transactions").param("search", "SHOW"), token))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void umUsuarioNaoEnxergaNemAlteraDadosDeOutro() throws Exception {
        String dono = register("Dono", unique("dono"));
        String intruso = register("Intruso", unique("intruso"));
        String categoria = categoryId(dono, "Lazer");
        String lancamento = createTransaction(dono, "Cinema", "50.00", LocalDate.of(2026, 5, 2), categoria);

        mvc.perform(auth(delete("/api/transactions/" + lancamento), intruso)).andExpect(status().isNotFound());
        mvc.perform(auth(put("/api/categories/" + categoria), intruso).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Hack\",\"type\":\"EXPENSE\",\"color\":\"#000000\"}"))
                .andExpect(status().isNotFound());
        // Usar a categoria de outra pessoa num lançamento próprio também não passa.
        mvc.perform(auth(post("/api/transactions"), intruso).contentType(MediaType.APPLICATION_JSON)
                        .content(transactionJson("Teste", "10.00", LocalDate.of(2026, 5, 3), categoria)))
                .andExpect(status().isNotFound());
        mvc.perform(auth(get("/api/transactions"), intruso)).andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void categoriaComLancamentosNaoPodeSerApagada() throws Exception {
        String token = register("Duda", unique("duda"));
        String saude = categoryId(token, "Saúde");
        String lancamento = createTransaction(token, "Consulta", "150.00", LocalDate.of(2026, 7, 1), saude);

        mvc.perform(auth(delete("/api/categories/" + saude), token)).andExpect(status().isConflict());

        mvc.perform(auth(delete("/api/transactions/" + lancamento), token)).andExpect(status().isNoContent());
        mvc.perform(auth(delete("/api/categories/" + saude), token)).andExpect(status().isNoContent());
    }

    @Test
    void relatoChegaAoPainelDoAdminQueResolve() throws Exception {
        String token = register("Gabi", unique("gabi"));
        mvc.perform(auth(post("/api/support"), token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\":\"BUG\",\"message\":\"O gráfico não abre\",\"page\":\"/lancamentos\"}"))
                .andExpect(status().isCreated());
        mvc.perform(auth(post("/api/support"), token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\":\"BUG\",\"message\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.message").exists());

        // Quem não é admin não entra no painel.
        mvc.perform(auth(get("/api/admin/reports"), token)).andExpect(status().isForbidden());

        String admin = adminToken();
        var list = mvc.perform(auth(get("/api/admin/reports"), admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.message == 'O gráfico não abre')].userName").value("Gabi"))
                .andReturn();
        String id = JsonPath.<java.util.List<String>>read(list.getResponse().getContentAsString(),
                "$[?(@.message == 'O gráfico não abre')].id").getFirst();
        // Conta real sem e-mail informado: responde no e-mail da conta.
        mvc.perform(auth(get("/api/admin/reports"), admin))
                .andExpect(jsonPath("$[?(@.id == '%s')].contactEmail".formatted(id)).value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.startsWith("gabi"))));

        mvc.perform(auth(put("/api/admin/reports/" + id), admin).contentType(MediaType.APPLICATION_JSON).content("{\"resolved\":true}"))
                .andExpect(jsonPath("$.resolved").value(true));
        mvc.perform(auth(get("/api/admin/reports"), admin))
                .andExpect(jsonPath("$[?(@.id == '%s')]".formatted(id)).isEmpty());
    }

    @Test
    void relatosTemLimitePorHora() throws Exception {
        String token = register("Hugo", unique("hugo"));
        for (int i = 0; i < 5; i++) {
            mvc.perform(auth(post("/api/support"), token).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"kind\":\"IDEA\",\"message\":\"ideia %d\"}".formatted(i))).andExpect(status().isCreated());
        }
        mvc.perform(auth(post("/api/support"), token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"kind\":\"IDEA\",\"message\":\"mais uma\"}")).andExpect(status().isTooManyRequests());
    }

    @Test
    void erroDoFrontEntraSemLoginEOMesmoErroSoSomaOcorrencias() throws Exception {
        String unico = "TypeError: teste " + UUID.randomUUID();
        for (int i = 0; i < 3; i++) {
            mvc.perform(post("/api/errors").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"message\":\"%s\",\"detail\":\"%s\\n    at Foo (main-ABC%d.js:1:2)\",\"page\":\"/\"}".formatted(unico, unico, i)))
                    .andExpect(status().isAccepted());
        }
        mvc.perform(auth(get("/api/admin/errors"), adminToken()))
                .andExpect(jsonPath("$[?(@.message == '%s')].occurrences".formatted(unico)).value(org.hamcrest.Matchers.contains(3)));
    }

    @Test
    void painelMostraUsoSemContarOAdmin() throws Exception {
        String admin = adminToken();
        String token = register("Iris", unique("iris"));
        mvc.perform(auth(get("/api/categories"), token)).andExpect(status().isOk());

        mvc.perform(auth(get("/api/admin/overview"), admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeToday").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.days.length()").value(30));
        mvc.perform(auth(get("/api/me"), admin)).andExpect(jsonPath("$.admin").value(true));
        mvc.perform(auth(get("/api/me"), token)).andExpect(jsonPath("$.admin").value(false));
    }

    @Test
    void frontConsegueConsultarSeAApiEstaAcordada() throws Exception {
        mvc.perform(get("/actuator/health/liveness").header("Origin", "http://localhost:4200"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"));
    }

    @Test
    void visitanteEntraNumaContaVaziaSoComAsCategoriasIniciais() throws Exception {
        var result = mvc.perform(post("/api/auth/guest"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.demo").value(true))
                .andExpect(jsonPath("$.user.name").value("Visitante"))
                .andReturn();
        String token = JsonPath.read(result.getResponse().getContentAsString(), "$.token");

        mvc.perform(auth(get("/api/summary"), token))
                .andExpect(jsonPath("$.income").value(0))
                .andExpect(jsonPath("$.expense").value(0));
        mvc.perform(auth(get("/api/savings"), token)).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(auth(get("/api/categories"), token)).andExpect(jsonPath("$.length()").isNotEmpty());
    }

    @Test
    void demonstracaoEntraComSeisMesesDeDadosDeExemplo() throws Exception {
        var result = mvc.perform(post("/api/auth/demo"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.demo").value(true))
                .andReturn();
        String token = JsonPath.read(result.getResponse().getContentAsString(), "$.token");

        var summary = mvc.perform(auth(get("/api/summary"), token)).andExpect(status().isOk()).andReturn();
        String body = summary.getResponse().getContentAsString();
        assertThat((String) JsonPath.read(body, "$.month")).isEqualTo(YearMonth.now(ZoneId.of("America/Sao_Paulo")).toString());
        assertThat((Double) JsonPath.read(body, "$.trend[0].income")).isPositive();
    }

    @Test
    void cofrinhoGuardaResgataENaoDeixaResgatarMaisDoQueTem() throws Exception {
        String token = register("Eva", unique("eva"));
        var created = mvc.perform(auth(post("/api/savings"), token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Notebook novo\",\"icon\":\"laptop_mac\",\"color\":\"#6c5ce7\",\"target\":4000}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.saved").value(0))
                .andReturn();
        String id = JsonPath.read(created.getResponse().getContentAsString(), "$.id");

        mvc.perform(auth(post("/api/savings/" + id + "/moves"), token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":1000,\"kind\":\"DEPOSIT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saved").value(1000.0))
                .andExpect(jsonPath("$.percent").value(25));

        mvc.perform(auth(post("/api/savings/" + id + "/moves"), token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":1500,\"kind\":\"WITHDRAW\"}"))
                .andExpect(status().isConflict());

        mvc.perform(auth(post("/api/savings/" + id + "/moves"), token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":400,\"kind\":\"WITHDRAW\"}"))
                .andExpect(jsonPath("$.saved").value(600.0))
                .andExpect(jsonPath("$.recentMoves.length()").value(2));

        // Outra pessoa não enxerga nem mexe.
        String intruso = register("Intrusa", unique("intrusa"));
        mvc.perform(auth(get("/api/savings"), intruso)).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(auth(post("/api/savings/" + id + "/moves"), intruso).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":10,\"kind\":\"DEPOSIT\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void demonstracaoJaComecaComCofrinhos() throws Exception {
        var result = mvc.perform(post("/api/auth/demo")).andExpect(status().isCreated()).andReturn();
        String token = JsonPath.read(result.getResponse().getContentAsString(), "$.token");
        mvc.perform(auth(get("/api/savings"), token))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@.name == 'Viagem para o Chile')].monthlyNeeded").isNotEmpty());
    }

    @Test
    void contaRecorrenteLancaOsMesesVencidosEBloqueiaApagarACategoria() throws Exception {
        String token = register("Fabi", unique("fabi"));
        String moradia = categoryId(token, "Moradia");
        YearMonth start = YearMonth.now(ZoneId.of("America/Sao_Paulo")).minusMonths(2);

        mvc.perform(auth(post("/api/recurring"), token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"Aluguel\",\"amount\":1600,\"categoryId\":\"%s\",\"dayOfMonth\":1,\"startMonth\":\"%s\"}"
                                .formatted(moradia, start)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nextDate").value(start.plusMonths(3).atDay(1).toString()));

        // Dia 1 já passou nos três meses: três lançamentos, marcados como recorrentes.
        mvc.perform(auth(get("/api/transactions").param("search", "Aluguel"), token))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.content[0].recurring").value(true));

        mvc.perform(auth(get("/api/recurring"), token)).andExpect(jsonPath("$.length()").value(1));

        // Sem lançamentos dessa categoria a regra ainda vale por causa da conta recorrente.
        String lazer = categoryId(token, "Lazer");
        mvc.perform(auth(post("/api/recurring"), token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"Streaming\",\"amount\":40,\"categoryId\":\"%s\",\"dayOfMonth\":28,\"startMonth\":\"%s\"}"
                                .formatted(lazer, start.plusMonths(12))))
                .andExpect(status().isCreated());
        mvc.perform(auth(delete("/api/categories/" + lazer), token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("conta recorrente")));
    }

    @Test
    void importaExtratoComPreviaMarcandoDuplicadosEGravaEmLote() throws Exception {
        String token = register("Gabi", unique("gabi"));
        String lazer = categoryId(token, "Lazer");
        createTransaction(token, "Cinema", "45.00", LocalDate.of(2026, 10, 3), lazer);

        String csv = "Data;Descrição;Valor\n03/10/2026;Cinema;-45,00\n04/10/2026;Show;-120,00\n05/10/2026;Salário;5.000,00\n";
        var file = new org.springframework.mock.web.MockMultipartFile("file", "extrato.csv", "text/csv", csv.getBytes());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/statements/preview").file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.format").value("CSV"))
                .andExpect(jsonPath("$.rows.length()").value(3))
                .andExpect(jsonPath("$.rows[?(@.description == 'Cinema')].duplicate").value(true))
                .andExpect(jsonPath("$.rows[?(@.description == 'Show')].duplicate").value(false));

        mvc.perform(auth(post("/api/transactions/batch"), token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[" + transactionJson("Show", "120.00", LocalDate.of(2026, 10, 4), lazer) + "]}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.created").value(1));

        // Um item com categoria de outra pessoa derruba o lote inteiro.
        String outro = register("Outro", unique("outro"));
        String categoriaAlheia = categoryId(outro, "Lazer");
        mvc.perform(auth(post("/api/transactions/batch"), token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[" + transactionJson("Ok", "10.00", LocalDate.of(2026, 10, 6), lazer) + ","
                                + transactionJson("Hack", "10.00", LocalDate.of(2026, 10, 6), categoriaAlheia) + "]}"))
                .andExpect(status().isNotFound());
        mvc.perform(auth(get("/api/transactions").param("month", "2026-10"), token)).andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void extratoIlegivelResponde422() throws Exception {
        String token = register("Hugo", unique("hugo"));
        var file = new org.springframework.mock.web.MockMultipartFile("file", "planilha.csv", "text/csv", "nome,idade\nAna,30".getBytes());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/statements/preview").file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnprocessableContent());
    }

    @Test
    void avatarEscolhidoFicaSalvoEVoltaNoLogin() throws Exception {
        String email = unique("iris");
        String token = register("Íris", email);

        mvc.perform(auth(put("/api/me/avatar"), token).contentType(MediaType.APPLICATION_JSON).content("{\"avatar\":\"raposa\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatar").value("raposa"));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"senha-forte-123\"}".formatted(email)))
                .andExpect(jsonPath("$.user.avatar").value("raposa"));

        mvc.perform(auth(put("/api/me/avatar"), token).contentType(MediaType.APPLICATION_JSON).content("{\"avatar\":\"dragao\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(auth(put("/api/me/avatar"), token).contentType(MediaType.APPLICATION_JSON).content("{\"avatar\":null}"))
                .andExpect(jsonPath("$.avatar").doesNotExist());
    }

    // --- apoio ---

    private String register(String name, String email) throws Exception {
        var result = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"%s\",\"email\":\"%s\",\"password\":\"senha-forte-123\"}".formatted(name, email)))
                .andExpect(status().isCreated())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.token");
    }

    private String login(String email, String password) throws Exception {
        var result = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.token");
    }

    private String categoryId(String token, String name) throws Exception {
        var result = mvc.perform(auth(get("/api/categories"), token)).andReturn();
        net.minidev.json.JSONArray ids = JsonPath.read(result.getResponse().getContentAsString(), "$[?(@.name == '%s')].id".formatted(name));
        return (String) ids.getFirst();
    }

    private String createTransaction(String token, String description, String amount, LocalDate date, String categoryId) throws Exception {
        var result = mvc.perform(auth(post("/api/transactions"), token).contentType(MediaType.APPLICATION_JSON)
                        .content(transactionJson(description, amount, date, categoryId)))
                .andExpect(status().isCreated())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }

    private static String transactionJson(String description, String amount, LocalDate date, String categoryId) {
        return "{\"description\":\"%s\",\"amount\":%s,\"date\":\"%s\",\"categoryId\":\"%s\"}".formatted(description, amount, date, categoryId);
    }

    private static MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder req, String token) {
        return req.header("Authorization", "Bearer " + token);
    }

    /** A conta de admin é criada uma vez; nas próximas chamadas só faz login. */
    private String adminToken() throws Exception {
        var res = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Admin\",\"email\":\"%s\",\"password\":\"senha-forte-123\"}".formatted(ADMIN))).andReturn();
        return res.getResponse().getStatus() == 201
                ? JsonPath.read(res.getResponse().getContentAsString(), "$.token")
                : login(ADMIN, "senha-forte-123");
    }

    private static String unique(String name) {
        return name + "-" + UUID.randomUUID() + "@teste.dev";
    }
}
