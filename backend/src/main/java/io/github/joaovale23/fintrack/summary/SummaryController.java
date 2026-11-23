package io.github.joaovale23.fintrack.summary;

import io.github.joaovale23.fintrack.config.CurrentUser;
import io.github.joaovale23.fintrack.recurring.RecurringGenerator;
import java.time.Clock;
import java.time.YearMonth;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/summary")
public class SummaryController {

    private final SummaryService service;
    private final RecurringGenerator recurring;
    private final Clock clock;

    public SummaryController(SummaryService service, RecurringGenerator recurring, Clock clock) {
        this.service = service;
        this.recurring = recurring;
        this.clock = clock;
    }

    /** Sem o parâmetro {@code month}, usa o mês atual. */
    @GetMapping
    MonthlySummary get(@AuthenticationPrincipal Jwt jwt, @RequestParam(required = false) YearMonth month) {
        // O servidor gratuito dorme: lança aqui as contas recorrentes que venceram enquanto ele estava parado.
        recurring.generateDue(CurrentUser.id(jwt));
        return service.of(CurrentUser.id(jwt), month != null ? month : YearMonth.now(clock));
    }
}
