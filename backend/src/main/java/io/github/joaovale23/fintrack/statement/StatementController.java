package io.github.joaovale23.fintrack.statement;

import io.github.joaovale23.fintrack.config.CurrentUser;
import java.io.IOException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Lê um extrato (CSV ou OFX) e devolve uma prévia; nada é gravado aqui. A gravação é em /api/transactions/batch. */
@RestController
@RequestMapping("/api/statements")
public class StatementController {

    private final StatementService service;

    public StatementController(StatementService service) {
        this.service = service;
    }

    @PostMapping("/preview")
    StatementPreview preview(@AuthenticationPrincipal Jwt jwt, @RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new InvalidStatementException("Escolha um arquivo de extrato.");
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        return service.preview(CurrentUser.id(jwt), name, file.getBytes());
    }
}
