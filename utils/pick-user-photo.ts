import * as ImagePicker from 'expo-image-picker';

import type { PhotoAsset } from '@/types/user-photo';

export class CameraPermissionError extends Error {
  constructor() {
    super('Permita o acesso à câmera para tirar uma foto.');
    this.name = 'CameraPermissionError';
  }
}

export class GalleryPermissionError extends Error {
  constructor() {
    super('Permita o acesso às suas fotos para escolher uma imagem.');
    this.name = 'GalleryPermissionError';
  }
}

/** @deprecated Use GalleryPermissionError */
export class PhotoPermissionError extends GalleryPermissionError {}

export class CameraLaunchError extends Error {
  constructor() {
    super('Não foi possível abrir a câmera.');
    this.name = 'CameraLaunchError';
  }
}

export class GalleryLaunchError extends Error {
  constructor() {
    super('Não foi possível abrir a galeria.');
    this.name = 'GalleryLaunchError';
  }
}

function mapAssetToPhotoAsset(asset: ImagePicker.ImagePickerAsset): PhotoAsset {
  return {
    uri: asset.uri,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    file: asset.file ?? undefined,
  };
}

export async function takeUserPhoto(): Promise<PhotoAsset | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new CameraPermissionError();
  }

  let result: ImagePicker.ImagePickerResult;

  try {
    result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
  } catch {
    throw new CameraLaunchError();
  }

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  return mapAssetToPhotoAsset(result.assets[0]);
}

export async function pickUserPhotoFromGallery(): Promise<PhotoAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new GalleryPermissionError();
  }

  let result: ImagePicker.ImagePickerResult;

  try {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
  } catch {
    throw new GalleryLaunchError();
  }

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  return mapAssetToPhotoAsset(result.assets[0]);
}

/** Mantido para compatibilidade com Signup */
export async function pickUserPhoto(): Promise<PhotoAsset | null> {
  return pickUserPhotoFromGallery();
}
