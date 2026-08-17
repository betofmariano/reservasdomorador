import type { Jogo, JogoJogador, JogoParticipante } from '@/types/jogo';
import { normalizeRecordId } from '@/utils/normalize-api-fields';
import {
  readPersonName,
  readPersonPhoto,
  readString,
} from '@/utils/normalize-api-fields';

function normalizeJogador(raw: unknown): JogoJogador | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const nome = readPersonName(record);

  if (!nome) {
    return null;
  }

  const telefone = readString(record, ['telefone']);

  return {
    nome,
    email: readString(record, ['email']),
    telefone: telefone || undefined,
    foto: readPersonPhoto(record),
  };
}

export function normalizeJogoFromApi(raw: Jogo): Jogo {
  const record = raw as Jogo & Record<string, unknown>;
  const usersId = normalizeRecordId(record.users_id);

  return {
    ...raw,
    users_id: usersId ?? undefined,
    responsavel: normalizeJogador(raw.responsavel) ?? raw.responsavel,
    adversario: normalizeJogador(raw.adversario) ?? raw.adversario,
    parceiro1: normalizeJogador(raw.parceiro1) ?? raw.parceiro1,
    parceiro2: normalizeJogador(raw.parceiro2) ?? raw.parceiro2,
  };
}

export function mapJogadorToParticipante(
  jogador: JogoJogador | null | undefined,
): JogoParticipante | null {
  if (!jogador?.nome?.trim()) {
    return null;
  }

  return {
    nome: jogador.nome.trim(),
    foto: jogador.foto,
  };
}
