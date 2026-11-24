package io.github.joaovale23.fintrack.auth;

import io.github.joaovale23.fintrack.config.FintrackProperties;
import io.github.joaovale23.fintrack.user.UserRepository;
import java.time.Clock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Apaga as contas temporárias (visitante e demonstração) antigas, para o banco gratuito não crescer sem limite. */
@Component
class DemoCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(DemoCleanupJob.class);

    private final UserRepository users;
    private final FintrackProperties props;
    private final Clock clock;

    DemoCleanupJob(UserRepository users, FintrackProperties props, Clock clock) {
        this.users = users;
        this.props = props;
        this.clock = clock;
    }

    @Scheduled(fixedDelayString = "PT1H", initialDelayString = "PT1M")
    @Transactional
    void deleteExpiredDemoUsers() {
        int deleted = users.deleteDemoUsersCreatedBefore(clock.instant().minus(props.demo().ttl()));
        if (deleted > 0) {
            log.info("{} contas temporárias expiradas foram apagadas", deleted);
        }
    }
}
