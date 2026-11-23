package io.github.joaovale23.fintrack.statement;

import java.util.List;

/** Um formato de extrato (CSV, OFX...). Cada formato decide se reconhece o conteúdo. */
public interface StatementParser {

    String format();

    boolean supports(String filename, String content);

    List<StatementLine> parse(String content);
}
