package io.github.joaovale23.fintrack.summary;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import io.github.joaovale23.fintrack.category.CategoryType;
import io.github.joaovale23.fintrack.transaction.CategoryTotal;
import io.github.joaovale23.fintrack.transaction.DayTotal;
import io.github.joaovale23.fintrack.transaction.MonthTotal;
import io.github.joaovale23.fintrack.transaction.TransactionRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SummaryServiceTest {

    private static final UUID USER = UUID.randomUUID();
    private static final YearMonth NOV = YearMonth.of(2026, 11);

    @Mock TransactionRepository transactions;
    @InjectMocks SummaryService service;

    @Test
    void calculaSaldoEPercentualDaMetaPorCategoria() {
        when(transactions.totalsByCategory(USER, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30))).thenReturn(List.of(
                total("Salário", CategoryType.INCOME, null, "5000.00"),
                total("Lazer", CategoryType.EXPENSE, "400.00", "500.00"),
                total("Moradia", CategoryType.EXPENSE, null, "1600.00")));
        when(transactions.totalsByMonth(eq(USER), any(), any())).thenReturn(List.of());

        MonthlySummary summary = service.of(USER, NOV);

        assertThat(summary.income()).isEqualByComparingTo("5000.00");
        assertThat(summary.expense()).isEqualByComparingTo("2100.00");
        assertThat(summary.balance()).isEqualByComparingTo("2900.00");
        // Maior gasto primeiro; meta estourada passa de 100%; sem meta, percentual nulo.
        assertThat(summary.expensesByCategory()).extracting(CategorySpending::name).containsExactly("Moradia", "Lazer");
        assertThat(summary.expensesByCategory().get(1).limitUsedPercent()).isEqualTo(125);
        assertThat(summary.expensesByCategory().get(0).limitUsedPercent()).isNull();
        assertThat(summary.incomesByCategory()).extracting(CategorySpending::name).containsExactly("Salário");
    }

    @Test
    void calendarioTemTodosOsDiasDoMes() {
        when(transactions.totalsByCategory(eq(USER), any(), any())).thenReturn(List.of());
        when(transactions.totalsByMonth(eq(USER), any(), any())).thenReturn(List.of());
        when(transactions.totalsByDay(USER, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28))).thenReturn(List.of(
                new DayTotal(LocalDate.of(2026, 2, 10), CategoryType.EXPENSE, new BigDecimal("80.00")),
                new DayTotal(LocalDate.of(2026, 2, 10), CategoryType.INCOME, new BigDecimal("200.00"))));

        List<DaySpending> daily = service.of(USER, YearMonth.of(2026, 2)).daily();

        assertThat(daily).hasSize(28);
        assertThat(daily.get(9).expense()).isEqualByComparingTo("80.00");
        assertThat(daily.get(9).income()).isEqualByComparingTo("200.00");
        assertThat(daily.get(0).expense()).isEqualByComparingTo("0");
    }

    @Test
    void evolucaoTemSempreSeisMesesComZeroNosMesesVazios() {
        when(transactions.totalsByCategory(eq(USER), any(), any())).thenReturn(List.of());
        when(transactions.totalsByMonth(USER, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 11, 30))).thenReturn(List.of(
                new MonthTotal(2026, 9, CategoryType.INCOME, new BigDecimal("5000.00")),
                new MonthTotal(2026, 11, CategoryType.EXPENSE, new BigDecimal("300.00"))));

        List<MonthTrend> trend = service.of(USER, NOV).trend();

        assertThat(trend).extracting(MonthTrend::month)
                .containsExactly(YearMonth.of(2026, 6), YearMonth.of(2026, 7), YearMonth.of(2026, 8),
                        YearMonth.of(2026, 9), YearMonth.of(2026, 10), NOV);
        assertThat(trend.get(3).income()).isEqualByComparingTo("5000.00");
        assertThat(trend.get(5).expense()).isEqualByComparingTo("300.00");
        assertThat(trend.get(0).income()).isEqualByComparingTo("0");
    }

    @Test
    void mesSemLancamentosTemSaldoZero() {
        when(transactions.totalsByCategory(eq(USER), any(), any())).thenReturn(List.of());
        when(transactions.totalsByMonth(eq(USER), any(), any())).thenReturn(List.of());

        MonthlySummary summary = service.of(USER, NOV);

        assertThat(summary.balance()).isEqualByComparingTo("0");
        assertThat(summary.expensesByCategory()).isEmpty();
    }

    private static CategoryTotal total(String name, CategoryType type, String limit, String total) {
        return new CategoryTotal(UUID.randomUUID(), name, type, "#000000", "sell",
                limit == null ? null : new BigDecimal(limit), new BigDecimal(total));
    }
}
