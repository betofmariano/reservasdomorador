import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Acesso } from '@/types/acesso';
import {
  formatAcessoCreatedAt,
  getAcessoPhotoUrl,
  isFotoAlteracaoAcesso,
} from '@/utils/acesso-format';

const TABLE_ROW_WIDTH_ACESSOS = 1090;
const TABLE_ROW_WIDTH_LOGINS = 1082;
const COL_NOME_WIDTH = 221;
const COL_PAGINA_WIDTH = 237;
const COL_ROTINA_WIDTH = 234;

type AcessoListItemProps = {
  acesso: Acesso;
  variant?: 'acessos' | 'logins';
  swapPaginaRotinaColumns?: boolean;
  onPress: () => void;
  onDeletePress: () => void;
};

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  border: '#E2E6EE',
};

function renderPaginaCell(acesso: Acesso) {
  const photoUrl = getAcessoPhotoUrl(acesso);

  if (photoUrl && isFotoAlteracaoAcesso(acesso)) {
    return (
      <Pressable
        style={styles.colPagina}
        onPress={() => {
          void Linking.openURL(photoUrl);
        }}
        hitSlop={8}>
        <Text style={[styles.tableCell, styles.linkCell]} numberOfLines={1}>
          Ver foto
        </Text>
      </Pressable>
    );
  }

  return (
    <Text style={[styles.tableCell, styles.colPagina]} numberOfLines={1}>
      {acesso.pagina || '—'}
    </Text>
  );
}

export function AcessoListItem({
  acesso,
  variant = 'logins',
  swapPaginaRotinaColumns = false,
  onPress,
  onDeletePress,
}: AcessoListItemProps) {
  const createdLabel = formatAcessoCreatedAt(acesso.created_at);
  const isAcessosVariant = variant === 'acessos';
  const rowWidth = isAcessosVariant ? TABLE_ROW_WIDTH_ACESSOS : TABLE_ROW_WIDTH_LOGINS;

  return (
    <Pressable style={[styles.tableRow, { width: rowWidth, minWidth: rowWidth }]} onPress={onPress}>
      <Pressable style={styles.deleteButton} onPress={onDeletePress} hitSlop={8}>
        <Ionicons name="trash-outline" size={20} color={COLORS.blue} />
      </Pressable>

      <Text style={[styles.tableCell, styles.colCreated]} numberOfLines={1}>
        {createdLabel}
      </Text>
      <Text style={[styles.tableCell, styles.colLocal]} numberOfLines={1}>
        {acesso.local || '—'}
      </Text>
      <Text style={[styles.tableCell, styles.colNome]} numberOfLines={1}>
        {acesso.nome || '—'}
      </Text>
      {swapPaginaRotinaColumns ? (
        <>
          <Text style={[styles.tableCell, styles.colRotina]} numberOfLines={1}>
            {acesso.rotina || '—'}
          </Text>
          {renderPaginaCell(acesso)}
        </>
      ) : (
        <>
          {renderPaginaCell(acesso)}
          <Text style={[styles.tableCell, styles.colRotina]} numberOfLines={1}>
            {acesso.rotina || '—'}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableCell: {
    fontSize: 13,
    color: COLORS.navy,
  },
  linkCell: {
    color: COLORS.blue,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  colCreated: {
    width: 148,
    flexShrink: 0,
  },
  colLocal: {
    width: 150,
    flexShrink: 0,
  },
  colNome: {
    width: COL_NOME_WIDTH,
    flexShrink: 0,
  },
  colPagina: {
    width: COL_PAGINA_WIDTH,
    flexShrink: 0,
  },
  colRotina: {
    width: COL_ROTINA_WIDTH,
    flexShrink: 0,
  },
  deleteButton: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
