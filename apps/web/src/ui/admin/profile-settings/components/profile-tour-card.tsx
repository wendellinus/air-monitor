import React from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';

type ProfileTourCardProps = {
  title: string;
  description: string;
  resetLabel: string;
  startLabel: string;
  onReset: () => void;
  onStart: () => void;
};

export function ProfileTourCard(props: ProfileTourCardProps): React.ReactNode {
  return (
    <section className="max-w-3xl rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{props.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{props.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={props.onReset}>
            <RotateCcw className="mr-1.5 size-4" />
            {props.resetLabel}
          </Button>
          <Button size="sm" onClick={props.onStart}>
            <Sparkles className="mr-1.5 size-4" />
            {props.startLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
