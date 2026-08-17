import type { Jogo } from '@/types/jogo';
import type { ReservaSummary } from '@/types/home-summary';
import type { User } from '@/types/user';

export function canCancelReservaWithinLimite(
  reserva: Pick<ReservaSummary, 'limiteCancelamento' | 'dataAtividade'>,
  referenceDate: Date = new Date(),
): boolean {
  // Sem prazo na API (ou valor inválido): permite cancelar — comum em MensalPorSemana.
  if (!reserva.limiteCancelamento) {
    return true;
  }

  if (!isPlausibleLimiteCancelamento(reserva.limiteCancelamento, reserva.dataAtividade)) {
    return true;
  }

  return referenceDate.getTime() < reserva.limiteCancelamento;
}

const MIN_VALID_LIMITE_CANCELAMENTO_MS = Date.UTC(2000, 0, 1);

function isPlausibleLimiteCancelamento(
  limiteCancelamento: number,
  dataAtividade: number,
): boolean {
  if (limiteCancelamento < MIN_VALID_LIMITE_CANCELAMENTO_MS) {
    return false;
  }

  if (dataAtividade > 0 && limiteCancelamento > dataAtividade + 24 * 60 * 60 * 1000) {
    return false;
  }

  return true;
}

/** Reservas carregadas via GET /reservasUsuario/{users_id} pertencem ao usuário autenticado. */
export function canCancelReservaUsuarioList(
  reserva: Pick<ReservaSummary, 'limiteCancelamento' | 'dataAtividade'>,
  referenceDate?: Date,
): boolean {
  return canCancelReservaWithinLimite(reserva, referenceDate);
}

export function canUserCancelReserva(
  user: Pick<User, 'id'>,
  reserva: Pick<ReservaSummary, 'responsavel_id' | 'users_id' | 'limiteCancelamento' | 'dataAtividade'>,
  referenceDate?: Date,
): boolean {
  if (!canCancelReservaWithinLimite(reserva, referenceDate)) {
    return false;
  }

  return isReservaResponsavel(user, reserva);
}

export function canManageReservaJogadores(
  user: Pick<User, 'id'>,
  reserva: Pick<ReservaSummary, 'responsavel_id' | 'users_id'>,
): boolean {
  return isReservaResponsavel(user, reserva);
}

export function isReservaResponsavel(
  user: Pick<User, 'id'>,
  reserva: Pick<ReservaSummary, 'responsavel_id' | 'users_id'>,
): boolean {
  if (user.id === reserva.responsavel_id && reserva.responsavel_id > 0) {
    return true;
  }

  return user.id === reserva.users_id && reserva.users_id > 0;
}

export function isJogoResponsavel(
  user: Pick<User, 'id'>,
  jogo: Pick<Jogo, 'responsavel_id'>,
): boolean {
  return user.id === jogo.responsavel_id;
}

export function isReservaQuadra(
  reserva: Pick<ReservaSummary, 'atividade'>,
): boolean {
  return !reserva.atividade?.trim();
}

export function isAdversarioPendente(jogo: Pick<Jogo, 'jogoDuplas' | 'adversario_id' | 'parceiro2_id'>): boolean {
  if (jogo.jogoDuplas) {
    return jogo.adversario_id === 0 || jogo.parceiro2_id === 0;
  }

  return jogo.adversario_id === 0;
}

export function getMinutosLimiteRegistroAdversario(
  createdAt: number | null | undefined,
  cancelamentoAutomatico: number | null | undefined,
): number | null {
  if (!createdAt || !cancelamentoAutomatico) {
    return null;
  }

  const diffMs = cancelamentoAutomatico - createdAt;

  if (diffMs <= 0) {
    return null;
  }

  return Math.round(diffMs / 60000);
}

export function buildAdversarioPendenteMessage(minutos: number | null): string {
  if (minutos) {
    return `De acordo com o regulamento atual, o tempo limite para registrar o adversário é de ${minutos} minutos após a reserva da quadra.`;
  }

  return 'De acordo com o regulamento atual, há um tempo limite para registrar o adversário após a reserva da quadra.';
}

export function buildAdversarioPendenteWarning(jogoDuplas: boolean): string {
  const participanteLabel = jogoDuplas ? 'adversário(s)' : 'adversário';

  return `Sua reserva será AUTOMATICAMENTE CANCELADA após esse período caso não tenha o(s) ${participanteLabel} registrado(s).`;
}
