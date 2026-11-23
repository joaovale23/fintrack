package io.github.joaovale23.fintrack.auth;

import java.time.Instant;
import java.util.UUID;

public record AuthResponse(String token, Instant expiresAt, UserInfo user) {

    public record UserInfo(UUID id, String name, String email, boolean demo, String avatar) {

        public static UserInfo from(io.github.joaovale23.fintrack.user.User u) {
            return new UserInfo(u.getId(), u.getName(), u.getEmail(), u.isDemo(), u.getAvatar());
        }
    }
}
