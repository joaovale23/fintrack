package io.github.joaovale23.fintrack.transaction;

import io.github.joaovale23.fintrack.category.CategoryResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionResponse(UUID id, String description, BigDecimal amount, LocalDate date, CategoryResponse category,
        boolean recurring) {

    public static TransactionResponse from(Transaction t) {
        return new TransactionResponse(t.getId(), t.getDescription(), t.getAmount(), t.getDate(),
                CategoryResponse.from(t.getCategory()), t.isRecurring());
    }
}
