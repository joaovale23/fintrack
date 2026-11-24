package io.github.joaovale23.fintrack.auth;

import java.time.Instant;
import java.util.UUID;

public record AuthResponse(String token, Instant expiresAt, UserInfo user) {

    /** {@code admin} libera o painel de administração no front. */
    public record UserInfo(UUID id, String name, String email, boolean demo, String avatar, boolean admin, boolean onboarded) {

        public static UserInfo from(io.github.joaovale23.fintrack.user.User u, boolean admin) {
            return new UserInfo(u.getId(), u.getName(), u.getEmail(), u.isDemo(), u.getAvatar(), admin, u.isOnboarded());
        }
    }
}
