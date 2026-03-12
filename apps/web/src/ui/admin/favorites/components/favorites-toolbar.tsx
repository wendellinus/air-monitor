import React from 'react';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshIconButton } from '@/ui/admin/components/feedback';
import type { TranslateFn } from '@/ui/admin/favorites/lib/types';

type FavoritesToolbarProps = {
  t: TranslateFn;
  inputValue: string;
  keyword: string;
  isRefreshing: boolean;
  isInitialLoading: boolean;
  refreshLocked: boolean;
  compact?: boolean;
  onInputChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onRefresh: () => void;
};

export function FavoritesToolbar(props: FavoritesToolbarProps): React.ReactNode {
  if (props.compact) {
    return (
      <RefreshIconButton
        label={props.t('admin.common.refresh')}
        onClick={props.onRefresh}
        loading={props.isRefreshing || props.refreshLocked}
        disabled={props.isRefreshing || props.isInitialLoading || props.refreshLocked}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder={props.t('admin.favorites.searchPlaceholder')}
          value={props.inputValue}
          onChange={(event) => props.onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            props.onSearch();
          }}
        />
      </div>
      <Button variant="outline" onClick={props.onSearch}>
        {props.t('admin.favorites.search')}
      </Button>
      {props.keyword ? (
        <Button variant="ghost" onClick={props.onClear}>
          {props.t('admin.favorites.clear')}
        </Button>
      ) : null}
      <RefreshIconButton
        label={props.t('admin.common.refresh')}
        onClick={props.onRefresh}
        loading={props.isRefreshing || props.refreshLocked}
        disabled={props.isRefreshing || props.isInitialLoading || props.refreshLocked}
      />
    </div>
  );
}
