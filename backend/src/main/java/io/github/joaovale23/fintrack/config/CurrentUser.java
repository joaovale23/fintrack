package io.github.joaovale23.fintrack.config;

import java.util.UUID;
import org.springframework.security.oauth2.jwt.Jwt;

/** O "subject" do token é o id do usuário: é dele que saem todos os filtros por dono. */
public final class CurrentUser {

    private CurrentUser() {}

    public static UUID id(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
