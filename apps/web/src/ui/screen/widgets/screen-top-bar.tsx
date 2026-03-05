import React from 'react';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

type ScreenTopBarProps = {
  marquee: string;
  now: Date;
  searchOpen: boolean;
  onOpenSearch: () => void;
};

export function ScreenTopBar(props: ScreenTopBarProps): React.ReactNode {
  return (
    <header className="pointer-events-auto relative z-30 flex w-full items-center rounded-[var(--radius)] border border-white/8 bg-black/22 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/10 backdrop-blur-lg">
      <div className="flex items-center gap-4">
        <div className="text-base font-semibold tracking-[0.22em]">空气质量监测</div>
      </div>

      <div className="mx-6 flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0 truncate text-sm text-muted-foreground">{props.marquee}</div>
      </div>

      <div className="flex items-center gap-4">
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
            'h-9 w-[260px] cursor-pointer bg-black/24 shadow-[0_18px_60px_rgba(0,0,0,0.45)]',
            'hidden md:flex',
          )}
        >
          <InputGroupInput
            placeholder="搜索数据…"
            readOnly
            aria-label="打开搜索"
            className="cursor-pointer py-0"
          />
          <InputGroupAddon className="px-3">
            <Search className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          </InputGroupAddon>
        </InputGroup>

        <div className="text-sm text-muted-foreground">{props.now.toLocaleString()}</div>
        <Button asChild size="sm" variant="outline">
          <a href="/admin/login">管理后台</a>
        </Button>
      </div>
    </header>
  );
}
