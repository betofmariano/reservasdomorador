import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '@/services/api-client';
import { getPatrocinadores, patchPatrocinadorAlterarDados } from '@/services/publicidade-service';
import type { Patrocinador, PatrocinadorAlterarDadosPayload, PatrocinadorAssetSlot } from '@/types/publicidade';
import type { PhotoAsset } from '@/types/user-photo';
import type { User } from '@/types/user';
import { isUserAdministrador } from '@/utils/club-config';
import {
  getPatrocinadorBannerPreviewUrl,
  getPatrocinadorLogoPreviewUrl,
  getPatrocinadorPopupPreviewUrl,
  getPatrocinadorWhatsAppPreviewUrl,
  selectPatrocinadoresGerenciaveis,
} from '@/utils/publicidade-patrocinador';

export const GERENCIAR_PUBLICIDADE_MESSAGES = {
  permission: 'Esta página é exclusiva do responsável pela publicidade.',
  saved: 'Alterações enviadas para aprovação.',
  noChanges: 'Altere um dado ou uma imagem antes de salvar.',
};

type FormState = {
  telefone: string;
  slogan: string;
  instagram: string;
  website: string;
  direcionamento: string;
};

type AssetState = Partial<Record<PatrocinadorAssetSlot, PhotoAsset>>;

function pendingOrPublished(pending: string | null | undefined, published: string | null | undefined): string {
  return pending?.trim() || published?.trim() || '';
}

function formFromPatrocinador(patrocinador: Patrocinador): FormState {
  return {
    telefone: pendingOrPublished(patrocinador.telefoneNovo, patrocinador.telefone),
    slogan: pendingOrPublished(patrocinador.sloganNovo, patrocinador.slogan),
    instagram: pendingOrPublished(patrocinador.instagramNovo, patrocinador.instagram),
    website: pendingOrPublished(
      patrocinador.webSiteNovo || patrocinador.websiteNovo,
      patrocinador.website,
    ),
    direcionamento: pendingOrPublished(patrocinador.direcionamentoNovo, patrocinador.direcionamento),
  };
}

export function useGerenciarPublicidadeScreen(user: User | null | undefined, authToken: string | null) {
  const [empresas, setEmpresas] = useState<Patrocinador[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({
    telefone: '',
    slogan: '',
    instagram: '',
    website: '',
    direcionamento: '',
  });
  const [initialForm, setInitialForm] = useState<FormState>(form);
  const [assets, setAssets] = useState<AssetState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickingSlot, setPickingSlot] = useState<PatrocinadorAssetSlot | null>(null);
  const canManageAll = Boolean(user && isUserAdministrador(user));

  const selected = useMemo(
    () => empresas.find((empresa) => empresa.id === selectedId) ?? null,
    [empresas, selectedId],
  );

  const applyEmpresa = useCallback((patrocinador: Patrocinador) => {
    const nextForm = formFromPatrocinador(patrocinador);
    setSelectedId(patrocinador.id);
    setForm(nextForm);
    setInitialForm(nextForm);
    setAssets({});
  }, []);

  const load = useCallback(async () => {
    if (!user?.id) {
      setEmpresas([]);
      setSelectedId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lista = selectPatrocinadoresGerenciaveis(
        await getPatrocinadores(),
        user.id,
        isUserAdministrador(user),
      );
      setEmpresas(lista);

      const current = lista[0] ?? null;

      if (current) {
        applyEmpresa(current);
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
      setEmpresas([]);
      setSelectedId(null);
    } finally {
      setIsLoading(false);
    }
  }, [applyEmpresa, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasTextChanges =
    form.telefone.trim() !== initialForm.telefone.trim() ||
    form.slogan.trim() !== initialForm.slogan.trim() ||
    form.instagram.trim() !== initialForm.instagram.trim() ||
    form.website.trim() !== initialForm.website.trim() ||
    form.direcionamento.trim() !== initialForm.direcionamento.trim();

  const hasImageChanges = Boolean(
    assets.logo || assets.banner || assets.popup || assets.whatsapp,
  );

  const hasChanges = hasTextChanges || hasImageChanges;
  const canAccess = Boolean(user?.id && (isLoading || canManageAll || empresas.length > 0));

  function getAssetPreviewUrl(slot: PatrocinadorAssetSlot): string | null {
    const pending = assets[slot]?.uri;

    if (pending) {
      return pending;
    }

    if (!selected) {
      return null;
    }

    if (slot === 'logo') {
      return getPatrocinadorLogoPreviewUrl(selected);
    }

    if (slot === 'banner') {
      return getPatrocinadorBannerPreviewUrl(selected);
    }

    if (slot === 'popup') {
      return getPatrocinadorPopupPreviewUrl(selected);
    }

    return getPatrocinadorWhatsAppPreviewUrl(selected);
  }

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handlePhotoSelected(asset: PhotoAsset) {
    if (!pickingSlot) {
      return;
    }

    setAssets((current) => ({ ...current, [pickingSlot]: asset }));
    setPickingSlot(null);
  }

  async function submit(): Promise<string | null> {
    if (!selected || !authToken) {
      return GERENCIAR_PUBLICIDADE_MESSAGES.permission;
    }

    if (!hasChanges) {
      return GERENCIAR_PUBLICIDADE_MESSAGES.noChanges;
    }

    const payload: PatrocinadorAlterarDadosPayload = {
      patrocinadoresId: selected.id,
    };

    if (form.telefone.trim() !== initialForm.telefone.trim()) {
      payload.telefoneNovo = form.telefone.trim();
    }

    if (form.slogan.trim() !== initialForm.slogan.trim()) {
      payload.sloganNovo = form.slogan.trim();
    }

    if (form.instagram.trim() !== initialForm.instagram.trim()) {
      payload.instagramNovo = form.instagram.trim();
    }

    if (form.direcionamento.trim() !== initialForm.direcionamento.trim()) {
      payload.direcionamentoNovo = form.direcionamento.trim();
    }

    if (form.website.trim() !== initialForm.website.trim()) {
      payload.webSiteNovo = form.website.trim();
    }

    if (assets.logo) {
      payload.logoTrocar = assets.logo;
    }

    if (assets.banner) {
      payload.bannerTrocar = assets.banner;
    }

    if (assets.popup) {
      payload.popupTelaTrocar = assets.popup;
    }

    if (assets.whatsapp) {
      payload.wzQuadroTrocar = assets.whatsapp;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const atualizado = await patchPatrocinadorAlterarDados(payload, authToken);
      setEmpresas((current) =>
        current.map((empresa) => (empresa.id === atualizado.id ? { ...empresa, ...atualizado } : empresa)),
      );
      applyEmpresa({ ...selected, ...atualizado });
      return null;
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      return message;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    empresas,
    selected,
    form,
    isLoading,
    isSubmitting,
    error,
    canAccess,
    hasChanges,
    pickingSlot,
    setPickingSlot,
    selectEmpresa: applyEmpresa,
    setField,
    getAssetPreviewUrl,
    handlePhotoSelected,
    submit,
  };
}
