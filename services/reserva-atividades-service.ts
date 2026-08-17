import { getAcademias } from '@/services/academias-service';
import { getAtividadesAcademia } from '@/services/atividades-service';
import { getUserLocalAssociations } from '@/services/user-local-service';
import type {
  ReservaAtividadeOption,
  ReservaAtividadesData,
  ReservaLocalOption,
} from '@/types/mapa-diario-futuro';
import type { UserLocalAssociation } from '@/types/user-local';
import { sortByClubNome } from '@/utils/club-sort';
import { normalizeRecordId } from '@/utils/normalize-api-fields';

function isReservableAssociation(association: UserLocalAssociation): boolean {
  return association.aprovado && !association.bloqueado;
}

function dedupeAssociationsByAcademia(
  associations: UserLocalAssociation[],
): UserLocalAssociation[] {
  const seenAcademiaIds = new Set<number>();

  return associations.filter((association) => {
    const academiasId = normalizeRecordId(association.academias_id);

    if (academiasId == null || seenAcademiaIds.has(academiasId)) {
      return false;
    }

    seenAcademiaIds.add(academiasId);
    return true;
  });
}

function buildReservaAtividadeKey(atividade: ReservaAtividadeOption): string {
  return `${atividade.academias_id}-${atividade.id}`;
}

export async function getReservaAtividadesDataForUser(
  userId: number,
): Promise<ReservaAtividadesData> {
  const [associations, academias] = await Promise.all([
    getUserLocalAssociations(userId),
    getAcademias(),
  ]);

  const eligibleAssociations = dedupeAssociationsByAcademia(
    associations.filter(isReservableAssociation),
  );

  if (eligibleAssociations.length === 0) {
    return { locais: [], atividades: [] };
  }

  const academiasById = new Map(academias.map((academia) => [academia.id, academia]));
  const locais: ReservaLocalOption[] = sortByClubNome(
    eligibleAssociations.map((association) => ({
      id: association.academias_id,
      nome:
        academiasById.get(association.academias_id)?.nome ?? `Local #${association.academias_id}`,
    })),
  );

  const activitiesByClub = await Promise.all(
    eligibleAssociations.map(async (association) => {
      const atividades = await getAtividadesAcademia(association.academias_id);
      const localNome =
        academiasById.get(association.academias_id)?.nome ?? `Local #${association.academias_id}`;

      return atividades.map((atividade) => ({
        id: atividade.id,
        nome: atividade.atividade,
        academias_id: atividade.academias_id,
        localNome,
        observacao: atividade.observacao,
      }));
    }),
  );

  const seenAtividades = new Set<string>();
  const atividades = activitiesByClub
    .flat()
    .filter((atividade) => {
      const key = buildReservaAtividadeKey(atividade);

      if (seenAtividades.has(key)) {
        return false;
      }

      seenAtividades.add(key);
      return true;
    })
    .sort((a, b) => {
      const localCompare = a.localNome.localeCompare(b.localNome, 'pt-BR', { sensitivity: 'base' });

      if (localCompare !== 0) {
        return localCompare;
      }

      return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
    });

  return { locais, atividades };
}

/** @deprecated Use getReservaAtividadesDataForUser */
export async function getReservaAtividadeOptionsForUser(
  userId: number,
): Promise<ReservaAtividadeOption[]> {
  const data = await getReservaAtividadesDataForUser(userId);

  return data.atividades;
}
