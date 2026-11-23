package io.github.joaovale23.fintrack.transaction;

import io.github.joaovale23.fintrack.category.CategoryType;
import io.github.joaovale23.fintrack.common.PageResponse;
import io.github.joaovale23.fintrack.config.CurrentUser;
import jakarta.validation.Valid;
import java.time.YearMonth;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService service;

    public TransactionController(TransactionService service) {
        this.service = service;
    }

    @GetMapping
    PageResponse<TransactionResponse> list(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) YearMonth month,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) CategoryType type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.list(CurrentUser.id(jwt), new TransactionFilter(month, categoryId, type, search), page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    TransactionResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody TransactionRequest req) {
        return service.create(CurrentUser.id(jwt), req);
    }

    @PostMapping("/batch")
    @ResponseStatus(HttpStatus.CREATED)
    Map<String, Integer> createAll(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody TransactionBatchRequest req) {
        return Map.of("created", service.createAll(CurrentUser.id(jwt), req));
    }

    @PutMapping("/{id}")
    TransactionResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @Valid @RequestBody TransactionRequest req) {
        return service.update(CurrentUser.id(jwt), id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        service.delete(CurrentUser.id(jwt), id);
    }
}
