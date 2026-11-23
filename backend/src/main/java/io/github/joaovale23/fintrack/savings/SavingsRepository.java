package io.github.joaovale23.fintrack.savings;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SavingsRepository extends JpaRepository<SavingsGoal, UUID> {

    List<SavingsGoal> findByUserIdOrderByNameAsc(UUID userId);

    Optional<SavingsGoal> findByIdAndUserId(UUID id, UUID userId);

    /** Saldo de cada cofrinho do usuário numa consulta só: [goalId, total]. */
    @Query("""
            select m.goal.id, sum(m.amount) from SavingsMove m
            where m.goal.user.id = :userId
            group by m.goal.id
            """)
    List<Object[]> savedByGoal(UUID userId);

    @Query("select coalesce(sum(m.amount), 0) from SavingsMove m where m.goal.id = :goalId")
    BigDecimal savedIn(UUID goalId);
}
