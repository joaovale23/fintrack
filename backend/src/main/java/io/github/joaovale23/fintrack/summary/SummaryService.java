package io.github.joaovale23.fintrack.summary;

import io.github.joaovale23.fintrack.category.CategoryType;
import io.github.joaovale23.fintrack.transaction.CategoryTotal;
import io.github.joaovale23.fintrack.transaction.DayTotal;
import io.github.joaovale23.fintrack.transaction.MonthTotal;
import io.github.joaovale23.fintrack.transaction.TransactionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SummaryService {

    /** Meses no gráfico de evolução, contando o mês pedido. */
    static final int TREND_MONTHS = 6;

    private final TransactionRepository transactions;

    public SummaryService(TransactionRepository transactions) {
        this.transactions = transactions;
    }

    @Transactional(readOnly = true)
    public MonthlySummary of(UUID userId, YearMonth month) {
        List<CategoryTotal> byCategory = transactions.totalsByCategory(userId, month.atDay(1), month.atEndOfMonth());
        BigDecimal income = sum(byCategory, CategoryType.INCOME);
        BigDecimal expense = sum(byCategory, CategoryType.EXPENSE);

        List<CategorySpending> incomes = ranked(byCategory, CategoryType.INCOME);
        List<CategorySpending> spending = ranked(byCategory, CategoryType.EXPENSE);
        List<DaySpending> daily = daily(month, transactions.totalsByDay(userId, month.atDay(1), month.atEndOfMonth()));

        YearMonth first = month.minusMonths(TREND_MONTHS - 1);
        List<MonthTotal> monthly = transactions.totalsByMonth(userId, first.atDay(1), month.atEndOfMonth());

        return new MonthlySummary(month, income, expense, income.subtract(expense), incomes, spending, daily, trend(first, monthly));
    }

    private static BigDecimal sum(List<CategoryTotal> totals, CategoryType type) {
        return totals.stream().filter(c -> c.type() == type).map(CategoryTotal::total).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Categorias de um tipo, da maior para a menor. */
    private static List<CategorySpending> ranked(List<CategoryTotal> totals, CategoryType type) {
        return totals.stream()
                .filter(c -> c.type() == type)
                .sorted(Comparator.comparing(CategoryTotal::total).reversed())
                .map(SummaryService::toSpending)
                .toList();
    }

    private static List<DaySpending> daily(YearMonth month, List<DayTotal> totals) {
        Map<LocalDate, Map<CategoryType, BigDecimal>> index = totals.stream().collect(Collectors.groupingBy(
                DayTotal::date, Collectors.toMap(DayTotal::type, DayTotal::total, BigDecimal::add)));
        return month.atDay(1).datesUntil(month.atEndOfMonth().plusDays(1))
                .map(d -> {
                    var t = index.getOrDefault(d, Map.of());
                    return new DaySpending(d, t.getOrDefault(CategoryType.INCOME, BigDecimal.ZERO),
                            t.getOrDefault(CategoryType.EXPENSE, BigDecimal.ZERO));
                })
                .toList();
    }

    private static CategorySpending toSpending(CategoryTotal c) {
        Integer percent = c.monthlyLimit() == null ? null
                : c.total().multiply(BigDecimal.valueOf(100)).divide(c.monthlyLimit(), 0, RoundingMode.HALF_UP).intValue();
        return new CategorySpending(c.categoryId(), c.name(), c.color(), c.icon(), c.total(), c.monthlyLimit(), percent);
    }

    /** Preenche com zero os meses sem lançamentos, para o gráfico não "pular" meses. */
    private static List<MonthTrend> trend(YearMonth first, List<MonthTotal> monthly) {
        Map<YearMonth, Map<CategoryType, BigDecimal>> index = monthly.stream().collect(Collectors.groupingBy(
                MonthTotal::yearMonth, Collectors.toMap(MonthTotal::type, MonthTotal::total, BigDecimal::add)));
        return Stream.iterate(first, m -> m.plusMonths(1)).limit(TREND_MONTHS)
                .map(m -> {
                    var totals = index.getOrDefault(m, Map.of());
                    return new MonthTrend(m, totals.getOrDefault(CategoryType.INCOME, BigDecimal.ZERO),
                            totals.getOrDefault(CategoryType.EXPENSE, BigDecimal.ZERO));
                })
                .toList();
    }
}
