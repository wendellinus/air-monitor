import React from 'react';

import { cn } from '@/lib/utils';

type ScreenStageProps = {
  children: React.ReactNode;
  designWidth?: number;
  designHeight?: number;
  className?: string;
};

type StageLayout = { scale: number; left: number; top: number; width: number; height: number };

export function ScreenStage(props: ScreenStageProps): React.ReactNode {
  const designWidth = props.designWidth ?? 1920;
  const designHeight = props.designHeight ?? 1080;

  const [layout, setLayout] = React.useState<StageLayout>(() => ({
    scale: 1,
    left: 0,
    top: 0,
    width: designWidth,
    height: designHeight,
  }));

  React.useLayoutEffect(() => {
    const update = (): void => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Contain scaling: avoid clipping bottom UI when not fullscreen.
      const scale = Math.min(vw / designWidth, vh / designHeight);

      // Keep the scaled stage filling the viewport, so "left: 8px / right: 8px"
      // positioning inside the stage maps to the actual viewport edges.
      const stageWidth = vw / scale;
      const stageHeight = vh / scale;
      setLayout({
        scale,
        left: 0,
        top: 0,
        width: stageWidth,
        height: stageHeight,
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
          width: layout.width,
          height: layout.height,
          transform: `scale(${layout.scale})`,
          transformOrigin: 'top left',
        }}
      >
        {props.children}
      </div>
    </div>
  );
}

