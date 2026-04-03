import {
  constants,
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  privateDecrypt,
  type KeyObject,
} from 'crypto';

import { Injectable, Logger } from '@nestjs/common';

import type { PasswordEncryptionKeyData } from '@air-monitor/shared';

import { AppError } from '../../shared/app-error';
import { EnvService } from '../../shared/env/env.service';
import { ErrorCodes } from '../../shared/error-codes';

function generatePasswordPrivateKeyPem(): string {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicExponent: 0x10001,
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
  });

  return privateKey;
}

@Injectable()
export class AuthPasswordCryptoService {
  private readonly logger = new Logger(AuthPasswordCryptoService.name);
  private readonly privateKey: KeyObject;
  private readonly publicKeyPem: string;
  private readonly keyId: string;

  constructor(private readonly env: EnvService) {
    const privateKeyPem = this.env.authPasswordPrivateKeyPem ?? generatePasswordPrivateKeyPem();
    if (!this.env.authPasswordPrivateKeyPem) {
      this.logger.warn(
        'AUTH_PASSWORD_PRIVATE_KEY_PEM is not configured. Generated an ephemeral RSA key for password transport encryption; refresh pages after each API restart.',
      );
    }

    this.privateKey = createPrivateKey(privateKeyPem);
    const exportedPublicKey = createPublicKey(this.privateKey).export({
      type: 'spki',
      format: 'pem',
    });
    this.publicKeyPem =
      typeof exportedPublicKey === 'string' ? exportedPublicKey : exportedPublicKey.toString('utf8');
    this.keyId = createHash('sha256').update(this.publicKeyPem).digest('hex').slice(0, 16);
  }

  getPasswordEncryptionKey(): PasswordEncryptionKeyData {
    return {
      keyId: this.keyId,
      algorithm: 'RSA-OAEP-256',
      publicKeyPem: this.publicKeyPem,
    };
  }

  resolvePassword(
    password: string | undefined,
    encryptedPassword: string | undefined,
    passwordKeyId: string | undefined,
    minimumLength = 1,
  ): string {
    return this.resolveSecret(password, encryptedPassword, passwordKeyId, '密码', minimumLength);
  }

  resolveNewPassword(
    newPassword: string | undefined,
    encryptedNewPassword: string | undefined,
    passwordKeyId: string | undefined,
    minimumLength = 6,
  ): string {
    return this.resolveSecret(newPassword, encryptedNewPassword, passwordKeyId, '新密码', minimumLength);
  }

  private resolveSecret(
    plainValue: string | undefined,
    encryptedValue: string | undefined,
    passwordKeyId: string | undefined,
    fieldLabel: string,
    minimumLength: number,
  ): string {
    const value = encryptedValue
      ? this.decryptSecret(encryptedValue, passwordKeyId)
      : (plainValue ?? '');

    if (value.length < minimumLength) {
      throw new AppError(ErrorCodes.ParamError, `${fieldLabel}至少 ${minimumLength} 位`);
    }

    return value;
  }

  private decryptSecret(encryptedValue: string, passwordKeyId: string | undefined): string {
    if (!passwordKeyId) {
      throw new AppError(ErrorCodes.ParamError, '缺少密码密钥标识');
    }
    if (passwordKeyId !== this.keyId) {
      throw new AppError(ErrorCodes.ParamError, '密码加密密钥已过期，请刷新页面后重试');
    }

    try {
      return privateDecrypt(
        {
          key: this.privateKey,
          padding: constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.from(encryptedValue, 'base64'),
      ).toString('utf8');
    } catch {
      throw new AppError(ErrorCodes.ParamError, '密码解密失败，请刷新页面后重试');
    }
  }
}
