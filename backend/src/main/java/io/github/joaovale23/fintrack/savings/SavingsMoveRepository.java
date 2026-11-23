package io.github.joaovale23.fintrack.savings;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavingsMoveRepository extends JpaRepository<SavingsMove, UUID> {

    List<SavingsMove> findTop5ByGoalIdOrderByDateDescIdDesc(UUID goalId);
}
