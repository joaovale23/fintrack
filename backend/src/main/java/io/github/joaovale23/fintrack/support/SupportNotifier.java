package io.github.joaovale23.fintrack.support;

import io.github.joaovale23.fintrack.admin.AdminAccess;
import io.github.joaovale23.fintrack.config.FintrackProperties;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * Avisa os administradores por e-mail: a cada relato e a cada erro novo (a primeira vez que ele aparece).
 * Sem SMTP configurado (local e testes), só registra no log. O envio roda numa thread virtual,
 * para quem relatou não esperar o servidor de e-mail.
 */
@Component
class SupportNotifier {

    private static final Logger log = LoggerFactory.getLogger(SupportNotifier.class);

    private final ObjectProvider<JavaMailSender> mail;
    private final AdminAccess admins;
    private final String from;
    private final String panelUrl;

    SupportNotifier(ObjectProvider<JavaMailSender> mail, AdminAccess admins, FintrackProperties props) {
        this.mail = mail;
        this.admins = admins;
        var support = Optional.ofNullable(props.support());
        this.from = support.map(FintrackProperties.Support::from).orElse("");
        this.panelUrl = support.map(FintrackProperties.Support::panelUrl).orElse("");
    }

    void newReport(SupportReport report) {
        String subject = "[fintrack] %s: %s".formatted(report.getKind().label(), shorten(report.getMessage(), 60));
        String body = """
                %s relatou pelo app:

                %s

                ---
                Responder para: %s
                Página: %s
                Navegador: %s
                Painel: %s
                """.formatted(report.getUserName(), report.getMessage(),
                Optional.ofNullable(report.getContactEmail()).orElse("(não informou)"),
                report.getPage(), report.getUserAgent(), panelUrl);
        send(subject, body, report.getContactEmail());
    }

    void newError(String source, String message, String page) {
        String subject = "[fintrack] Erro novo no %s: %s".formatted(source.equals("WEB") ? "site" : "servidor", shorten(message, 60));
        String body = """
                Um erro apareceu pela primeira vez:

                %s

                ---
                Página: %s
                Painel: %s
                """.formatted(message, page, panelUrl);
        send(subject, body, null);
    }

    private void send(String subject, String body, String replyTo) {
        JavaMailSender sender = mail.getIfAvailable();
        if (sender == null || from.isBlank() || admins.emails().isEmpty()) {
            log.info("Aviso por e-mail desligado (sem SMTP configurado): {}", subject);
            return;
        }
        Thread.startVirtualThread(() -> {
            try {
                var email = new SimpleMailMessage();
                email.setFrom(from);
                email.setTo(admins.emails().toArray(String[]::new));
                if (replyTo != null && !replyTo.isBlank()) {
                    email.setReplyTo(replyTo);
                }
                email.setSubject(subject);
                email.setText(body);
                sender.send(email);
            } catch (RuntimeException e) {
                log.warn("Falha ao enviar o aviso por e-mail: {}", e.getMessage());
            }
        });
    }

    private static String shorten(String text, int max) {
        String oneLine = text.replaceAll("\\s+", " ").strip();
        return oneLine.length() <= max ? oneLine : oneLine.substring(0, max - 1) + "…";
    }
}
