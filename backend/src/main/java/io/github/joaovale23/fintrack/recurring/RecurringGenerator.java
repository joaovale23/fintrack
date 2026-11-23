package io.github.joaovale23.fintrack.recurring;

import io.github.joaovale23.fintrack.transaction.Transaction;
import io.github.joaovale23.fintrack.transaction.TransactionRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Transforma contas recorrentes em lançamentos quando a data chega.
 * Roda de hora em hora e também sob demanda (o plano gratuito do Render dorme, então a API
 * gera o que estiver vencido quando o usuário abre o painel ou a lista de contas).
 */
@Component
public class RecurringGenerator {

    private static final Logger log = LoggerFactory.getLogger(RecurringGenerator.class);

    private final RecurringBillRepository bills;
    private final TransactionRepository transactions;
    private final Clock clock;

    public RecurringGenerator(RecurringBillRepository bills, TransactionRepository transactions, Clock clock) {
        this.bills = bills;
        this.transactions = transactions;
        this.clock = clock;
    }

    @Scheduled(cron = "0 5 * * * *", zone = "America/Sao_Paulo")
    @Transactional
    public void generateAll() {
        int created = bills.findByActiveTrue().stream().mapToInt(this::generate).sum();
        if (created > 0) log.info("{} lançamentos recorrentes criados", created);
    }

    @Transactional
    public void generateDue(UUID userId) {
        bills.findByUserIdAndActiveTrue(userId).forEach(this::generate);
    }

    /**
     * Lança todos os meses pendentes cuja data já chegou. Idempotente: não repete um mês já lançado.
     * @return quantos lançamentos foram criados
     */
    @Transactional
    public int generate(RecurringBill bill) {
        if (!bill.isActive()) return 0;
        LocalDate today = LocalDate.now(clock);
        int created = 0;
        for (YearMonth month = bill.nextPendingMonth(); !month.isAfter(YearMonth.from(today)); month = month.plusMonths(1)) {
            LocalDate date = bill.dateIn(month);
            if (date.isAfter(today)) break;
            if (!transactions.existsByRecurringIdAndDate(bill.getId(), date)) {
                transactions.save(new Transaction(bill.getUser(), bill.getCategory(), bill.getDescription(), bill.getAmount(), date, bill));
                created++;
            }
            bill.markGenerated(month);
        }
        return created;
    }
}
