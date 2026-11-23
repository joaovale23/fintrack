package io.github.joaovale23.fintrack.transaction;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Vários lançamentos de uma vez (importação de extrato). Ou entram todos, ou nenhum. */
public record TransactionBatchRequest(
        @NotEmpty(message = "Nenhum lançamento enviado") @Size(max = 500, message = "No máximo 500 lançamentos por vez")
        List<@Valid TransactionRequest> items) {}
