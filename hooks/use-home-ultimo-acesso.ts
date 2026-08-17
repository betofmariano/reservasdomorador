import { useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { registerUltimoAcessoOnHome } from '@/services/meus-dados-service';
import type { User } from '@/types/user';

type UseHomeUltimoAcessoParams = {
  user: User | null;
  authToken: string | null;
};

function logUltimoAcessoError(error: unknown) {
  if (__DEV__) {
    console.warn('Não foi possível atualizar ultimoAcesso na Home:', error);
  }
}

export function useHomeUltimoAcesso({ user, authToken }: UseHomeUltimoAcessoParams) {
  const syncUltimoAcesso = useCallback(() => {
    if (!user?.id || !authToken) {
      return;
    }

    void registerUltimoAcessoOnHome(user, authToken)
      .then(() => {
        if (__DEV__) {
          console.log('ultimoAcesso atualizado na Home');
        }
      })
      .catch(logUltimoAcessoError);
  }, [authToken, user?.id]);

  useEffect(() => {
    syncUltimoAcesso();
  }, [syncUltimoAcesso]);

  useFocusEffect(
    useCallback(() => {
      syncUltimoAcesso();
    }, [syncUltimoAcesso]),
  );
}
