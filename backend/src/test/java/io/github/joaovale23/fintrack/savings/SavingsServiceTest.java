package io.github.joaovale23.fintrack.savings;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class SavingsServiceTest {

    /** "Hoje" é 23/11/2026. */
    private final Clock clock = Clock.fixed(ZonedDateTime.of(2026, 11, 23, 12, 0, 0, 0, ZoneId.of("America/Sao_Paulo")).toInstant(),
            ZoneId.of("America/Sao_Paulo"));
    private final SavingsService service = new SavingsService(Mockito.mock(SavingsRepository.class),
            Mockito.mock(SavingsMoveRepository.class), null, clock);

    private SavingsGoal goal(String target, LocalDate deadline) {
        return new SavingsGoal(null, "Viagem", "flight", "#000000", new BigDecimal(target), deadline);
    }

    @Test
    void divideOQueFaltaPelosMesesAteOPrazoContandoOMesAtual() {
        // nov, dez, jan, fev, mar, abr = 6 meses; faltam 6000 - 1200 = 4800
        assertThat(service.monthlyNeeded(goal("6000.00", LocalDate.of(2027, 4, 30)), new BigDecimal("1200.00")))
                .isEqualByComparingTo("800.00");
    }

    @Test
    void semPrazoOuComObjetivoAtingidoNaoHaValorMensal() {
        assertThat(service.monthlyNeeded(goal("6000.00", null), BigDecimal.ZERO)).isNull();
        assertThat(service.monthlyNeeded(goal("6000.00", LocalDate.of(2027, 4, 30)), new BigDecimal("6000.00"))).isNull();
    }

    @Test
    void prazoVencidoCobraTudoNoMesAtual() {
        assertThat(service.monthlyNeeded(goal("1000.00", LocalDate.of(2026, 8, 1)), new BigDecimal("400.00")))
                .isEqualByComparingTo("600.00");
    }
}
