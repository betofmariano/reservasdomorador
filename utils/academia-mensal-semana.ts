import type { Academia } from '@/types/academia';

export function academiaUsaMensalPorSemana(academia: Academia | null | undefined): boolean {
  return academia?.mensalSemana === true;
}

export function academiaUsaCriarReservaReact(academia: Academia | null | undefined): boolean {
  return academia?.mensalSemana === true;
}

export function getAcademiaReservaSemanaLimite(academia: Academia | null | undefined): number | null {
  if (!academia || academia.reservaSemana <= 0) {
    return null;
  }

  return academia.reservaSemana;
}
