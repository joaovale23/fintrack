package io.github.joaovale23.fintrack.transaction;

import io.github.joaovale23.fintrack.category.CategoryType;
import java.math.BigDecimal;
import java.util.UUID;

public record CategoryTotal(UUID categoryId, String name, CategoryType type, String color, String icon, BigDecimal monthlyLimit,
        BigDecimal total) {}
