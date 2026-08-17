import type { Jogo, JogoParticipante, JogoParticipantesView } from '@/types/jogo';
import { mapJogadorToParticipante } from '@/utils/normalize-jogo';

function collectParticipantes(
  jogadores: Array<Jogo['responsavel'] | undefined>,
): JogoParticipante[] {
  return jogadores
    .map((jogador) => mapJogadorToParticipante(jogador))
    .filter((jogador): jogador is JogoParticipante => jogador !== null);
}

export function buildJogoParticipantesView(jogo: Jogo): JogoParticipantesView {
  if (jogo.jogoDuplas) {
    return {
      tipo: 'duplas',
      dupla1: collectParticipantes([jogo.responsavel, jogo.parceiro1]),
      dupla2: collectParticipantes([jogo.adversario, jogo.parceiro2]),
    };
  }

  return {
    tipo: 'simples',
    dupla1: collectParticipantes([jogo.responsavel]),
    dupla2: collectParticipantes([jogo.adversario]),
  };
}
