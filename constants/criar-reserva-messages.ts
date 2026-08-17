export const CRIAR_RESERVA_RESULTADO = {
  usuarioBloqueado: 0,
  sucesso: 1,
  jaReservado: 2,
  relogioAdiantado: 3,
} as const;

export type CriarReservaResultadoCode =
  (typeof CRIAR_RESERVA_RESULTADO)[keyof typeof CRIAR_RESERVA_RESULTADO];

export const CRIAR_RESERVA_MESSAGES = {
  success: 'Horário reservado com sucesso.',
  usuarioBloqueado: 'Usuário bloqueado para essa atividade.',
  jaReservado: 'Você já possui reserva para essa atividade.',
  relogioAdiantado:
    'O relógio do seu aparelho está adiantado. Ajuste a data e a hora para o modo automático e tente novamente.',
  unexpected: 'Não foi possível concluir a reserva. Tente novamente.',
} as const;

export const CRIAR_RESERVA_MODAL_TITLES = {
  usuarioBloqueado: 'Atividade bloqueada',
  jaReservado: 'Reserva existente',
  relogioAdiantado: 'Relógio adiantado',
  unexpected: 'Reserva não concluída',
} as const;

export function getCriarReservaModalTitle(sucesso: number | null): string {
  switch (sucesso) {
    case CRIAR_RESERVA_RESULTADO.usuarioBloqueado:
      return CRIAR_RESERVA_MODAL_TITLES.usuarioBloqueado;
    case CRIAR_RESERVA_RESULTADO.jaReservado:
      return CRIAR_RESERVA_MODAL_TITLES.jaReservado;
    case CRIAR_RESERVA_RESULTADO.relogioAdiantado:
      return CRIAR_RESERVA_MODAL_TITLES.relogioAdiantado;
    default:
      return CRIAR_RESERVA_MODAL_TITLES.unexpected;
  }
}
