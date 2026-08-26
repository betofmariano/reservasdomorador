import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppVersionLabel } from '@/components/app-version-label';

type HeaderMenuDropdownProps = {
  visible: boolean;
  onClose: () => void;
  showHomeOption?: boolean;
  showUsuariosOption?: boolean;
  showMeusDadosOption?: boolean;
  showLogoutOption?: boolean;
  onLogout?: () => void;
};

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  error: '#D64545',
};

export function HeaderMenuDropdown({
  visible,
  onClose,
  showHomeOption = true,
  showUsuariosOption = true,
  showMeusDadosOption = false,
  showLogoutOption = false,
  onLogout,
}: HeaderMenuDropdownProps) {
  const router = useRouter();

  function handleUsuarios() {
    onClose();
    router.push('/usuarios');
  }

  function handleMeusDados() {
    onClose();
    router.push('/meus-dados');
  }

  function handleHome() {
    onClose();
    router.replace('/');
  }

  function handleLogout() {
    onClose();
    onLogout?.();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menuCard}>
          {showHomeOption ? (
            <Pressable style={styles.menuItem} onPress={handleHome}>
              <Text style={styles.menuItemText}>Início</Text>
            </Pressable>
          ) : null}

          {showUsuariosOption ? (
            <Pressable style={styles.menuItem} onPress={handleUsuarios}>
              <Text style={styles.menuItemText}>Lista de Usuários</Text>
            </Pressable>
          ) : null}

          {showMeusDadosOption ? (
            <Pressable style={styles.menuItem} onPress={handleMeusDados}>
              <Text style={styles.menuItemText}>Meus Dados</Text>
            </Pressable>
          ) : null}

          {showLogoutOption ? (
            <Pressable style={styles.menuItem} onPress={handleLogout}>
              <Text style={[styles.menuItemText, styles.logoutText]}>Sair</Text>
            </Pressable>
          ) : null}

          <View style={styles.versionContainer}>
            <AppVersionLabel />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 96,
    paddingLeft: 118,
  },
  menuCard: {
    minWidth: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E6EE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F6',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
  },
  logoutText: {
    color: COLORS.error,
  },
  versionContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F6',
  },
});
