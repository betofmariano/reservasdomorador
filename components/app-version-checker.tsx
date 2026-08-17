import { Platform } from 'react-native';

import { AppUpdateModal } from '@/components/app-update-modal';
import { useAppVersion } from '@/hooks/use-app-version';

type AppVersionCheckerProps = {
  enabled: boolean;
};

export function AppVersionChecker({ enabled }: AppVersionCheckerProps) {
  const {
    remoteVersion,
    showUpdateModal,
    isUpdating,
    updateErrorMessage,
    updateApplicationNow,
    dismissUpdate,
  } = useAppVersion({ enabled: Platform.OS === 'web' && enabled });

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <AppUpdateModal
      visible={showUpdateModal}
      remoteVersion={remoteVersion}
      isUpdating={isUpdating}
      updateErrorMessage={updateErrorMessage}
      onUpdate={() => void updateApplicationNow()}
      onDismiss={dismissUpdate}
    />
  );
}
