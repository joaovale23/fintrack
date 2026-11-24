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

    /**
     * Conta de visitante: usa o app de verdade sem e-mail nem senha. Começa vazia, só com as categorias
     * iniciais, como uma conta nova. Some depois de 24 horas.
     */
    @Transactional
    public AuthResponse guest() {
        User user = temporaryUser("Visitante");
        starterCategories.createFor(user);
        return tokens.issue(user);
    }

    /** Demonstração: conta temporária já com seis meses de dados de exemplo, para ver o app funcionando. */
    @Transactional
    public AuthResponse demo() {
        User user = temporaryUser("Demonstração");
        demoData.fill(user, starterCategories.createFor(user), LocalDate.now(clock));
        return tokens.issue(user);
    }

    private User temporaryUser(String name) {
        String id = UUID.randomUUID().toString();
        // Senha aleatória que ninguém conhece: a conta só é acessível pelo token devolvido aqui.
        return users.save(new User(name, "visitante-" + id + "@demo.fintrack",
                passwordEncoder.encode(UUID.randomUUID().toString()), true));
    }

    private static String normalize(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }
}
