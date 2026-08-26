import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader, ScreenHeaderDivider } from '@/components/screen-header';
import { UsuarioContatoModal } from '@/components/usuario-contato-modal';
import { UsuarioListItemRow } from '@/components/usuario-list-item';
import { useAuth } from '@/contexts/auth-context';
import { useUserContext } from '@/contexts/user-context';
import { getAcademias } from '@/services/academias-service';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import { getUsuariosLocal, mapUsersLocalToClubList } from '@/services/usuarios-service';
import type { Academia } from '@/types/academia';
import type { UsuarioListItem } from '@/types/usuario';
import { matchesSearchText } from '@/utils/search-text';

const COLORS = {
  background: '#FFFFFF',
  navy: '#3A2154',
  blue: '#0F7A6C',
  error: '#D64545',
  muted: '#5C6475',
  border: '#D5DAE3',
};

const LOCAIS_ERROR_MESSAGE = 'Não foi possível carregar seus locais.';
const USERS_ERROR_MESSAGE = 'Não foi possível carregar os usuários.';
const EMPTY_MESSAGE = 'Não foram encontrados usuários.';
const SEARCH_DEBOUNCE_MS = 400;

export default function UsuariosScreen() {
  const router = useRouter();
  const { user, authToken, isLoading: isAuthLoading, signOut } = useAuth();
  const { effectiveAcademiasId, currentAcademia, permissions, isLoading: isContextLoading } =
    useUserContext();

  const [availableAcademias, setAvailableAcademias] = useState<Academia[]>([]);
  const [isLoadingLocais, setIsLoadingLocais] = useState(true);
  const [locaisError, setLocaisError] = useState<string | null>(null);

  const [usuarios, setUsuarios] = useState<UsuarioListItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioListItem | null>(null);
  const [isContatoModalVisible, setIsContatoModalVisible] = useState(false);

  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUnauthorized = useCallback(async () => {
    await signOut();
    router.replace('/login');
  }, [router, signOut]);

  const showLocalSelector = false;
  const selectedAcademiaId = effectiveAcademiasId;
  const localNome = currentAcademia?.nome ?? null;
  const hasAssociatedLocais = selectedAcademiaId != null && permissions.podeUsarLocal;

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((usuario) => matchesSearchText(usuario.nome, debouncedSearchQuery));
  }, [debouncedSearchQuery, usuarios]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const loadAvailableLocais = useCallback(async () => {
    if (isContextLoading) {
      setIsLoadingLocais(true);
      return;
    }

    if (!user?.id || !effectiveAcademiasId || !permissions.podeUsarLocal) {
      setAvailableAcademias([]);
      setIsLoadingLocais(false);
      return;
    }

    setIsLoadingLocais(true);
    setLocaisError(null);

    try {
      const academias = await getAcademias();
      const academia = academias.find((item) => item.id === effectiveAcademiasId) ?? null;

      setAvailableAcademias(academia ? [academia] : []);

      if (!academia) {
        setUsuarios([]);
      }
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        await handleUnauthorized();
        return;
      }

      setLocaisError(LOCAIS_ERROR_MESSAGE);
      setAvailableAcademias([]);
      setUsuarios([]);
    } finally {
      setIsLoadingLocais(false);
    }
  }, [
    effectiveAcademiasId,
    handleUnauthorized,
    isContextLoading,
    permissions.podeUsarLocal,
    user?.id,
  ]);

  const fetchUsuarios = useCallback(
    async (options?: { refreshing?: boolean }) => {
      if (!selectedAcademiaId || !authToken || isLoadingLocais) {
        setIsLoadingUsers(false);
        setIsRefreshing(false);
        return;
      }

      const currentRequestId = ++requestIdRef.current;

      if (options?.refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoadingUsers(true);
      }

      setUsersError(null);

      try {
        const data = await getUsuariosLocal(authToken, selectedAcademiaId, {
          force: options?.refreshing,
        });

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        const mapped = mapUsersLocalToClubList(data, selectedAcademiaId);
        setUsuarios(mapped);
        console.log('Quantidade de usuários:', mapped.length);
      } catch (error) {
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await handleUnauthorized();
          return;
        }

        const message = getApiErrorMessage(error);
        setUsersError(message.includes('conectar') ? message : USERS_ERROR_MESSAGE);
        setUsuarios([]);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoadingUsers(false);
          setIsRefreshing(false);
        }
      }
    },
    [authToken, handleUnauthorized, isLoadingLocais, selectedAcademiaId],
  );

  useEffect(() => {
    if (isAuthLoading || isContextLoading || !user?.id) {
      return;
    }

    void loadAvailableLocais();
  }, [isAuthLoading, isContextLoading, loadAvailableLocais, user?.id]);

  useEffect(() => {
    if (isAuthLoading || isContextLoading || !user?.id || !authToken || isLoadingLocais || !selectedAcademiaId) {
      return;
    }

    void fetchUsuarios();
  }, [
    authToken,
    fetchUsuarios,
    isAuthLoading,
    isContextLoading,
    isLoadingLocais,
    selectedAcademiaId,
    user?.id,
  ]);

  function handleUsuarioPress(usuario: UsuarioListItem) {
    console.log('Usuário selecionado:', Boolean(usuario?.id));
    setUsuarioSelecionado(usuario);
    setIsContatoModalVisible(true);
  }

  function handleCloseContatoModal() {
    setIsContatoModalVisible(false);
    setUsuarioSelecionado(null);
  }

  if (isAuthLoading || !user) {
    return (
      <SafeAreaView style={styles.loadingSafeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      </SafeAreaView>
    );
  }

  function renderContent() {
    if (isLoadingLocais) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      );
    }

    if (locaisError) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{locaisError}</Text>
          <Pressable style={styles.retryButton} onPress={() => void loadAvailableLocais()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    if (!hasAssociatedLocais) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>Você não está associado a nenhum local.</Text>
        </View>
      );
    }

    if (isLoadingUsers && !isRefreshing) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      );
    }

    if (usersError) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{usersError}</Text>
          <Pressable style={styles.retryButton} onPress={() => void fetchUsuarios()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    if (filteredUsuarios.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>{EMPTY_MESSAGE}</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredUsuarios}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <UsuarioListItemRow usuario={item} onPress={handleUsuarioPress} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void fetchUsuarios({ refreshing: true })}
            tintColor={COLORS.blue}
            colors={[COLORS.blue]}
          />
        }
        keyboardShouldPersistTaps="handled"
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader
        user={user}
        title="Lista de Usuários"
      />
      <ScreenHeaderDivider />

      {localNome ? (
        <View style={styles.localSelectorContainer}>
          <Text style={styles.localTitle}>{localNome}</Text>
        </View>
      ) : null}

      {hasAssociatedLocais && !isLoadingLocais && !locaisError ? (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={COLORS.blue} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Pesquisar por nome"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="words"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      ) : null}

      <View style={styles.listContainer}>{renderContent()}</View>

      <UsuarioContatoModal
        visible={isContatoModalVisible}
        usuario={usuarioSelecionado}
        authToken={authToken}
        loadPhotoOnOpen
        onClose={handleCloseContatoModal}
      />
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
  listContainer: {
    flex: 1,
  },
  localSelectorContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  localTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.blue,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.navy,
    paddingVertical: 8,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
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
