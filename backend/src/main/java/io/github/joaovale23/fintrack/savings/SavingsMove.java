package io.github.joaovale23.fintrack.savings;

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

/** Dinheiro que entrou (valor positivo) ou saiu (negativo) de um cofrinho. */
@Entity
@Table(name = "savings_moves")
public class SavingsMove {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "goal_id")
    private SavingsGoal goal;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate date;

    protected SavingsMove() {}

    public SavingsMove(SavingsGoal goal, BigDecimal amount, LocalDate date) {
        this.goal = goal;
        this.amount = amount;
        this.date = date;
    }

    public UUID getId() { return id; }
    public SavingsGoal getGoal() { return goal; }
    public BigDecimal getAmount() { return amount; }
    public LocalDate getDate() { return date; }
}
