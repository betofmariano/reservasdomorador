export type Quadra = {
  id: number;
  created_at: number;
  academias_id: number;
  quadra: number;
};

export type CreateQuadraPayload = {
  academias_id: number;
  quadra: number;
};
