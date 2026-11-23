package io.github.joaovale23.fintrack.recurring;

import io.github.joaovale23.fintrack.category.CategoryResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;

/** {@code nextDate} é a próxima vez que a conta vira lançamento (nulo se pausada). */
public record RecurringBillResponse(
        UUID id,
        String description,
        BigDecimal amount,
        CategoryResponse category,
        int dayOfMonth,
        YearMonth startMonth,
        boolean active,
        LocalDate nextDate) {

    static RecurringBillResponse from(RecurringBill r) {
        return new RecurringBillResponse(r.getId(), r.getDescription(), r.getAmount(), CategoryResponse.from(r.getCategory()),
                r.getDayOfMonth(), r.getStartMonth(), r.isActive(), r.isActive() ? r.dateIn(r.nextPendingMonth()) : null);
    }
}
