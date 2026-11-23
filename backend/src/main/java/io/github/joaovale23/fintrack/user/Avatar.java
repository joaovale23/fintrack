package io.github.joaovale23.fintrack.user;

import java.util.Set;

/** Personagens que podem ser foto de perfil. Os desenhos ficam no front; a API só guarda o nome. */
public final class Avatar {

    public static final Set<String> ALL = Set.of("porquinho", "raposa", "coruja", "gato", "panda", "sapo", "coala", "lobo");

    private Avatar() {}
}
