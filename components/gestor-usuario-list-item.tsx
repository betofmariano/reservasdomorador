import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LogadoBooleanCell } from '@/components/logado-boolean-cell';
import { UserAvatar } from '@/components/user-avatar';
import type { GestorUsuarioListItem } from '@/types/usuario';
import {
  GESTOR_USUARIOS_ACTIONS_COLUMN_WIDTH,
  GESTOR_USUARIOS_ENDERECO_COLUMN_WIDTH,
  GESTOR_USUARIOS_FLAG_COLUMN_WIDTH,
  GESTOR_USUARIOS_NOME_COLUMN_WIDTH,
  GESTOR_USUARIOS_TABLE_COLUMN_GAP,
  GESTOR_USUARIOS_TABLE_HORIZONTAL_PADDING,
  GESTOR_USUARIOS_TELEFONE_COLUMN_WIDTH,
  GESTOR_USUARIOS_ULTIMA_ENTRADA_COLUMN_WIDTH,
} from '@/utils/gestor-usuario-table-layout';

type GestorUsuarioListItemRowProps = {
  usuario: GestorUsuarioListItem;
  isCurrentUser: boolean;
  tableWidth: number;
  disabled?: boolean;
  onApprovePress: () => void;
  onBlockPress: () => void;
  onGestorPress: () => void;
  onDeletePress: () => void;
  onContactPress: () => void;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  muted: '#5C6475',
  border: '#E2E6EE',
  danger: '#D64545',
  approve: '#1F8A4C',
  gestor: '#0F7A6C',
};

export function GestorUsuarioListItemRow({
  usuario,
  isCurrentUser,
  tableWidth,
  disabled = false,
  onApprovePress,
  onBlockPress,
  onGestorPress,
  onDeletePress,
  onContactPress,
}: GestorUsuarioListItemRowProps) {
  const isDisabled = disabled || isCurrentUser;

  return (
    <View style={[styles.tableRow, { width: tableWidth, minWidth: tableWidth }]}>
      <View style={[styles.colNome, { width: GESTOR_USUARIOS_NOME_COLUMN_WIDTH }]}>
        <UserAvatar name={usuario.nome} photoUrl={null} size={40} />
        <Pressable
          style={styles.nomePressable}
          onPress={(event) => {
            event.stopPropagation();
            onContactPress();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Contato de ${usuario.nome}`}>
          <Text style={styles.nomeText} numberOfLines={1}>
            {usuario.nome}
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.tableCell, styles.colTelefone]} numberOfLines={1}>
        {usuario.telefone || '—'}
      </Text>

      <Text
        style={[
          styles.tableCell,
          styles.colEndereco,
          { width: GESTOR_USUARIOS_ENDERECO_COLUMN_WIDTH },
        ]}
        numberOfLines={1}>
        {usuario.endereco || '—'}
      </Text>

      <View style={styles.colFlag}>
        <LogadoBooleanCell value={usuario.gestor} />
      </View>

      <View style={styles.colFlag}>
        <LogadoBooleanCell value={usuario.aprovado} />
      </View>

      <View style={styles.colFlag}>
        <LogadoBooleanCell value={usuario.bloqueado} />
      </View>

      <View style={styles.actionsCell}>
        <Pressable
          style={styles.actionButton}
          onPress={(event) => {
            event.stopPropagation();
            onBlockPress();
          }}
          disabled={isDisabled}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            usuario.bloqueado ? `Desbloquear ${usuario.nome}` : `Bloquear ${usuario.nome}`
          }>
          <Ionicons
            name="ban"
            size={20}
            color={isDisabled ? COLORS.muted : usuario.bloqueado ? COLORS.approve : COLORS.danger}
          />
        </Pressable>

        {!usuario.aprovado ? (
          <Pressable
            style={styles.actionButton}
            onPress={(event) => {
              event.stopPropagation();
              onApprovePress();
            }}
            disabled={isDisabled}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Aprovar ${usuario.nome}`}>
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={isDisabled ? COLORS.muted : COLORS.approve}
            />
          </Pressable>
        ) : (
          <Pressable
            style={styles.actionButton}
            onPress={(event) => {
              event.stopPropagation();
              onGestorPress();
            }}
            disabled={isDisabled}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              usuario.gestor ? `Remover gestor ${usuario.nome}` : `Definir gestor ${usuario.nome}`
            }>
            <Ionicons
              name={usuario.gestor ? 'briefcase' : 'briefcase-outline'}
              size={20}
              color={isDisabled ? COLORS.muted : COLORS.gestor}
            />
          </Pressable>
        )}

        <Pressable
          style={styles.actionButton}
          onPress={(event) => {
            event.stopPropagation();
            onDeletePress();
          }}
          disabled={isDisabled}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Excluir ${usuario.nome}`}>
          <Ionicons
            name="trash-outline"
            size={20}
            color={isDisabled ? COLORS.muted : COLORS.danger}
          />
        </Pressable>
      </View>

      <Text style={[styles.tableCell, styles.colUltimaEntrada]} numberOfLines={1}>
        {usuario.ultimaEntrada}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GESTOR_USUARIOS_TABLE_COLUMN_GAP,
    paddingVertical: 10,
    paddingHorizontal: GESTOR_USUARIOS_TABLE_HORIZONTAL_PADDING / 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableCell: {
    fontSize: 13,
    color: COLORS.navy,
  },
  colNome: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  nomePressable: {
    flex: 1,
    minWidth: 0,
  },
  nomeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.blue,
    textDecorationLine: 'underline',
  },
  colTelefone: {
    width: GESTOR_USUARIOS_TELEFONE_COLUMN_WIDTH,
    flexShrink: 0,
  },
  colEndereco: {
    flexShrink: 0,
    overflow: 'hidden',
  },
  colFlag: {
    width: GESTOR_USUARIOS_FLAG_COLUMN_WIDTH,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colUltimaEntrada: {
    width: GESTOR_USUARIOS_ULTIMA_ENTRADA_COLUMN_WIDTH,
    flexShrink: 0,
    textAlign: 'center',
  },
  actionsCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flexShrink: 0,
    width: GESTOR_USUARIOS_ACTIONS_COLUMN_WIDTH,
  },
  actionButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
