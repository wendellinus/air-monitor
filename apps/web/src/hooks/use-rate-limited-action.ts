import React from 'react';

type ActionResult = void | Promise<unknown>;
type Action = () => ActionResult;

type UseRateLimitedActionOptions = {
  cooldownMs?: number;
  lockWhileRunning?: boolean;
};

type UseRateLimitedActionResult = {
  run: () => void;
  locked: boolean;
};

function isPromiseLike(value: ActionResult): value is Promise<unknown> {
  return typeof value === 'object' && value !== null && 'then' in value;
}

export function useRateLimitedAction(
  action: Action,
  options: UseRateLimitedActionOptions = {},
): UseRateLimitedActionResult {
  const { cooldownMs = 700, lockWhileRunning = true } = options;
  const [cooldownLocked, setCooldownLocked] = React.useState<boolean>(false);
  const [running, setRunning] = React.useState<boolean>(false);
  const unlockTimerRef = React.useRef<number | null>(null);

  const lockCooldown = React.useCallback((): void => {
    if (cooldownMs <= 0) return;
    setCooldownLocked(true);
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current);
    }
    unlockTimerRef.current = window.setTimeout(() => {
      setCooldownLocked(false);
      unlockTimerRef.current = null;
    }, cooldownMs);
  }, [cooldownMs]);

  React.useEffect(
    () => () => {
      if (unlockTimerRef.current !== null) {
        window.clearTimeout(unlockTimerRef.current);
      }
    },
    [],
  );

  const run = React.useCallback((): void => {
    if (cooldownLocked) return;
    if (lockWhileRunning && running) return;

    lockCooldown();
    const result = action();
    if (!isPromiseLike(result)) return;

    setRunning(true);
    void Promise.resolve(result).finally(() => {
      setRunning(false);
    });
  }, [action, cooldownLocked, lockCooldown, lockWhileRunning, running]);

  return {
    run,
    locked: cooldownLocked || (lockWhileRunning && running),
  };
}
