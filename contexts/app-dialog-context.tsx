import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { AppAlertModal } from '@/components/app-alert-modal';
import { AppConfirmModal } from '@/components/app-confirm-modal';
import type { AppAlertOptions, AppConfirmOptions } from '@/types/app-dialog';
import { registerAppDialogBridge } from '@/utils/app-dialog-bridge';

export type { AppAlertOptions, AppConfirmOptions };

type AppDialogContextValue = {
  confirm: (options: AppConfirmOptions) => Promise<boolean>;
  alert: (options: AppAlertOptions) => Promise<void>;
};

type ActiveConfirmState = AppConfirmOptions & {
  resolve: (value: boolean) => void;
};

type ActiveAlertState = AppAlertOptions & {
  resolve: () => void;
};

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [activeConfirm, setActiveConfirm] = useState<ActiveConfirmState | null>(null);
  const [activeAlert, setActiveAlert] = useState<ActiveAlertState | null>(null);
  const queueRef = useRef<Array<() => void>>([]);
  const isBusyRef = useRef(false);

  const runNextDialog = useCallback(() => {
    const next = queueRef.current.shift();

    if (!next) {
      isBusyRef.current = false;
      return;
    }

    isBusyRef.current = true;
    next();
  }, []);

  const enqueueDialog = useCallback(
    (showDialog: () => void) => {
      queueRef.current.push(showDialog);

      if (!isBusyRef.current) {
        runNextDialog();
      }
    },
    [runNextDialog],
  );

  const finishDialog = useCallback(() => {
    runNextDialog();
  }, [runNextDialog]);

  const confirm = useCallback(
    (options: AppConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        enqueueDialog(() => {
          setActiveConfirm({
            ...options,
            resolve,
          });
        });
      }),
    [enqueueDialog],
  );

  const alert = useCallback(
    (options: AppAlertOptions) =>
      new Promise<void>((resolve) => {
        enqueueDialog(() => {
          setActiveAlert({
            ...options,
            resolve,
          });
        });
      }),
    [enqueueDialog],
  );

  const contextValue = useMemo(
    () => ({
      confirm,
      alert,
    }),
    [alert, confirm],
  );

  useEffect(() => {
    registerAppDialogBridge(contextValue);

    return () => {
      registerAppDialogBridge(null);
    };
  }, [contextValue]);

  function handleConfirmClose(confirmed: boolean) {
    if (!activeConfirm) {
      return;
    }

    activeConfirm.resolve(confirmed);
    setActiveConfirm(null);
    finishDialog();
  }

  function handleAlertClose() {
    if (!activeAlert) {
      return;
    }

    activeAlert.resolve();
    setActiveAlert(null);
    finishDialog();
  }

  return (
    <AppDialogContext.Provider value={contextValue}>
      {children}

      <AppConfirmModal
        visible={activeConfirm != null}
        title={activeConfirm?.title}
        message={activeConfirm?.message ?? ''}
        cancelLabel={activeConfirm?.cancelLabel}
        confirmLabel={activeConfirm?.confirmLabel}
        destructive={activeConfirm?.destructive}
        onCancel={() => handleConfirmClose(false)}
        onConfirm={() => handleConfirmClose(true)}
      />

      <AppAlertModal
        visible={activeAlert != null}
        title={activeAlert?.title}
        message={activeAlert?.message ?? ''}
        okLabel={activeAlert?.okLabel}
        onClose={handleAlertClose}
      />
    </AppDialogContext.Provider>
  );
}

export function useAppDialog(): AppDialogContextValue {
  const context = useContext(AppDialogContext);

  if (!context) {
    throw new Error('useAppDialog must be used within AppDialogProvider');
  }

  return context;
}
