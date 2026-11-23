package io.github.joaovale23.fintrack.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    /** Conta de visitante, criada pelo botão "Entrar como visitante" e apagada depois de um tempo. */
    @Column(nullable = false)
    private boolean demo;

    /** Um dos personagens do app (ver {@link Avatar}); nulo mostra as iniciais. */
    private String avatar;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected User() {}

    public User(String name, String email, String passwordHash, boolean demo) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.demo = demo;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public boolean isDemo() { return demo; }
    public Instant getCreatedAt() { return createdAt; }
    public String getAvatar() { return avatar; }

    public void changeAvatar(String avatar) {
        this.avatar = avatar;
    }
}
