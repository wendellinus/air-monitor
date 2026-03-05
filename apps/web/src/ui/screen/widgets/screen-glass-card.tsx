import React from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function ScreenGlassCard(props: React.ComponentProps<typeof Card>): React.ReactNode {
  return (
    <Card
      {...props}
      className={cn(
        'border-white/8 bg-black/8 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/10',
        props.className,
      )}
    />
  );
}
