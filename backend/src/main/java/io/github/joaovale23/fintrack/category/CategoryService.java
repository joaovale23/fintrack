package io.github.joaovale23.fintrack.category;

import io.github.joaovale23.fintrack.common.BusinessException;
import io.github.joaovale23.fintrack.common.NotFoundException;
import io.github.joaovale23.fintrack.recurring.RecurringBillRepository;
import io.github.joaovale23.fintrack.transaction.TransactionRepository;
import io.github.joaovale23.fintrack.user.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

    private final CategoryRepository categories;
    private final TransactionRepository transactions;
    private final UserRepository users;

    private final RecurringBillRepository recurring;

    public CategoryService(CategoryRepository categories, TransactionRepository transactions, UserRepository users,
            RecurringBillRepository recurring) {
        this.categories = categories;
        this.transactions = transactions;
        this.users = users;
        this.recurring = recurring;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list(UUID userId) {
        return categories.findByUserIdOrderByTypeAscNameAsc(userId).stream().map(CategoryResponse::from).toList();
    }

    @Transactional
    public CategoryResponse create(UUID userId, CategoryRequest req) {
        if (categories.existsByUserIdAndNameIgnoreCase(userId, req.name().strip())) {
            throw new BusinessException("Já existe uma categoria com esse nome");
        }
        var category = new Category(users.getReferenceById(userId), req.name(), req.type(), req.color(), req.icon(), req.monthlyLimit());
        return CategoryResponse.from(categories.save(category));
    }

    @Transactional
    public CategoryResponse update(UUID userId, UUID id, CategoryRequest req) {
        var category = find(userId, id);
        if (categories.existsByUserIdAndNameIgnoreCaseAndIdNot(userId, req.name().strip(), id)) {
            throw new BusinessException("Já existe uma categoria com esse nome");
        }
        if (category.getType() != req.type() && transactions.existsByCategoryId(id)) {
            throw new BusinessException("Não dá para trocar o tipo de uma categoria que já tem lançamentos");
        }
        category.update(req.name(), req.type(), req.color(), req.icon(), req.monthlyLimit());
        return CategoryResponse.from(category);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        var category = find(userId, id);
        if (transactions.existsByCategoryId(id)) {
            throw new BusinessException("Essa categoria tem lançamentos. Mova ou apague os lançamentos antes.");
        }
        if (recurring.existsByCategoryId(id)) {
            throw new BusinessException("Essa categoria é usada por uma conta recorrente. Apague ou mude a conta antes.");
        }
        categories.delete(category);
    }

    /** Busca sempre filtrando pelo dono: a categoria de outro usuário "não existe". */
    public Category find(UUID userId, UUID id) {
        return categories.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Categoria não encontrada"));
    }
}
