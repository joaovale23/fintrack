package io.github.joaovale23.fintrack.transaction;

import io.github.joaovale23.fintrack.category.CategoryService;
import io.github.joaovale23.fintrack.common.NotFoundException;
import io.github.joaovale23.fintrack.common.PageResponse;
import io.github.joaovale23.fintrack.user.UserRepository;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransactionService {

    static final int MAX_PAGE_SIZE = 100;

    private final TransactionRepository transactions;
    private final CategoryService categories;
    private final UserRepository users;

    public TransactionService(TransactionRepository transactions, CategoryService categories, UserRepository users) {
        this.transactions = transactions;
        this.categories = categories;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public PageResponse<TransactionResponse> list(UUID userId, TransactionFilter filter, int page, int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE),
                Sort.by(Sort.Order.desc("date"), Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        return PageResponse.of(transactions.findAll(TransactionSpecs.of(userId, filter), pageable), TransactionResponse::from);
    }

    @Transactional
    public TransactionResponse create(UUID userId, TransactionRequest req) {
        var category = categories.find(userId, req.categoryId());
        var transaction = new Transaction(users.getReferenceById(userId), category, req.description(), req.amount(), req.date());
        return TransactionResponse.from(transactions.save(transaction));
    }

    /** Grava tudo numa transação só: se uma categoria não for do usuário, nada é gravado. */
    @Transactional
    public int createAll(UUID userId, TransactionBatchRequest req) {
        var user = users.getReferenceById(userId);
        var list = req.items().stream()
                .map(r -> new Transaction(user, categories.find(userId, r.categoryId()), r.description(), r.amount(), r.date()))
                .toList();
        transactions.saveAll(list);
        return list.size();
    }

    @Transactional
    public TransactionResponse update(UUID userId, UUID id, TransactionRequest req) {
        var transaction = find(userId, id);
        transaction.update(categories.find(userId, req.categoryId()), req.description(), req.amount(), req.date());
        return TransactionResponse.from(transaction);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        transactions.delete(find(userId, id));
    }

    private Transaction find(UUID userId, UUID id) {
        return transactions.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Lançamento não encontrado"));
    }
}
