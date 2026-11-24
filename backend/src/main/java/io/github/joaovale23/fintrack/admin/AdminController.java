package io.github.joaovale23.fintrack.admin;

import io.github.joaovale23.fintrack.common.NotFoundException;
import io.github.joaovale23.fintrack.config.CurrentUser;
import io.github.joaovale23.fintrack.support.SupportReport;
import io.github.joaovale23.fintrack.support.SupportReportRepository;
import io.github.joaovale23.fintrack.user.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Painel do dono do app: uso, relatos e erros. Só para as contas listadas em ADMIN_EMAILS. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository users;
    private final AdminAccess admins;
    private final AdminStats stats;
    private final SupportReportRepository reports;
    private final JdbcClient jdbc;

    AdminController(UserRepository users, AdminAccess admins, AdminStats stats, SupportReportRepository reports, JdbcClient jdbc) {
        this.users = users;
        this.admins = admins;
        this.stats = stats;
        this.reports = reports;
        this.jdbc = jdbc;
    }

    public record ReportView(UUID id, String userName, String kind, String message, String contactEmail, String page,
            String userAgent, boolean resolved, Instant createdAt) {

        static ReportView from(SupportReport r) {
            return new ReportView(r.getId(), r.getUserName(), r.getKind().name(), r.getMessage(), r.getContactEmail(),
                    r.getPage(), r.getUserAgent(), r.isResolved(), r.getCreatedAt());
        }
    }

    public record ErrorView(UUID id, String source, String message, String detail, String page, String userAgent,
            int occurrences, boolean resolved, Instant firstSeen, Instant lastSeen) {}

    public record ResolveRequest(boolean resolved) {}

    @GetMapping("/overview")
    AdminStats.Overview overview(@AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return stats.overview();
    }

    @GetMapping("/reports")
    @Transactional(readOnly = true)
    List<ReportView> reports(@AuthenticationPrincipal Jwt jwt, @RequestParam(defaultValue = "true") boolean open) {
        requireAdmin(jwt);
        var list = open ? reports.findTop100ByResolvedFalseOrderByCreatedAtDesc() : reports.findTop100ByOrderByCreatedAtDesc();
        return list.stream().map(ReportView::from).toList();
    }

    @PutMapping("/reports/{id}")
    @Transactional
    ReportView resolveReport(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @RequestBody ResolveRequest req) {
        requireAdmin(jwt);
        SupportReport report = reports.findById(id).orElseThrow(() -> new NotFoundException("Relato não encontrado"));
        report.markResolved(req.resolved());
        return ReportView.from(report);
    }

    @GetMapping("/errors")
    List<ErrorView> errors(@AuthenticationPrincipal Jwt jwt, @RequestParam(defaultValue = "true") boolean open) {
        requireAdmin(jwt);
        return jdbc.sql("""
                select id, source, message, detail, page, user_agent, occurrences, resolved, first_seen, last_seen
                from app_errors where (not :open or not resolved) order by last_seen desc limit 100""")
                .param("open", open)
                .query((rs, i) -> new ErrorView(rs.getObject("id", UUID.class), rs.getString("source"), rs.getString("message"),
                        rs.getString("detail"), rs.getString("page"), rs.getString("user_agent"), rs.getInt("occurrences"),
                        rs.getBoolean("resolved"), rs.getTimestamp("first_seen").toInstant(), rs.getTimestamp("last_seen").toInstant()))
                .list();
    }

    @PutMapping("/errors/{id}")
    void resolveError(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @RequestBody ResolveRequest req) {
        requireAdmin(jwt);
        int updated = jdbc.sql("update app_errors set resolved = :r where id = :id").param("r", req.resolved()).param("id", id).update();
        if (updated == 0) throw new NotFoundException("Erro não encontrado");
    }

    private void requireAdmin(Jwt jwt) {
        boolean admin = users.findById(CurrentUser.id(jwt)).map(admins::isAdmin).orElse(false);
        if (!admin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Área restrita");
        }
    }
}
