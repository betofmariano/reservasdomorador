import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LogadoBooleanCell } from '@/components/logado-boolean-cell';
import { UserAvatar } from '@/components/user-avatar';
import type { GestorUsuarioListItem } from '@/types/usuario';
import {
  GESTOR_USUARIOS_COMPLEMENTO_COLUMN_WIDTH,
  GESTOR_USUARIOS_FLAG_COLUMN_WIDTH,
  GESTOR_USUARIOS_NOME_COLUMN_WIDTH,
  GESTOR_USUARIOS_SOCIO_COLUMN_WIDTH,
} from '@/utils/gestor-usuario-table-layout';

type GestorUsuarioListItemRowProps = {
  usuario: GestorUsuarioListItem;
  isCurrentUser: boolean;
  showDeleteButton: boolean;
  showSocioColumn: boolean;
  showComplementoColumn: boolean;
  showAdministradorColumn: boolean;
  tableWidth: number;
  disabled?: boolean;
  onApprovePress: () => void;
  onBlockPress: () => void;
  onGestorPress: () => void;
  onProfessorPress: () => void;
  onDeletePress: () => void;
  onContactPress: () => void;
};

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  muted: '#5C6475',
  border: '#E2E6EE',
  danger: '#D64545',
  approve: '#1F8A4C',
  professor: '#6B4FA8',
  gestor: '#2456A8',
};

export function GestorUsuarioListItemRow({
  usuario,
  isCurrentUser,
  showDeleteButton,
  showSocioColumn,
  showComplementoColumn,
  showAdministradorColumn,
  tableWidth,
  disabled = false,
  onApprovePress,
  onBlockPress,
  onGestorPress,
  onProfessorPress,
  onDeletePress,
  onContactPress,
}: GestorUsuarioListItemRowProps) {
  const isDisabled = disabled || isCurrentUser;

  return (
    <View style={[styles.tableRow, { width: tableWidth, minWidth: tableWidth }]}>
      <View style={[styles.colNome, { width: GESTOR_USUARIOS_NOME_COLUMN_WIDTH }]}>
        <UserAvatar name={usuario.nome} photoUrl={null} size={40} />
        <Pressable
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

      {showSocioColumn ? (
        <Text
          style={[styles.tableCell, styles.colSocio, { width: GESTOR_USUARIOS_SOCIO_COLUMN_WIDTH }]}
          numberOfLines={1}>
          {usuario.socio || '—'}
        </Text>
      ) : null}

      {showComplementoColumn ? (
        <Text
          style={[
            styles.tableCell,
            styles.colComplemento,
            { width: GESTOR_USUARIOS_COMPLEMENTO_COLUMN_WIDTH },
          ]}
          numberOfLines={1}>
          {usuario.complemento || '—'}
        </Text>
      ) : null}

      <View style={styles.colFlag}>
        <LogadoBooleanCell value={usuario.professor} />
      </View>

      {showAdministradorColumn ? (
        <View style={styles.colFlag}>
          <LogadoBooleanCell value={usuario.administrador} />
        </View>
      ) : null}

      <View style={styles.colFlag}>
        <LogadoBooleanCell value={usuario.gestor} />
      </View>

      <View style={styles.colFlag}>
        <LogadoBooleanCell value={usuario.aprovado} />
      </View>

      <View style={styles.colFlag}>
        <LogadoBooleanCell value={usuario.bloqueado} />
      </View>

      <View
        style={[
          styles.actionsCell,
          showDeleteButton ? styles.actionsCellWithDelete : styles.actionsCellWithoutDelete,
        ]}>
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
            color={
              isDisabled ? COLORS.muted : usuario.bloqueado ? COLORS.approve : COLORS.danger
            }
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
          <>
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

            <Pressable
              style={styles.actionButton}
              onPress={(event) => {
                event.stopPropagation();
                onProfessorPress();
              }}
              disabled={isDisabled}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                usuario.professor
                  ? `Remover professor ${usuario.nome}`
                  : `Definir professor ${usuario.nome}`
              }>
              <Ionicons
                name={usuario.professor ? 'school' : 'school-outline'}
                size={20}
                color={isDisabled ? COLORS.muted : COLORS.professor}
              />
            </Pressable>
          </>
        )}

        {showDeleteButton ? (
          <Pressable
            style={styles.actionButton}
            onPress={(event) => {
              event.stopPropagation();
              onDeletePress();
            }}
            disabled={isDisabled}
            hitSlop={8}>
            <Ionicons
              name="trash-outline"
              size={20}
              color={isDisabled ? COLORS.muted : COLORS.danger}
            />
          </Pressable>
        ) : null}
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
  colNome: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nomeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.blue,
    textDecorationLine: 'underline',
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
    width: GESTOR_USUARIOS_FLAG_COLUMN_WIDTH,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colUltimaEntrada: {
    width: 120,
    flexShrink: 0,
  },
  actionsCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flexShrink: 0,
  },
  actionsCellWithDelete: {
    width: 140,
  },
  actionsCellWithoutDelete: {
    width: 106,
  },
  actionButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
