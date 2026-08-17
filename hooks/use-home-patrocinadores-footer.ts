import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getPatrocinadores } from '@/services/publicidade-service';
import type { Patrocinador } from '@/types/publicidade';
import type { User } from '@/types/user';
import { selectPatrocinadoresFooter } from '@/utils/publicidade-patrocinador';

type UseHomePatrocinadoresFooterParams = {
  user: User | null;
  semPublicidade?: boolean;
};

export function useHomePatrocinadoresFooter({
  user,
  semPublicidade = false,
}: UseHomePatrocinadoresFooterParams) {
  const [patrocinadores, setPatrocinadores] = useState<Patrocinador[]>([]);

  const showFooter = Boolean(user?.id && !semPublicidade && patrocinadores.length > 0);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id || semPublicidade) {
        setPatrocinadores([]);
        return;
      }

      let cancelled = false;

      void getPatrocinadores()
        .then((lista) => {
          if (cancelled) {
            return;
          }

          setPatrocinadores(selectPatrocinadoresFooter(lista));
        })
        .catch(() => {
          if (!cancelled) {
            setPatrocinadores([]);
          }
        });

      return () => {
        cancelled = true;
      };
    }, [semPublicidade, user?.id]),
  );

  return {
    patrocinadores,
    showFooter,
  };
}
