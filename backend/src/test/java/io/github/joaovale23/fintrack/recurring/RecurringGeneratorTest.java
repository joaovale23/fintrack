package io.github.joaovale23.fintrack.recurring;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import io.github.joaovale23.fintrack.category.Category;
import io.github.joaovale23.fintrack.category.CategoryType;
import io.github.joaovale23.fintrack.transaction.Transaction;
import io.github.joaovale23.fintrack.transaction.TransactionRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class RecurringGeneratorTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");
    private final TransactionRepository transactions = mock(TransactionRepository.class);

    private RecurringGenerator at(int year, int month, int day) {
        Clock clock = Clock.fixed(ZonedDateTime.of(year, month, day, 12, 0, 0, 0, SP).toInstant(), SP);
        return new RecurringGenerator(mock(RecurringBillRepository.class), transactions, clock);
    }

    private RecurringBill bill(int day, YearMonth start) {
        var category = new Category(null, "Moradia", CategoryType.EXPENSE, "#000000", "home", null);
        return new RecurringBill(null, category, "Aluguel", new BigDecimal("1600.00"), day, start);
    }

    @Test
    void lancaOsMesesPendentesAteHojeESoUmaVez() {
        var bill = bill(10, YearMonth.of(2026, 9));
        var generator = at(2026, 11, 23);

        assertThat(generator.generate(bill)).isEqualTo(3); // set, out, nov
        assertThat(generator.generate(bill)).isZero(); // idempotente
        assertThat(bill.nextPendingMonth()).isEqualTo(YearMonth.of(2026, 12));
    }

    @Test
    void naoLancaAntesDoDiaChegar() {
        var bill = bill(25, YearMonth.of(2026, 11));
        assertThat(at(2026, 11, 23).generate(bill)).isZero();
        assertThat(at(2026, 11, 25).generate(bill)).isEqualTo(1);
    }

    @Test
    void dia31EmFevereiroCaiNoUltimoDiaDoMes() {
        var bill = bill(31, YearMonth.of(2027, 2));
        at(2027, 2, 28).generate(bill);
        var captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactions, times(1)).save(captor.capture());
        assertThat(captor.getValue().getDate()).isEqualTo(LocalDate.of(2027, 2, 28));
        assertThat(captor.getValue().isRecurring()).isTrue();
    }

    @Test
    void contaPausadaNaoGeraNada() {
        var bill = bill(1, YearMonth.of(2026, 1));
        bill.pause();
        assertThat(at(2026, 11, 23).generate(bill)).isZero();
        verify(transactions, times(0)).save(any());
    }
}
