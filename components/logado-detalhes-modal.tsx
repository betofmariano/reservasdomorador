import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth-button';
import type { LogadoRecord } from '@/types/logado';
import {
  formatLogadoBoolean,
  formatLogadoCreatedAt,
  formatLogadoTelefone,
  getLogadoClubeNome,
} from '@/utils/logado-lista-format';

type LogadoDetalhesModalProps = {
  visible: boolean;
  logado: LogadoRecord | null;
  onClose: () => void;
};

const COLORS = {
  navy: '#1B2B4B',
  white: '#FFFFFF',
};

export function LogadoDetalhesModal({ visible, logado, onClose }: LogadoDetalhesModalProps) {
  if (!logado) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Detalhes do logado</Text>

          <ScrollView style={styles.scrollArea}>
            <Text style={styles.detailText}>ID: {logado.id}</Text>
            <Text style={styles.detailText}>Data: {formatLogadoCreatedAt(logado.created_at)}</Text>
            <Text style={styles.detailText}>users_id: {logado.users_id}</Text>
            <Text style={styles.detailText}>Nome: {logado.nome || '—'}</Text>
            <Text style={styles.detailText}>Local: {getLogadoClubeNome(logado)}</Text>
            <Text style={styles.detailText}>academias_id: {logado.academias_id}</Text>
            <Text style={styles.detailText}>Telefone: {formatLogadoTelefone(logado)}</Text>
            <Text style={styles.detailText}>Código: {logado.cod || '—'}</Text>
            <Text style={styles.detailText}>E-mail: {logado.email || '—'}</Text>
            <Text style={styles.detailText}>Largura da página: {logado.larguraPagina}</Text>
            <Text style={styles.detailText}>Plataforma: {logado.plataforma || '—'}</Text>
            <Text style={styles.detailText}>Dispositivo: {logado.dispositivo || '—'}</Text>
            <Text style={styles.detailText}>Aprovado: {formatLogadoBoolean(logado.aprovado)}</Text>
            <Text style={styles.detailText}>Gestor: {formatLogadoBoolean(logado.gestor)}</Text>
            <Text style={styles.detailText}>
              Administrador: {formatLogadoBoolean(logado.administrador)}
            </Text>
            <Text style={styles.detailText}>Bloqueado: {formatLogadoBoolean(logado.bloqueado)}</Text>
            <Text style={styles.detailText}>Logado Xano: {formatLogadoBoolean(logado.logadoXano)}</Text>
          </ScrollView>

          <AuthButton label="Fechar" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 12,
    textAlign: 'center',
  },
  scrollArea: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 15,
    color: COLORS.navy,
    marginBottom: 8,
  },
});
