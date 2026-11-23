package io.github.joaovale23.fintrack.statement;

import java.util.Locale;

/** Deixa as descrições dos bancos ("PIX ENVIADO   PADARIA SAO JOSE") mais legíveis. */
final class StatementText {

    private StatementText() {}

    static String clean(String raw) {
        String text = raw.replace('"', ' ').replaceAll("\\s+", " ").strip();
        if (text.length() > 120) text = text.substring(0, 120).strip();
        // Bancos costumam mandar tudo em maiúsculas: vira "Pix enviado padaria sao jose".
        if (text.equals(text.toUpperCase(Locale.ROOT)) && text.chars().anyMatch(Character::isLetter)) {
            text = text.toLowerCase(Locale.ROOT);
            text = Character.toUpperCase(text.charAt(0)) + text.substring(1);
        }
        return text.isEmpty() ? "Lançamento importado" : text;
    }
}
