package io.github.joaovale23.fintrack.admin;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Números de uso para o painel. Só contagens: o painel nunca mostra lançamentos nem valores de ninguém.
 * As contas de administrador ficam de fora, para os números mostrarem quem usa o app de verdade.
 */
@Service
public class AdminStats {

    static final int DAYS = 30;

    private final JdbcClient jdbc;
    private final AdminAccess admins;
    private final Clock clock;

    AdminStats(JdbcClient jdbc, AdminAccess admins, Clock clock) {
        this.jdbc = jdbc;
        this.admins = admins;
        this.clock = clock;
    }

    public record Day(LocalDate date, long active, long visitors, long signups) {}

    public record Overview(long realUsers, long newRealUsers7d, long activeToday, long active7d, long visitorsToday,
            long transactions7d, long openReports, long openErrors, List<Day> days) {}

    @Transactional(readOnly = true)
    public Overview overview() {
        LocalDate today = LocalDate.now(clock);
        // O driver do Postgres não aceita Instant direto; OffsetDateTime vira timestamptz.
        OffsetDateTime weekAgo = OffsetDateTime.ofInstant(clock.instant(), ZoneOffset.UTC).minusDays(7);
        List<UUID> excluded = adminIds();

        long realUsers = count("select count(*) from users where not demo and id not in (:ex)", excluded, null, null);
        long newReal = count("select count(*) from users where not demo and id not in (:ex) and created_at >= :since", excluded, "since", weekAgo);
        long activeToday = count("select count(*) from user_activity where not temporary and user_id not in (:ex) and day = :d", excluded, "d", today);
        long active7d = count("select count(distinct user_id) from user_activity where not temporary and user_id not in (:ex) and day > :d",
                excluded, "d", today.minusDays(7));
        long visitorsToday = count("select count(*) from user_activity where temporary and day = :d", excluded, "d", today);
        long tx7d = count("""
                select count(*) from transactions t join users u on u.id = t.user_id
                where not u.demo and u.id not in (:ex) and t.created_at >= :since""", excluded, "since", weekAgo);
        long openReports = jdbc.sql("select count(*) from support_reports where not resolved").query(Long.class).single();
        long openErrors = jdbc.sql("select count(*) from app_errors where not resolved").query(Long.class).single();

        LocalDate from = today.minusDays(DAYS - 1);
        List<Day> days = jdbc.sql("""
                select d::date as day,
                       (select count(*) from user_activity a where a.day = d::date and not a.temporary and a.user_id not in (:ex)) as active,
                       (select count(*) from user_activity a where a.day = d::date and a.temporary) as visitors,
                       (select count(*) from users u where not u.demo and u.id not in (:ex)
                           and (u.created_at at time zone 'America/Sao_Paulo')::date = d::date) as signups
                from generate_series(cast(:from as date), cast(:to as date), interval '1 day') d
                order by d""")
                .param("ex", excluded).param("from", from).param("to", today)
                .query((rs, i) -> new Day(rs.getObject("day", LocalDate.class), rs.getLong("active"), rs.getLong("visitors"), rs.getLong("signups")))
                .list();

        return new Overview(realUsers, newReal, activeToday, active7d, visitorsToday, tx7d, openReports, openErrors, days);
    }

    private long count(String sql, List<UUID> excluded, String name, Object value) {
        var spec = jdbc.sql(sql).param("ex", excluded);
        if (name != null) spec = spec.param(name, value);
        return spec.query(Long.class).single();
    }

    /** "not in ()" vazio não é SQL válido: sem administradores, usa um id que não existe. */
    private List<UUID> adminIds() {
        List<UUID> ids = new ArrayList<>();
        if (!admins.emails().isEmpty()) {
            ids.addAll(jdbc.sql("select id from users where lower(email) in (:emails)")
                    .param("emails", List.copyOf(admins.emails())).query(UUID.class).list());
        }
        if (ids.isEmpty()) ids.add(new UUID(0, 0));
        return ids;
    }
}
