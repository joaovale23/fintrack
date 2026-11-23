package io.github.joaovale23.fintrack.recurring;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.UUID;

public record RecurringBillRequest(
        @NotBlank(message = "Informe a descrição") @Size(max = 120, message = "Use até 120 caracteres") String description,
        @NotNull(message = "Informe o valor") @DecimalMin(value = "0.01", message = "O valor precisa ser maior que zero")
        @Digits(integer = 10, fraction = 2, message = "Use no máximo duas casas decimais") BigDecimal amount,
        @NotNull(message = "Escolha a categoria") UUID categoryId,
        @NotNull(message = "Escolha o dia") @Min(value = 1, message = "Dia entre 1 e 31") @Max(value = 31, message = "Dia entre 1 e 31") Integer dayOfMonth,
        /** Mês da primeira cobrança; sem valor, começa no mês atual. */
        YearMonth startMonth,
        /** Sem valor, a conta fica ativa. */
        Boolean active) {}
