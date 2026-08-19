export type AppConfirmOptions = {
  message: string;
  title?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  destructive?: boolean;
};

export type AppAlertOptions = {
  message: string;
  title?: string;
  okLabel?: string;
};

export type AppDialogHandlers = {
  confirm: (options: AppConfirmOptions) => Promise<boolean>;
  alert: (options: AppAlertOptions) => Promise<void>;
};
