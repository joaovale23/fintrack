package io.github.joaovale23.fintrack.support;

import io.github.joaovale23.fintrack.common.NotFoundException;
import io.github.joaovale23.fintrack.config.CurrentUser;
import io.github.joaovale23.fintrack.user.User;
import io.github.joaovale23.fintrack.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Clock;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Canal de suporte: relatos de quem usa o app e erros que o próprio front captura. */
@RestController
public class SupportController {

    /** Limite por pessoa, contra cliques repetidos e abuso. */
    static final int MAX_REPORTS_PER_HOUR = 5;

    private final SupportReportRepository reports;
    private final UserRepository users;
    private final SupportNotifier notifier;
    private final ErrorLog errors;
    private final Clock clock;

    SupportController(SupportReportRepository reports, UserRepository users, SupportNotifier notifier, ErrorLog errors, Clock clock) {
        this.reports = reports;
        this.users = users;
        this.notifier = notifier;
        this.errors = errors;
        this.clock = clock;
    }

    public record ReportRequest(
            @NotNull(message = "Escolha o tipo") ReportKind kind,
            @NotBlank(message = "Conte o que aconteceu") @Size(max = 2000, message = "Use até 2000 caracteres") String message,
            @Email(message = "E-mail inválido") @Size(max = 160) String contactEmail,
            @Size(max = 300) String page) {}

    public record ClientError(String message, String detail, String page) {}

    @PostMapping("/api/support")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    Map<String, UUID> report(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ReportRequest req,
            @RequestHeader(value = "User-Agent", required = false) String userAgent) {
        User user = users.findById(CurrentUser.id(jwt)).orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        if (reports.countByUserIdAndCreatedAtAfter(user.getId(), clock.instant().minus(Duration.ofHours(1))) >= MAX_REPORTS_PER_HOUR) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Você já enviou vários relatos agora há pouco. Tente de novo mais tarde.");
        }
        // Conta real: dá para responder no e-mail da conta, se a pessoa não informar outro.
        String contact = blank(req.contactEmail()) ? (user.isDemo() ? null : user.getEmail()) : req.contactEmail().strip();
        String agent = userAgent == null ? null : userAgent.substring(0, Math.min(userAgent.length(), 300));
        SupportReport saved = reports.save(new SupportReport(user.getId(), user.getName(), req.kind(),
                req.message().strip(), contact, req.page(), agent));
        notifier.newReport(saved);
        return Map.of("id", saved.getId());
    }

    /** Aberto (sem login), para registrar também erros da tela de entrada. Sempre responde 202. */
    @PostMapping("/api/errors")
    @ResponseStatus(HttpStatus.ACCEPTED)
    void clientError(@RequestBody ClientError error, @RequestHeader(value = "User-Agent", required = false) String userAgent) {
        errors.record("WEB", error.message(), error.detail(), error.page(), userAgent);
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }
}
