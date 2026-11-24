package io.github.joaovale23.fintrack.support;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/**
 * Guarda erros do front (WEB) e da API agrupados por "impressão digital": o mesmo erro só soma
 * ocorrências. Um erro já resolvido que volta a acontecer é reaberto.
 */
@Service
public class ErrorLog {

    private static final Logger log = LoggerFactory.getLogger(ErrorLog.class);
    /** Teto de erros abertos diferentes: protege o banco gratuito de uma enxurrada de mensagens únicas. */
    static final int MAX_OPEN = 300;

    private final JdbcClient jdbc;
    private final SupportNotifier notifier;

    ErrorLog(JdbcClient jdbc, SupportNotifier notifier) {
        this.jdbc = jdbc;
        this.notifier = notifier;
    }

    public void record(String source, String message, String detail, String page, String userAgent) {
        try {
            String msg = cut(blankTo(message, "(sem mensagem)"), 500);
            String fingerprint = fingerprint(source, msg, detail);
            boolean known = jdbc.sql("select count(*) from app_errors where fingerprint = :f").param("f", fingerprint)
                    .query(Long.class).single() > 0;
            if (!known && jdbc.sql("select count(*) from app_errors where not resolved").query(Long.class).single() >= MAX_OPEN) {
                return;
            }
            boolean inserted = jdbc.sql("""
                    insert into app_errors (id, fingerprint, source, message, detail, page, user_agent)
                    values (:id, :f, :source, :message, :detail, :page, :ua)
                    on conflict (fingerprint) do update
                       set occurrences = app_errors.occurrences + 1, last_seen = now(), resolved = false,
                           page = excluded.page, user_agent = excluded.user_agent
                    returning (xmax = 0)
                    """)
                    .param("id", UUID.randomUUID()).param("f", fingerprint).param("source", source)
                    .param("message", msg).param("detail", cut(detail, 4000))
                    .param("page", cut(page, 300)).param("ua", cut(userAgent, 300))
                    .query(Boolean.class).single();
            if (inserted) {
                notifier.newError(source, msg, page);
            }
        } catch (RuntimeException e) {
            log.warn("Não foi possível registrar o erro: {}", e.getMessage());
        }
    }

    /**
     * Números e nomes de arquivos com hash mudam a cada deploy ou registro; tirá-los agrupa o que é o mesmo erro.
     * Usa a mensagem e a primeira linha do detalhe (onde o erro aconteceu).
     */
    static String fingerprint(String source, String message, String detail) {
        // Primeira linha da pilha que diz onde o erro aconteceu ("at ..." no Java e no Chrome, "...@" no Firefox).
        String where = detail == null ? "" : detail.lines().map(String::strip)
                .filter(l -> l.startsWith("at ") || l.contains("@"))
                .findFirst().orElse("");
        String key = (source + "|" + message + "|" + where)
                .replaceAll("chunk-[A-Za-z0-9_-]+|main-[A-Za-z0-9]+", "chunk")
                .replaceAll("\\d+", "#");
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(key.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String cut(String text, int max) {
        if (text == null) return null;
        return text.length() <= max ? text : text.substring(0, max);
    }

    private static String blankTo(String text, String fallback) {
        return text == null || text.isBlank() ? fallback : text;
    }
}
