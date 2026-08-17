export type PublicidadeImage = {
  url: string;
};

export type PublicidadeBanner = {
  id: number;
  empresa: string;
  ativa: boolean;
  linkBanner: string;
  slogan: string;
  instagram: string;
  telefone: string;
  logo: PublicidadeImage | null;
  banner: PublicidadeImage | null;
};

export type Patrocinador = {
  id: number;
  empresa: string;
  ativa: boolean;
  ultimaExibicao?: number;
  telefone: string;
  slogan: string;
  instagram: string;
  website: string;
  direcionamento: string;
  users_id: number;
  logoAtual?: string;
  bannerAtual?: string;
  popupTelaAtual?: string;
  wzQuadroAtual?: string;
  logo?: PublicidadeImage | null;
  banner?: PublicidadeImage | null;
  popupTela?: PublicidadeImage | null;
  wzquadro?: PublicidadeImage | null;
};

export type PatrocinadoresResponse = Patrocinador[];

export type MostrarPubliXanoPayload = {
  publicidade_id: number;
  users_id: number;
  nome: string;
  publi: string;
  dataMostrada: number;
  aplicativo: string;
  local: string;
  display: string;
};

export type MostrarPubliXanoResponse = {
  id: number;
  created_at: number;
  nome: string;
  publi: string;
  dataMostrada: number | null;
  aplicativo: string;
  local: string;
  display: string;
};

export type PatrocinioUltimaTelaPayload = {
  publicidade_id: number;
  users_id: number;
};

export type PatrocinioUltimaTelaResponse = {
  id: number;
  created_at: number;
  nome: string;
  publi: string;
  dataMostrada: number;
  aplicativo: string;
  local: string;
  display: string;
};

export type PatrocinioUltimoVistoPayload = {
  users_id: number;
};

export type PublicidadeLinkAction = 'whatsapp' | 'instagram' | 'website' | 'delivery';

export type PublicidadeLinkButton = {
  action: PublicidadeLinkAction;
  label: string;
  url: string;
};
