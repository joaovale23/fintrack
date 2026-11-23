package io.github.joaovale23.fintrack.transaction;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionRequest(
        @NotBlank(message = "Informe a descrição") @Size(max = 120, message = "Use até 120 caracteres") String description,
        @NotNull(message = "Informe o valor") @DecimalMin(value = "0.01", message = "O valor precisa ser maior que zero")
        @Digits(integer = 10, fraction = 2, message = "Use no máximo duas casas decimais") BigDecimal amount,
        @NotNull(message = "Informe a data") LocalDate date,
        @NotNull(message = "Escolha a categoria") UUID categoryId) {}
