import React from 'react';
import { toast } from 'sonner';

import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import type {
  AdminNoticeItem,
  AdminNoticeListData,
  CreateNoticeForm,
  TranslateFn,
} from '@/ui/admin/notices/lib/types';
import { getDefaultCreateNoticeForm } from '@/ui/admin/notices/lib/types';
import { deriveNoticeViewStatus, normalizeAdminNoticeItem } from '@/ui/admin/notices/lib/status';

const PAGE_SIZE = 15;

type UseAdminNoticesInput = {
  t: TranslateFn;
};

type UseAdminNoticesResult = {
  pageSize: number;
  notices: AdminNoticeItem[];
  total: number;
  totalPages: number;
  page: number;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  createOpen: boolean;
  submitting: boolean;
  publishingId: number | string | null;
  effectiveFrom: string;
  effectiveTo: string;
  form: CreateNoticeForm;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setCreateOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setForm: React.Dispatch<React.SetStateAction<CreateNoticeForm>>;
  setEffectiveFrom: (value: string) => void;
  setEffectiveTo: (value: string) => void;
  clearEffectiveFilters: () => void;
  refresh: () => Promise<void>;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  togglePublish: (notice: AdminNoticeItem) => Promise<void>;
  revokeNotice: (notice: AdminNoticeItem) => Promise<void>;
  createNotice: () => Promise<void>;
};

export function useAdminNotices(input: UseAdminNoticesInput): UseAdminNoticesResult {
  const { t } = input;
  const [notices, setNotices] = React.useState<AdminNoticeItem[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [page, setPage] = React.useState<number>(1);
  const [isInitialLoading, setIsInitialLoading] = React.useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [createOpen, setCreateOpen] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [publishingId, setPublishingId] = React.useState<number | string | null>(null);
  const [effectiveFrom, setEffectiveFromState] = React.useState<string>('');
  const [effectiveTo, setEffectiveToState] = React.useState<string>('');
  const [form, setForm] = React.useState<CreateNoticeForm>(getDefaultCreateNoticeForm);
  const firstLoadRef = React.useRef<boolean>(true);

  const totalPages = React.useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const loadNotices = React.useCallback(
    async (targetPage: number, mode: 'initial' | 'refresh' = 'refresh'): Promise<void> => {
      if (mode === 'initial') {
        setIsInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }
      try {
        const response = await api.get<ApiResponse<AdminNoticeListData>>('/admin/notices', {
          params: {
            page: targetPage,
            pageSize: PAGE_SIZE,
            ...(effectiveFrom ? { effectiveFrom } : {}),
            ...(effectiveTo ? { effectiveTo } : {}),
          },
        });
        setNotices(response.data.data.list.map((item) => normalizeAdminNoticeItem(item)));
        setTotal(response.data.data.total);
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : t('admin.notices.loadFail'));
      } finally {
        if (mode === 'initial') {
          setIsInitialLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [effectiveFrom, effectiveTo, t],
  );

  React.useEffect(() => {
    const mode = firstLoadRef.current ? 'initial' : 'refresh';
    firstLoadRef.current = false;
    void loadNotices(page, mode);
  }, [loadNotices, page]);

  const refresh = React.useCallback(async (): Promise<void> => {
    await loadNotices(page, 'refresh');
  }, [loadNotices, page]);

  const setEffectiveFrom = React.useCallback((value: string): void => {
    setEffectiveFromState(value);
    setPage(1);
  }, []);

  const setEffectiveTo = React.useCallback((value: string): void => {
    setEffectiveToState(value);
    setPage(1);
  }, []);

  const clearEffectiveFilters = React.useCallback((): void => {
    setEffectiveFromState('');
    setEffectiveToState('');
    setPage(1);
  }, []);

  const openCreateDialog = React.useCallback((): void => {
    setForm(getDefaultCreateNoticeForm());
    setCreateOpen(true);
  }, []);

  const closeCreateDialog = React.useCallback((): void => {
    setCreateOpen(false);
  }, []);

  const togglePublish = React.useCallback(
    async (notice: AdminNoticeItem): Promise<void> => {
      const currentlyActive = notice.status === 'active';
      if (notice.status === 'expired') return;
      const action = currentlyActive ? 'unpublish' : 'publish';
      setPublishingId(notice.id);
      try {
        await api.post(`/admin/notices/${notice.id}/${action}`);
        setNotices((current) =>
          current.map((item) =>
            item.id === notice.id
              ? {
                  ...item,
                  status: currentlyActive
                    ? 'revoked'
                    : deriveNoticeViewStatus('published', item.startTime, item.endTime),
                }
              : item,
          ),
        );
        toast.success(t('admin.notices.publishSuccess'));
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : t('admin.notices.publishFail'));
      } finally {
        setPublishingId(null);
      }
    },
    [t],
  );

  const revokeNotice = React.useCallback(
    async (notice: AdminNoticeItem): Promise<void> => {
      if (notice.status === 'revoked' || notice.status === 'expired') return;
      setPublishingId(notice.id);
      try {
        await api.post(`/admin/notices/${notice.id}/revoke`);
        setNotices((current) =>
          current.map((item) => (item.id === notice.id ? { ...item, status: 'revoked' } : item)),
        );
        toast.success(t('admin.notices.revokeSuccess'));
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : t('admin.notices.revokeFail'));
      } finally {
        setPublishingId(null);
      }
    },
    [t],
  );

  const createNotice = React.useCallback(async (): Promise<void> => {
    if (!form.title.trim()) {
      toast.error(t('admin.notices.create.titleRequired'));
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/notices', {
        title: form.title.trim(),
        content: form.content.trim() || undefined,
        level: form.level,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      });
      toast.success(t('admin.notices.create.success'));
      setCreateOpen(false);
      setForm(getDefaultCreateNoticeForm());
      setPage(1);
      await loadNotices(1, 'refresh');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t('admin.notices.create.fail'));
    } finally {
      setSubmitting(false);
    }
  }, [form, loadNotices, t]);

  return {
    pageSize: PAGE_SIZE,
    notices,
    total,
    totalPages,
    page,
    isInitialLoading,
    isRefreshing,
    createOpen,
    submitting,
    publishingId,
    effectiveFrom,
    effectiveTo,
    form,
    setPage,
    setCreateOpen,
    setForm,
    setEffectiveFrom,
    setEffectiveTo,
    clearEffectiveFilters,
    refresh,
    openCreateDialog,
    closeCreateDialog,
    togglePublish,
    revokeNotice,
    createNotice,
  };
}
