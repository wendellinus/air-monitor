import React from 'react';

type ProfileLoadingPanelProps = {
  text: string;
};

export function ProfileLoadingPanel(props: ProfileLoadingPanelProps): React.ReactNode {
  return (
    <section className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {props.text}
    </section>
  );
}
