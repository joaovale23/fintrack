package io.github.joaovale23.fintrack.statement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * OFX, o formato que a maioria dos bancos brasileiros exporta. Funciona tanto com o OFX 1.x
 * (SGML, tags sem fechamento) quanto com o 2.x (XML), lendo cada bloco &lt;STMTTRN&gt;.
 */
@Component
@Order(1)
class OfxStatementParser implements StatementParser {

    private static final Pattern TRANSACTION = Pattern.compile("<STMTTRN>(.*?)(?:</STMTTRN>|(?=<STMTTRN>)|(?=</BANKTRANLIST>))",
            Pattern.DOTALL | Pattern.CASE_INSENSITIVE);

    @Override
    public String format() {
        return "OFX";
    }

    @Override
    public boolean supports(String filename, String content) {
        return filename.toLowerCase(Locale.ROOT).endsWith(".ofx") || content.toUpperCase(Locale.ROOT).contains("<OFX>");
    }

    @Override
    public List<StatementLine> parse(String content) {
        List<StatementLine> lines = new ArrayList<>();
        Matcher m = TRANSACTION.matcher(content);
        while (m.find()) {
            String block = m.group(1);
            String date = tag(block, "DTPOSTED");
            String amount = tag(block, "TRNAMT");
            if (date == null || amount == null || date.length() < 8) continue;
            String memo = tag(block, "MEMO");
            String name = tag(block, "NAME");
            String description = memo != null && !memo.isBlank() ? memo : name != null ? name : "Lançamento importado";
            lines.add(new StatementLine(
                    LocalDate.of(Integer.parseInt(date.substring(0, 4)), Integer.parseInt(date.substring(4, 6)), Integer.parseInt(date.substring(6, 8))),
                    StatementText.clean(description),
                    new BigDecimal(amount.replace(',', '.'))));
        }
        if (lines.isEmpty()) throw new InvalidStatementException("Não encontrei lançamentos nesse OFX.");
        return lines;
    }

    /** Valor de uma tag, com ou sem a tag de fechamento. */
    private static String tag(String block, String name) {
        Matcher m = Pattern.compile("<" + name + ">([^<\\r\\n]*)", Pattern.CASE_INSENSITIVE).matcher(block);
        return m.find() ? m.group(1).trim() : null;
    }
}
