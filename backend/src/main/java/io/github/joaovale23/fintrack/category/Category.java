package io.github.joaovale23.fintrack.category;

import io.github.joaovale23.fintrack.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "categories")
public class Category {

    public static final String DEFAULT_ICON = "sell";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoryType type;

    @Column(nullable = false)
    private String color;

    /** Nome de um ícone do Material Symbols (ex.: "restaurant"). */
    @Column(nullable = false)
    private String icon;

    /** Teto de gastos por mês. Só faz sentido em despesas; nulo quando não há meta. */
    @Column(name = "monthly_limit")
    private BigDecimal monthlyLimit;

    protected Category() {}

    public Category(User user, String name, CategoryType type, String color, String icon, BigDecimal monthlyLimit) {
        this.user = user;
        update(name, type, color, icon, monthlyLimit);
    }

    public final void update(String name, CategoryType type, String color, String icon, BigDecimal monthlyLimit) {
        this.name = name.strip();
        this.type = type;
        this.color = color;
        this.icon = icon == null || icon.isBlank() ? DEFAULT_ICON : icon;
        this.monthlyLimit = type == CategoryType.EXPENSE ? monthlyLimit : null;
    }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public String getName() { return name; }
    public CategoryType getType() { return type; }
    public String getColor() { return color; }
    public String getIcon() { return icon; }
    public BigDecimal getMonthlyLimit() { return monthlyLimit; }
}
