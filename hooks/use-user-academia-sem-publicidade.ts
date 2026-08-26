import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { APP_OCULTAR_PATROCINADORES } from '@/constants/app-branding';
import { getAcademias } from '@/services/academias-service';
import { academiaUsaMensalPorSemana } from '@/utils/academia-mensal-semana';
import { findAcademiaById, isAcademiaSemPublicidade } from '@/utils/academia-publicidade';

export function useUserAcademiaSemPublicidade(academiasId: number | null | undefined) {
  const [semPublicidade, setSemPublicidade] = useState(APP_OCULTAR_PATROCINADORES);
  const [usaMensalPorSemana, setUsaMensalPorSemana] = useState(false);
  const [isSemPublicidadeResolved, setIsSemPublicidadeResolved] = useState(APP_OCULTAR_PATROCINADORES);

  useFocusEffect(
    useCallback(() => {
      if (!academiasId) {
        setSemPublicidade(APP_OCULTAR_PATROCINADORES);
        setUsaMensalPorSemana(false);
        setIsSemPublicidadeResolved(true);
        return;
      }

      setIsSemPublicidadeResolved(APP_OCULTAR_PATROCINADORES);

      let cancelled = false;

      void getAcademias()
        .then((academias) => {
          if (cancelled) {
            return;
          }

          const academia = findAcademiaById(academias, academiasId);
          setSemPublicidade(isAcademiaSemPublicidade(academia));
          setUsaMensalPorSemana(academiaUsaMensalPorSemana(academia));
          setIsSemPublicidadeResolved(true);
        })
        .catch(() => {
          if (!cancelled) {
            setSemPublicidade(APP_OCULTAR_PATROCINADORES);
            setUsaMensalPorSemana(false);
            setIsSemPublicidadeResolved(true);
          }
        });

      return () => {
        cancelled = true;
      };
    }, [academiasId]),
  );

  return { semPublicidade, usaMensalPorSemana, isSemPublicidadeResolved };
}
