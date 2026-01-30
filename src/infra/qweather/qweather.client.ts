import { createPrivateKey, type KeyObject } from 'crypto';

import { Injectable } from '@nestjs/common';
import axios, { type AxiosInstance } from 'axios';
import { SignJWT } from 'jose';


import { EnvService } from '../../shared/env/env.service';

type QweatherAuthHeader =
  | { kind: 'bearer'; value: string }
  | { kind: 'apiKey'; value: string };

@Injectable()
export class QweatherClient {
  private readonly http: AxiosInstance;

  private cachedToken: { value: string; expMs: number } | null = null;

  constructor(private readonly env: EnvService) {
    this.http = axios.create({
      baseURL: env.qweatherHost,
      timeout: 10_000,
    });
  }

  private hasJwtAuth(): boolean {
    return Boolean(this.env.qweatherPublicId && this.env.qweatherPrivateKeyPem);
  }

  private hasApiKeyAuth(): boolean {
    return Boolean(this.env.qweatherApiKey);
  }

  private loadPkcs8Ed25519Key(privateKeyPem: string): KeyObject {
    // Normalize common escaping artifacts from .env parsing.
    const pem = privateKeyPem
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\\\n/g, '\n');

    // Preferred: normal PEM import.
    try {
      return createPrivateKey({ key: pem, format: 'pem', type: 'pkcs8' });
    } catch {
      // Fallback: decode base64 ourselves and import as DER to bypass PEM decoder quirks.
      const b64 = pem
        .split('\n')
        .map((l) => l.replace(/\\$/g, '').trim())
        .filter((l) => l && !l.includes('BEGIN') && !l.includes('END'))
        .join('');
      const der = Buffer.from(b64, 'base64');
      return createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
    }
  }

  private async getAuthHeader(): Promise<QweatherAuthHeader> {
    if (this.hasJwtAuth()) {
      const nowMs = Date.now();
      const refreshWindowMs = 60_000; // refresh 1 min before exp
      if (this.cachedToken && nowMs + refreshWindowMs < this.cachedToken.expMs) {
        return { kind: 'bearer', value: this.cachedToken.value };
      }

      const publicId = this.env.qweatherPublicId!;
      const projectId = this.env.qweatherProjectId ?? '';
      const privateKeyPem = this.env.qweatherPrivateKeyPem!;

      const iat = Math.floor(nowMs / 1000);
      const exp = iat + 5 * 60;

      // QWeather JWT uses an Ed25519 private key in PKCS#8 PEM.
      // Make the expected format explicit for better error messages.
      const key = this.loadPkcs8Ed25519Key(privateKeyPem);
      const jwt = await new SignJWT({ sub: projectId })
        .setProtectedHeader({ alg: 'EdDSA', kid: publicId })
        .setIssuedAt(iat)
        .setIssuer(publicId)
        .setExpirationTime(exp)
        .sign(key);

      const token = `Bearer ${jwt}`;
      this.cachedToken = { value: token, expMs: exp * 1000 };
      return { kind: 'bearer', value: token };
    }

    if (this.hasApiKeyAuth()) {
      return { kind: 'apiKey', value: this.env.qweatherApiKey! };
    }

    throw new Error('QWeather credentials are not configured (JWT or API key).');
  }

  async get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    if (!this.env.qweatherHost) {
      throw new Error('QWEATHER_HOST is not configured.');
    }

    const auth = await this.getAuthHeader();
    const headers: Record<string, string> = {};
    if (auth.kind === 'bearer') {
      headers.Authorization = auth.value;
    } else {
      headers['X-QW-Api-Key'] = auth.value;
    }

    const res = await this.http.get<T>(path, { params, headers });
    return res.data;
  }
}
