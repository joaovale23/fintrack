package io.github.joaovale23.fintrack.transaction;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

    @EntityGraph(attributePaths = "category")
    Optional<Transaction> findByIdAndUserId(UUID id, UUID userId);

    /** Traz a categoria na mesma consulta da listagem, evitando o problema N+1. */
    @Override
    @EntityGraph(attributePaths = "category")
    Page<Transaction> findAll(Specification<Transaction> spec, Pageable pageable);

    boolean existsByCategoryId(UUID categoryId);

    boolean existsByRecurringIdAndDate(UUID recurringId, LocalDate date);

    /** Lançamentos de um período, para detectar duplicados na importação de extrato. */
    List<Transaction> findByUserIdAndDateBetween(UUID userId, LocalDate from, LocalDate to);

    /** Total por categoria num intervalo de datas: uma linha por categoria com lançamento. */
    @Query("""
            select new io.github.joaovale23.fintrack.transaction.CategoryTotal(
                c.id, c.name, c.type, c.color, c.icon, c.monthlyLimit, sum(t.amount))
            from Transaction t join t.category c
            where t.user.id = :userId and t.date between :from and :to
            group by c.id, c.name, c.type, c.color, c.icon, c.monthlyLimit
            """)
    List<CategoryTotal> totalsByCategory(UUID userId, LocalDate from, LocalDate to);

    /** Total por dia e tipo, para o calendário de gastos do mês. */
    @Query("""
            select new io.github.joaovale23.fintrack.transaction.DayTotal(t.date, c.type, sum(t.amount))
            from Transaction t join t.category c
            where t.user.id = :userId and t.date between :from and :to
            group by t.date, c.type
            """)
    List<DayTotal> totalsByDay(UUID userId, LocalDate from, LocalDate to);

    /** Total por mês e tipo, para o gráfico de evolução. */
    @Query("""
            select new io.github.joaovale23.fintrack.transaction.MonthTotal(
                extract(year from t.date), extract(month from t.date), c.type, sum(t.amount))
            from Transaction t join t.category c
            where t.user.id = :userId and t.date between :from and :to
            group by extract(year from t.date), extract(month from t.date), c.type
            """)
    List<MonthTotal> totalsByMonth(UUID userId, LocalDate from, LocalDate to);

}
