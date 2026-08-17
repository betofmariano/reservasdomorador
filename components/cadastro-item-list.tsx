import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { MATCHPOINT_COLORS } from '@/constants/theme';

type CadastroItemListProps<T> = {
  items: T[];
  keyExtractor: (item: T) => string;
  getLabel: (item: T) => string;
  onDeletePress: (item: T) => void;
  onEditPress?: (item: T) => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  emptyMessage: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  deleteDisabled?: boolean;
  editDisabled?: boolean;
};

const COLORS = {
  navy: MATCHPOINT_COLORS.navy,
  blue: MATCHPOINT_COLORS.blue,
  border: MATCHPOINT_COLORS.borderLight,
  error: MATCHPOINT_COLORS.error,
  muted: MATCHPOINT_COLORS.muted,
};

export function CadastroItemList<T>({
  items,
  keyExtractor,
  getLabel,
  onDeletePress,
  onEditPress,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  emptyMessage,
  errorMessage = null,
  onRetry,
  deleteDisabled = false,
  editDisabled = false,
}: CadastroItemListProps<T>) {
  const { width } = useWindowDimensions();
  const isWide = width >= WEB_MAX_CONTENT_WIDTH;

  if (isLoading && items.length === 0) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={COLORS.blue} />
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        {onRetry ? (
          <Pressable style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={keyExtractor}
      scrollEnabled={false}
      contentContainerStyle={[
        styles.listContent,
        isWide && styles.listContentWide,
        items.length === 0 && styles.listContentEmpty,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.blue}
            colors={[COLORS.blue]}
          />
        ) : undefined
      }
      ListEmptyComponent={
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.label}>{getLabel(item)}</Text>
          <View style={styles.actions}>
            {onEditPress ? (
              <Pressable
                style={[styles.actionButton, editDisabled && styles.actionButtonDisabled]}
                onPress={() => onEditPress(item)}
                disabled={editDisabled}
                accessibilityLabel="Editar">
                <Ionicons name="create-outline" size={18} color={COLORS.blue} />
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.actionButton, deleteDisabled && styles.actionButtonDisabled]}
              onPress={() => onDeletePress(item)}
              disabled={deleteDisabled}
              accessibilityLabel="Excluir">
              <Ionicons name="trash-outline" size={18} color={COLORS.blue} />
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  listContentWide: {
    maxWidth: 210,
    alignSelf: 'center',
    width: '100%',
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  actionButton: {
    padding: 4,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    minHeight: 120,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.muted,
    fontWeight: '600',
    textAlign: 'center',
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
