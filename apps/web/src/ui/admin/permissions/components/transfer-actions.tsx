import React from 'react';
import { ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

type TransferActionsProps = {
  t: (key: string) => string;
  inactivePermissionsLength: number;
  inactiveCheckedSize: number;
  activeCheckedSize: number;
  activePermissionsLength: number;
  onActivateAll: () => void;
  onActivateSelected: () => void;
  onDeactivateSelected: () => void;
  onDeactivateAll: () => void;
};

export function TransferActions(props: TransferActionsProps): React.ReactNode {
  return (
    <div className="flex min-h-0 items-center justify-center overflow-auto">
      <div className="w-full rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <div className="mb-2 px-1 text-center text-xs font-medium text-slate-500">批量操作</div>
        <div className="flex w-full flex-wrap gap-2 lg:flex-col">
        <Button
          variant="outline"
          size="sm"
          onClick={props.onActivateAll}
          disabled={props.inactivePermissionsLength === 0}
          className="h-9 border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <ChevronsRight className="mr-2 h-4 w-4" />
          {props.t('admin.permissions.transfer.activateAll')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={props.onActivateSelected}
          disabled={props.inactiveCheckedSize === 0}
          className="h-9 border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          {props.t('admin.permissions.transfer.activateSelected')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={props.onDeactivateSelected}
          disabled={props.activeCheckedSize === 0}
          className="h-9 border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {props.t('admin.permissions.transfer.deactivateSelected')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={props.onDeactivateAll}
          disabled={props.activePermissionsLength === 0}
          className="h-9 border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <ChevronsLeft className="mr-2 h-4 w-4" />
          {props.t('admin.permissions.transfer.deactivateAll')}
        </Button>
        </div>
      </div>
    </div>
  );
}
