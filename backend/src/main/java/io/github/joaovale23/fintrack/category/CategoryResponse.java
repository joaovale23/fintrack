package io.github.joaovale23.fintrack.category;

import java.math.BigDecimal;
import java.util.UUID;

public record CategoryResponse(UUID id, String name, CategoryType type, String color, String icon, BigDecimal monthlyLimit) {

    public static CategoryResponse from(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getType(), c.getColor(), c.getIcon(), c.getMonthlyLimit());
    }
}
