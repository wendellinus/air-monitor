import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  onToggle: (key: string, checked: boolean) => void;
};

export function TransferPanel(props: TransferPanelProps): React.ReactNode {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border bg-card">
      <div className="border-b px-3 py-2">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">{props.title}</h3>
          <span className="text-xs text-muted-foreground">{props.items.length}</span>
        </div>
        <Input
          value={props.query}
          onChange={(event) => props.onQueryChange(event.target.value)}
          placeholder={props.searchPlaceholder}
          className="h-8"
        />
      </div>

      <ScrollArea className="h-full min-h-0 flex-1">
        <div className="space-y-1 p-2">
          {props.items.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">{props.emptyText}</p>
          ) : (
            props.items.map((item) => {
              const isChecked = props.checked.has(item.key);
              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => props.onToggle(item.key, !isChecked)}
                  className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(value) => props.onToggle(item.key, Boolean(value))}
                    onClick={(event) => event.stopPropagation()}
                    className="mt-0.5"
                    aria-label={item.label}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm text-foreground">{item.label}</span>
                      <Badge variant={item.type === 'menu' ? 'secondary' : 'outline'} className="text-[10px]">
                        {item.type === 'menu' ? props.badgeText.menu : props.badgeText.action}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{item.path}</p>
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
