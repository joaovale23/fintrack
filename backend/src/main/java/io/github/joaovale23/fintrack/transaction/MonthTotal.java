package io.github.joaovale23.fintrack.transaction;

import io.github.joaovale23.fintrack.category.CategoryType;
import java.math.BigDecimal;
import java.time.YearMonth;

public record MonthTotal(int year, int month, CategoryType type, BigDecimal total) {

    public YearMonth yearMonth() {
        return YearMonth.of(year, month);
    }
}
