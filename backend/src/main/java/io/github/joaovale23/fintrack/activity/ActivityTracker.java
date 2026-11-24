package io.github.joaovale23.fintrack.activity;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Marca que a pessoa usou o app hoje (uma linha por pessoa por dia). É o que alimenta o painel de uso.
 * Guarda em memória quem já foi marcado no dia, para não ir ao banco a cada requisição.
 */
@Component
class ActivityTracker implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(ActivityTracker.class);
    private static final int MAX_REMEMBERED = 20_000;

    private final JdbcClient jdbc;
    private final Clock clock;
    private final Set<String> markedToday = ConcurrentHashMap.newKeySet();

    ActivityTracker(JdbcClient jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (SecurityContextHolder.getContext().getAuthentication() instanceof JwtAuthenticationToken token) {
            mark(UUID.fromString(token.getToken().getSubject()), Boolean.TRUE.equals(token.getToken().getClaimAsBoolean("temp")));
        }
        return true;
    }

    void mark(UUID userId, boolean temporary) {
        LocalDate today = LocalDate.now(clock);
        if (markedToday.size() > MAX_REMEMBERED) {
            markedToday.clear();
        }
        if (!markedToday.add(today + "|" + userId)) {
            return;
        }
        try {
            jdbc.sql("insert into user_activity (day, user_id, temporary) values (:day, :user, :temp) on conflict do nothing")
                    .param("day", today).param("user", userId).param("temp", temporary)
                    .update();
        } catch (RuntimeException e) {
            // Estatística nunca derruba a requisição de quem está usando o app.
            markedToday.remove(today + "|" + userId);
            log.warn("Não foi possível registrar a atividade: {}", e.getMessage());
        }
    }
}
