package io.github.joaovale23.fintrack.common;

/** Recurso inexistente ou de outro usuário: nos dois casos a resposta é 404, para não revelar o que existe. */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
