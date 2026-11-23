package io.github.joaovale23.fintrack.statement;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Uma linha do extrato. {@code amount} positivo é entrada; negativo é saída. */
public record StatementLine(LocalDate date, String description, BigDecimal amount) {}
