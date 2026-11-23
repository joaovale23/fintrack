package io.github.joaovale23.fintrack.savings;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Cofrinho com o que já foi guardado e, se houver prazo, quanto guardar por mês para chegar lá.
 * {@code monthlyNeeded} é nulo sem prazo ou quando o objetivo já foi atingido.
 */
public record SavingsGoalResponse(
        UUID id,
        String name,
        String icon,
        String color,
        BigDecimal target,
        LocalDate deadline,
        BigDecimal saved,
        int percent,
        BigDecimal monthlyNeeded,
        List<Move> recentMoves) {

    public record Move(UUID id, BigDecimal amount, LocalDate date) {}
}
