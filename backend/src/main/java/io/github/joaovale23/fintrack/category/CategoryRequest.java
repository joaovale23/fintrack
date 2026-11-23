package io.github.joaovale23.fintrack.category;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CategoryRequest(
        @NotBlank(message = "Informe o nome") @Size(max = 40, message = "Use até 40 caracteres") String name,
        @NotNull(message = "Informe o tipo") CategoryType type,
        @NotNull(message = "Informe a cor") @Pattern(regexp = "#[0-9a-fA-F]{6}", message = "Use uma cor no formato #RRGGBB") String color,
        /** Opcional: sem ícone, a categoria usa o padrão. */
        @Pattern(regexp = "[a-z_]{1,40}", message = "Ícone inválido") String icon,
        @DecimalMin(value = "0.01", message = "A meta precisa ser maior que zero")
        @Digits(integer = 10, fraction = 2, message = "Valor inválido") BigDecimal monthlyLimit) {}
