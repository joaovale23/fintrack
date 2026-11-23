package io.github.joaovale23.fintrack.auth;

import io.github.joaovale23.fintrack.category.Category;
import io.github.joaovale23.fintrack.category.CategoryRepository;
import io.github.joaovale23.fintrack.category.CategoryType;
import io.github.joaovale23.fintrack.user.User;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/** Categorias com que toda conta nova começa, para a pessoa já poder lançar sem configurar nada. */
@Component
class StarterCategories {

    private record Starter(String name, CategoryType type, String color, String icon, BigDecimal limit) {}

    private static final List<Starter> STARTERS = List.of(
            new Starter("Salário", CategoryType.INCOME, "#1f8a5b", "payments", null),
            new Starter("Freelance", CategoryType.INCOME, "#3aa6a0", "laptop_mac", null),
            new Starter("Moradia", CategoryType.EXPENSE, "#6c5ce7", "home", null),
            new Starter("Alimentação", CategoryType.EXPENSE, "#f08a24", "restaurant", new BigDecimal("1500.00")),
            new Starter("Transporte", CategoryType.EXPENSE, "#2d8fd5", "directions_car", new BigDecimal("600.00")),
            new Starter("Lazer", CategoryType.EXPENSE, "#e0457b", "celebration", new BigDecimal("400.00")),
            new Starter("Saúde", CategoryType.EXPENSE, "#d64545", "favorite", null),
            new Starter("Educação", CategoryType.EXPENSE, "#a0703c", "school", null));

    private final CategoryRepository categories;

    StarterCategories(CategoryRepository categories) {
        this.categories = categories;
    }

    /** Cria as categorias iniciais e devolve um mapa nome → categoria. */
    Map<String, Category> createFor(User user) {
        Map<String, Category> byName = new LinkedHashMap<>();
        for (Starter s : STARTERS) {
            byName.put(s.name(), categories.save(new Category(user, s.name(), s.type(), s.color(), s.icon(), s.limit())));
        }
        return byName;
    }
}
