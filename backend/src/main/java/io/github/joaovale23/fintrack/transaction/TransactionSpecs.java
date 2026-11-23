package io.github.joaovale23.fintrack.transaction;

import io.github.joaovale23.fintrack.category.CategoryType;
import java.time.YearMonth;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

/** Filtros combináveis da listagem: cada um só entra na consulta se o parâmetro vier preenchido. */
final class TransactionSpecs {

    private TransactionSpecs() {}

    static Specification<Transaction> of(UUID userId, TransactionFilter f) {
        Specification<Transaction> spec = (root, q, cb) -> cb.equal(root.get("user").get("id"), userId);
        if (f.month() != null) spec = spec.and(inMonth(f.month()));
        if (f.categoryId() != null) spec = spec.and((root, q, cb) -> cb.equal(root.get("category").get("id"), f.categoryId()));
        if (f.type() != null) spec = spec.and(ofType(f.type()));
        if (f.search() != null && !f.search().isBlank()) {
            String like = "%" + f.search().strip().toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("description")), like));
        }
        return spec;
    }

    private static Specification<Transaction> inMonth(YearMonth month) {
        return (root, q, cb) -> cb.between(root.get("date"), month.atDay(1), month.atEndOfMonth());
    }

    private static Specification<Transaction> ofType(CategoryType type) {
        return (root, q, cb) -> cb.equal(root.get("category").get("type"), type);
    }
}
