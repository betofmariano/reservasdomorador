import { useEffect, useState } from 'react';

import { getPatrocinadores } from '@/services/publicidade-service';
import type { Patrocinador } from '@/types/publicidade';
import type { User } from '@/types/user';
import { isUserAdministrador } from '@/utils/club-config';
import { selectPatrocinadoresGerenciaveis } from '@/utils/publicidade-patrocinador';

export function usePatrocinadoresDoUsuario(user: User | null | undefined) {
  const [empresas, setEmpresas] = useState<Patrocinador[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setEmpresas([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    const canManageAll = isUserAdministrador(user);

    void getPatrocinadores()
      .then((lista) => {
        if (!cancelled) {
          setEmpresas(selectPatrocinadoresGerenciaveis(lista, user.id, canManageAll));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEmpresas([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.administrador, user?.id]);

  return { empresas, isLoading };
}
