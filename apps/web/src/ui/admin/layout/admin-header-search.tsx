import React from 'react';
import { Search, ArrowDown, ArrowUp, CornerDownLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { useI18n } from '@/shared/i18n';
import { useUiShellStore } from '@/ui/admin/stores/ui-shell-store';

import { useAdminAccess } from './access-context';

type SearchItem = {
  id: string;
  to: string;
  permissionKey: string;
  getTitle: (locale: string) => string;
  getDesc: (locale: string) => string;
};

const SEARCH_ITEMS: SearchItem[] = [
  {
    id: 'dashboard',
    to: '/admin',
    permissionKey: 'dashboard.view',
    getTitle: (locale) => (locale.startsWith('zh') ? '仪表盘' : 'Dashboard'),
    getDesc: (locale) =>
      locale.startsWith('zh') ? '查看系统核心指标与图表总览' : 'Overview of key metrics and charts',
  },
  {
    id: 'users',
    to: '/admin/users',
    permissionKey: 'users.view',
    getTitle: (locale) => (locale.startsWith('zh') ? '用户管理' : 'Users'),
    getDesc: (locale) =>
      locale.startsWith('zh') ? '管理用户状态、角色与密码重置' : 'Manage user status, roles, and reset actions',
  },
  {
    id: 'notices',
    to: '/admin/notices',
    permissionKey: 'notices.view',
    getTitle: (locale) => (locale.startsWith('zh') ? '公告管理' : 'Notices'),
    getDesc: (locale) =>
      locale.startsWith('zh') ? '创建、发布与维护公告信息' : 'Create, publish, and maintain notices',
  },
  {
    id: 'cities',
    to: '/admin/cities',
    permissionKey: 'cities.view',
    getTitle: (locale) => (locale.startsWith('zh') ? '城市监控' : 'City Monitor'),
    getDesc: (locale) =>
      locale.startsWith('zh') ? '查看城市监控数据与基础信息' : 'Browse city monitoring data',
  },
  {
    id: 'favorites',
    to: '/admin/favorites',
    permissionKey: 'favorites.view',
    getTitle: (locale) => (locale.startsWith('zh') ? '收藏管理' : 'Favorites'),
    getDesc: (locale) =>
      locale.startsWith('zh') ? '维护用户收藏记录' : 'Manage user favorite records',
  },
  {
    id: 'system',
    to: '/admin/system',
    permissionKey: 'system.view',
    getTitle: (locale) => (locale.startsWith('zh') ? '系统设置' : 'System'),
    getDesc: (locale) =>
      locale.startsWith('zh') ? '配置轮询与服务运行参数' : 'Configure polling and runtime settings',
  },
  {
    id: 'api-quota',
    to: '/admin/api-quota',
    permissionKey: 'apiQuota.view',
    getTitle: (locale) => (locale.startsWith('zh') ? 'API 额度中心' : 'API Quota'),
    getDesc: (locale) =>
      locale.startsWith('zh') ? '查看和风与高德额度及请求趋势' : 'Quota and usage trends by provider',
  },
  {
    id: 'permissions',
    to: '/admin/permissions',
    permissionKey: 'permissions.view',
    getTitle: (locale) => (locale.startsWith('zh') ? '权限管理' : 'Permissions'),
    getDesc: (locale) =>
      locale.startsWith('zh') ? '按角色分配菜单和操作权限' : 'Assign menu and action permissions',
  },
  {
    id: 'profile',
    to: '/admin/profile-settings',
    permissionKey: 'dashboard.view',
    getTitle: (locale) => (locale.startsWith('zh') ? '账户设置' : 'Profile Settings'),
    getDesc: (locale) =>
      locale.startsWith('zh') ? '维护个人资料与偏好' : 'Update profile and preferences',
  },
];

type SearchOption = {
  id: string;
  to: string;
  title: string;
  desc: string;
};

export function AdminHeaderSearch(): React.ReactNode {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const { hasPermission } = useAdminAccess();

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = React.useState('');
  const open = useUiShellStore((state) => state.globalSearchOpen);
  const setOpen = useUiShellStore((state) => state.setGlobalSearchOpen);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  const options = React.useMemo<SearchOption[]>(() => {
    const keyword = query.trim().toLowerCase();
    const base = SEARCH_ITEMS.filter((item) => hasPermission(item.permissionKey)).map((item) => ({
      id: item.id,
      to: item.to,
      title: item.getTitle(locale),
      desc: item.getDesc(locale),
    }));

    if (!keyword) return base;

    return base.filter((item) => {
      return (
        item.title.toLowerCase().includes(keyword) ||
        item.desc.toLowerCase().includes(keyword) ||
        (!locale.startsWith('zh') && item.to.toLowerCase().includes(keyword))
      );
    });
  }, [hasPermission, locale, query]);

  React.useEffect(() => {
    if (options.length === 0) {
      setHighlightedIndex(0);
      return;
    }
    setHighlightedIndex((prev) => {
      if (prev < 0) return 0;
      if (prev > options.length - 1) return options.length - 1;
      return prev;
    });
  }, [options]);

  React.useEffect(() => {
    const onPointerDown = (event: MouseEvent): void => {
      const root = rootRef.current;
      if (!root) return;
      if (root.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  React.useEffect(() => {
    const onShortcut = (event: KeyboardEvent): void => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      inputRef.current?.focus();
      setOpen(true);
    };

    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  const openWithReset = React.useCallback((): void => {
    setOpen(true);
    setHighlightedIndex(0);
  }, []);

  const selectOption = React.useCallback(
    (option: SearchOption): void => {
      navigate(option.to);
      setOpen(false);
      setQuery('');
      setHighlightedIndex(0);
      inputRef.current?.blur();
    },
    [navigate],
  );

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>): void => {
      if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        setOpen(true);
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (options.length === 0) return;
        setHighlightedIndex((prev) => (prev + 1) % options.length);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (options.length === 0) return;
        setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const target = options[highlightedIndex];
        if (!target) return;
        selectOption(target);
        return;
      }

      if (event.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    },
    [highlightedIndex, open, options, selectOption],
  );

  const placeholder = locale.startsWith('zh') ? '搜索后台功能（Ctrl + K）' : 'Search admin pages (Ctrl + K)';

  return (
    <div ref={rootRef} className="relative" data-tour="header-search">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!open) setOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={openWithReset}
          onKeyDown={onKeyDown}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-16 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          placeholder={placeholder}
          aria-label={placeholder}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          Ctrl K
        </span>
      </label>

      {open ? (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="max-h-80 overflow-auto p-2">
            {options.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
                {locale.startsWith('zh') ? '没有匹配结果' : 'No results found'}
              </div>
            ) : (
              options.map((option, index) => {
                const active = index === highlightedIndex;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={cn(
                      'mb-1 flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors last:mb-0',
                      active
                        ? 'border-blue-300 bg-blue-50 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.18)]'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50',
                    )}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseMove={() => setHighlightedIndex(index)}
                    onClick={() => selectOption(option)}
                    aria-selected={active}
                  >
                    <div className="mt-0.5 rounded-md border border-slate-200 bg-white p-1 text-slate-400">
                      <Search className="size-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{option.title}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{option.desc}</p>
                      {!locale.startsWith('zh') ? (
                        <p className="mt-1 truncate text-[11px] text-slate-400">{option.to}</p>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-[11px] text-slate-500">
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5">
                <ArrowUp className="size-3" />
                <ArrowDown className="size-3" />
              </span>
              <span>{locale.startsWith('zh') ? '切换高亮项' : 'Move highlight'}</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5">
              <CornerDownLeft className="size-3" />
              <span>{locale.startsWith('zh') ? '进入' : 'Open'}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
