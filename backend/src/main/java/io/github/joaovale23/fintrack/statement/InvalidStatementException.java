package io.github.joaovale23.fintrack.statement;

/** Arquivo que não dá para ler como extrato: vira 422 com a explicação. */
public class InvalidStatementException extends RuntimeException {
    public InvalidStatementException(String message) {
        super(message);
    }
}
