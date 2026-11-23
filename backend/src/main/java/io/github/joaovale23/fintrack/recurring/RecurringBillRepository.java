package io.github.joaovale23.fintrack.recurring;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecurringBillRepository extends JpaRepository<RecurringBill, UUID> {

    @EntityGraph(attributePaths = "category")
    List<RecurringBill> findByUserIdOrderByDayOfMonthAsc(UUID userId);

    @EntityGraph(attributePaths = "category")
    Optional<RecurringBill> findByIdAndUserId(UUID id, UUID userId);

    @EntityGraph(attributePaths = { "category", "user" })
    List<RecurringBill> findByActiveTrue();

    @EntityGraph(attributePaths = { "category", "user" })
    List<RecurringBill> findByUserIdAndActiveTrue(UUID userId);

    boolean existsByCategoryId(UUID categoryId);
}
