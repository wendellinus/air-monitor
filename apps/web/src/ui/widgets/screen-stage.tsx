import React from 'react';

import { cn } from '@/lib/utils';

type ScreenStageProps = {
  children: React.ReactNode;
  designWidth?: number;
  designHeight?: number;
  className?: string;
};

type StageLayout = { scale: number; left: number; top: number };

export function ScreenStage(props: ScreenStageProps): React.ReactNode {
  const designWidth = props.designWidth ?? 1920;
  const designHeight = props.designHeight ?? 1080;

  const [layout, setLayout] = React.useState<StageLayout>(() => ({
    scale: 1,
    left: 0,
    top: 0,
  }));

  React.useLayoutEffect(() => {
    const update = (): void => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Fit-width scaling: fill the viewport width without cropping left/right.
      // Height may letterbox (centered) or overflow (clamped to top) depending on aspect ratio.
      const scale = vw / designWidth;
      const scaledHeight = designHeight * scale;
      setLayout({
        scale,
        left: 0,
        top: Math.max(0, (vh - scaledHeight) / 2),
      });
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [designWidth, designHeight]);

  return (
    <div className={cn('absolute inset-0', props.className)}>
      <div
        style={{
          position: 'absolute',
          left: layout.left,
          top: layout.top,
          width: designWidth,
          height: designHeight,
          transform: `scale(${layout.scale})`,
          transformOrigin: 'top left',
        }}
      >
        {props.children}
      </div>
    </div>
  );
}

