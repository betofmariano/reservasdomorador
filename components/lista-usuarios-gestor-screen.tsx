import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AcademiaSelector } from '@/components/academia-selector';
import { AdminTableScrollContainer } from '@/components/admin-table-scroll-container';
import { ExcluirCadastroModal } from '@/components/excluir-cadastro-modal';
import { GestorUsuarioListItemRow } from '@/components/gestor-usuario-list-item';
import { GestorUsuarioStatusFilter } from '@/components/gestor-usuario-status-filter';
import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { UsuarioContatoModal } from '@/components/usuario-contato-modal';
import { UsuarioSuspensaoAtividadeModal } from '@/components/usuario-suspensao-atividade-modal';
import { UsuarioSuspensaoTipoModal } from '@/components/usuario-suspensao-tipo-modal';
import { WebScreenContainer } from '@/components/web-screen-container';
import { WEB_MAX_WIDE_CONTENT_WIDTH } from '@/constants/web-layout';
import { useAppToast } from '@/contexts/app-toast-context';
import { useAuth } from '@/contexts/auth-context';
import { useAcademiaAdminSelection } from '@/hooks/use-academia-admin-selection';
import { getAcademiaById } from '@/services/academias-service';
import {
  LISTA_USUARIOS_GESTOR_MESSAGES,
  useListaUsuariosGestorScreen,
} from '@/hooks/use-lista-usuarios-gestor-screen';
import type { GestorUsuarioListItem } from '@/types/usuario';
import type { Academia } from '@/types/academia';
import { academiaExigeComplemento } from '@/utils/academia-form';
import { CLUB_ADMIN_MESSAGES } from '@/utils/club-config';
import {
  GESTOR_USUARIOS_COMPLEMENTO_COLUMN_WIDTH,
  GESTOR_USUARIOS_FLAG_COLUMN_WIDTH,
  GESTOR_USUARIOS_NOME_COLUMN_WIDTH,
  GESTOR_USUARIOS_SOCIO_COLUMN_WIDTH,
  GESTOR_USUARIOS_TABLE_CENTER_MIN_WIDTH,
  getGestorUsuariosTableWidth,
} from '@/utils/gestor-usuario-table-layout';

const COLORS = {
  background: '#FFFFFF',
  navy: '#3A2154',
  blue: '#0F7A6C',
  error: '#D64545',
  muted: '#5C6475',
  border: '#D5DAE3',
  highlight: '#FFF4D6',
};

const TABLE_HEADER_STYLE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 8,
  paddingVertical: 10,
  paddingHorizontal: 8,
  backgroundColor: COLORS.highlight,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.border,
};

type PendingAction = {
  type:
    | 'approve'
    | 'gestor'
    | 'unset-gestor'
    | 'professor'
    | 'unset-professor'
    | 'delete';
  usuario: GestorUsuarioListItem;
};

export function ListaUsuariosGestorScreen() {
  const router = useRouter();

  const { showToast } = useAppToast();
  const { user, authToken, isLoading: isAuthLoading, signOut } = useAuth();

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [usuarioContato, setUsuarioContato] = useState<GestorUsuarioListItem | null>(null);
  const [isContatoModalVisible, setIsContatoModalVisible] = useState(false);
  const [usuarioSuspensao, setUsuarioSuspensao] = useState<GestorUsuarioListItem | null>(null);
  const [isSuspensaoTipoVisible, setIsSuspensaoTipoVisible] = useState(false);
  const [isSuspensaoAtividadeVisible, setIsSuspensaoAtividadeVisible] = useState(false);
  const [suspensaoError, setSuspensaoError] = useState<string | null>(null);

  const handleUnauthorized = useCallback(async () => {
    await signOut();
    router.replace('/login');
  }, [router, signOut]);

  const {
    availableAcademias,
    selectedAcademiaId,
    isLoadingAcademias,
    academiasLoadError,
    academiaLoadError,
    isAdministrador,
    canManageSelectedAcademia,
    showAcademiaSelector,
    setSelectedAcademiaId,
    fetchAvailableAcademias,
  } = useAcademiaAdminSelection({
    user,
    authToken,
    isAuthLoading,
    onUnauthorized: handleUnauthorized,
  });

  const selectedAcademia = useMemo(
    () => availableAcademias.find((academia) => academia.id === selectedAcademiaId) ?? null,
    [availableAcademias, selectedAcademiaId],
  );
  const [resolvedAcademia, setResolvedAcademia] = useState<Academia | null>(selectedAcademia);

  useEffect(() => {
    if (!selectedAcademiaId || !authToken) {
      setResolvedAcademia(selectedAcademia);
      return;
    }

    let cancelled = false;

    void getAcademiaById(selectedAcademiaId, authToken)
      .then((academia) => {
        if (!cancelled) {
          setResolvedAcademia(academia);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedAcademia(selectedAcademia);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authToken, selectedAcademia, selectedAcademiaId]);

  const academiaConfig = resolvedAcademia ?? selectedAcademia;
  const showSocioColumn = academiaConfig?.tituloSocio === true;
  const showComplemento = academiaExigeComplemento(academiaConfig);
  const showComplementoColumn = showComplemento;
  const showComplementoField = showComplemento;
  const showSocioTituloField = academiaConfig?.tituloSocio === true;
  const tableMinWidth = getGestorUsuariosTableWidth({
    showSocioColumn,
    showComplementoColumn,
    showAdministradorColumn: isAdministrador,
  });

  const isLoadingAcademiaContext = isLoadingAcademias;

  const {
    usuarios,
    totalCount,
    isLoading,
    isRefreshing,
    loadError,
    searchQuery,
    statusFilter,
    sortField,
    sortDirection,
    isActionRunning,
    setSearchQuery,
    setStatusFilter,
    handleNomeSortPress,
    handleUltimaEntradaSortPress,
    fetchUsuarios,
    approveUsuario,
    toggleBlockUsuario,
    blockUsuarioTotal,
    suspendUsuarioAtividade,
    setGestorUsuario,
    setProfessorUsuario,
    deleteUsuario,
    updateUsuarioFoto,
    updateUsuarioExtraFields,
  } = useListaUsuariosGestorScreen({
    user,
    authToken,
    isAuthLoading,
    isAdministrador,
    selectedClubId: selectedAcademiaId,
    canManageSelectedClub: canManageSelectedAcademia,
    isLoadingClubContext: isLoadingAcademiaContext,
    onUnauthorized: handleUnauthorized,
  });

  useEffect(() => {
    if (isAuthLoading || !user || isLoadingAcademias) {
      return;
    }

    if (!isAdministrador && availableAcademias.length === 0 && !academiasLoadError) {
      showToast(CLUB_ADMIN_MESSAGES.permission, { variant: 'error' });
      router.replace('/');
    }
  }, [
    availableAcademias.length,
    academiasLoadError,
    isAdministrador,
    isAuthLoading,
    isLoadingAcademias,
    router,
    showToast,
    user,
  ]);

  function handleContactPress(usuario: GestorUsuarioListItem) {
    setUsuarioContato(usuario);
    setIsContatoModalVisible(true);
  }

  function handleCloseContatoModal() {
    setIsContatoModalVisible(false);
    setUsuarioContato(null);
  }

  function handleUsuarioPhotoUpdated(photoUrl: string | null) {
    if (!usuarioContato) {
      return;
    }

    const updatedUsuario = { ...usuarioContato, foto: photoUrl };
    setUsuarioContato(updatedUsuario);
    updateUsuarioFoto(usuarioContato.userslocalId, photoUrl);
  }

  function handleUsuarioExtraFieldsUpdated(
    values: { complemento?: string; socioTitulo?: string },
  ): Promise<string | null> {
    if (!usuarioContato) {
      return Promise.resolve(LISTA_USUARIOS_GESTOR_MESSAGES.actionError);
    }

    return updateUsuarioExtraFields(usuarioContato, values).then((error) => {
      if (!error) {
        setUsuarioContato((current) =>
          current
            ? {
                ...current,
                complemento: values.complemento ?? current.complemento,
                socio: values.socioTitulo ?? current.socio,
              }
            : current,
        );
      }

      return error;
    });
  }

  function closeSuspensaoModals() {
    if (isActionRunning) {
      return;
    }

    setIsSuspensaoTipoVisible(false);
    setIsSuspensaoAtividadeVisible(false);
    setUsuarioSuspensao(null);
    setSuspensaoError(null);
  }

  async function handleBlockPress(usuario: GestorUsuarioListItem) {
    if (isActionRunning) {
      return;
    }

    if (usuario.bloqueado) {
      const error = await toggleBlockUsuario(usuario);

      if (error) {
        showToast(error, { variant: 'error' });
        return;
      }

      showToast(LISTA_USUARIOS_GESTOR_MESSAGES.unblockSuccess, { variant: 'success' });
      return;
    }

    setSuspensaoError(null);
    setUsuarioSuspensao(usuario);
    setIsSuspensaoTipoVisible(true);
  }

  async function handleSuspensaoTotal() {
    if (!usuarioSuspensao) {
      return;
    }

    setSuspensaoError(null);

    const error = await blockUsuarioTotal(usuarioSuspensao);

    if (error) {
      showToast(error, { variant: 'error' });
      return;
    }

    closeSuspensaoModals();
    showToast(LISTA_USUARIOS_GESTOR_MESSAGES.blockSuccess, { variant: 'success' });
  }

  function handleSuspensaoAtividadeSelect() {
    setSuspensaoError(null);
    setIsSuspensaoTipoVisible(false);
    setIsSuspensaoAtividadeVisible(true);
  }

  async function handleSuspensaoAtividadeConfirm(params: {
    atividadesId: number;
    dias: number;
  }) {
    if (!usuarioSuspensao) {
      return;
    }

    setSuspensaoError(null);

    const error = await suspendUsuarioAtividade(
      usuarioSuspensao,
      params.atividadesId,
      params.dias,
    );

    if (error) {
      setSuspensaoError(error);
      return;
    }

    closeSuspensaoModals();
    showToast(LISTA_USUARIOS_GESTOR_MESSAGES.suspensaoAtividadeSuccess, { variant: 'success' });
  }

  function openAction(type: PendingAction['type'], usuario: GestorUsuarioListItem) {
    if (isActionRunning) {
      return;
    }

    if (type === 'delete' && !canManageSelectedAcademia) {
      return;
    }

    setActionError(null);
    setPendingAction({ type, usuario });
  }

  function closeActionModal() {
    if (isActionRunning) {
      return;
    }

    setPendingAction(null);
    setActionError(null);
  }

  async function handleConfirmAction() {
    if (!pendingAction) {
      return;
    }

    setActionError(null);

    let error: string | null = null;
    let successMessage = '';

    switch (pendingAction.type) {
      case 'approve':
        error = await approveUsuario(pendingAction.usuario);
        successMessage = LISTA_USUARIOS_GESTOR_MESSAGES.approveSuccess;
        break;
      case 'gestor':
        error = await setGestorUsuario(pendingAction.usuario, true);
        successMessage = LISTA_USUARIOS_GESTOR_MESSAGES.gestorSuccess;
        break;
      case 'unset-gestor':
        error = await setGestorUsuario(pendingAction.usuario, false);
        successMessage = LISTA_USUARIOS_GESTOR_MESSAGES.unsetGestorSuccess;
        break;
      case 'professor':
        error = await setProfessorUsuario(pendingAction.usuario, true);
        successMessage = LISTA_USUARIOS_GESTOR_MESSAGES.professorSuccess;
        break;
      case 'unset-professor':
        error = await setProfessorUsuario(pendingAction.usuario, false);
        successMessage = LISTA_USUARIOS_GESTOR_MESSAGES.unsetProfessorSuccess;
        break;
      case 'delete':
        error = await deleteUsuario(pendingAction.usuario);
        successMessage = LISTA_USUARIOS_GESTOR_MESSAGES.deleteSuccess;
        break;
    }

    if (error) {
      setActionError(error);
      return;
    }

    setPendingAction(null);
    showToast(successMessage, { variant: 'success' });
  }

  function getActionModalCopy(action: PendingAction | null) {
    if (!action) {
      return { title: '', message: '', confirmLabel: 'Confirmar', confirmDestructive: false };
    }

    switch (action.type) {
      case 'approve':
        return {
          title: LISTA_USUARIOS_GESTOR_MESSAGES.approveTitle,
          message: LISTA_USUARIOS_GESTOR_MESSAGES.approveMessage,
          confirmLabel: 'Aprovar',
          confirmDestructive: false,
        };
      case 'gestor':
        return {
          title: LISTA_USUARIOS_GESTOR_MESSAGES.gestorTitle,
          message: LISTA_USUARIOS_GESTOR_MESSAGES.gestorMessage,
          confirmLabel: 'Definir gestor',
          confirmDestructive: false,
        };
      case 'unset-gestor':
        return {
          title: LISTA_USUARIOS_GESTOR_MESSAGES.unsetGestorTitle,
          message: LISTA_USUARIOS_GESTOR_MESSAGES.unsetGestorMessage,
          confirmLabel: 'Remover gestor',
          confirmDestructive: false,
        };
      case 'professor':
        return {
          title: LISTA_USUARIOS_GESTOR_MESSAGES.professorTitle,
          message: LISTA_USUARIOS_GESTOR_MESSAGES.professorMessage,
          confirmLabel: 'Definir professor',
          confirmDestructive: false,
        };
      case 'unset-professor':
        return {
          title: LISTA_USUARIOS_GESTOR_MESSAGES.unsetProfessorTitle,
          message: LISTA_USUARIOS_GESTOR_MESSAGES.unsetProfessorMessage,
          confirmLabel: 'Remover professor',
          confirmDestructive: false,
        };
      case 'delete':
        return {
          title: LISTA_USUARIOS_GESTOR_MESSAGES.deleteTitle,
          message: LISTA_USUARIOS_GESTOR_MESSAGES.deleteMessage,
          confirmLabel: 'Excluir',
          confirmDestructive: true,
        };
    }
  }

  if (isAuthLoading || !user) {
    return (
      <SafeAreaView style={styles.loadingSafeArea} edges={['top', 'left', 'right']}>
        <WebScreenContainer maxWidth={WEB_MAX_WIDE_CONTENT_WIDTH}>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={COLORS.blue} />
          </View>
        </WebScreenContainer>
      </SafeAreaView>
    );
  }

  const showList =
    !isLoadingAcademiaContext &&
    canManageSelectedAcademia &&
    !isLoading &&
    !loadError &&
    usuarios.length > 0;

  const modalCopy = getActionModalCopy(pendingAction);

  const nomeHeaderLabel = `Nome${
    isAdministrador && sortField === 'nome' ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''
  }`;

  const ultimaEntradaHeaderLabel = `Última Entrada${
    isAdministrador && sortField === 'ultimaEntrada'
      ? sortDirection === 'desc'
        ? ' ↓'
        : ' ↑'
      : ''
  }`;

  const tableHeader = (
    <View style={[styles.tableHeader, { width: tableMinWidth, minWidth: tableMinWidth }]}>
      {isAdministrador ? (
        <Pressable
          style={[styles.colNomeHeader, { width: GESTOR_USUARIOS_NOME_COLUMN_WIDTH }]}
          onPress={handleNomeSortPress}
          hitSlop={8}>
          <Text
            style={[
              styles.tableHeaderText,
              sortField === 'nome' && styles.tableHeaderTextActive,
            ]}>
            {nomeHeaderLabel}
          </Text>
        </Pressable>
      ) : (
        <Text
          style={[
            styles.tableHeaderText,
            styles.colNome,
            { width: GESTOR_USUARIOS_NOME_COLUMN_WIDTH },
          ]}>
          Nome
        </Text>
      )}
      <Text style={[styles.tableHeaderText, styles.colTelefone]}>Telefone</Text>
      {showSocioColumn ? (
        <Text
          style={[
            styles.tableHeaderText,
            styles.colSocio,
            { width: GESTOR_USUARIOS_SOCIO_COLUMN_WIDTH },
          ]}>
          Sócio
        </Text>
      ) : null}
      {showComplementoColumn ? (
        <Text
          style={[
            styles.tableHeaderText,
            styles.colComplemento,
            { width: GESTOR_USUARIOS_COMPLEMENTO_COLUMN_WIDTH },
          ]}>
          Complemento
        </Text>
      ) : null}
      <Text
        style={[
          styles.tableHeaderText,
          styles.colFlag,
          { width: GESTOR_USUARIOS_FLAG_COLUMN_WIDTH },
        ]}>
        Prof
      </Text>
      {isAdministrador ? (
        <Text
          style={[
            styles.tableHeaderText,
            styles.colFlag,
            { width: GESTOR_USUARIOS_FLAG_COLUMN_WIDTH },
          ]}>
          Adm
        </Text>
      ) : null}
      <Text style={[styles.tableHeaderText, styles.colFlag]}>Gestor</Text>
      <Text style={[styles.tableHeaderText, styles.colFlag]}>Aprov</Text>
      <Text style={[styles.tableHeaderText, styles.colFlag]}>Bloq</Text>
      <Text
        style={[
          styles.tableHeaderText,
          styles.colActions,
          !isAdministrador && styles.colActionsCompact,
        ]}>
        Ações
      </Text>
      {isAdministrador ? (
        <Pressable
          style={styles.colUltimaEntradaHeader}
          onPress={handleUltimaEntradaSortPress}
          hitSlop={8}>
          <Text
            style={[
              styles.tableHeaderText,
              styles.colUltimaEntradaHeaderText,
              sortField === 'ultimaEntrada' && styles.tableHeaderTextActive,
            ]}>
            {ultimaEntradaHeaderLabel}
          </Text>
        </Pressable>
      ) : (
        <Text style={[styles.tableHeaderText, styles.colUltimaEntradaHeaderText, styles.colUltimaEntradaHeaderStatic]}>
          Última Entrada
        </Text>
      )}
    </View>
  );

  const currentUserId = user.id;

  function renderListItem({ item }: { item: GestorUsuarioListItem }) {
    const isCurrentUser = item.usersId === currentUserId;

    return (
      <GestorUsuarioListItemRow
        usuario={item}
        isCurrentUser={isCurrentUser}
        showDeleteButton={canManageSelectedAcademia}
        showSocioColumn={showSocioColumn}
        showComplementoColumn={showComplementoColumn}
        showAdministradorColumn={isAdministrador}
        tableWidth={tableMinWidth}
        disabled={isActionRunning}
        onApprovePress={() => openAction('approve', item)}
        onBlockPress={() => void handleBlockPress(item)}
        onGestorPress={() =>
          openAction(item.gestor ? 'unset-gestor' : 'gestor', item)
        }
        onProfessorPress={() =>
          openAction(item.professor ? 'unset-professor' : 'professor', item)
        }
        onDeletePress={() => openAction('delete', item)}
        onContactPress={() => handleContactPress(item)}
      />
    );
  }

  const listElement = (
    <FlatList
      style={[styles.list, { width: tableMinWidth }]}
      data={showList ? usuarios : []}
      keyExtractor={(item) => String(item.userslocalId)}
      ListHeaderComponent={showList ? tableHeader : null}
      renderItem={renderListItem}
      contentContainerStyle={[styles.scrollContent, { minWidth: tableMinWidth }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => void fetchUsuarios({ refreshing: true })}
          tintColor={COLORS.blue}
          colors={[COLORS.blue]}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );

  function renderMainContent() {
    if (isLoadingAcademias) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      );
    }

    if (academiasLoadError) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{academiasLoadError}</Text>
          <Pressable style={styles.retryButton} onPress={() => void fetchAvailableAcademias()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    if (!isAdministrador && availableAcademias.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>{CLUB_ADMIN_MESSAGES.permission}</Text>
        </View>
      );
    }

    if (academiaLoadError) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{academiaLoadError}</Text>
        </View>
      );
    }

    if (!canManageSelectedAcademia) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>{LISTA_USUARIOS_GESTOR_MESSAGES.permission}</Text>
        </View>
      );
    }

    if (isLoading && !isRefreshing) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      );
    }

    if (loadError) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable style={styles.retryButton} onPress={() => void fetchUsuarios()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    if (usuarios.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>{LISTA_USUARIOS_GESTOR_MESSAGES.empty}</Text>
        </View>
      );
    }

    return (
      <AdminTableScrollContainer
        minWidth={tableMinWidth}
        centerWhenScreenWiderThan={GESTOR_USUARIOS_TABLE_CENTER_MIN_WIDTH}>
        {listElement}
      </AdminTableScrollContainer>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebScreenContainer maxWidth={WEB_MAX_WIDE_CONTENT_WIDTH} style={styles.screenContainer}>
        <ScreenHeader user={user} title={'Lista de\nUsuários'} />
        <ScreenHeaderDivider />

        <View style={styles.toolbar}>
          {showAcademiaSelector ? (
            <AcademiaSelector
              academias={availableAcademias}
              value={selectedAcademiaId}
              onChange={setSelectedAcademiaId}
              isLoading={isLoadingAcademias}
              error={academiasLoadError}
              onRetry={() => void fetchAvailableAcademias()}
              disabled={isLoading && !isRefreshing}
              label="Local"
              placeholder="Selecione o local"
              modalTitle="Selecione o local"
            />
          ) : selectedAcademia ? (
            <View style={styles.readonlyLocalField}>
              <Text style={styles.readonlyLocalLabel}>Local</Text>
              <Text style={styles.readonlyLocalValue}>{selectedAcademia.nome}</Text>
            </View>
          ) : null}

          <GestorUsuarioStatusFilter
            value={statusFilter}
            onChange={setStatusFilter}
            disabled={(isLoading && !isRefreshing) || !canManageSelectedAcademia}
          />

          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Procurar..."
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            autoCorrect={false}
            editable={canManageSelectedAcademia}
          />

          <Text style={styles.countText}>Quantidade de Usuários: {totalCount}</Text>
        </View>

        <View style={styles.listContainer}>{renderMainContent()}</View>

        <ExcluirCadastroModal
          visible={pendingAction != null}
          title={modalCopy.title}
          message={modalCopy.message}
          confirmLabel={modalCopy.confirmLabel}
          confirmDestructive={modalCopy.confirmDestructive}
          isDeleting={isActionRunning}
          errorMessage={actionError}
          onClose={closeActionModal}
          onConfirm={() => void handleConfirmAction()}
        />

        <UsuarioSuspensaoTipoModal
          visible={isSuspensaoTipoVisible}
          isSubmitting={isActionRunning}
          onClose={closeSuspensaoModals}
          onSelectTotal={() => void handleSuspensaoTotal()}
          onSelectAtividade={handleSuspensaoAtividadeSelect}
        />

        <UsuarioSuspensaoAtividadeModal
          visible={isSuspensaoAtividadeVisible}
          usuario={usuarioSuspensao}
          academiasId={selectedAcademiaId}
          authToken={authToken}
          isSubmitting={isActionRunning}
          errorMessage={suspensaoError}
          onClose={closeSuspensaoModals}
          onConfirm={(params) => void handleSuspensaoAtividadeConfirm(params)}
        />

        <UsuarioContatoModal
          visible={isContatoModalVisible}
          usuario={
            usuarioContato
              ? {
                  id: usuarioContato.usersId,
                  userslocalId: usuarioContato.userslocalId,
                  nome: usuarioContato.nome,
                  foto: null,
                  telefoneLimpo: usuarioContato.telefoneLimpo,
                }
              : null
          }
          photoSize={120}
          showPhone
          allowPhotoChange
          authToken={authToken}
          loadPhotoOnOpen
          showComplementoField={showComplementoField}
          showSocioTituloField={showSocioTituloField}
          complemento={usuarioContato?.complemento ?? ''}
          socioTitulo={usuarioContato?.socio ?? ''}
          allowFieldEdit={canManageSelectedAcademia}
          onSaveExtraFields={handleUsuarioExtraFieldsUpdated}
          onPhotoUpdated={handleUsuarioPhotoUpdated}
          onClose={handleCloseContatoModal}
        />
      </WebScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingSafeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  toolbar: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  readonlyLocalField: {
    gap: 6,
  },
  readonlyLocalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
  },
  readonlyLocalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.navy,
  },
  countText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
  },
  searchInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.navy,
    backgroundColor: COLORS.background,
  },
  tableHeader: TABLE_HEADER_STYLE,
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  colNome: {
    flexShrink: 0,
  },
  colNomeHeader: {
    flexShrink: 0,
    justifyContent: 'center',
  },
  colTelefone: {
    width: 130,
    flexShrink: 0,
  },
  colSocio: {
    flexShrink: 0,
  },
  colComplemento: {
    flexShrink: 0,
  },
  colFlag: {
    width: 42,
    flexShrink: 0,
    textAlign: 'center',
  },
  colActions: {
    width: 140,
    flexShrink: 0,
    textAlign: 'center',
  },
  colActionsCompact: {
    width: 106,
  },
  colUltimaEntradaHeader: {
    width: 120,
    flexShrink: 0,
    justifyContent: 'center',
  },
  colUltimaEntradaHeaderStatic: {
    width: 120,
    flexShrink: 0,
  },
  colUltimaEntradaHeaderText: {
    textAlign: 'left',
  },
  tableHeaderTextActive: {
    color: COLORS.blue,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    minHeight: 200,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.error,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.blue,
    textDecorationLine: 'underline',
  },
});
