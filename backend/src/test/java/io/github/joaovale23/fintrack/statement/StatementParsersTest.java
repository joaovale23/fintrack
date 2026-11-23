package io.github.joaovale23.fintrack.statement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class StatementParsersTest {

    private final CsvStatementParser csv = new CsvStatementParser();
    private final OfxStatementParser ofx = new OfxStatementParser();

    @Test
    void csvComPontoEVirgulaEDecimalComVirgula() {
        String content = """
                Data;Histórico;Valor
                05/11/2026;PIX RECEBIDO - EMPRESA XYZ;5.200,00
                08/11/2026;"COMPRA CARTAO; PADARIA";-35,90
                Saldo do dia;;5.164,10
                """;
        List<StatementLine> lines = csv.parse(content);
        assertThat(lines).hasSize(2);
        assertThat(lines.get(0)).isEqualTo(new StatementLine(LocalDate.of(2026, 11, 5), "Pix recebido - empresa xyz", new BigDecimal("5200.00")));
        assertThat(lines.get(1).amount()).isEqualByComparingTo("-35.90");
        assertThat(lines.get(1).description()).isEqualTo("Compra cartao; padaria");
    }

    @Test
    void csvNoLayoutDoNubankComVirgulaEDataIso() {
        String content = """
                Data,Valor,Identificador,Descrição
                2026-11-10,-1600.00,abc-123,Transferência enviada pelo Pix - Imobiliária
                2026-11-12,-18.90,def-456,"Uber, viagem"
                """;
        List<StatementLine> lines = csv.parse(content);
        assertThat(lines).extracting(StatementLine::amount).containsExactly(new BigDecimal("-1600.00"), new BigDecimal("-18.90"));
        assertThat(lines.get(1).description()).isEqualTo("Uber, viagem");
        assertThat(lines.get(0).date()).isEqualTo(LocalDate.of(2026, 11, 10));
    }

    @Test
    void csvComColunasSeparadasDeCreditoEDebito() {
        String content = """
                Data;Lançamento;Crédito;Débito
                01/11/2026;Salário;5000,00;
                02/11/2026;Aluguel;;1600,00
                """;
        assertThat(csv.parse(content)).extracting(StatementLine::amount)
                .containsExactly(new BigDecimal("5000.00"), new BigDecimal("-1600.00"));
    }

    @Test
    void csvSemCabecalhoDescobreAsColunasPeloConteudo() {
        String content = """
                03/11/2026,Farmácia Popular,-42.50
                04/11/2026,Mercado,-210.00
                """;
        List<StatementLine> lines = csv.parse(content);
        assertThat(lines).hasSize(2);
        assertThat(lines.get(0).description()).isEqualTo("Farmácia Popular");
    }

    @Test
    void csvIrreconhecivelDaErroClaro() {
        assertThatThrownBy(() -> csv.parse("nome,idade\nAna,30\n"))
                .isInstanceOf(InvalidStatementException.class)
                .hasMessageContaining("Não reconheci");
    }

    @Test
    void numerosEmVariosFormatos() {
        assertThat(CsvStatementParser.parseAmount("R$ 1.234,56")).isEqualByComparingTo("1234.56");
        assertThat(CsvStatementParser.parseAmount("(80,00)")).isEqualByComparingTo("-80.00");
        assertThat(CsvStatementParser.parseAmount("1,234.56")).isEqualByComparingTo("1234.56");
        assertThat(CsvStatementParser.parseAmount("texto")).isNull();
    }

    @Test
    void ofxSgmlSemTagsDeFechamento() {
        String content = """
                OFXHEADER:100
                DATA:OFXSGML
                <OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
                <STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261110120000[-3:BRT]<TRNAMT>-1600.00<FITID>1<MEMO>ALUGUEL NOVEMBRO
                <STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20261105<TRNAMT>5200.00<FITID>2<NAME>SALARIO EMPRESA
                </BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>
                """;
        assertThat(ofx.supports("extrato.ofx", content)).isTrue();
        List<StatementLine> lines = ofx.parse(content);
        assertThat(lines).containsExactly(
                new StatementLine(LocalDate.of(2026, 11, 10), "Aluguel novembro", new BigDecimal("-1600.00")),
                new StatementLine(LocalDate.of(2026, 11, 5), "Salario empresa", new BigDecimal("5200.00")));
    }

    @Test
    void arquivoEmLatin1ViraTextoCorreto() {
        byte[] latin1 = "Data;Descrição;Valor\n01/11/2026;Pão;-5,00".getBytes(StandardCharsets.ISO_8859_1);
        assertThat(StatementService.decode(latin1)).contains("Descrição").contains("Pão");
    }
}
