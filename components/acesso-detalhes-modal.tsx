import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth-button';
import type { Acesso } from '@/types/acesso';
import {
  formatAcessoCreatedAt,
  getAcessoPhotoUrl,
  isFotoAlteracaoAcesso,
} from '@/utils/acesso-format';

type AcessoDetalhesModalProps = {
  visible: boolean;
  acesso: Acesso | null;
  onClose: () => void;
};

const COLORS = {
  navy: '#1B2B4B',
  blue: '#2456A8',
  white: '#FFFFFF',
};

export function AcessoDetalhesModal({ visible, acesso, onClose }: AcessoDetalhesModalProps) {
  if (!acesso) {
    return null;
  }

  const photoUrl = getAcessoPhotoUrl(acesso);
  const isFotoAlteracao = isFotoAlteracaoAcesso(acesso);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Detalhes do acesso</Text>

          <ScrollView style={styles.scrollArea}>
            <Text style={styles.detailText}>ID: {acesso.id}</Text>
            <Text style={styles.detailText}>
              Criado em: {formatAcessoCreatedAt(acesso.created_at)}
            </Text>
            <Text style={styles.detailText}>Local: {acesso.local || '—'}</Text>
            <Text style={styles.detailText}>E-mail: {acesso.email || '—'}</Text>
            <Text style={styles.detailText}>Nome: {acesso.nome || '—'}</Text>
            <Text style={styles.detailText}>Largura da página: {acesso.larguraPagina}</Text>
            <Text style={styles.detailText}>Rotina: {acesso.rotina || '—'}</Text>

            {isFotoAlteracao && photoUrl ? (
              <>
                <Text style={styles.detailText}>Foto enviada pelo usuário:</Text>
                <Image source={{ uri: photoUrl }} style={styles.photoPreview} resizeMode="cover" />
                <Pressable
                  style={styles.photoLinkButton}
                  onPress={() => {
                    void Linking.openURL(photoUrl);
                  }}>
                  <Text style={styles.photoLinkText}>Abrir foto em tela cheia</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.detailText}>Página: {acesso.pagina || '—'}</Text>
            )}

            <Text style={styles.detailText}>users_id: {acesso.users_id}</Text>
            <Text style={styles.detailText}>users_id: {acesso.users_id}</Text>
            <Text style={styles.detailText}>academias_id: {acesso.academias_id}</Text>
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
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 12,
    backgroundColor: '#E0E0E0',
  },
  photoLinkButton: {
    alignSelf: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  photoLinkText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.blue,
    textDecorationLine: 'underline',
  },
});
