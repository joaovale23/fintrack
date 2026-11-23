package io.github.joaovale23.fintrack.recurring;

import io.github.joaovale23.fintrack.category.Category;
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
import java.time.YearMonth;
import java.util.UUID;

/**
 * Conta que se repete todo mês. {@code lastGeneratedMonth} marca até onde ela já virou lançamento,
 * para a geração ser idempotente.
 */
@Entity
@Table(name = "recurring_bills")
public class RecurringBill {

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

    @Column(name = "day_of_month", nullable = false)
    private int dayOfMonth;

    /** Guardado como o primeiro dia do mês. */
    @Column(name = "start_month", nullable = false)
    private LocalDate startMonth;

    @Column(name = "last_generated_month")
    private LocalDate lastGeneratedMonth;

    @Column(nullable = false)
    private boolean active = true;

    protected RecurringBill() {}

    public RecurringBill(User user, Category category, String description, BigDecimal amount, int dayOfMonth, YearMonth startMonth) {
        this.user = user;
        update(category, description, amount, dayOfMonth, startMonth, true);
    }

    public final void update(Category category, String description, BigDecimal amount, int dayOfMonth, YearMonth startMonth, boolean active) {
        this.category = category;
        this.description = description.strip();
        this.amount = amount;
        this.dayOfMonth = dayOfMonth;
        this.active = active;
        // Mudar o início para antes do que já foi gerado não pode duplicar lançamentos.
        LocalDate start = startMonth.atDay(1);
        if (lastGeneratedMonth == null || start.isAfter(lastGeneratedMonth)) {
            this.startMonth = start;
        }
    }

    /** Data da conta num mês: dia 31 em fevereiro vira o último dia de fevereiro. */
    public LocalDate dateIn(YearMonth month) {
        return month.atDay(Math.min(dayOfMonth, month.lengthOfMonth()));
    }

    /** Primeiro mês que ainda não virou lançamento. */
    public YearMonth nextPendingMonth() {
        return lastGeneratedMonth == null ? YearMonth.from(startMonth) : YearMonth.from(lastGeneratedMonth).plusMonths(1);
    }

    public void pause() {
        this.active = false;
    }

    public void markGenerated(YearMonth month) {
        this.lastGeneratedMonth = month.atDay(1);
    }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public Category getCategory() { return category; }
    public String getDescription() { return description; }
    public BigDecimal getAmount() { return amount; }
    public int getDayOfMonth() { return dayOfMonth; }
    public YearMonth getStartMonth() { return YearMonth.from(startMonth); }
    public boolean isActive() { return active; }
}
