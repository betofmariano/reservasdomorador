import * as Device from 'expo-device';
import { Platform } from 'react-native';

export type DeviceRegistrationInfo = {
  plataforma: string;
  dispositivo: string;
};

function getWebDeviceDescription(): string {
  if (typeof navigator === 'undefined') {
    return 'Navegador web';
  }

  const userAgent = navigator.userAgent;

  if (/Edg\//i.test(userAgent)) {
    return 'Microsoft Edge';
  }

  if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) {
    return 'Google Chrome';
  }

  if (/Firefox\//i.test(userAgent)) {
    return 'Mozilla Firefox';
  }

  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) {
    return 'Apple Safari';
  }

  return userAgent.slice(0, 120);
}

export function getDeviceRegistrationInfo(): DeviceRegistrationInfo {
  if (Platform.OS === 'web') {
    return {
      plataforma: 'web',
      dispositivo: getWebDeviceDescription(),
    };
  }

  const plataforma = Platform.OS;
  const parts = [
    Device.brand,
    Device.modelName ?? Device.deviceName,
    Device.osName,
    Device.osVersion,
  ]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);

  return {
    plataforma,
    dispositivo: parts.length > 0 ? parts.join(' · ') : plataforma,
  };
}
