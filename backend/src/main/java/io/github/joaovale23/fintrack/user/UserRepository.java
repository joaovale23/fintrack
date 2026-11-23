package io.github.joaovale23.fintrack.user;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /** Categorias e lançamentos saem junto, pelo ON DELETE CASCADE do banco. */
    @Modifying
    @Query("delete from User u where u.demo = true and u.createdAt < :before")
    int deleteDemoUsersCreatedBefore(Instant before);
}
