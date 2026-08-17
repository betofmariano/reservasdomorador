import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useUserContext } from '@/contexts/user-context';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import {
  getAcademiaById,
  getAcademiasForConfiguration,
  updateAcademia,
} from '@/services/academias-service';
import { getUserLocalAssociations } from '@/services/user-local-service';
import type { Academia, AcademiaFormFieldErrors, AcademiaFormValues } from '@/types/academia';
import type { Club } from '@/types/club';
import type { User } from '@/types/user';
import type { UserLocalAssociation } from '@/types/user-local';
import {
  academiaToFormValues,
  buildUpdateAcademiaPayload,
  createEmptyAcademiaFormValues,
  hasAcademiaFormChanges,
  LOCAL_CONFIG_MESSAGES,
  validateAcademiaForm,
} from '@/utils/academia-form';
import { canManageAcademia, filterAcademiasForConfiguration } from '@/utils/club-config';
import { readAcademiaRegulamentoUrl } from '@/utils/normalize-academia';

type UseConfiguracaoLocalScreenParams = {
  user: User | null;
  authToken: string | null;
  isAuthLoading: boolean;
  onUnauthorized: () => void | Promise<void>;
};

export function useConfiguracaoLocalScreen({
  user,
  authToken,
  isAuthLoading,
  onUnauthorized,
}: UseConfiguracaoLocalScreenParams) {
  const { effectiveAcademiasId, permissions, isLoading: isContextLoading } = useUserContext();
  const [availableClubs, setAvailableClubs] = useState<Club[]>([]);
  const [associations, setAssociations] = useState<UserLocalAssociation[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [loadedAcademia, setLoadedAcademia] = useState<Academia | null>(null);

  const [values, setValues] = useState<AcademiaFormValues>(createEmptyAcademiaFormValues());
  const [originalValues, setOriginalValues] = useState<AcademiaFormValues>(
    createEmptyAcademiaFormValues(),
  );
  const [errors, setErrors] = useState<AcademiaFormFieldErrors>({});

  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [clubsLoadError, setClubsLoadError] = useState<string | null>(null);

  const [isLoadingClub, setIsLoadingClub] = useState(false);
  const [clubLoadError, setClubLoadError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const clubRequestIdRef = useRef(0);

  const isAdministrador = user?.administrador === true;

  const canManageSelectedClub = useMemo(() => {
    if (!user || !loadedAcademia) {
      return false;
    }

    if (permissions.administrador) {
      return true;
    }

    return (
      permissions.podeGerirLocal &&
      effectiveAcademiasId === loadedAcademia.id &&
      canManageAcademia(user, loadedAcademia.id, associations)
    );
  }, [
    associations,
    effectiveAcademiasId,
    loadedAcademia,
    permissions.administrador,
    permissions.podeAcessarConfiguracaoLocal,
    user,
  ]);

  const showClubSelector = isAdministrador && availableClubs.length > 0;

  const hasChanges = useMemo(
    () => hasAcademiaFormChanges(values, originalValues),
    [originalValues, values],
  );

  const regulamentoUrl = useMemo(
    () => readAcademiaRegulamentoUrl(loadedAcademia?.regulamento ?? null),
    [loadedAcademia],
  );

  const fetchAvailableClubs = useCallback(async () => {
    if (!user || !authToken || isContextLoading) {
      setIsLoadingClubs(isContextLoading);
      return;
    }

    setIsLoadingClubs(true);
    setClubsLoadError(null);

    try {
      const [academias, userAssociations] = await Promise.all([
        getAcademiasForConfiguration(authToken),
        isAdministrador ? Promise.resolve([]) : getUserLocalAssociations(user.id),
      ]);

      if (isAdministrador) {
        const filtered = filterAcademiasForConfiguration(user, academias, []);
        setAssociations([]);
        setAvailableClubs(filtered as unknown as Club[]);
        setSelectedClubId((current) => {
          if (current && filtered.some((club) => club.id === current)) {
            return current;
          }

          return null;
        });
        return;
      }

      if (!effectiveAcademiasId || !permissions.podeAcessarConfiguracaoLocal) {
        setAssociations([]);
        setAvailableClubs([]);
        setSelectedClubId(null);
        return;
      }

      const filtered = filterAcademiasForConfiguration(user, academias, userAssociations).filter(
        (club) => club.id === effectiveAcademiasId,
      );

      setAssociations(
        userAssociations.filter((association) => association.academias_id === effectiveAcademiasId),
      );
      setAvailableClubs(filtered as unknown as Club[]);
      setSelectedClubId(filtered[0]?.id ?? null);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        await onUnauthorized();
        return;
      }

      const message = getApiErrorMessage(error);
      setClubsLoadError(message.includes('conectar') ? message : LOCAL_CONFIG_MESSAGES.loadListError);
      setAvailableClubs([]);
    } finally {
      setIsLoadingClubs(false);
    }
  }, [
    authToken,
    effectiveAcademiasId,
    isAdministrador,
    isContextLoading,
    onUnauthorized,
    permissions.podeAcessarConfiguracaoLocal,
    user,
  ]);

  const fetchClubDetails = useCallback(
    async (clubId: number) => {
      if (!user || !authToken) {
        return;
      }

      const requestId = ++clubRequestIdRef.current;

      setIsLoadingClub(true);
      setClubLoadError(null);
      setLoadedAcademia(null);
      setValues(createEmptyAcademiaFormValues());
      setOriginalValues(createEmptyAcademiaFormValues());
      setErrors({});

      try {
        const academia = await getAcademiaById(clubId, authToken);

        if (requestId !== clubRequestIdRef.current) {
          return;
        }

        if (!canManageAcademia(user, academia.id, associations)) {
          setClubLoadError(LOCAL_CONFIG_MESSAGES.permissionView);
          return;
        }

        const formValues = academiaToFormValues(academia);

        setLoadedAcademia(academia);
        setValues(formValues);
        setOriginalValues(formValues);
      } catch (error) {
        if (requestId !== clubRequestIdRef.current) {
          return;
        }

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await onUnauthorized();
          return;
        }

        const message = getApiErrorMessage(error);
        setClubLoadError(message.includes('conectar') ? message : LOCAL_CONFIG_MESSAGES.loadError);
      } finally {
        if (requestId === clubRequestIdRef.current) {
          setIsLoadingClub(false);
        }
      }
    },
    [associations, authToken, onUnauthorized, user],
  );

  useEffect(() => {
    if (isAuthLoading || !user || !authToken) {
      return;
    }

    void fetchAvailableClubs();
  }, [authToken, fetchAvailableClubs, isAuthLoading, user]);

  useEffect(() => {
    if (!selectedClubId || isLoadingClubs) {
      return;
    }

    void fetchClubDetails(selectedClubId);
  }, [fetchClubDetails, isLoadingClubs, selectedClubId]);

  function handleChange<K extends keyof AcademiaFormValues>(field: K, value: AcademiaFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));

    if (errors[field] || errors.general) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        delete next.general;
        return next;
      });
    }
  }

  function handleClubChange(clubId: number) {
    setSelectedClubId(clubId);
  }

  async function saveLocalConfiguration(): Promise<string | null> {
    if (!user || !authToken || !loadedAcademia || !selectedClubId) {
      return LOCAL_CONFIG_MESSAGES.permissionSave;
    }

    if (!canManageAcademia(user, loadedAcademia.id, associations)) {
      return LOCAL_CONFIG_MESSAGES.permissionSave;
    }

    const validationErrors = validateAcademiaForm(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return validationErrors.general ?? 'Preencha corretamente os campos obrigatórios.';
    }

    setIsSaving(true);
    setErrors({});

    try {
      const payload = buildUpdateAcademiaPayload(values, loadedAcademia);
      const updatedAcademia = await updateAcademia(selectedClubId, payload, authToken);
      const updatedValues = academiaToFormValues(updatedAcademia);

      setLoadedAcademia(updatedAcademia);
      setValues(updatedValues);
      setOriginalValues(updatedValues);
      setAvailableClubs((current) =>
        current.map((club) =>
          club.id === updatedAcademia.id ? { ...club, nome: updatedAcademia.nome } : club,
        ),
      );

      return null;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        await onUnauthorized();
        return LOCAL_CONFIG_MESSAGES.permissionSave;
      }

      const message = getApiErrorMessage(error);
      return message.includes('conectar')
        ? message
        : message.length < 120
          ? message
          : LOCAL_CONFIG_MESSAGES.updateError;
    } finally {
      setIsSaving(false);
    }
  }

  return {
    availableClubs,
    selectedClubId,
    loadedAcademia,
    values,
    originalValues,
    errors,
    isLoadingClubs: isContextLoading || isLoadingClubs,
    clubsLoadError,
    isLoadingClub,
    clubLoadError,
    isSaving,
    isAdministrador,
    canManageSelectedClub,
    showClubSelector,
    hasChanges,
    regulamentoUrl,
    setSelectedClubId: handleClubChange,
    handleChange,
    fetchAvailableClubs,
    fetchClubDetails,
    saveLocalConfiguration,
  };
}
