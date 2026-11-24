package io.github.joaovale23.fintrack.admin;

import io.github.joaovale23.fintrack.config.FintrackProperties;
import io.github.joaovale23.fintrack.user.User;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/** Quem é administrador: as contas reais cujo e-mail está em {@code fintrack.admin.emails} (variável ADMIN_EMAILS). */
@Component
public class AdminAccess {

    private final Set<String> emails;

    AdminAccess(FintrackProperties props) {
        List<String> configured = Optional.ofNullable(props.admin()).map(FintrackProperties.Admin::emails).orElse(List.of());
        this.emails = configured.stream()
                .map(e -> e.strip().toLowerCase(Locale.ROOT))
                .filter(e -> !e.isBlank())
                .collect(Collectors.toUnmodifiableSet());
    }

    public boolean isAdmin(User user) {
        return !user.isDemo() && emails.contains(user.getEmail().toLowerCase(Locale.ROOT));
    }

    public Set<String> emails() {
        return emails;
    }
}
