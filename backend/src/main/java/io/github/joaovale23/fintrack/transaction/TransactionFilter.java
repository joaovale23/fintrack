package io.github.joaovale23.fintrack.transaction;

import io.github.joaovale23.fintrack.category.CategoryType;
import java.time.YearMonth;
import java.util.UUID;

public record TransactionFilter(YearMonth month, UUID categoryId, CategoryType type, String search) {}
