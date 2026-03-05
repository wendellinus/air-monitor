import React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { RefreshIconButton } from '@/ui/admin/components/feedback';
import type { TranslateFn } from '@/ui/admin/notices/lib/types';

type NoticesToolbarProps = {
  t: TranslateFn;
  isRefreshing: boolean;
  isInitialLoading: boolean;
  refreshLocked: boolean;
  onRefresh: () => void;
  onCreate: () => void;
};

export function NoticesToolbar(props: NoticesToolbarProps): React.ReactNode {
  return (
    <div className="flex items-center justify-end gap-2">
      <RefreshIconButton
        label={props.t('admin.common.refresh')}
        onClick={props.onRefresh}
        loading={props.isRefreshing}
        disabled={props.isRefreshing || props.isInitialLoading || props.refreshLocked}
      />
      <Button onClick={props.onCreate}>
        <Plus className="mr-2 h-4 w-4" />
        {props.t('admin.notices.new')}
      </Button>
    </div>
  );
}
