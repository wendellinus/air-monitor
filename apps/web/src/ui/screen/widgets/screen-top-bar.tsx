import React from 'react';
import { Search } from 'lucide-react';

import type { NoticeItem } from '@air-monitor/shared';

import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

type ScreenTopBarProps = {
  notices: NoticeItem[];
  now: Date;
  searchOpen: boolean;
  isLoggedIn: boolean;
  replayMode: boolean;
  replayLabel: string;
  onOpenSearch: () => void;
};

type NoticeMarqueeItem = {
  key: string;
  level: 'urgent' | 'info';
  title: string;
  summary: string;
};

const TEXT = {
  title: '空气质量监测',
  empty: '暂无公告',
  unnamedNotice: '未命名公告',
  urgent: '紧急',
  info: '普通',
  searchPlaceholder: '搜索数据...',
  searchAriaLabel: '打开搜索',
  admin: '管理后台',
  login: '登录后台',
} as const;

function toMarqueeItems(notices: NoticeItem[]): NoticeMarqueeItem[] {
  return notices.map((notice) => {
    const title = notice.title?.trim() || TEXT.unnamedNotice;
    const compactContent = (notice.content ?? '').replace(/\s+/g, ' ').trim();
    const summary = compactContent.length > 42 ? `${compactContent.slice(0, 42)}...` : compactContent;
    return {
      key: String(notice.id),
      level: notice.level === 'urgent' ? 'urgent' : 'info',
      title,
      summary,
    };
  });
}

export function ScreenTopBar(props: ScreenTopBarProps): React.ReactNode {
  const marqueeItems = React.useMemo(() => toMarqueeItems(props.notices), [props.notices]);
  const adminLink = props.isLoggedIn ? '/admin' : '/admin/login';
  const adminLabel = props.isLoggedIn ? TEXT.admin : TEXT.login;

  return (
    <header className="pointer-events-auto relative z-30 flex w-full items-center rounded-[var(--radius)] border border-white/8 bg-black/22 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/10 backdrop-blur-lg">
      <div className="flex items-center gap-4">
        <div className="text-base font-semibold tracking-[0.12em]">{TEXT.title}</div>
      </div>

      <div className="mx-6 flex min-w-0 flex-1 items-center gap-3">
        <div className="relative w-full overflow-hidden">
          {marqueeItems.length === 0 ? (
            <div className="text-sm text-muted-foreground">{TEXT.empty}</div>
          ) : (
            <div className="flex w-max min-w-full items-center gap-3 whitespace-nowrap pr-3 animate-marquee [animation-duration:32s] hover:[animation-play-state:paused]">
              {[...marqueeItems, ...marqueeItems].map((item, index) => (
                <div
                  key={`${item.key}-${index}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/18 px-3 py-1.5 text-xs"
                >
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                      item.level === 'urgent'
                        ? 'border-rose-300/50 bg-rose-500/20 text-rose-100'
                        : 'border-sky-200/40 bg-sky-400/15 text-sky-100',
                    )}
                  >
                    {item.level === 'urgent' ? TEXT.urgent : TEXT.info}
                  </span>
                  <span className="font-medium text-foreground/95">{item.title}</span>
                  {item.summary ? <span className="text-muted-foreground">{item.summary}</span> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div
          className={cn(
            'hidden rounded-full border px-3 py-1 text-xs font-semibold lg:inline-flex',
            props.replayMode
              ? 'border-cyan-300/35 bg-cyan-300/12 text-cyan-100'
              : 'border-white/12 bg-black/18 text-white/70',
          )}
        >
          {props.replayMode ? `回放 ${props.replayLabel}` : '实时监测'}
        </div>

        <InputGroup
          role="button"
          tabIndex={0}
          aria-haspopup="dialog"
          aria-expanded={props.searchOpen}
          onClick={props.onOpenSearch}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              props.onOpenSearch();
            }
          }}
          className={cn(
            'hidden h-9 w-[260px] cursor-pointer bg-black/24 shadow-[0_18px_60px_rgba(0,0,0,0.45)] md:flex',
          )}
        >
          <InputGroupInput
            placeholder={TEXT.searchPlaceholder}
            readOnly
            aria-label={TEXT.searchAriaLabel}
            className="cursor-pointer py-0"
          />
          <InputGroupAddon className="px-3">
            <Search className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          </InputGroupAddon>
        </InputGroup>

        <div className="text-sm text-muted-foreground">{props.now.toLocaleString()}</div>
        <a
          href={adminLink}
          className="inline-flex h-9 items-center rounded-md border border-white/12 px-4 text-sm text-foreground/90 transition-colors hover:bg-white/6"
        >
          {adminLabel}
        </a>
      </div>
    </header>
  );
}
