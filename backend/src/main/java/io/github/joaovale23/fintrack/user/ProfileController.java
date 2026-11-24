package io.github.joaovale23.fintrack.user;

import io.github.joaovale23.fintrack.admin.AdminAccess;
import io.github.joaovale23.fintrack.auth.AuthResponse;
import io.github.joaovale23.fintrack.common.NotFoundException;
import io.github.joaovale23.fintrack.config.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Dados do próprio usuário. Por enquanto, só a troca de avatar. */
@RestController
@RequestMapping("/api/me")
public class ProfileController {

    private final UserRepository users;
    private final AdminAccess admins;

    public ProfileController(UserRepository users, AdminAccess admins) {
        this.users = users;
        this.admins = admins;
    }

    public record AvatarRequest(String avatar) {}

    @GetMapping
    @Transactional(readOnly = true)
    AuthResponse.UserInfo me(@AuthenticationPrincipal Jwt jwt) {
        User user = find(jwt);
        return AuthResponse.UserInfo.from(user, admins.isAdmin(user));
    }

    /** {@code avatar} nulo volta para as iniciais. */
    @PutMapping("/avatar")
    @Transactional
    AuthResponse.UserInfo changeAvatar(@AuthenticationPrincipal Jwt jwt, @RequestBody AvatarRequest req) {
        if (req.avatar() != null && !Avatar.ALL.contains(req.avatar())) {
            throw new InvalidAvatarException();
        }
        User user = find(jwt);
        user.changeAvatar(req.avatar());
        return AuthResponse.UserInfo.from(user, admins.isAdmin(user));
    }

    private User find(Jwt jwt) {
        return users.findById(CurrentUser.id(jwt)).orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
    }

    static class InvalidAvatarException extends RuntimeException {}

    @ExceptionHandler(InvalidAvatarException.class)
    ProblemDetail invalidAvatar() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Avatar desconhecido");
    }
}
