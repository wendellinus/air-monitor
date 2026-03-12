import { toast } from 'sonner';

import { isCanceledRequestError } from '@/shared/http/error-normalizer';

function extractErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    const trimmed = error.message.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof error === 'string') {
    const trimmed = error.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = error.message;
    if (typeof message === 'string') {
      const trimmed = message.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
  }

  return null;
}

export function reportUiError(error: unknown): void {
  if (isCanceledRequestError(error)) return;
  toast.error(
    extractErrorMessage(error) ?? '\u64cd\u4f5c\u672a\u5b8c\u6210\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5',
  );
}
