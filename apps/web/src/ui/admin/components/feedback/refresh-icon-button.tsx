import React from 'react';
import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type RefreshIconButtonProps = {
  label: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  size?: React.ComponentProps<typeof Button>['size'];
  variant?: React.ComponentProps<typeof Button>['variant'];
  className?: string;
};

export function RefreshIconButton(props: RefreshIconButtonProps): React.ReactNode {
  return (
    <Button
      type="button"
      variant={props.variant ?? 'outline'}
      size={props.size ?? 'default'}
      onClick={props.onClick}
      disabled={props.disabled}
      className={cn('min-w-[92px] justify-center', props.className)}
    >
      <RefreshCw className={cn('mr-2 h-4 w-4', props.loading ? 'animate-spin' : undefined)} />
      {props.label}
    </Button>
  );
}
