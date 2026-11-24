package io.github.joaovale23.fintrack.support;

public enum ReportKind {
    BUG("Problema"),
    IDEA("Sugestão"),
    OTHER("Outro");

    private final String label;

    ReportKind(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
