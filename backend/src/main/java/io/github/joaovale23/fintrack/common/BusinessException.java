package io.github.joaovale23.fintrack.common;

/** Regra de negócio violada: vira 409 (conflito) na API. */
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
