package io.github.joaovale23.fintrack.auth;

import io.github.joaovale23.fintrack.admin.AdminAccess;
import io.github.joaovale23.fintrack.config.FintrackProperties;
import io.github.joaovale23.fintrack.user.User;
import java.time.Clock;
import java.time.Instant;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

    private final JwtEncoder encoder;
    private final FintrackProperties props;
    private final Clock clock;
    private final AdminAccess admins;

    public TokenService(JwtEncoder encoder, FintrackProperties props, Clock clock, AdminAccess admins) {
        this.encoder = encoder;
        this.props = props;
        this.clock = clock;
        this.admins = admins;
    }

    public AuthResponse issue(User user) {
        Instant now = clock.instant();
        Instant expiresAt = now.plus(props.jwt().expiration());
        var claims = JwtClaimsSet.builder()
                .issuer("fintrack")
                .subject(user.getId().toString())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .claim("name", user.getName())
                // Separa visitantes de contas reais nas estatísticas de uso, sem consultar o banco.
                .claim("temp", user.isDemo())
                .build();
        var header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new AuthResponse(token, expiresAt,
                AuthResponse.UserInfo.from(user, admins.isAdmin(user)));
    }
}
