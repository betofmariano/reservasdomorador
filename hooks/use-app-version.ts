import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import type { RemoteVersion } from '@/types/version';
import {
  dismissUpdate,
  fetchRemoteVersion,
  getDismissedUpdateVersion,
  getPendingUpdateFailureMessage,
  initializeVersionCheckState,
  isRemoteVersionNewer,
  shouldShowUpdateModal,
  syncInstalledVersionWhenCurrent,
  updateApplication,
  UPDATE_FAILED_MESSAGE,
  VERSION_CHECK_MIN_INTERVAL_MS,
} from '@/services/version-service';

type UseAppVersionParams = {
  enabled: boolean;
};

type UseAppVersionResult = {
  remoteVersion: RemoteVersion | null;
  updateAvailable: boolean;
  showUpdateModal: boolean;
  checkingVersion: boolean;
  isUpdating: boolean;
  updateErrorMessage: string | null;
  checkForUpdate: () => Promise<void>;
  updateApplicationNow: () => Promise<void>;
  dismissUpdate: () => void;
};

export function useAppVersion({ enabled }: UseAppVersionParams): UseAppVersionResult {
  const [remoteVersion, setRemoteVersion] = useState<RemoteVersion | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checkingVersion, setCheckingVersion] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateErrorMessage, setUpdateErrorMessage] = useState<string | null>(() => {
    if (Platform.OS !== 'web') {
      return null;
    }

    return getPendingUpdateFailureMessage(initializeVersionCheckState());
  });
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(() =>
    Platform.OS === 'web' ? getDismissedUpdateVersion() : null,
  );

  const checkInFlightRef = useRef(false);
  const lastCheckAtRef = useRef(0);

  const checkForUpdate = useCallback(
    async (options?: { force?: boolean }) => {
      if (Platform.OS !== 'web' || !enabled) {
        return;
      }

      const now = Date.now();

      if (!options?.force && now - lastCheckAtRef.current < VERSION_CHECK_MIN_INTERVAL_MS) {
        return;
      }

      if (checkInFlightRef.current) {
        return;
      }

      checkInFlightRef.current = true;
      setCheckingVersion(true);

      try {
        const remote = await fetchRemoteVersion();
        setRemoteVersion(remote);
        syncInstalledVersionWhenCurrent(remote);
        setUpdateAvailable(Boolean(remote && isRemoteVersionNewer(remote.version)));
        lastCheckAtRef.current = Date.now();
      } finally {
        checkInFlightRef.current = false;
        setCheckingVersion(false);
      }
    },
    [enabled],
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) {
      return;
    }

    void checkForUpdate({ force: true });
  }, [checkForUpdate, enabled]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || typeof document === 'undefined') {
      return;
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void checkForUpdate();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdate, enabled]);

  const showUpdateModal = useMemo(() => {
    if (!remoteVersion) {
      return false;
    }

    if (dismissedVersion === remoteVersion.version) {
      return false;
    }

    return shouldShowUpdateModal(remoteVersion);
  }, [dismissedVersion, remoteVersion]);

  const updateApplicationNow = useCallback(async () => {
    if (!remoteVersion || isUpdating) {
      return;
    }

    setIsUpdating(true);
    setUpdateErrorMessage(null);

    try {
      await updateApplication(remoteVersion.version);
    } catch {
      setIsUpdating(false);
      setUpdateErrorMessage(UPDATE_FAILED_MESSAGE);
    }
  }, [isUpdating, remoteVersion]);

  const dismissUpdateNow = useCallback(() => {
    if (!remoteVersion || remoteVersion.mandatory) {
      return;
    }

    dismissUpdate(remoteVersion.version);
    setDismissedVersion(remoteVersion.version);
  }, [remoteVersion]);

  return {
    remoteVersion,
    updateAvailable,
    showUpdateModal,
    checkingVersion,
    isUpdating,
    updateErrorMessage,
    checkForUpdate: () => checkForUpdate(),
    updateApplicationNow,
    dismissUpdate: dismissUpdateNow,
  };
}
