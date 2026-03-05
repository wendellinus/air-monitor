import React from 'react';

type ScreenFullscreenState = {
  isFullscreen: boolean;
  toggleFullscreen: () => Promise<void>;
};

export function useScreenFullscreen(): ScreenFullscreenState {
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(
    () => Boolean(typeof document !== 'undefined' && document.fullscreenElement),
  );

  const toggleFullscreen = React.useCallback(async (): Promise<void> => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await document.documentElement.requestFullscreen();
    } catch {
      // Ignore fullscreen errors (permissions / gesture requirements vary by browser).
    }
  }, []);

  React.useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    onChange();
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  return { isFullscreen, toggleFullscreen };
}
