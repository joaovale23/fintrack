package io.github.joaovale23.fintrack.summary;

import java.math.BigDecimal;
import java.time.YearMonth;

public record MonthTrend(YearMonth month, BigDecimal income, BigDecimal expense) {}
