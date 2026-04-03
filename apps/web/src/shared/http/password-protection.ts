import type {
  AdminResetPasswordRequest,
  LoginRequest,
  PasswordEncryptionKeyData,
  RegisterRequest,
} from '@air-monitor/shared';

import { api } from '@/shared/api';
import { SILENT_UI_ERROR_REQUEST_CONFIG } from '@/shared/http/api-request-config';
import type { ApiResponse } from '@/shared/types';

let passwordKeyPromise: Promise<PasswordEncryptionKeyData> | null = null;

function decodePemToArrayBuffer(publicKeyPem: string): ArrayBuffer {
  const base64 = publicKeyPem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s+/g, '');
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

function encodeArrayBufferToBase64(value: ArrayBuffer): string {
  const bytes = new Uint8Array(value);
  const chunkSize = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return window.btoa(binary);
}

async function getPasswordEncryptionKey(): Promise<PasswordEncryptionKeyData> {
  if (!passwordKeyPromise) {
    passwordKeyPromise = api
      .get<ApiResponse<PasswordEncryptionKeyData>>('/auth/password-key', SILENT_UI_ERROR_REQUEST_CONFIG)
      .then((response) => response.data.data)
      .catch((error: unknown) => {
        passwordKeyPromise = null;
        throw error;
      });
  }

  return passwordKeyPromise;
}

async function encryptSecret(secret: string): Promise<{ encryptedValue: string; keyId: string }> {
  if (!window.crypto?.subtle) {
    throw new Error('当前浏览器环境不支持密码加密，请切换到 HTTPS 或升级浏览器后重试');
  }

  const passwordKey = await getPasswordEncryptionKey();
  const cryptoKey = await window.crypto.subtle.importKey(
    'spki',
    decodePemToArrayBuffer(passwordKey.publicKeyPem),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt'],
  );

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    cryptoKey,
    new TextEncoder().encode(secret),
  );

  return {
    encryptedValue: encodeArrayBufferToBase64(encrypted),
    keyId: passwordKey.keyId,
  };
}

export async function encryptPasswordTransport(
  password: string,
): Promise<Pick<LoginRequest, 'encryptedPassword' | 'passwordKeyId'>> {
  const encryptedSecret = await encryptSecret(password);
  return {
    encryptedPassword: encryptedSecret.encryptedValue,
    passwordKeyId: encryptedSecret.keyId,
  };
}

export async function encryptRegisterPasswordTransport(
  password: string,
): Promise<Pick<RegisterRequest, 'encryptedPassword' | 'passwordKeyId'>> {
  const encryptedSecret = await encryptSecret(password);
  return {
    encryptedPassword: encryptedSecret.encryptedValue,
    passwordKeyId: encryptedSecret.keyId,
  };
}

export async function encryptNewPasswordTransport(
  newPassword: string,
): Promise<Pick<AdminResetPasswordRequest, 'encryptedNewPassword' | 'passwordKeyId'>> {
  const encryptedSecret = await encryptSecret(newPassword);
  return {
    encryptedNewPassword: encryptedSecret.encryptedValue,
    passwordKeyId: encryptedSecret.keyId,
  };
}
