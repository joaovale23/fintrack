package io.github.joaovale23.fintrack.statement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * O que o extrato trouxe, antes de gravar. {@code duplicate} marca linhas que já parecem estar lançadas
 * (mesma data, valor e descrição), para o usuário decidir.
 */
public record StatementPreview(String format, List<Row> rows) {

    public record Row(LocalDate date, String description, BigDecimal amount, boolean duplicate) {}
}
