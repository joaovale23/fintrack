package io.github.joaovale23.fintrack.config;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Configurações próprias da aplicação, lidas do application.yml (prefixo "fintrack"). */
@ConfigurationProperties("fintrack")
public record FintrackProperties(Jwt jwt, Cors cors, Demo demo) {

    /** O segredo assina os tokens com HMAC-SHA256 e precisa ter pelo menos 32 bytes. */
    public record Jwt(String secret, Duration expiration) {}

    public record Cors(List<String> allowedOrigins) {}

    /** Contas temporárias (visitante e demonstração): apagadas depois de {@code ttl}. */
    public record Demo(Duration ttl) {}
}
