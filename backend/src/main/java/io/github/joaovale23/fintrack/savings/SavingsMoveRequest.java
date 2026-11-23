package io.github.joaovale23.fintrack.savings;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/** Guardar ou resgatar: o valor é sempre positivo, quem diz a direção é o {@code kind}. */
public record SavingsMoveRequest(
        @NotNull(message = "Informe o valor") @DecimalMin(value = "0.01", message = "O valor precisa ser maior que zero")
        @Digits(integer = 10, fraction = 2, message = "Valor inválido") BigDecimal amount,
        @NotNull(message = "Diga se é para guardar ou resgatar") Kind kind) {

    public enum Kind { DEPOSIT, WITHDRAW }
}
