import type { User } from '@/types/user';

export type PhotoAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  file?: File;
};

export type UpdatePhotoResponse = {
  foto?: string;
  user?: User;
  [key: string]: unknown;
};
