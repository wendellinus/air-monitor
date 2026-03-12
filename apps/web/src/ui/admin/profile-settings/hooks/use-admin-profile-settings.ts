import React from 'react';
import type { MeProfileData, UpdateMeProfileRequest } from '@air-monitor/shared';
import { toast } from 'sonner';

import { SettingsProfile1, type ProfileFormData } from '@/components/settings-profile1';
import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import {
  ADMIN_TOUR_START_EVENT,
} from '@/ui/admin/components/admin-driver-tour-button';
import { textByLocale } from '@/ui/admin/profile-settings/lib/locale';
import { useOnboardingStore } from '@/ui/admin/stores/onboarding-store';
import { useAdminSessionStore } from '@/ui/admin/stores/admin-session-store';
import {
  normalizeAvatarBeforeStore,
  readProfileExtra,
  type ProfileExtraStorage,
  writeProfileExtra,
} from '@/ui/admin/profile-settings/lib/profile-extra-storage';

type UseAdminProfileSettingsResult = {
  loading: boolean;
  saving: boolean;
  defaultValues: ProfileFormData;
  handleSaveProfile: (data: ProfileFormData) => Promise<void>;
  handleResetTour: () => void;
  handleResetAndStart: () => void;
};

export function useAdminProfileSettings(locale: string): UseAdminProfileSettingsResult {
  const resetTour = useOnboardingStore((state) => state.resetTour);
  const me = useAdminSessionStore((state) => state.me);
  const setMe = useAdminSessionStore((state) => state.setMe);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [defaultValues, setDefaultValues] = React.useState<ProfileFormData>({
    name: '',
    email: '',
    username: '',
    bio: '',
    avatar: '',
  });

  const loadProfile = React.useCallback(async (): Promise<void> => {
    const defaultBio = textByLocale(
      locale,
      '用于维护系统账户信息。',
      'Used to maintain account profile information.',
    );
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<MeProfileData>>('/user/me/profile');
      const profile = response.data.data;
      const extra = readProfileExtra(profile.id);
      setDefaultValues({
        name: extra.name ?? profile.username,
        username: profile.username,
        email: profile.email ?? '',
        bio: extra.bio ?? defaultBio,
        avatar: extra.avatar ?? '',
      });
    } catch (errorValue: unknown) {
      toast.error(
        errorValue instanceof Error
          ? errorValue.message
          : textByLocale(locale, '加载账户信息失败', 'Failed to load profile settings'),
      );
    } finally {
      setLoading(false);
    }
  }, [locale]);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = React.useCallback(
    async (data: ProfileFormData): Promise<void> => {
      const username = data.username.trim();
      if (!username) {
        toast.error(textByLocale(locale, '用户名不能为空', 'Username is required'));
        return;
      }

      setSaving(true);
      try {
        const payload: UpdateMeProfileRequest = {
          username,
          email: data.email.trim() || undefined,
        };
        const response = await api.put<ApiResponse<MeProfileData>>('/user/me/profile', payload);
        const saved = response.data.data;

        const extra: ProfileExtraStorage = {
          name: data.name.trim() || saved.username,
          bio: data.bio?.trim() || undefined,
          avatar: normalizeAvatarBeforeStore(data.avatar),
        };
        writeProfileExtra(saved.id, extra);

        setDefaultValues({
          name: extra.name ?? saved.username,
          username: saved.username,
          email: saved.email ?? '',
          bio: extra.bio ?? '',
          avatar: extra.avatar ?? '',
        });
        if (me) {
          setMe({ ...me, username: saved.username });
        }
        toast.success(textByLocale(locale, '账户信息已保存', 'Profile saved'));
      } catch (errorValue: unknown) {
        toast.error(
          errorValue instanceof Error
            ? errorValue.message
            : textByLocale(locale, '保存账户信息失败', 'Failed to save profile'),
        );
      } finally {
        setSaving(false);
      }
    },
    [locale, me, setMe],
  );

  const handleResetTour = React.useCallback(() => {
    resetTour();
    toast.success(
      textByLocale(
        locale,
        '引导已重置，下次进入仪表盘会自动出现。',
        'Tour reset. It will auto start next time on dashboard.',
      ),
    );
  }, [locale, resetTour]);

  const handleResetAndStart = React.useCallback(() => {
    resetTour();
    window.dispatchEvent(new Event(ADMIN_TOUR_START_EVENT));
  }, [resetTour]);

  return {
    loading,
    saving,
    defaultValues,
    handleSaveProfile,
    handleResetTour,
    handleResetAndStart,
  };
}


