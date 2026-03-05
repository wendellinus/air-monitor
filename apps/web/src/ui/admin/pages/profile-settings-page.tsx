import React from 'react';

import { SettingsProfile1 } from '@/components/settings-profile1';
import { useI18n } from '@/shared/i18n';
import { PageShell } from '@/ui/admin/components/page-shell';
import { ProfileLoadingPanel, ProfileTourCard } from '@/ui/admin/profile-settings/components';
import { useAdminProfileSettings } from '@/ui/admin/profile-settings/hooks';
import { textByLocale } from '@/ui/admin/profile-settings/lib';

export function AdminProfileSettingsPage(): React.ReactNode {
  const { locale } = useI18n();
  const {
    loading,
    saving,
    defaultValues,
    handleSaveProfile,
    handleResetTour,
    handleResetAndStart,
  } = useAdminProfileSettings(locale);

  return (
    <PageShell
      fitHeight
      title={textByLocale(locale, '账户设置', 'Account Settings')}
      description={textByLocale(
        locale,
        '维护账户基础资料、头像与个性化引导配置。',
        'Manage profile info, avatar, and onboarding preferences.',
      )}
      bodyClassName="min-h-0 overflow-auto pr-1 [scrollbar-gutter:stable]"
    >
      <div className="space-y-4 pb-6 pt-1">
        {loading ? (
          <ProfileLoadingPanel
            text={textByLocale(locale, '正在加载账户信息...', 'Loading profile settings...')}
          />
        ) : (
          <SettingsProfile1
            className="max-w-3xl"
            defaultValues={defaultValues}
            onSave={handleSaveProfile}
            saving={saving}
          />
        )}

        <ProfileTourCard
          title={textByLocale(locale, '新手引导', 'Onboarding Tour')}
          description={textByLocale(
            locale,
            '可在这里重置引导状态，或立即重新开始一次完整引导。',
            'Reset tour state here or restart the full guide now.',
          )}
          resetLabel={textByLocale(locale, '重置引导', 'Reset Tour')}
          startLabel={textByLocale(locale, '立即开始引导', 'Start Tour Now')}
          onReset={handleResetTour}
          onStart={handleResetAndStart}
        />
      </div>
    </PageShell>
  );
}
