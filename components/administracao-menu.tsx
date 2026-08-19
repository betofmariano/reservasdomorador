import { useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';

import { CriarMapaDiarioPanel } from '@/components/criar-mapa-diario-panel';
import { MenuActionButton } from '@/components/menu-action-button';
import { MATCHPOINT_COLORS } from '@/constants/theme';
import { useUserContext } from '@/contexts/user-context';
import { useAdministracaoMenuAccess, type AdministracaoMenuAccess } from '@/hooks/use-administracao-menu-access';
import type { User } from '@/types/user';
import { isUserAdministrador } from '@/utils/club-config';
import { isGestorMenuRouteEnabled } from '@/utils/academia-permissoes-gestor';
import {
  ADMINISTRACAO_MENU_COLUMN_GAP,
  getAdministracaoMenuButtonWidth,
  getAdministracaoTwoColumnSectionWidth,
  isAdministracaoWideLayout,
} from '@/utils/administracao-menu-layout';
import { getHomeMenuButtonMetrics } from '@/utils/home-menu-button';

type AdministracaoMenuProps = {
  user: User;
  access: AdministracaoMenuAccess;
};

type AdminMenuItem = {
  label: string;
  route: string;
};

const BUTTON_GAP = 18;

const ADMIN_ONLY_ITEMS: AdminMenuItem[] = [
  { label: 'Lista de Acessos', route: '/lista-acessos' },
  { label: 'Lista de Logins', route: '/lista-logins' },
  { label: 'Lista de Logados', route: '/lista-logados' },
  { label: 'Publicidade', route: '/resumo-publicidade' },
];

const CLUB_ADMIN_ITEMS: AdminMenuItem[] = [
  { label: 'Lista de Usuários', route: '/lista-usuarios-gestor' },
  { label: 'Lista de Usuários Suspensos', route: '/lista-usuarios-suspensos' },
  { label: 'Lista de Presença', route: '/lista-presenca' },
  { label: 'Lista de Reservas', route: '/lista-reservas' },
  { label: 'Lista de Reservas por Atividade', route: '/lista-reservas-atividade' },
  { label: 'Resumo de Reservas por Período', route: '/lista-reservas-periodo' },
  { label: 'Programação de Atividades', route: '/programacao-atividades' },
  { label: 'Lista de Espera', route: '/relatorio-lista-espera' },
  { label: 'Mapa de Frequência', route: '/mapa-frequencia' },
  { label: 'Configuração do Local', route: '/configuracao-local' },
  { label: 'Cadastro de Atividades', route: '/cadastro-atividades' },
  { label: 'Cadastro de Horários', route: '/cadastro-horarios' },
];

const GESTAO_COLUMN_1_ROUTES = [
  '/lista-usuarios-gestor',
  '/lista-usuarios-suspensos',
  '/cadastro-atividades',
  '/cadastro-horarios',
  '/programacao-atividades',
] as const;

function splitGestaoMenuItems(items: AdminMenuItem[]) {
  const itemsByRoute = new Map(items.map((item) => [item.route, item]));
  const column1Routes = new Set<string>(GESTAO_COLUMN_1_ROUTES);

  const column1 = GESTAO_COLUMN_1_ROUTES.map((route) => itemsByRoute.get(route)).filter(
    (item): item is AdminMenuItem => item != null,
  );

  const column2 = items.filter((item) => !column1Routes.has(item.route));

  return { column1, column2 };
}

export function AdministracaoMenu({ user, access }: AdministracaoMenuProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { currentAcademia } = useUserContext();
  const { isClubGestor } = access;
  const isAdministrador = isUserAdministrador(user);
  const isWideLayout = isAdministracaoWideLayout(width);
  const menuButtonMetrics = getHomeMenuButtonMetrics(width);
  const standardButtonWidth = getAdministracaoMenuButtonWidth(width);

  const [showCriarMapaDiarioPanel, setShowCriarMapaDiarioPanel] = useState(false);

  const gestaoItems = useMemo(
    () =>
      CLUB_ADMIN_ITEMS.filter((item) => {
        if (isAdministrador) {
          return true;
        }

        return isGestorMenuRouteEnabled(item.route, currentAcademia);
      }),
    [currentAcademia, isAdministrador],
  );

  const { column1: gestaoColumn1, column2: gestaoColumn2 } = useMemo(
    () => splitGestaoMenuItems(gestaoItems),
    [gestaoItems],
  );

  const useGestaoTwoColumns = gestaoColumn1.length > 0 && gestaoColumn2.length > 0 && isWideLayout;
  const gestaoSectionWidth = useGestaoTwoColumns
    ? getAdministracaoTwoColumnSectionWidth(width)
    : standardButtonWidth;
  const menuButtonWidth = standardButtonWidth;

  function renderMenuButton(
    label: string,
    onPress: () => void,
    buttonWidth: number,
    options?: { isFirst?: boolean },
  ) {
    return (
      <MenuActionButton
        label={label}
        backgroundColor={MATCHPOINT_COLORS.blue}
        textColor={MATCHPOINT_COLORS.white}
        width={buttonWidth}
        fontSize={menuButtonMetrics.fontSize}
        buttonHeight={menuButtonMetrics.buttonHeight}
        paddingHorizontal={menuButtonMetrics.paddingHorizontal}
        style={options?.isFirst ? undefined : { marginTop: BUTTON_GAP }}
        onPress={onPress}
      />
    );
  }

  function handleNavigate(route: string) {
    router.push(route as never);
  }

  function renderMenuColumn(items: AdminMenuItem[], buttonWidth: number) {
    return (
      <View style={[styles.menuColumn, { width: buttonWidth }]}>
        {items.map((item, index) => (
          <View key={item.route} style={styles.menuButtonSlot}>
            {renderMenuButton(item.label, () => handleNavigate(item.route), buttonWidth, {
              isFirst: index === 0,
            })}
          </View>
        ))}
      </View>
    );
  }

  function renderGestaoSection() {
    if (gestaoItems.length === 0) {
      return null;
    }

    return (
      <View style={[styles.section, { maxWidth: gestaoSectionWidth }]}>
        <Text style={styles.sectionTitle}>Gestão</Text>

        {useGestaoTwoColumns ? (
          <View style={styles.columnsRow}>
            {renderMenuColumn(gestaoColumn1, menuButtonWidth)}
            {renderMenuColumn(gestaoColumn2, menuButtonWidth)}
          </View>
        ) : (
          renderMenuColumn(gestaoItems, menuButtonWidth)
        )}
      </View>
    );
  }

  const hasAdminItems = isAdministrador;
  const hasClubItems = isAdministrador || isClubGestor;

  if (!hasAdminItems && !hasClubItems) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Nenhuma opção de administração disponível.</Text>
      </View>
    );
  }

  return (
    <View style={styles.menuContainer}>
      {hasAdminItems ? (
        <View style={[styles.section, { maxWidth: menuButtonWidth }]}>
          <Text style={styles.sectionTitle}>Sistema</Text>
          {ADMIN_ONLY_ITEMS.map((item, index) => (
            <View key={item.route} style={styles.menuButtonSlot}>
              {renderMenuButton(item.label, () => handleNavigate(item.route), menuButtonWidth, {
                isFirst: index === 0,
              })}
            </View>
          ))}
          {!showCriarMapaDiarioPanel ? (
            renderMenuButton(
              'Criar Mapa Diario',
              () => setShowCriarMapaDiarioPanel(true),
              menuButtonWidth,
            )
          ) : (
            <View style={{ marginTop: BUTTON_GAP, width: menuButtonWidth }}>
              <CriarMapaDiarioPanel user={user} enabled={showCriarMapaDiarioPanel} />
            </View>
          )}
        </View>
      ) : null}

      {hasClubItems ? renderGestaoSection() : null}
    </View>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 32,
  },
  section: {
    width: '100%',
    alignItems: 'center',
  },
  columnsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: ADMINISTRACAO_MENU_COLUMN_GAP,
  },
  menuColumn: {
    alignItems: 'center',
  },
  menuButtonSlot: {
    width: '100%',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: MATCHPOINT_COLORS.navy,
    textAlign: 'center',
    marginBottom: BUTTON_GAP,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: MATCHPOINT_COLORS.muted,
    textAlign: 'center',
  },
});
