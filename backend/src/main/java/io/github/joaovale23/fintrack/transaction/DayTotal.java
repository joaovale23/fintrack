package io.github.joaovale23.fintrack.transaction;

import io.github.joaovale23.fintrack.category.CategoryType;
import java.math.BigDecimal;
import java.time.LocalDate;

public record DayTotal(LocalDate date, CategoryType type, BigDecimal total) {}
