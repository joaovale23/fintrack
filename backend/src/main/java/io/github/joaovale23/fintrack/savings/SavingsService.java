package io.github.joaovale23.fintrack.savings;

import io.github.joaovale23.fintrack.common.BusinessException;
import io.github.joaovale23.fintrack.common.NotFoundException;
import io.github.joaovale23.fintrack.user.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SavingsService {

    private final SavingsRepository goals;
    private final SavingsMoveRepository moves;
    private final UserRepository users;
    private final Clock clock;

    public SavingsService(SavingsRepository goals, SavingsMoveRepository moves, UserRepository users, Clock clock) {
        this.goals = goals;
        this.moves = moves;
        this.users = users;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<SavingsGoalResponse> list(UUID userId) {
        Map<UUID, BigDecimal> saved = goals.savedByGoal(userId).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (BigDecimal) row[1]));
        return goals.findByUserIdOrderByNameAsc(userId).stream()
                .map(g -> toResponse(g, saved.getOrDefault(g.getId(), BigDecimal.ZERO)))
                .toList();
    }

    @Transactional
    public SavingsGoalResponse create(UUID userId, SavingsGoalRequest req) {
        var goal = goals.save(new SavingsGoal(users.getReferenceById(userId), req.name(), req.icon(), req.color(), req.target(), req.deadline()));
        return toResponse(goal, BigDecimal.ZERO);
    }

    @Transactional
    public SavingsGoalResponse update(UUID userId, UUID id, SavingsGoalRequest req) {
        var goal = find(userId, id);
        goal.update(req.name(), req.icon(), req.color(), req.target(), req.deadline());
        return toResponse(goal, goals.savedIn(id));
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        goals.delete(find(userId, id));
    }

    /** Guarda ou resgata. Não dá para resgatar mais do que o cofrinho tem. */
    @Transactional
    public SavingsGoalResponse move(UUID userId, UUID id, SavingsMoveRequest req) {
        var goal = find(userId, id);
        BigDecimal saved = goals.savedIn(id);
        BigDecimal amount = req.amount();
        if (req.kind() == SavingsMoveRequest.Kind.WITHDRAW) {
            if (amount.compareTo(saved) > 0) {
                throw new BusinessException("O cofrinho só tem " + brl(saved) + " para resgatar");
            }
            amount = amount.negate();
        }
        moves.save(new SavingsMove(goal, amount, LocalDate.now(clock)));
        return toResponse(goal, saved.add(amount));
    }

    private SavingsGoal find(UUID userId, UUID id) {
        return goals.findByIdAndUserId(id, userId).orElseThrow(() -> new NotFoundException("Cofrinho não encontrado"));
    }

    SavingsGoalResponse toResponse(SavingsGoal g, BigDecimal saved) {
        int percent = saved.multiply(BigDecimal.valueOf(100)).divide(g.getTarget(), 0, RoundingMode.DOWN).intValue();
        var recent = g.getId() == null ? List.<SavingsGoalResponse.Move>of()
                : moves.findTop5ByGoalIdOrderByDateDescIdDesc(g.getId()).stream()
                        .map(m -> new SavingsGoalResponse.Move(m.getId(), m.getAmount(), m.getDate()))
                        .toList();
        return new SavingsGoalResponse(g.getId(), g.getName(), g.getIcon(), g.getColor(), g.getTarget(), g.getDeadline(),
                saved, percent, monthlyNeeded(g, saved), recent);
    }

    /** Falta dividido pelos meses até o prazo, contando o mês atual. */
    BigDecimal monthlyNeeded(SavingsGoal g, BigDecimal saved) {
        BigDecimal missing = g.getTarget().subtract(saved);
        if (g.getDeadline() == null || missing.signum() <= 0) return null;
        long months = Math.max(1, ChronoUnit.MONTHS.between(YearMonth.now(clock), YearMonth.from(g.getDeadline())) + 1);
        return missing.divide(BigDecimal.valueOf(months), 2, RoundingMode.UP);
    }

    private static String brl(BigDecimal value) {
        return "R$ " + String.format(java.util.Locale.of("pt", "BR"), "%,.2f", value);
    }
}
