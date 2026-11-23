package io.github.joaovale23.fintrack.transaction;

import io.github.joaovale23.fintrack.category.Category;
import io.github.joaovale23.fintrack.recurring.RecurringBill;
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
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Um lançamento. Se é receita ou despesa, quem diz é a categoria. */
@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate date;

    /** Conta recorrente que gerou este lançamento (nulo se foi lançado à mão). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recurring_id")
    private RecurringBill recurring;

    /** Preenchido pelo banco; desempata a ordem dos lançamentos do mesmo dia (o mais recente primeiro). */
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    protected Transaction() {}

    public Transaction(User user, Category category, String description, BigDecimal amount, LocalDate date) {
        this(user, category, description, amount, date, null);
    }

    public Transaction(User user, Category category, String description, BigDecimal amount, LocalDate date, RecurringBill recurring) {
        this.user = user;
        this.recurring = recurring;
        update(category, description, amount, date);
    }

    public final void update(Category category, String description, BigDecimal amount, LocalDate date) {
        this.category = category;
        this.description = description.strip();
        this.amount = amount;
        this.date = date;
    }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public Category getCategory() { return category; }
    public String getDescription() { return description; }
    public BigDecimal getAmount() { return amount; }
    public LocalDate getDate() { return date; }
    public boolean isRecurring() { return recurring != null; }
}
