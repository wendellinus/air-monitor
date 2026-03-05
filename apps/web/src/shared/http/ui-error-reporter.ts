import { toast } from 'sonner';

export function reportUiError(error: unknown): void {
  if (error instanceof Error && error.message) {
    toast.error(error.message);
    return;
  }
  toast.error('请求失败');
}
