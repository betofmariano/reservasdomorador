import type { ReservaParticipanteSummary, ReservaSummary } from '@/types/home-summary';

export function getHomeReservaParticipantesExibidos(
  reserva: ReservaSummary,
  userId: number,
): ReservaParticipanteSummary[] {
  const isResponsavel = userId === reserva.responsavel_id;

  if (isResponsavel) {
    if (reserva.jogoDuplas) {
      return reserva.convidados;
    }

    return reserva.adversario ? [reserva.adversario] : [];
  }

  if (!reserva.jogoDuplas) {
    return reserva.responsavel ? [reserva.responsavel] : [];
  }

  return [reserva.responsavel, ...reserva.convidados].filter(
    (participante): participante is ReservaParticipanteSummary =>
      participante !== null && participante.users_id !== userId,
  );
}
