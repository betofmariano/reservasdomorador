export const USO_QUADRA_PROGRAMAR_OPTIONS = [
  'Livre',
  'Aula',
  'Torneio',
  'Bloq',
  'Manutenção',
] as const;

export type UsoQuadraProgramarOption = (typeof USO_QUADRA_PROGRAMAR_OPTIONS)[number];

export type ProgramarQuadraPayload = {
  dataJogoInic: number;
  dataJogoFinal: number;
  quadra: number;
  usoQuadra: UsoQuadraProgramarOption;
  academias_id: number;
};

export type ProgramarQuadraResponse = Record<string, unknown>;
