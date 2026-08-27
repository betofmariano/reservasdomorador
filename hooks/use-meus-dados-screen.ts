import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { ApiError, getApiErrorMessage } from '@/services/api-client';
import { getAcademias } from '@/services/academias-service';
import {
  getUserComplementoFromRecords,
  resolveMeusDadosAcademiasId,
  updateUserComplementoInRecords,
  updateUserNameInRecords,
} from '@/services/meus-dados-service';
import { createSolicitacaoAlteracao } from '@/services/solicitacoes-alteracao-service';
import { invalidateUsuariosLocalCache } from '@/services/usuarios-service';
import { useAuth } from '@/contexts/auth-context';
import { useUserContext } from '@/contexts/user-context';
import type { User } from '@/types/user';
import {
  SOLICITACAO_ROTINA,
  type SolicitacaoAlteracaoTipo,
} from '@/types/solicitacao-alteracao';
import {
  buildOriginalValues,
  detectMeusDadosChanges,
  getOriginalPhoneDigits,
  MEUS_DADOS_MESSAGES,
  normalizePersonName,
  validateMeusDadosComplemento,
  validateMeusDadosNome,
  validateMeusDadosTelefoneDigits,
} from '@/utils/meus-dados';
import { formatBrazilianMobilePhone } from '@/utils/phone-mask';

type SubmitResult = {
  success: boolean;
  message: string;
  partialFailure?: boolean;
};

type UseMeusDadosScreenParams = {
  user: User | null;
  authToken: string | null;
};

export function useMeusDadosScreen({ user, authToken }: UseMeusDadosScreenParams) {
  const { patchUser } = useAuth();
  const { effectiveAcademiasId, refreshUserContext } = useUserContext();
  const { width } = useWindowDimensions();
  const larguraPagina = Math.round(width);

  const originalsRef = useRef(buildOriginalValues(user ?? ({} as User)));

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [complemento, setComplemento] = useState('');
  const [complementoRegistrado, setComplementoRegistrado] = useState('');

  const [clubName, setClubName] = useState('');
  const [showComplementoField, setShowComplementoField] = useState(false);
  const [isLoadingClubName, setIsLoadingClubName] = useState(true);
  const [clubNameError, setClubNameError] = useState<string | null>(null);

  const [nomeError, setNomeError] = useState<string | null>(null);
  const [telefoneError, setTelefoneError] = useState<string | null>(null);
  const [complementoError, setComplementoError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const telefoneDigits = useMemo(
    () => telefone.replace(/\D/g, '').slice(0, 11),
    [telefone],
  );

  const changes = useMemo(
    () =>
      detectMeusDadosChanges({
        nome,
        telefoneDigits,
        complemento,
        originals: originalsRef.current,
      }),
    [complemento, nome, telefoneDigits],
  );

  const photoPreviewUri = user?.foto ?? null;

  useEffect(() => {
    if (!user) {
      return;
    }

    originalsRef.current = buildOriginalValues(user);
    setNome(user.nome ?? '');
    setTelefone(formatBrazilianMobilePhone(getOriginalPhoneDigits(user)));
    setComplemento(user.endereco ?? '');
    setComplementoRegistrado(user.endereco ?? '');
    setNomeError(null);
    setTelefoneError(null);
    setComplementoError(null);
  }, [user?.id]);

  useEffect(() => {
    const academiasId = user
      ? resolveMeusDadosAcademiasId(user, effectiveAcademiasId)
      : 0;

    if (!academiasId) {
      setClubName('');
      setIsLoadingClubName(false);
      return;
    }

    let isMounted = true;

    setIsLoadingClubName(true);
    setClubNameError(null);

    void getAcademias()
      .then((clubs) => {
        if (!isMounted) {
          return;
        }

        const club = clubs.find((item) => item.id === academiasId);
        setClubName(club?.nome ?? 'Clube não identificado');
        setShowComplementoField(club?.complemento === true);
      })
      .catch(() => {
        if (isMounted) {
          setClubNameError('Não foi possível identificar o clube.');
          setClubName('');
          setShowComplementoField(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingClubName(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveAcademiasId, user]);

  useEffect(() => {
    if (!user || !showComplementoField) {
      return;
    }

    let isMounted = true;

    void getUserComplementoFromRecords(user, effectiveAcademiasId ?? undefined)
      .then((registeredComplemento) => {
        if (!isMounted) {
          return;
        }

        const nextComplemento = registeredComplemento.trim() || user.endereco || '';
        setComplemento(nextComplemento);
        setComplementoRegistrado(nextComplemento);
        originalsRef.current = {
          ...originalsRef.current,
          complemento: nextComplemento,
        };
      })
      .catch(() => {
        // Mantém formulário editável mesmo se a consulta falhar.
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveAcademiasId, showComplementoField, user?.id]);

  const handleNomeChange = useCallback((value: string) => {
    setNome(value);

    if (nomeError) {
      setNomeError(null);
    }
  }, [nomeError]);

  const handleTelefoneChange = useCallback((value: string) => {
    setTelefone(value);

    if (telefoneError) {
      setTelefoneError(null);
    }
  }, [telefoneError]);

  const handleComplementoChange = useCallback((value: string) => {
    setComplemento(value);

    if (complementoError) {
      setComplementoError(null);
    }
  }, [complementoError]);

  const submitSolicitacoes = useCallback(async (): Promise<SubmitResult> => {
    if (!user || !authToken) {
      return { success: false, message: MEUS_DADOS_MESSAGES.sendError };
    }

    if (!changes.hasChanges) {
      return { success: false, message: MEUS_DADOS_MESSAGES.noChanges };
    }

    const nomeValidation = changes.nomeAlterado ? validateMeusDadosNome(nome) : null;
    const telefoneValidation = changes.telefoneAlterado
      ? validateMeusDadosTelefoneDigits(telefoneDigits)
      : null;
    const complementoValidation =
      changes.complementoAlterado && showComplementoField
        ? validateMeusDadosComplemento(complemento)
        : null;

    if (nomeValidation || telefoneValidation || complementoValidation) {
      setNomeError(nomeValidation);
      setTelefoneError(telefoneValidation);
      setComplementoError(complementoValidation);
      return {
        success: false,
        message:
          nomeValidation ??
          telefoneValidation ??
          complementoValidation ??
          MEUS_DADOS_MESSAGES.sendError,
      };
    }

    const resolvedAcademiasId = resolveMeusDadosAcademiasId(user, effectiveAcademiasId);
    const needsAcademia = changes.nomeAlterado || changes.telefoneAlterado;

    if (needsAcademia && resolvedAcademiasId <= 0) {
      return { success: false, message: MEUS_DADOS_MESSAGES.localRequired };
    }

    const needsClubName = needsAcademia;

    if (needsClubName && (isLoadingClubName || clubNameError || !clubName)) {
      return { success: false, message: clubNameError ?? MEUS_DADOS_MESSAGES.sendError };
    }

    setIsSubmitting(true);

    const sentTypes: SolicitacaoAlteracaoTipo[] = [];
    const failedTypes: SolicitacaoAlteracaoTipo[] = [];
    const successMessages: string[] = [];
    let complementoAtualizado = false;
    let complementoFalhou = false;
    let nomeUpdateErrorMessage: string | null = null;

    try {
      if (changes.nomeAlterado) {
        try {
          const previousName = normalizePersonName(originalsRef.current.nome);
          const normalizedName = await updateUserNameInRecords(user, nome, authToken);

          invalidateUsuariosLocalCache();

          try {
            await createSolicitacaoAlteracao(
              {
                dataJogo: Date.now(),
                academias_id: resolvedAcademiasId,
                rotina: SOLICITACAO_ROTINA.nome,
                nome: previousName,
                larguraPagina,
                pagina: normalizedName,
                local: clubName,
                users_id: user.id,
              },
              authToken,
            );
          } catch (error) {
            if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
              throw error;
            }
          }

          const updatedUser: User = {
            ...user,
            nome: normalizedName,
          };

          patchUser({ nome: normalizedName });
          void refreshUserContext(undefined, updatedUser);
          originalsRef.current = {
            ...originalsRef.current,
            nome: normalizedName,
          };
          setNome(normalizedName);
          successMessages.push(MEUS_DADOS_MESSAGES.nomeSuccess);
          sentTypes.push('nome');
        } catch (error) {
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            throw error;
          }

          failedTypes.push('nome');
          nomeUpdateErrorMessage = getApiErrorMessage(error);

          if (error instanceof ApiError) {
            console.warn('Falha ao atualizar nome:', error.status, error.message);
          }
        }
      }

      if (changes.complementoAlterado && showComplementoField) {
        try {
          const normalizedComplemento = await updateUserComplementoInRecords(
            user,
            complemento,
            authToken,
            effectiveAcademiasId ?? undefined,
          );

          patchUser({ endereco: normalizedComplemento });
          originalsRef.current = {
            ...originalsRef.current,
            complemento: normalizedComplemento,
          };
          setComplemento(normalizedComplemento);
          setComplementoRegistrado(normalizedComplemento);
          complementoAtualizado = true;
          successMessages.push(MEUS_DADOS_MESSAGES.complementoSuccess);
        } catch (error) {
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            throw error;
          }

          complementoFalhou = true;
        }
      }

      if (changes.telefoneAlterado) {
        try {
          await createSolicitacaoAlteracao(
            {
              dataJogo: Date.now(),
              academias_id: resolvedAcademiasId,
              rotina: SOLICITACAO_ROTINA.telefone,
              nome: originalsRef.current.telefoneDigits,
              larguraPagina,
              pagina: telefoneDigits,
              local: clubName,
              users_id: user.id,
            },
            authToken,
          );

          sentTypes.push('telefone');
          successMessages.push(MEUS_DADOS_MESSAGES.telefoneSuccess);
          successMessages.push(MEUS_DADOS_MESSAGES.telefoneSuccessHint);
        } catch (error) {
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            throw error;
          }

          failedTypes.push('telefone');
        }
      }

      const algumaAlteracaoEnviada = sentTypes.length > 0 || complementoAtualizado;
      const algumaFalha = failedTypes.length > 0 || complementoFalhou;

      if (!algumaAlteracaoEnviada && algumaFalha) {
        const nomeFalhou = failedTypes.includes('nome');

        return {
          success: false,
          message:
            nomeFalhou && failedTypes.length === 1 && !complementoFalhou
              ? nomeUpdateErrorMessage ?? MEUS_DADOS_MESSAGES.nomeUpdateError
              : MEUS_DADOS_MESSAGES.partialError,
          partialFailure: true,
        };
      }

      if (algumaFalha) {
        const nomeFalhou = failedTypes.includes('nome');

        return {
          success: false,
          message:
            nomeFalhou && sentTypes.length === 0 && !complementoAtualizado
              ? nomeUpdateErrorMessage ?? MEUS_DADOS_MESSAGES.nomeUpdateError
              : MEUS_DADOS_MESSAGES.partialError,
          partialFailure: true,
        };
      }

      if (successMessages.length > 0) {
        return {
          success: true,
          message: successMessages.join(' '),
        };
      }

      return {
        success: false,
        message: MEUS_DADOS_MESSAGES.sendError,
      };
    } catch (error) {
      const message = getApiErrorMessage(error);
      return {
        success: false,
        message: message.includes('conectar') ? message : MEUS_DADOS_MESSAGES.sendError,
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [
    authToken,
    changes,
    clubName,
    clubNameError,
    complemento,
    effectiveAcademiasId,
    isLoadingClubName,
    larguraPagina,
    nome,
    patchUser,
    refreshUserContext,
    showComplementoField,
    telefoneDigits,
    user,
  ]);

  return {
    nome,
    telefone,
    complemento,
    complementoRegistrado,
    showComplementoField,
    photoPreviewUri,
    clubName,
    isLoadingClubName,
    clubNameError,
    nomeError,
    telefoneError,
    complementoError,
    isSubmitting,
    hasChanges: changes.hasChanges,
    matricula: user?.matricula ?? '',
    handleNomeChange,
    handleTelefoneChange,
    handleComplementoChange,
    submitSolicitacoes,
  };
};
