package io.github.joaovale23.fintrack.savings;

import io.github.joaovale23.fintrack.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Um cofrinho: quanto se quer juntar, para quando (opcional) e com que cara. */
@Entity
@Table(name = "savings_goals")
public class SavingsGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String icon;

    @Column(nullable = false)
    private String color;

    @Column(nullable = false)
    private BigDecimal target;

    private LocalDate deadline;

    protected SavingsGoal() {}

    public SavingsGoal(User user, String name, String icon, String color, BigDecimal target, LocalDate deadline) {
        this.user = user;
        update(name, icon, color, target, deadline);
    }

    public final void update(String name, String icon, String color, BigDecimal target, LocalDate deadline) {
        this.name = name.strip();
        this.icon = icon == null || icon.isBlank() ? "savings" : icon;
        this.color = color;
        this.target = target;
        this.deadline = deadline;
    }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public String getName() { return name; }
    public String getIcon() { return icon; }
    public String getColor() { return color; }
    public BigDecimal getTarget() { return target; }
    public LocalDate getDeadline() { return deadline; }
}
