import React from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type AsyncButtonProps = React.ComponentProps<typeof Button> & {
  isLoading?: boolean;
  loadingText?: React.ReactNode;
  spinnerClassName?: string;
};

export function AsyncButton(props: AsyncButtonProps): React.ReactNode {
  const {
    isLoading = false,
    loadingText,
    spinnerClassName,
    disabled,
    children,
    className,
    ...rest
  } = props;

  return (
    <Button
      {...rest}
      className={cn(className)}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          <Spinner className={cn('mr-2 h-4 w-4', spinnerClassName)} />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
