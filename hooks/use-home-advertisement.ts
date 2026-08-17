import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

import {
  getPatrocinadorProximaTela,
  registrarImpressaoBanner,
} from '@/services/publicidade-service';
import { atualizarUltimaPublicidadeData } from '@/services/user-service';
import type { Patrocinador } from '@/types/publicidade';
import type { User } from '@/types/user';
import { PUBLICIDADE_DISPLAY_BANNER } from '@/utils/publicidade-display';
import {
  getEffectiveLastAdvertisementViewAt,
  normalizeUltimaPublicidadeData,
  shouldShowAdvertisement,
} from '@/utils/publicidade-interval';
import {
  getPatrocinadorBannerImageUrl,
  isPatrocinadorValido,
} from '@/utils/publicidade-patrocinador';
import {
  getLastAdvertisementViewAt,
  setLastAdvertisementViewAt,
} from '@/utils/publicidade-storage';
import { isUserSemPublicidade } from '@/utils/academia-publicidade';

type UseHomeAdvertisementParams = {
  user: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
  isBlockedByCriticalModal: boolean;
  semPublicidade?: boolean;
  isSemPublicidadeResolved?: boolean;
  onUltimaPublicidadeDataUpdated?: (timestamp: number) => void;
};

export function useHomeAdvertisement({
  user,
  authToken,
  isAuthLoading,
  isBlockedByCriticalModal,
  semPublicidade = false,
  isSemPublicidadeResolved = false,
  onUltimaPublicidadeDataUpdated,
}: UseHomeAdvertisementParams) {
  const isHomeFocused = useIsFocused();
  const [patrocinador, setPatrocinador] = useState<Patrocinador | null>(null);
  const [visible, setVisible] = useState(false);

  const isFetchingRef = useRef(false);
  const impressionRegisteredRef = useRef(false);
  const advertisementVisibleRef = useRef(false);
  const pendingAfterBlockRef = useRef(false);
  const mountedRef = useRef(true);
  const userRef = useRef(user);
  const authTokenRef = useRef(authToken);
  const patrocinadorRef = useRef<Patrocinador | null>(null);
  const blockedRef = useRef(isBlockedByCriticalModal);
  const focusedRef = useRef(isHomeFocused);
  const semPublicidadeRef = useRef(semPublicidade);
  const isSemPublicidadeResolvedRef = useRef(isSemPublicidadeResolved);
  const onUltimaPublicidadeDataUpdatedRef = useRef(onUltimaPublicidadeDataUpdated);

  userRef.current = user;
  authTokenRef.current = authToken;
  patrocinadorRef.current = patrocinador;
  blockedRef.current = isBlockedByCriticalModal;
  focusedRef.current = isHomeFocused;
  semPublicidadeRef.current = semPublicidade;
  isSemPublicidadeResolvedRef.current = isSemPublicidadeResolved;
  onUltimaPublicidadeDataUpdatedRef.current = onUltimaPublicidadeDataUpdated;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    advertisementVisibleRef.current = visible;
  }, [visible]);

  const resetAdvertisementUI = useCallback(() => {
    advertisementVisibleRef.current = false;
    setPatrocinador(null);
    setVisible(false);
  }, []);

  const resetAdvertisementSession = useCallback(() => {
    impressionRegisteredRef.current = false;
    resetAdvertisementUI();
  }, [resetAdvertisementUI]);

  const closeAdvertisement = useCallback(() => {
    resetAdvertisementUI();
  }, [resetAdvertisementUI]);

  const fetchAndOpenAdvertisement = useCallback(async () => {
    const currentUser = userRef.current;

    if (
      isFetchingRef.current ||
      !currentUser?.id ||
      isUserSemPublicidade(currentUser) ||
      !isSemPublicidadeResolvedRef.current ||
      semPublicidadeRef.current ||
      !focusedRef.current
    ) {
      return;
    }

    isFetchingRef.current = true;

    try {
      const localLastViewedAt = await getLastAdvertisementViewAt();
      const serverLastViewedAt = normalizeUltimaPublicidadeData(currentUser.ultimaPublicidadeData);
      const lastViewedAt = getEffectiveLastAdvertisementViewAt(
        localLastViewedAt,
        serverLastViewedAt,
      );
      const podeMostrar = shouldShowAdvertisement(lastViewedAt);

      if (__DEV__) {
        console.log('Verificando publicidade da Home');
        console.log('Intervalo de 15 minutos cumprido:', podeMostrar);
      }

      if (!podeMostrar) {
        impressionRegisteredRef.current = false;
        return;
      }

      if (blockedRef.current) {
        pendingAfterBlockRef.current = true;
        return;
      }

      if (advertisementVisibleRef.current || impressionRegisteredRef.current) {
        return;
      }

      const proximoPatrocinador = await getPatrocinadorProximaTela(currentUser.id);

      if (!mountedRef.current || !focusedRef.current) {
        return;
      }

      if (!isPatrocinadorValido(proximoPatrocinador)) {
        if (__DEV__) {
          console.log('Patrocinador encontrado:', false);
        }
        return;
      }

      const imageUrl = getPatrocinadorBannerImageUrl(proximoPatrocinador);

      if (!imageUrl) {
        if (__DEV__) {
          console.log('Patrocinador encontrado:', Boolean(proximoPatrocinador.id));
        }
        return;
      }

      if (impressionRegisteredRef.current || advertisementVisibleRef.current) {
        return;
      }

      if (__DEV__) {
        console.log('Patrocinador encontrado:', Boolean(proximoPatrocinador.id));
        console.log('Publicidade aberta');
      }

      advertisementVisibleRef.current = true;
      setPatrocinador(proximoPatrocinador);
      setVisible(true);
    } catch {
      if (__DEV__) {
        console.warn('Falha ao carregar publicidade da Home');
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!semPublicidade) {
      return;
    }

    resetAdvertisementSession();
  }, [resetAdvertisementSession, semPublicidade]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthLoading || !isSemPublicidadeResolved) {
        return;
      }

      if (isUserSemPublicidade(userRef.current) || semPublicidadeRef.current) {
        if (__DEV__) {
          console.log('Usuário sem publicidade:', isUserSemPublicidade(userRef.current));
          console.log('Academia sem publicidade:', semPublicidadeRef.current);
        }
        return;
      }

      void fetchAndOpenAdvertisement();

      return () => {
        pendingAfterBlockRef.current = false;
        resetAdvertisementUI();
      };
    }, [
      fetchAndOpenAdvertisement,
      isAuthLoading,
      isSemPublicidadeResolved,
      resetAdvertisementUI,
    ]),
  );

  useEffect(() => {
    if (isBlockedByCriticalModal || !pendingAfterBlockRef.current || !isHomeFocused) {
      return;
    }

    pendingAfterBlockRef.current = false;
    void fetchAndOpenAdvertisement();
  }, [fetchAndOpenAdvertisement, isBlockedByCriticalModal, isHomeFocused]);

  const handleImpressionReady = useCallback(async () => {
    const currentUser = userRef.current;
    const currentAuthToken = authTokenRef.current;
    const currentPatrocinador = patrocinadorRef.current;

    if (
      impressionRegisteredRef.current ||
      !currentUser?.id ||
      !currentPatrocinador?.id ||
      isUserSemPublicidade(currentUser) ||
      semPublicidadeRef.current
    ) {
      return;
    }

    impressionRegisteredRef.current = true;
    const viewedAt = Date.now();

    try {
      await registrarImpressaoBanner({
        user: currentUser,
        patrocinador: currentPatrocinador,
        display: PUBLICIDADE_DISPLAY_BANNER,
      });

      if (currentAuthToken) {
        await atualizarUltimaPublicidadeData(currentUser, viewedAt, currentAuthToken);
      }
    } catch {
      if (__DEV__) {
        console.warn('Falha ao registrar visualização remota da publicidade');
      }
    }

    await setLastAdvertisementViewAt(viewedAt);
    onUltimaPublicidadeDataUpdatedRef.current?.(viewedAt);
  }, []);

  const handleImageError = useCallback(() => {
    resetAdvertisementSession();
  }, [resetAdvertisementSession]);

  return {
    patrocinador,
    visible,
    closeAdvertisement,
    handleImpressionReady,
    handleImageError,
  };
}
