package io.github.joaovale23.fintrack.savings;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingsGoalRequest(
        @NotBlank(message = "Dê um nome para o cofrinho") @Size(max = 60, message = "Use até 60 caracteres") String name,
        @Pattern(regexp = "[a-z_]{1,40}", message = "Ícone inválido") String icon,
        @NotNull(message = "Informe a cor") @Pattern(regexp = "#[0-9a-fA-F]{6}", message = "Use uma cor no formato #RRGGBB") String color,
        @NotNull(message = "Informe quanto quer juntar") @DecimalMin(value = "0.01", message = "O objetivo precisa ser maior que zero")
        @Digits(integer = 10, fraction = 2, message = "Valor inválido") BigDecimal target,
        LocalDate deadline) {}
