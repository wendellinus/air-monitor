import React from 'react';
import type { CityItem } from '@air-monitor/shared';

import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import { humanizeError, toastErrorDeduped } from '@/ui/screen/lib/screen-utils';

type ScreenSearchState = {
  searchOpen: boolean;
  searchKeyword: string;
  searchResults: CityItem[];
  searchLoading: boolean;
  searchError: string | null;
  searchInputRef: React.RefObject<HTMLInputElement>;
  setSearchKeyword: React.Dispatch<React.SetStateAction<string>>;
  openSearch: () => void;
  closeSearch: () => void;
};

export function useScreenSearch(): ScreenSearchState {
  const [searchOpen, setSearchOpen] = React.useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = React.useState<string>('');
  const [searchResults, setSearchResults] = React.useState<CityItem[]>([]);
  const [searchLoading, setSearchLoading] = React.useState<boolean>(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);

  const searchAbortRef = React.useRef<AbortController | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const closeSearch = React.useCallback((): void => {
    searchAbortRef.current?.abort();
    setSearchOpen(false);
    setSearchKeyword('');
    setSearchResults([]);
    setSearchLoading(false);
    setSearchError(null);
  }, []);

  const openSearch = React.useCallback((): void => {
    setSearchKeyword('');
    setSearchResults([]);
    setSearchLoading(false);
    setSearchError(null);
    setSearchOpen(true);
  }, []);

  React.useEffect(() => {
    return () => searchAbortRef.current?.abort();
  }, []);

  React.useEffect(() => {
    if (!searchOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      closeSearch();
    };

    window.addEventListener('keydown', onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [closeSearch, searchOpen]);

  React.useEffect(() => {
    if (!searchOpen) return;
    const keyword = searchKeyword.trim();

    if (!keyword) {
      searchAbortRef.current?.abort();
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setSearchLoading(true);
    setSearchError(null);

    const timer = setTimeout(() => {
      api
        .get<ApiResponse<CityItem[]>>('/city/search', {
          params: { keyword },
          signal: controller.signal,
        })
        .then((res) => {
          if (controller.signal.aborted) return;
          const list = Array.isArray(res.data.data) ? res.data.data : [];
          setSearchResults(list.slice(0, 28));
        })
        .catch((e: unknown) => {
          const err = e as { name?: string; code?: string };
          if (
            err.name === 'CanceledError' ||
            err.name === 'AbortError' ||
            err.code === 'ERR_CANCELED'
          ) {
            return;
          }
          const msg = humanizeError(e);
          setSearchResults([]);
          setSearchError(msg);
          toastErrorDeduped('city-search', msg, 2500);
        })
        .finally(() => {
          if (controller.signal.aborted) return;
          setSearchLoading(false);
        });
    }, 260);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchKeyword, searchOpen]);

  return {
    searchOpen,
    searchKeyword,
    searchResults,
    searchLoading,
    searchError,
    searchInputRef,
    setSearchKeyword,
    openSearch,
    closeSearch,
  };
}
