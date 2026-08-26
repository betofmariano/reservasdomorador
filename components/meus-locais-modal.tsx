import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { WEB_MAX_CONTENT_WIDTH } from '@/constants/web-layout';
import { useAuth } from '@/contexts/auth-context';
import { useUserContext } from '@/contexts/user-context';
import { getAcademias } from '@/services/academias-service';
import { ApiError, getApiErrorMessage } from '@/services/api-client';
import {
  buildCreateUserLocalAssociationPayload,
  createUserLocalAssociation,
  enrichAssociationsWithAcademias,
  filterAvailableAcademias,
  getAssociationStatusLabel,
  getUserLocalAssociationsForUser,
  isDuplicateAssociationError,
} from '@/services/user-local-service';
import type { Academia } from '@/types/academia';
import type { AssociatedLocalDisplay, UserLocalAssociation } from '@/types/user-local';
import type { User } from '@/types/user';

type MeusLocaisModalProps = {
  visible: boolean;
  user: User | null;
  onClose: () => void;
};

type ModalStep = 'list' | 'add';

const COLORS = {
  navy: '#3A2154',
  blue: '#0F7A6C',
  white: '#FFFFFF',
  gray: '#F4F6FA',
  border: '#E2E6EE',
  error: '#D64545',
  success: '#1F8A4C',
};

const LOAD_LOCATIONS_ERROR = 'Não foi possível carregar seus locais.';
const LOAD_CLUBS_ERROR = 'Não foi possível carregar os clubes disponíveis.';
const ASSOCIATE_ERROR = 'Não foi possível adicionar este local. Tente novamente.';
const DUPLICATE_ERROR = 'Você já está associado a este local.';
const SUCCESS_MESSAGE = 'Local adicionado com sucesso.';
const NO_USER_MESSAGE = 'Não foi possível identificar o usuário.';
const EMPTY_MESSAGE = 'Você ainda não está associado a nenhum local.';

export function MeusLocaisModal({ visible, user, onClose }: MeusLocaisModalProps) {
  const { authToken } = useAuth();
  const { refreshUserContext } = useUserContext();
  const { width: screenWidth } = useWindowDimensions();
  const shouldLimitWidth = Platform.OS === 'web' || screenWidth >= WEB_MAX_CONTENT_WIDTH;

  const [step, setStep] = useState<ModalStep>('list');
  const [associations, setAssociations] = useState<UserLocalAssociation[]>([]);
  const [displayItems, setDisplayItems] = useState<AssociatedLocalDisplay[]>([]);
  const [allAcademias, setAllAcademias] = useState<Academia[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);
  const [isAssociating, setIsAssociating] = useState(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [clubsError, setClubsError] = useState<string | null>(null);
  const [associateError, setAssociateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const associatedClubIds = useMemo(
    () => associations.map((association) => association.academias_id),
    [associations],
  );

  const availableAcademias = useMemo(
    () => filterAvailableAcademias(allAcademias, associatedClubIds),
    [allAcademias, associatedClubIds],
  );

  const filteredAcademias = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return availableAcademias;
    }

    return availableAcademias.filter((academia) => academia.nome.toLowerCase().includes(query));
  }, [availableAcademias, searchQuery]);

  const resetAddStepState = useCallback(() => {
    setSearchQuery('');
    setSelectedClubId(null);
    setClubsError(null);
    setAssociateError(null);
  }, []);

  const resetModalState = useCallback(() => {
    setStep('list');
    setAssociations([]);
    setDisplayItems([]);
    setAllAcademias([]);
    resetAddStepState();
    setLocationsError(null);
    setSuccessMessage(null);
  }, [resetAddStepState]);

  const handleClose = useCallback(() => {
    if (isAssociating) {
      return;
    }

    resetModalState();
    onClose();
  }, [isAssociating, onClose, resetModalState]);

  const loadLocations = useCallback(async () => {
    if (!user?.id) {
      setLocationsError(NO_USER_MESSAGE);
      setAssociations([]);
      setDisplayItems([]);
      return;
    }

    setIsLoadingLocations(true);
    setLocationsError(null);
    setSuccessMessage(null);

    try {
      const [associationsData, clubsData] = await Promise.all([
        getUserLocalAssociationsForUser(user, authToken),
        getAcademias().catch(() => [] as Academia[]),
      ]);

      console.log('Resposta clubesUsuario recebida');
      console.log('Quantidade de clubes associados:', associationsData.length);

      setAssociations(associationsData);
      setAllAcademias(clubsData);
      setDisplayItems(enrichAssociationsWithAcademias(associationsData, clubsData));
    } catch (error) {
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : getApiErrorMessage(error) || LOAD_LOCATIONS_ERROR;

      setLocationsError(message.includes('conectar') ? message : LOAD_LOCATIONS_ERROR);
      setAssociations([]);
      setDisplayItems([]);
    } finally {
      setIsLoadingLocations(false);
    }
  }, [authToken, user?.id]);

  const loadAvailableClubs = useCallback(async () => {
    setIsLoadingClubs(true);
    setClubsError(null);

    try {
      const clubsData = await getAcademias();
      setAllAcademias(clubsData);
    } catch (error) {
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : getApiErrorMessage(error) || LOAD_CLUBS_ERROR;

      setClubsError(message.includes('conectar') ? message : LOAD_CLUBS_ERROR);
    } finally {
      setIsLoadingClubs(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    console.log('Abrindo Meus Locais');
    console.log('Usuário identificado:', Boolean(user?.id));

    setStep('list');
    resetAddStepState();
    void loadLocations();
  }, [visible, user?.id, loadLocations, resetAddStepState]);

  function handleOpenAddStep() {
    setStep('add');
    resetAddStepState();
    void loadAvailableClubs();
  }

  function handleBackToList() {
    setStep('list');
    resetAddStepState();
  }

  async function handleAssociateClub() {
    if (isAssociating) {
      return;
    }

    if (!user?.id) {
      setAssociateError(NO_USER_MESSAGE);
      return;
    }

    if (!selectedClubId) {
      return;
    }

    if (associatedClubIds.includes(selectedClubId)) {
      setAssociateError(DUPLICATE_ERROR);
      return;
    }

    console.log('Clube selecionado:', selectedClubId);
    console.log('Criando associação em userslocal');

    setIsAssociating(true);
    setAssociateError(null);

    try {
      await createUserLocalAssociation(
        buildCreateUserLocalAssociationPayload(user, selectedClubId),
        authToken,
      );

      console.log('Associação criada com sucesso');

      resetAddStepState();
      setStep('list');
      setSuccessMessage(SUCCESS_MESSAGE);
      await Promise.all([loadLocations(), refreshUserContext()]);
    } catch (error) {
      if (isDuplicateAssociationError(error)) {
        setAssociateError(DUPLICATE_ERROR);
        return;
      }

      const message =
        error instanceof ApiError && error.message
          ? error.message
          : getApiErrorMessage(error) || ASSOCIATE_ERROR;

      setAssociateError(message.includes('conectar') ? message : ASSOCIATE_ERROR);
    } finally {
      setIsAssociating(false);
    }
  }

  function renderListStep() {
    return (
      <>
        {isLoadingLocations ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={COLORS.blue} />
          </View>
        ) : locationsError ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{locationsError}</Text>
            <Pressable style={styles.secondaryButton} onPress={() => void loadLocations()}>
              <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : displayItems.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>{EMPTY_MESSAGE}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}>
            {displayItems.map((item) => (
              <View key={item.association.id} style={styles.clubCard}>
                <View style={styles.clubIconContainer}>
                  <Ionicons name="business-outline" size={28} color={COLORS.blue} />
                </View>
                <View style={styles.clubInfo}>
                  <Text style={styles.clubName}>{item.nome}</Text>
                  {item.cidade ? <Text style={styles.clubCity}>{item.cidade}</Text> : null}
                  <Text style={styles.clubStatus}>
                    {getAssociationStatusLabel(item.association)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <Pressable style={styles.primaryButton} onPress={handleOpenAddStep}>
          <Text style={styles.primaryButtonText}>Adicionar novo local</Text>
        </Pressable>
      </>
    );
  }

  function renderAddStep() {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Pesquisar clube pelo nome"
          placeholderTextColor="#9AA0A6"
          editable={!isLoadingClubs && !isAssociating}
        />

        {isLoadingClubs ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={COLORS.blue} />
          </View>
        ) : clubsError ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{clubsError}</Text>
            <Pressable style={styles.secondaryButton} onPress={() => void loadAvailableClubs()}>
              <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : filteredAcademias.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>Nenhum clube disponível para associação.</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {filteredAcademias.map((academia) => {
              const isSelected = selectedClubId === academia.id;

              return (
                <Pressable
                  key={academia.id}
                  style={[styles.selectableCard, isSelected && styles.selectableCardSelected]}
                  onPress={() => setSelectedClubId(academia.id)}
                  disabled={isAssociating}>
                  <View style={styles.clubIconContainer}>
                    <Ionicons name="business-outline" size={28} color={COLORS.blue} />
                  </View>
                  <View style={styles.clubInfo}>
                    <Text style={styles.clubName}>{academia.nome}</Text>
                  </View>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.blue} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {associateError ? <Text style={styles.errorText}>{associateError}</Text> : null}

        <Pressable
          style={[
            styles.primaryButton,
            styles.highlightButton,
            (!selectedClubId || isAssociating) && styles.buttonDisabled,
          ]}
          onPress={() => void handleAssociateClub()}
          disabled={!selectedClubId || isAssociating}>
          {isAssociating ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Associar ao clube</Text>
          )}
        </Pressable>

        <Pressable style={styles.backButton} onPress={handleBackToList} disabled={isAssociating}>
          <Text style={styles.backButtonText}>Voltar para Meus Locais</Text>
        </Pressable>
      </KeyboardAvoidingView>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={[styles.overlay, shouldLimitWidth && styles.overlayWide]}>
        <SafeAreaView
          style={[
            styles.modalContainer,
            shouldLimitWidth && styles.modalContainerWide,
          ]}
          edges={['bottom']}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 'list' ? 'Meus Locais' : 'Adicionar novo local'}
            </Text>
            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isAssociating}
              hitSlop={8}>
              <Ionicons name="close" size={28} color={COLORS.navy} />
            </Pressable>
          </View>

          <View style={styles.content}>{step === 'list' ? renderListStep() : renderAddStep()}</View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  overlayWide: {
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '55%',
    width: '100%',
  },
  modalContainerWide: {
    maxWidth: WEB_MAX_CONTENT_WIDTH,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.navy,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  flex: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 12,
    gap: 12,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectableCardSelected: {
    borderColor: COLORS.blue,
    backgroundColor: '#EAF1FB',
  },
  clubIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  clubCity: {
    fontSize: 14,
    color: '#5C6475',
    marginTop: 2,
  },
  clubStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.blue,
    marginTop: 4,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.navy,
    backgroundColor: COLORS.white,
    marginBottom: 12,
  },
  primaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  highlightButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.blue,
    textDecorationLine: 'underline',
  },
  backButton: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
    textDecorationLine: 'underline',
  },
  emptyText: {
    fontSize: 15,
    color: '#5C6475',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  successText: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});
