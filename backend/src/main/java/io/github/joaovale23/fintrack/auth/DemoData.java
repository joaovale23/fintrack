package io.github.joaovale23.fintrack.auth;

import io.github.joaovale23.fintrack.category.Category;
import io.github.joaovale23.fintrack.recurring.RecurringBill;
import io.github.joaovale23.fintrack.recurring.RecurringBillRepository;
import io.github.joaovale23.fintrack.savings.SavingsGoal;
import io.github.joaovale23.fintrack.savings.SavingsMove;
import io.github.joaovale23.fintrack.savings.SavingsMoveRepository;
import io.github.joaovale23.fintrack.savings.SavingsRepository;
import io.github.joaovale23.fintrack.transaction.Transaction;
import io.github.joaovale23.fintrack.transaction.TransactionRepository;
import io.github.joaovale23.fintrack.user.User;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.random.RandomGenerator;
import java.util.SplittableRandom;
import org.springframework.stereotype.Component;

/**
 * Gera seis meses de lançamentos plausíveis para a conta de demonstração, sempre relativos à data de hoje,
 * para que o painel nunca apareça vazio nem com dados "velhos".
 */
@Component
class DemoData {

    private final TransactionRepository transactions;
    private final SavingsRepository savings;
    private final SavingsMoveRepository savingsMoves;
    private final RecurringBillRepository bills;

    DemoData(TransactionRepository transactions, SavingsRepository savings, SavingsMoveRepository savingsMoves,
            RecurringBillRepository bills) {
        this.transactions = transactions;
        this.savings = savings;
        this.savingsMoves = savingsMoves;
        this.bills = bills;
    }

    void fill(User user, Map<String, Category> c, LocalDate today) {
        // Semente fixa: toda demonstração conta a mesma história, o que facilita uma demonstração.
        // SplittableRandom fica no java.base: existe em qualquer imagem, inclusive em JREs enxutos.
        RandomGenerator rnd = new SplittableRandom(42);
        List<Transaction> list = new ArrayList<>();
        YearMonth current = YearMonth.from(today);
        YearMonth first = current.minusMonths(5);
        // Contas fixas: os lançamentos delas nascem ligados à conta recorrente, como aconteceria de verdade.
        var salary = bills.save(new RecurringBill(user, c.get("Salário"), "Salário", new BigDecimal("5200.00"), 5, first));
        var rent = bills.save(new RecurringBill(user, c.get("Moradia"), "Aluguel", new BigDecimal("1600.00"), 10, first));
        var internet = bills.save(new RecurringBill(user, c.get("Moradia"), "Internet", new BigDecimal("99.90"), 20, first));
        var course = bills.save(new RecurringBill(user, c.get("Educação"), "Curso online", new BigDecimal("89.90"), 8, first));
        for (int back = 5; back >= 0; back--) {
            YearMonth m = current.minusMonths(back);
            list.add(fixed(salary, m));
            if (rnd.nextInt(3) > 0) add(list, user, c.get("Freelance"), "Projeto freelance", money(rnd, 400, 1500), day(m, rnd));
            list.add(fixed(rent, m));
            add(list, user, c.get("Moradia"), "Conta de luz", money(rnd, 120, 220), m.atDay(15));
            list.add(fixed(internet, m));
            list.add(fixed(course, m));
            for (int i = 0; i < 4; i++) add(list, user, c.get("Alimentação"), "Mercado", money(rnd, 180, 420), day(m, rnd));
            for (int i = 0; i < 3; i++) add(list, user, c.get("Alimentação"), "Restaurante", money(rnd, 40, 130), day(m, rnd));
            for (int i = 0; i < 5; i++) add(list, user, c.get("Transporte"), i % 2 == 0 ? "Combustível" : "Aplicativo de transporte", money(rnd, 30, 190), day(m, rnd));
            for (int i = 0; i < 2 + rnd.nextInt(3); i++) add(list, user, c.get("Lazer"), "Cinema e passeios", money(rnd, 40, 180), day(m, rnd));
            if (rnd.nextBoolean()) add(list, user, c.get("Saúde"), "Farmácia", money(rnd, 30, 160), day(m, rnd));
        }
        transactions.saveAll(list.stream().filter(t -> !t.getDate().isAfter(today)).toList());
        // Marca até onde cada conta já foi lançada; as datas futuras ficam para o gerador automático.
        for (var bill : List.of(salary, rent, internet, course)) {
            bill.markGenerated(bill.dateIn(current).isAfter(today) ? current.minusMonths(1) : current);
        }
        fillSavings(user, current);
    }

    /** Dois cofrinhos: um com prazo (viagem) e uma reserva sem prazo, com depósitos nos últimos meses. */
    private void fillSavings(User user, YearMonth current) {
        var trip = savings.save(new SavingsGoal(user, "Viagem para o Chile", "flight", "#2d8fd5", new BigDecimal("6000.00"),
                current.plusMonths(7).atEndOfMonth()));
        var reserve = savings.save(new SavingsGoal(user, "Reserva de emergência", "savings", "#1f8a5b", new BigDecimal("15000.00"), null));
        List<SavingsMove> moves = new ArrayList<>();
        for (int back = 5; back >= 0; back--) {
            YearMonth m = current.minusMonths(back);
            moves.add(new SavingsMove(trip, new BigDecimal(back == 2 ? "250.00" : "400.00"), m.atDay(6)));
            moves.add(new SavingsMove(reserve, new BigDecimal("800.00"), m.atDay(6)));
        }
        moves.add(new SavingsMove(trip, new BigDecimal("-150.00"), current.minusMonths(1).atDay(20)));
        savingsMoves.saveAll(moves);
    }

    private static Transaction fixed(RecurringBill bill, YearMonth month) {
        return new Transaction(bill.getUser(), bill.getCategory(), bill.getDescription(), bill.getAmount(), bill.dateIn(month), bill);
    }

    private static void add(List<Transaction> list, User user, Category category, String description, String amount, LocalDate date) {
        list.add(new Transaction(user, category, description, new BigDecimal(amount), date));
    }

    private static String money(RandomGenerator rnd, int min, int max) {
        return BigDecimal.valueOf(rnd.nextDouble(min, max)).setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private static LocalDate day(YearMonth m, RandomGenerator rnd) {
        return m.atDay(1 + rnd.nextInt(m.lengthOfMonth()));
    }
}
