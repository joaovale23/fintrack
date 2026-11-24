package io.github.joaovale23.fintrack.support;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Um relato enviado pelo botão "Relatar problema". */
@Entity
@Table(name = "support_reports")
public class SupportReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "user_name", nullable = false)
    private String userName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportKind kind;

    @Column(nullable = false)
    private String message;

    @Column(name = "contact_email")
    private String contactEmail;

    private String page;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(nullable = false)
    private boolean resolved;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected SupportReport() {}

    SupportReport(UUID userId, String userName, ReportKind kind, String message, String contactEmail, String page, String userAgent) {
        this.userId = userId;
        this.userName = userName;
        this.kind = kind;
        this.message = message;
        this.contactEmail = contactEmail;
        this.page = page;
        this.userAgent = userAgent;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getUserName() { return userName; }
    public ReportKind getKind() { return kind; }
    public String getMessage() { return message; }
    public String getContactEmail() { return contactEmail; }
    public String getPage() { return page; }
    public String getUserAgent() { return userAgent; }
    public boolean isResolved() { return resolved; }
    public Instant getCreatedAt() { return createdAt; }

    public void markResolved(boolean resolved) {
        this.resolved = resolved;
    }
}
