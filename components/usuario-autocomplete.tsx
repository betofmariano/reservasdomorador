import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { UserAvatar } from '@/components/user-avatar';
import {
  createClubUsersCache,
  searchClubUsers,
  type ClubUsersCache,
} from '@/services/club-users-service';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import type { ClubUserOption, SelectedClubUser } from '@/types/game-players';

type UsuarioAutocompleteProps = {
  label: string;
  academiasId: number;
  authToken: string;
  selectedUser: SelectedClubUser | null;
  excludedUserIds: number[];
  onSelect: (user: SelectedClubUser) => void;
  onDuplicateAttempt?: () => void;
  onClear?: () => void;
  cache?: ClubUsersCache;
};

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  error: '#D64545',
  success: '#1F8A4C',
  muted: '#5C6475',
  border: '#D5DAE3',
  resultBg: '#FFFFFF',
};

const SEARCH_ERROR_MESSAGE = 'Não foi possível buscar os usuários deste clube.';
const EMPTY_MESSAGE = 'Nenhum usuário encontrado neste clube.';
const DEBOUNCE_MS = 400;

export function UsuarioAutocomplete({
  label,
  academiasId,
  authToken,
  selectedUser,
  excludedUserIds,
  onSelect,
  onDuplicateAttempt,
  onClear,
  cache: externalCache,
}: UsuarioAutocompleteProps) {
  const [query, setQuery] = useState(selectedUser?.nome ?? '');
  const [results, setResults] = useState<ClubUserOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cacheRef = useRef<ClubUsersCache>(externalCache ?? createClubUsersCache());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setQuery(selectedUser?.nome ?? '');
  }, [selectedUser?.users_id, selectedUser?.nome]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function handleChangeText(text: string) {
    setQuery(text);
    setErrorMessage(null);

    if (selectedUser && text !== selectedUser.nome) {
      onClear?.();
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    setShowResults(true);
    setIsSearching(true);

    debounceRef.current = setTimeout(() => {
      void runSearch(text);
    }, DEBOUNCE_MS);
  }

  async function runSearch(term: string) {
    const requestId = ++requestIdRef.current;

    try {
      const found = await searchClubUsers(academiasId, term, authToken, cacheRef.current);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setResults(found);
      setErrorMessage(null);
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const message =
        error instanceof ApiError && error.message.includes('conectar')
          ? error.message
          : getApiErrorMessage(error) || SEARCH_ERROR_MESSAGE;

      setResults([]);
      setErrorMessage(message.includes('conectar') ? message : SEARCH_ERROR_MESSAGE);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsSearching(false);
      }
    }
  }

  function handleSelectUser(user: ClubUserOption) {
    if (excludedUserIds.includes(user.users_id)) {
      onDuplicateAttempt?.();
      return;
    }

    Keyboard.dismiss();
    setQuery(user.nome);
    setShowResults(false);
    setResults([]);
    onSelect({
      users_id: user.users_id,
      nome: user.nome,
    });
  }

  const shouldShowDropdown = showResults && query.trim().length >= 3;
  const hasSelectedUser = selectedUser !== null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, hasSelectedUser && styles.inputSelected]}
          value={query}
          onChangeText={handleChangeText}
          placeholder="Digite ao menos 3 letras"
          placeholderTextColor="#9AA0A6"
          autoCapitalize="words"
          autoCorrect={false}
          onFocus={() => {
            if (query.trim().length >= 3) {
              setShowResults(true);
            }
          }}
        />
        {isSearching ? (
          <ActivityIndicator size="small" color={COLORS.blue} style={styles.inputSpinner} />
        ) : null}
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {shouldShowDropdown ? (
        <View style={styles.dropdown}>
          {!isSearching && results.length === 0 && !errorMessage ? (
            <Text style={styles.emptyText}>{EMPTY_MESSAGE}</Text>
          ) : (
            <ScrollView
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled>
              {results.map((user) => (
                <Pressable
                  key={user.users_id}
                  style={styles.resultItem}
                  onPress={() => handleSelectUser(user)}>
                  <UserAvatar
                    name={user.nome}
                    photoUrl={user.foto}
                    size={36}
                    shape="rounded-rect"
                  />
                  <View style={styles.resultTextBlock}>
                    <Text style={styles.resultName} numberOfLines={2}>
                      {user.nome}
                    </Text>
                    {user.matricula ? (
                      <Text style={styles.resultMeta} numberOfLines={1}>
                        Matrícula: {user.matricula}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
    zIndex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingRight: 40,
    fontSize: 16,
    color: COLORS.navy,
    backgroundColor: COLORS.resultBg,
  },
  inputSelected: {
    color: COLORS.success,
    fontWeight: '700',
  },
  inputSpinner: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  dropdown: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.resultBg,
    maxHeight: 180,
    overflow: 'hidden',
  },
  resultsList: {
    maxHeight: 180,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F6',
  },
  resultTextBlock: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
  },
  resultMeta: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    marginTop: 6,
  },
});
