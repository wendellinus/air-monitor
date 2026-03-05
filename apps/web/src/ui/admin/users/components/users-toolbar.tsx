import React from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshIconButton } from '@/ui/admin/components/feedback';
import type { TranslateFn } from '@/ui/admin/users/lib/types';

type UsersToolbarProps = {
  t: TranslateFn;
  inputValue: string;
  keyword: string;
  isRefreshing: boolean;
  isInitialLoading: boolean;
  refreshLocked: boolean;
  onInputChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  onRefresh: () => void;
};

export function UsersToolbar(props: UsersToolbarProps): React.ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder={props.t('admin.users.search.placeholder')}
          value={props.inputValue}
          onChange={(event) => props.onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            props.onSearch();
          }}
        />
      </div>
      <Button variant="outline" onClick={props.onSearch}>
        {props.t('admin.users.search.search')}
      </Button>
      {props.keyword ? (
        <Button variant="ghost" onClick={props.onClearSearch}>
          {props.t('admin.users.search.clear')}
        </Button>
      ) : null}
      <RefreshIconButton
        label={props.t('admin.common.refresh')}
        onClick={props.onRefresh}
        loading={props.isRefreshing}
        disabled={props.isRefreshing || props.isInitialLoading || props.refreshLocked}
      />
    </div>
  );
}
