package io.github.joaovale23.fintrack.summary;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Movimento de um dia do mês. Os dias sem lançamento vêm com zero, para o calendário ficar completo. */
public record DaySpending(LocalDate date, BigDecimal income, BigDecimal expense) {}
