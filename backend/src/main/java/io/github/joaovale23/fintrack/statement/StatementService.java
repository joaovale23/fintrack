package io.github.joaovale23.fintrack.statement;

import io.github.joaovale23.fintrack.category.CategoryType;
import io.github.joaovale23.fintrack.transaction.TransactionRepository;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StatementService {

    static final int MAX_LINES = 500;

    private final List<StatementParser> parsers;
    private final TransactionRepository transactions;

    StatementService(List<StatementParser> parsers, TransactionRepository transactions) {
        this.parsers = parsers;
        this.transactions = transactions;
    }

    @Transactional(readOnly = true)
    public StatementPreview preview(UUID userId, String filename, byte[] bytes) {
        String content = decode(bytes);
        StatementParser parser = parsers.stream().filter(p -> p.supports(filename, content)).findFirst().orElseThrow();
        List<StatementLine> lines = parser.parse(content);
        if (lines.size() > MAX_LINES) {
            throw new InvalidStatementException("O extrato tem " + lines.size() + " lançamentos; importe no máximo " + MAX_LINES + " por vez.");
        }

        LocalDate from = lines.stream().map(StatementLine::date).min(Comparator.naturalOrder()).orElseThrow();
        LocalDate to = lines.stream().map(StatementLine::date).max(Comparator.naturalOrder()).orElseThrow();
        Set<String> existing = transactions.findByUserIdAndDateBetween(userId, from, to).stream()
                .map(t -> key(t.getDate(), t.getCategory().getType() == CategoryType.INCOME ? t.getAmount() : t.getAmount().negate(),
                        t.getDescription()))
                .collect(Collectors.toSet());

        var rows = lines.stream()
                .sorted(Comparator.comparing(StatementLine::date).reversed())
                .map(l -> new StatementPreview.Row(l.date(), l.description(), l.amount(), existing.contains(key(l.date(), l.amount(), l.description()))))
                .toList();
        return new StatementPreview(parser.format(), rows);
    }

    private static String key(LocalDate date, java.math.BigDecimal amount, String description) {
        return date + "|" + amount.stripTrailingZeros().toPlainString() + "|" + description.toLowerCase(Locale.ROOT).strip();
    }

    /** Bancos brasileiros ainda exportam em ISO-8859-1; tenta UTF-8 e, se não for, cai para Latin-1. */
    static String decode(byte[] bytes) {
        try {
            return StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes))
                    .toString()
                    .replace("﻿", "");
        } catch (CharacterCodingException e) {
            return new String(bytes, StandardCharsets.ISO_8859_1);
        }
    }
}
