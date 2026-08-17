import { ApiError } from '@/services/api-client';
import { getAcademias } from '@/services/academias-service';
import { createSolicitacaoAlteracao } from '@/services/solicitacoes-alteracao-service';
import { updateUserPhoto } from '@/services/user-service';
import { SOLICITACAO_ROTINA } from '@/types/solicitacao-alteracao';
import type { User } from '@/types/user';
import type { PhotoAsset } from '@/types/user-photo';
import { normalizePersonName } from '@/utils/meus-dados';
import { resolveUpdatedPhotoUrl } from '@/utils/user-photo';

type SubmitSolicitacaoFotoAlteracaoParams = {
  user: User;
  photoAsset: PhotoAsset;
  authToken: string;
  larguraPagina: number;
  clubName: string;
};

export async function resolveAcademiaNameById(academiasId: number): Promise<string> {
  const clubs = await getAcademias();
  const club = clubs.find((item) => item.id === academiasId);

  return club?.nome ?? 'Clube não identificado';
}

export async function submitSolicitacaoFotoAlteracao({
  user,
  photoAsset,
  authToken,
  larguraPagina,
  clubName,
}: SubmitSolicitacaoFotoAlteracaoParams): Promise<string> {
  const updateResult = await updateUserPhoto(user.id, photoAsset, authToken);
  const photoUrl = resolveUpdatedPhotoUrl(updateResult, photoAsset.uri);

  if (!photoUrl) {
    throw new ApiError('Não foi possível confirmar a URL da foto atualizada.');
  }

  await createSolicitacaoAlteracao(
    {
      dataJogo: Date.now(),
      academias_id: user.academias_id,
      rotina: SOLICITACAO_ROTINA.foto,
      nome: normalizePersonName(user.nome),
      larguraPagina,
      pagina: photoUrl,
      local: clubName,
      users_id: user.id,
    },
    authToken,
  );

  return photoUrl;
}
