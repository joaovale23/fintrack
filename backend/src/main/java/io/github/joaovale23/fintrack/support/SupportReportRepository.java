package io.github.joaovale23.fintrack.support;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportReportRepository extends JpaRepository<SupportReport, UUID> {

    long countByUserIdAndCreatedAtAfter(UUID userId, Instant after);

    long countByResolvedFalse();

    List<SupportReport> findTop100ByOrderByCreatedAtDesc();

    List<SupportReport> findTop100ByResolvedFalseOrderByCreatedAtDesc();
}
