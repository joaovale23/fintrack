package io.github.joaovale23.fintrack.auth;

import io.github.joaovale23.fintrack.common.BusinessException;
import io.github.joaovale23.fintrack.user.User;
import io.github.joaovale23.fintrack.user.UserRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokens;
    private final StarterCategories starterCategories;
    private final DemoData demoData;
    private final Clock clock;

    AuthService(UserRepository users, PasswordEncoder passwordEncoder, TokenService tokens,
            StarterCategories starterCategories, DemoData demoData, Clock clock) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.tokens = tokens;
        this.starterCategories = starterCategories;
        this.demoData = demoData;
        this.clock = clock;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = normalize(req.email());
        if (users.existsByEmail(email)) {
            throw new BusinessException("Esse e-mail já tem conta");
        }
        User user = users.save(new User(req.name().strip(), email, passwordEncoder.encode(req.password()), false));
        starterCategories.createFor(user);
        return tokens.issue(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        return users.findByEmail(normalize(req.email()))
                .filter(u -> !u.isDemo())
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .map(tokens::issue)
                .orElseThrow(InvalidCredentialsException::new);
    }

    /** Conta descartável com dados de exemplo: quem visita o portfólio entra sem se cadastrar. */
    @Transactional
    public AuthResponse demo() {
        String id = UUID.randomUUID().toString();
        // Senha aleatória que ninguém conhece: a conta só é acessível pelo token devolvido aqui.
        User user = users.save(new User("Visitante", "visitante-" + id + "@demo.fintrack",
                passwordEncoder.encode(UUID.randomUUID().toString()), true));
        demoData.fill(user, starterCategories.createFor(user), LocalDate.now(clock));
        return tokens.issue(user);
    }

    private static String normalize(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }
}
