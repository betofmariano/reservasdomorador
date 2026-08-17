import type { CriarReservaResponse } from '@/types/reserva';

export type CriarReservaMensalPorSemanaPayload = {
  mapamensalporsemana_id: number;
  users_id: number;
  semana: number;
  responsavel_id: number;
  responsavel: string;
  /** Unidade da atividade (Q1/Q2…). Opcional em atividades sem unidade. */
  atividadeunidade_id?: number | null;
};

export type CriarReservaMensalPorSemanaResponse = CriarReservaResponse & {
  reservasMensalPorSemana_id?: string | number | null;
  reservasdamha_id?: string | number | null;
};
