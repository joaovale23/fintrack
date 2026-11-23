package io.github.joaovale23.fintrack.statement;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * CSV de extrato. Cada banco usa um layout, então o leitor descobre sozinho:
 * o separador (vírgula ou ponto e vírgula), as colunas de data, valor e descrição (pelo cabeçalho
 * ou, sem cabeçalho, pelo conteúdo) e o formato dos números (1.234,56 ou 1234.56).
 * Também aceita extratos com colunas separadas de crédito e débito.
 */
@Component
@Order(2)
class CsvStatementParser implements StatementParser {

    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ofPattern("dd/MM/yy"));

    @Override
    public String format() {
        return "CSV";
    }

    @Override
    public boolean supports(String filename, String content) {
        return true; // último recurso: se não é OFX, tenta como CSV
    }

    @Override
    public List<StatementLine> parse(String content) {
        List<String> rows = content.lines().map(String::strip).filter(l -> !l.isEmpty()).toList();
        if (rows.isEmpty()) throw new InvalidStatementException("O arquivo está vazio.");
        char sep = separator(rows.getFirst());
        List<List<String>> table = rows.stream().map(r -> split(r, sep)).toList();

        Columns cols = fromHeader(table.getFirst());
        int firstData = 1;
        if (cols == null) {
            cols = fromContent(table);
            firstData = 0;
        }
        if (cols == null) {
            throw new InvalidStatementException("Não reconheci as colunas de data, valor e descrição nesse CSV.");
        }

        List<StatementLine> lines = new ArrayList<>();
        for (List<String> row : table.subList(firstData, table.size())) {
            LocalDate date = parseDate(cell(row, cols.date));
            BigDecimal amount = cols.amount >= 0 ? parseAmount(cell(row, cols.amount)) : creditMinusDebit(row, cols);
            if (date == null || amount == null || amount.signum() == 0) continue; // linhas de saldo, totais etc.
            String description = cols.description >= 0 ? cell(row, cols.description) : "";
            lines.add(new StatementLine(date, StatementText.clean(description), amount));
        }
        if (lines.isEmpty()) throw new InvalidStatementException("Não encontrei lançamentos nesse CSV.");
        return lines;
    }

    private record Columns(int date, int amount, int description, int credit, int debit) {}

    private static char separator(String header) {
        long semicolons = header.chars().filter(c -> c == ';').count();
        long commas = header.chars().filter(c -> c == ',').count();
        return semicolons >= commas && semicolons > 0 ? ';' : ',';
    }

    /** Separa respeitando aspas: "Compra, parcela 1/3" é uma célula só. */
    static List<String> split(String line, char sep) {
        List<String> cells = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean quoted = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (ch == '"') {
                if (quoted && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    quoted = !quoted;
                }
            } else if (ch == sep && !quoted) {
                cells.add(current.toString().strip());
                current.setLength(0);
            } else {
                current.append(ch);
            }
        }
        cells.add(current.toString().strip());
        return cells;
    }

    private static Columns fromHeader(List<String> header) {
        int date = -1, amount = -1, description = -1, credit = -1, debit = -1;
        for (int i = 0; i < header.size(); i++) {
            String h = normalize(header.get(i));
            if (date < 0 && (h.startsWith("data") || h.equals("date"))) date = i;
            else if (amount < 0 && (h.startsWith("valor") || h.equals("amount") || h.equals("quantia"))) amount = i;
            else if (description < 0 && (h.startsWith("descri") || h.startsWith("historico") || h.equals("memo") || h.equals("title")
                    || h.startsWith("estabelecimento") || h.startsWith("lancamento"))) description = i;
            else if (credit < 0 && (h.startsWith("credito") || h.startsWith("entrada"))) credit = i;
            else if (debit < 0 && (h.startsWith("debito") || h.startsWith("saida"))) debit = i;
        }
        boolean hasValue = amount >= 0 || (credit >= 0 && debit >= 0);
        return date >= 0 && hasValue ? new Columns(date, amount, description, credit, debit) : null;
    }

    /** Sem cabeçalho: data é a coluna que vira data, valor é a numérica, descrição é a de texto mais longo. */
    private static Columns fromContent(List<List<String>> table) {
        List<String> sample = table.getFirst();
        int date = -1, amount = -1, description = -1, longest = -1;
        for (int i = 0; i < sample.size(); i++) {
            String cell = sample.get(i);
            if (date < 0 && parseDate(cell) != null) date = i;
            else if (amount < 0 && parseAmount(cell) != null) amount = i;
            else if (cell.length() > longest) {
                longest = cell.length();
                description = i;
            }
        }
        return date >= 0 && amount >= 0 ? new Columns(date, amount, description, -1, -1) : null;
    }

    private static BigDecimal creditMinusDebit(List<String> row, Columns cols) {
        BigDecimal credit = parseAmount(cell(row, cols.credit));
        BigDecimal debit = parseAmount(cell(row, cols.debit));
        if (credit == null && debit == null) return null;
        return (credit == null ? BigDecimal.ZERO : credit.abs()).subtract(debit == null ? BigDecimal.ZERO : debit.abs());
    }

    static LocalDate parseDate(String raw) {
        String text = raw.strip();
        if (text.length() > 10) text = text.substring(0, 10);
        for (DateTimeFormatter f : DATE_FORMATS) {
            try {
                return LocalDate.parse(text, f);
            } catch (DateTimeParseException ignored) {
                // tenta o próximo formato
            }
        }
        return null;
    }

    /** "-1.234,56", "R$ 35,90", "1234.56", "(80,00)" → número. */
    static BigDecimal parseAmount(String raw) {
        String text = raw.replace("R$", "").replace(" ", "").replace(" ", "").strip();
        boolean negative = text.startsWith("(") && text.endsWith(")");
        text = text.replace("(", "").replace(")", "");
        if (text.isEmpty() || !text.matches("[-+]?[\\d.,]+")) return null;
        int comma = text.lastIndexOf(',');
        int dot = text.lastIndexOf('.');
        if (comma > dot) {
            text = text.replace(".", "").replace(',', '.');
        } else if (dot > comma && comma >= 0) {
            text = text.replace(",", "");
        } else if (comma < 0 && dot >= 0 && text.length() - dot - 1 == 3 && text.indexOf('.') != dot) {
            text = text.replace(".", ""); // "1.234.567" sem decimais
        }
        try {
            BigDecimal value = new BigDecimal(text);
            return negative ? value.negate() : value;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String cell(List<String> row, int index) {
        return index >= 0 && index < row.size() ? row.get(index) : "";
    }

    private static String normalize(String text) {
        return Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).replace("\"", "").strip();
    }
}
