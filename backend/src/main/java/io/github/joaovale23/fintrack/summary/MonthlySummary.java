package io.github.joaovale23.fintrack.summary;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

/** Tudo o que o painel mostra de um mês, calculado no backend. */
public record MonthlySummary(
        YearMonth month,
        BigDecimal income,
        BigDecimal expense,
        BigDecimal balance,
        List<CategorySpending> incomesByCategory,
        List<CategorySpending> expensesByCategory,
        List<DaySpending> daily,
        List<MonthTrend> trend) {}
