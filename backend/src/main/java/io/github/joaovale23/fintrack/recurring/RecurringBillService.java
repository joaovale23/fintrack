package io.github.joaovale23.fintrack.recurring;

import io.github.joaovale23.fintrack.category.CategoryService;
import io.github.joaovale23.fintrack.common.NotFoundException;
import io.github.joaovale23.fintrack.user.UserRepository;
import java.time.Clock;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecurringBillService {

    private final RecurringBillRepository bills;
    private final CategoryService categories;
    private final UserRepository users;
    private final RecurringGenerator generator;
    private final Clock clock;

    public RecurringBillService(RecurringBillRepository bills, CategoryService categories, UserRepository users,
            RecurringGenerator generator, Clock clock) {
        this.bills = bills;
        this.categories = categories;
        this.users = users;
        this.generator = generator;
        this.clock = clock;
    }

    /** Lista as contas já com as cobranças vencidas lançadas, ordenadas pela próxima data. */
    @Transactional
    public List<RecurringBillResponse> list(UUID userId) {
        generator.generateDue(userId);
        return bills.findByUserIdOrderByDayOfMonthAsc(userId).stream()
                .map(RecurringBillResponse::from)
                .sorted(Comparator.comparing(RecurringBillResponse::nextDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    @Transactional
    public RecurringBillResponse create(UUID userId, RecurringBillRequest req) {
        var bill = new RecurringBill(users.getReferenceById(userId), categories.find(userId, req.categoryId()), req.description(),
                req.amount(), req.dayOfMonth(), start(req));
        if (Boolean.FALSE.equals(req.active())) bill.pause();
        bills.save(bill);
        generator.generate(bill);
        return RecurringBillResponse.from(bill);
    }

    @Transactional
    public RecurringBillResponse update(UUID userId, UUID id, RecurringBillRequest req) {
        var bill = find(userId, id);
        bill.update(categories.find(userId, req.categoryId()), req.description(), req.amount(), req.dayOfMonth(), start(req),
                !Boolean.FALSE.equals(req.active()));
        generator.generate(bill);
        return RecurringBillResponse.from(bill);
    }

    /** Para de repetir. Os lançamentos que ela já gerou continuam no histórico. */
    @Transactional
    public void delete(UUID userId, UUID id) {
        bills.delete(find(userId, id));
    }

    private RecurringBill find(UUID userId, UUID id) {
        return bills.findByIdAndUserId(id, userId).orElseThrow(() -> new NotFoundException("Conta recorrente não encontrada"));
    }

    private YearMonth start(RecurringBillRequest req) {
        return req.startMonth() != null ? req.startMonth() : YearMonth.now(clock);
    }
}
