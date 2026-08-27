export type ReservaMensalPorSemanaCancelamentoKey = {
  users_id: number;
  atividades_id: number;
  mapadiariodamha_id: number;
  dataAtividade: number;
  atividadeunidade_id: number | null;
};

export type ReservaMensalPorSemanaCancelamentoRecord = ReservaMensalPorSemanaCancelamentoKey & {
  numeroCancelamento?: number;
};

function normalizeUnidadeId(value: number | null | undefined): number | null {
  return value != null && value > 0 ? value : null;
}

function sameHorarioInstant(left: number, right: number): boolean {
  if (left <= 0 || right <= 0) {
    return false;
  }

  return Math.floor(left / 60_000) === Math.floor(right / 60_000);
}

export function isSameReservaMensalPorSemanaHorario(
  left: ReservaMensalPorSemanaCancelamentoKey,
  right: ReservaMensalPorSemanaCancelamentoKey,
): boolean {
  if (left.users_id > 0 && right.users_id > 0 && left.users_id !== right.users_id) {
    return false;
  }

  if (left.atividades_id > 0 && right.atividades_id > 0 && left.atividades_id !== right.atividades_id) {
    return false;
  }

  if (left.mapadiariodamha_id > 0 && right.mapadiariodamha_id > 0) {
    return left.mapadiariodamha_id === right.mapadiariodamha_id;
  }

  if (!sameHorarioInstant(left.dataAtividade, right.dataAtividade)) {
    return false;
  }

  return normalizeUnidadeId(left.atividadeunidade_id) === normalizeUnidadeId(right.atividadeunidade_id);
}

export function resolveNextNumeroCancelamento(
  current: ReservaMensalPorSemanaCancelamentoKey,
  reservas: ReservaMensalPorSemanaCancelamentoRecord[],
): number {
  let maxNumero = 0;

  for (const reserva of reservas) {
    if (!isSameReservaMensalPorSemanaHorario(current, reserva)) {
      continue;
    }

    const value = reserva.numeroCancelamento ?? 0;

    if (value > maxNumero) {
      maxNumero = value;
    }
  }

  return maxNumero + 1;
}
