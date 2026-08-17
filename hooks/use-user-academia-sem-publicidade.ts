import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getAcademias } from '@/services/academias-service';
import { academiaUsaMensalPorSemana } from '@/utils/academia-mensal-semana';
import { findAcademiaById, isAcademiaSemPublicidade } from '@/utils/academia-publicidade';

export function useUserAcademiaSemPublicidade(academiasId: number | null | undefined) {
  const [semPublicidade, setSemPublicidade] = useState(false);
  const [usaMensalPorSemana, setUsaMensalPorSemana] = useState(false);
  const [isSemPublicidadeResolved, setIsSemPublicidadeResolved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!academiasId) {
        setSemPublicidade(false);
        setUsaMensalPorSemana(false);
        setIsSemPublicidadeResolved(true);
        return;
      }

      setIsSemPublicidadeResolved(false);

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
            setSemPublicidade(false);
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
