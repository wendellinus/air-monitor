import React from 'react';
import { Search, Tags } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { type PermissionFlatItem } from '@/ui/admin/permissions/lib/permission-transfer';

type TransferPanelProps = {
  title: string;
  searchPlaceholder: string;
  emptyText: string;
  badgeText: { menu: string; action: string };
  query: string;
  onQueryChange: (value: string) => void;
  items: PermissionFlatItem[];
  checked: Set<string>;
  checkedCount: number;
  onToggle: (key: string, checked: boolean) => void;
  side?: 'left' | 'right';
};

export function TransferPanel(props: TransferPanelProps): React.ReactNode {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200/80 bg-slate-50/60 px-3 py-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Tags className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800">{props.title}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded-md bg-slate-200/70 px-2 py-0.5 text-xs font-medium text-slate-700">
              {props.checkedCount}
            </span>
            <span className="text-xs text-slate-500">/</span>
            <span className="text-xs text-slate-500">{props.items.length}</span>
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
            placeholder={props.searchPlaceholder}
            className="h-9 border-slate-200 bg-white pl-8 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="h-full min-h-0 flex-1 bg-white">
        <div className="space-y-2 p-3">
          {props.items.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-slate-500">{props.emptyText}</p>
          ) : (
            props.items.map((item) => {
              const isChecked = props.checked.has(item.key);
              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => props.onToggle(item.key, !isChecked)}
                  className={cn(
                    'group flex w-full items-start gap-2 rounded-lg border px-2.5 py-2.5 text-left transition-all',
                    'hover:border-slate-300 hover:bg-slate-50/90',
                    isChecked
                      ? 'border-blue-200 bg-blue-50/60 shadow-[0_0_0_1px_rgba(59,130,246,0.12)]'
                      : 'border-slate-200 bg-white',
                  )}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(value) => props.onToggle(item.key, Boolean(value))}
                    onClick={(event) => event.stopPropagation()}
                    className="mt-0.5"
                    aria-label={item.label}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-800">{item.label}</span>
                      <Badge
                        variant={item.type === 'menu' ? 'secondary' : 'outline'}
                        className="h-5 rounded-md border-slate-300 px-1.5 text-[10px] text-slate-700"
                      >
                        {item.type === 'menu' ? props.badgeText.menu : props.badgeText.action}
                      </Badge>
                    </div>
                    <p
                      className={cn(
                        'truncate text-xs',
                        isChecked ? 'text-blue-700/80' : 'text-slate-500',
                      )}
                    >
                      {item.path}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
