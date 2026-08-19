import type {
  AppAlertOptions,
  AppConfirmOptions,
  AppDialogHandlers,
} from '@/types/app-dialog';

let dialogBridge: AppDialogHandlers | null = null;

export function registerAppDialogBridge(value: AppDialogHandlers | null) {
  dialogBridge = value;
}

export function appConfirm(options: AppConfirmOptions): Promise<boolean> {
  if (!dialogBridge) {
    return Promise.resolve(false);
  }

  return dialogBridge.confirm(options);
}

export function appAlert(options: AppAlertOptions): Promise<void> {
  if (!dialogBridge) {
    return Promise.resolve();
  }

  return dialogBridge.alert(options);
}

export type { AppAlertOptions, AppConfirmOptions };
