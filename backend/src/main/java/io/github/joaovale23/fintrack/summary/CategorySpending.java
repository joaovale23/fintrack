package io.github.joaovale23.fintrack.summary;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Gasto de uma categoria no mês.
 * {@code limitUsedPercent} é nulo quando a categoria não tem meta; passa de 100 quando a meta estourou.
 */
public record CategorySpending(UUID categoryId, String name, String color, String icon, BigDecimal total, BigDecimal monthlyLimit,
        Integer limitUsedPercent) {}
