import React from 'react';
import type { UserRole } from '@air-monitor/shared';
import { driver, type DriveStep } from 'driver.js';
import { Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/ui/admin/stores/onboarding-store';

export const ADMIN_TOUR_START_EVENT = 'air-monitor:start-admin-tour';

const AUTO_START_DELAY_MS = 560;
const SIDEBAR_TOGGLE_SELECTOR = '[data-tour="header-sidebar-toggle"]';
const SIDEBAR_REFRESH_DELAY_MS = 240;
const SIDEBAR_REALIGN_DELAY_MS = 320;

function textByLocale(locale: string, zh: string, en: string): string {
  return locale.startsWith('zh') ? zh : en;
}

function buildBaseSteps(
  locale: string,
  options?: {
    onSidebarToggleHighlighted?: DriveStep['onHighlighted'];
    onSidebarToggleDeselected?: DriveStep['onDeselected'];
  },
): DriveStep[] {
  return [
    {
      element: SIDEBAR_TOGGLE_SELECTOR,
      onHighlighted: options?.onSidebarToggleHighlighted,
      onDeselected: options?.onSidebarToggleDeselected,
      popover: {
        title: textByLocale(locale, '\u4fa7\u8fb9\u680f\u5f00\u5173', 'Sidebar Toggle'),
        description: textByLocale(
          locale,
          '\u70b9\u51fb\u8fd9\u91cc\u53ef\u5c55\u5f00\u6216\u6536\u8d77\u4fa7\u8fb9\u680f\u3002',
          'Click here to collapse or expand the sidebar.',
        ),
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="header-search"]',
      popover: {
        title: textByLocale(locale, '\u5168\u5c40\u641c\u7d22', 'Global Search'),
        description: textByLocale(
          locale,
          '\u53ef\u5feb\u901f\u641c\u7d22\u5e76\u8df3\u8f6c\u540e\u53f0\u9875\u9762\uff0c\u652f\u6301\u952e\u76d8\u4e0a\u4e0b\u9009\u62e9\u7ed3\u679c\u3002',
          'Search and jump between pages, with keyboard up/down selection.',
        ),
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="nav-dashboard"]',
      popover: {
        title: textByLocale(locale, '\u4eea\u8868\u76d8\u5bfc\u822a', 'Dashboard Entry'),
        description: textByLocale(
          locale,
          '\u8fd9\u91cc\u53ef\u4ee5\u56de\u5230\u4eea\u8868\u76d8\u603b\u89c8\u3002',
          'Use this menu to return to dashboard overview.',
        ),
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '[data-tour="dashboard-widget-chart-trend"]',
      popover: {
        title: textByLocale(locale, '\u56fe\u8868\u533a', 'Chart Area'),
        description: textByLocale(
          locale,
          '\u6b64\u5904\u5c55\u793a\u6838\u5fc3\u8d8b\u52bf\u56fe\uff0c\u53ef\u62d6\u62fd\u8c03\u6574\u5e03\u5c40\u3002',
          'Core trend charts are shown here and can be rearranged.',
        ),
        side: 'bottom',
        align: 'start',
      },
    },
  ];
}

function buildRoleSteps(role: UserRole, locale: string): DriveStep[] {
  if (role === 'admin') {
    return [
      {
        element: '[data-tour="nav-users"]',
        popover: {
          title: textByLocale(locale, '\u7528\u6237\u7ba1\u7406', 'User Management'),
          description: textByLocale(
            locale,
            '\u7ef4\u62a4\u7528\u6237\u72b6\u6001\u3001\u89d2\u8272\u548c\u5bc6\u7801\u91cd\u7f6e\u3002',
            'Manage user status, role and reset actions.',
          ),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="nav-permissions"]',
        popover: {
          title: textByLocale(locale, '\u6743\u9650\u7ba1\u7406', 'Permissions'),
          description: textByLocale(
            locale,
            '\u6309\u89d2\u8272\u914d\u7f6e\u83dc\u5355\u548c\u64cd\u4f5c\u6743\u9650\u3002',
            'Configure menu and action permissions by role.',
          ),
          side: 'right',
          align: 'start',
        },
      },
    ];
  }

  if (role === 'operator') {
    return [
      {
        element: '[data-tour="nav-notices"]',
        popover: {
          title: textByLocale(locale, '\u516c\u544a\u7ba1\u7406', 'Notice Management'),
          description: textByLocale(
            locale,
            '\u5904\u7406\u516c\u544a\u53d1\u5e03\u4e0e\u751f\u6548\u72b6\u6001\u3002',
            'Handle notice publishing and active state.',
          ),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="nav-cities"]',
        popover: {
          title: textByLocale(locale, '\u57ce\u5e02\u76d1\u63a7', 'City Monitor'),
          description: textByLocale(
            locale,
            '\u67e5\u770b\u57ce\u5e02\u76d1\u63a7\u6570\u636e\u4e0e\u53d8\u5316\u3002',
            'Browse city monitoring data and changes.',
          ),
          side: 'right',
          align: 'start',
        },
      },
    ];
  }

  return [
    {
      element: '[data-tour="nav-favorites"]',
      popover: {
        title: textByLocale(locale, '\u6536\u85cf\u7ba1\u7406', 'Favorites'),
        description: textByLocale(
          locale,
          '\u53ef\u5728\u8fd9\u91cc\u67e5\u770b\u5e38\u7528\u6536\u85cf\u3002',
          'Check your frequently used favorites here.',
        ),
        side: 'right',
        align: 'start',
      },
    },
  ];
}

function filterMountedSteps(steps: DriveStep[]): DriveStep[] {
  return steps.filter((step) => {
    if (typeof step.element !== 'string') return true;
    return document.querySelector(step.element) !== null;
  });
}

type AdminDriverTourButtonProps = {
  locale: string;
  role?: UserRole;
  autoStart?: boolean;
  hideTrigger?: boolean;
};

type DriverController = ReturnType<typeof driver>;
type TourExitReason = 'completed' | 'skipped' | 'cleanup';

export function AdminDriverTourButton(props: AdminDriverTourButtonProps): React.ReactNode {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const role: UserRole = props.role ?? 'user';
  const autoStart = props.autoStart ?? true;
  const hideTrigger = props.hideTrigger ?? false;
  const hasHydrated = useOnboardingStore((state) => state.hasHydrated);
  const tourCompleted = useOnboardingStore((state) => state.tourCompleted);
  const tourSkipped = useOnboardingStore((state) => state.tourSkipped);
  const setTourCompleted = useOnboardingStore((state) => state.setTourCompleted);
  const setTourSkipped = useOnboardingStore((state) => state.setTourSkipped);
  const tourRef = React.useRef<DriverController | null>(null);
  const timerRef = React.useRef<number | null>(null);
  const isStartingRef = React.useRef(false);
  const pendingManualStartRef = React.useRef(false);
  const sidebarRefreshTimeoutsRef = React.useRef<number[]>([]);
  const sidebarRefreshFramesRef = React.useRef<number[]>([]);
  const sidebarToggleCleanupRef = React.useRef<(() => void) | null>(null);

  const clearTimer = React.useCallback((): void => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearSidebarRefreshTasks = React.useCallback((): void => {
    sidebarRefreshTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    sidebarRefreshTimeoutsRef.current = [];

    sidebarRefreshFramesRef.current.forEach((frameId) => window.cancelAnimationFrame(frameId));
    sidebarRefreshFramesRef.current = [];

    sidebarToggleCleanupRef.current?.();
    sidebarToggleCleanupRef.current = null;
  }, []);

  const markTourCompleted = React.useCallback((): void => {
    setTourCompleted();
  }, [setTourCompleted]);

  const markTourSkipped = React.useCallback((): void => {
    setTourSkipped();
  }, [setTourSkipped]);

  const destroyTour = React.useCallback((reason: TourExitReason = 'cleanup'): void => {
    const current = tourRef.current;
    clearSidebarRefreshTasks();
    if (!current) return;
    current.destroy();
    tourRef.current = null;
    isStartingRef.current = false;
  }, [clearSidebarRefreshTasks]);

  const scheduleSidebarRefresh = React.useCallback((): void => {
    clearSidebarRefreshTasks();

    const refreshHighlight = (): void => {
      const current = tourRef.current;
      if (!current?.isActive()) return;
      if (current.getActiveStep()?.element !== SIDEBAR_TOGGLE_SELECTOR) return;
      current.refresh();
    };

    const realignHighlight = (): void => {
      const current = tourRef.current;
      if (!current?.isActive()) return;
      if (current.getActiveStep()?.element !== SIDEBAR_TOGGLE_SELECTOR) return;
      const activeIndex = current.getActiveIndex();
      if (typeof activeIndex !== 'number') {
        current.refresh();
        return;
      }
      current.moveTo(activeIndex);
    };

    const firstFrame = window.requestAnimationFrame(() => {
      refreshHighlight();
      const secondFrame = window.requestAnimationFrame(() => {
        refreshHighlight();
      });
      sidebarRefreshFramesRef.current.push(secondFrame);
    });
    sidebarRefreshFramesRef.current.push(firstFrame);

    [120, SIDEBAR_REFRESH_DELAY_MS].forEach((delay) => {
      const timeoutId = window.setTimeout(() => {
        refreshHighlight();
      }, delay);
      sidebarRefreshTimeoutsRef.current.push(timeoutId);
    });

    const realignTimeoutId = window.setTimeout(() => {
      realignHighlight();
    }, SIDEBAR_REALIGN_DELAY_MS);
    sidebarRefreshTimeoutsRef.current.push(realignTimeoutId);
  }, [clearSidebarRefreshTasks]);

  const finishTour = React.useCallback(
    (reason: Extract<TourExitReason, 'completed' | 'skipped'>): void => {
      if (reason === 'completed') {
        markTourCompleted();
      } else {
        markTourSkipped();
      }

      destroyTour(reason);
    },
    [destroyTour, markTourCompleted, markTourSkipped],
  );

  const startTour = React.useCallback((): void => {
    if (isStartingRef.current) return;
    clearTimer();

    if (pathname !== '/admin') {
      pendingManualStartRef.current = true;
      navigate('/admin');
      return;
    }

    isStartingRef.current = true;

    const steps = filterMountedSteps([
      ...buildBaseSteps(props.locale, {
        onSidebarToggleHighlighted: (element) => {
          if (!(element instanceof HTMLElement)) return;
          clearSidebarRefreshTasks();

          const handleToggle = (): void => {
            scheduleSidebarRefresh();
          };

          const handleTransitionEnd = (event: TransitionEvent): void => {
            if (!(event.target instanceof HTMLElement)) return;
            if (
              !['width', 'padding', 'margin-left', 'margin-right', 'transform'].includes(event.propertyName)
            ) {
              return;
            }

            scheduleSidebarRefresh();
          };

          const transitionTargets = [
            element.closest('header'),
            document.querySelector('[data-sidebar="sidebar"]'),
            document.querySelector('[data-sidebar="content"]'),
            document.querySelector('[data-sidebar="rail"]'),
            document.querySelector('[data-admin-outlet-viewport]')?.closest('main'),
          ].filter((target): target is HTMLElement => target instanceof HTMLElement);

          element.addEventListener('click', handleToggle);
          transitionTargets.forEach((target) => {
            target.addEventListener('transitionend', handleTransitionEnd);
          });
          sidebarToggleCleanupRef.current = () => {
            element.removeEventListener('click', handleToggle);
            transitionTargets.forEach((target) => {
              target.removeEventListener('transitionend', handleTransitionEnd);
            });
            sidebarToggleCleanupRef.current = null;
          };
        },
        onSidebarToggleDeselected: () => {
          clearSidebarRefreshTasks();
        },
      }),
      ...buildRoleSteps(role, props.locale),
    ]);
    if (steps.length === 0) {
      isStartingRef.current = false;
      return;
    }

    if (tourRef.current) {
      tourRef.current.destroy();
      tourRef.current = null;
    }

    const tour = driver({
      showProgress: true,
      animate: true,
      overlayOpacity: 0.44,
      allowClose: true,
      stagePadding: 8,
      showButtons: ['previous', 'next', 'close'],
      popoverClass: 'admin-driver-popover',
      nextBtnText: textByLocale(props.locale, '\u4e0b\u4e00\u6b65', 'Next'),
      prevBtnText: textByLocale(props.locale, '\u4e0a\u4e00\u6b65', 'Previous'),
      doneBtnText: textByLocale(props.locale, '\u5b8c\u6210', 'Done'),
      progressText: '{{current}} / {{total}}',
      onPopoverRender: (popover) => {
        const skipButton = popover.closeButton;
        skipButton.textContent = textByLocale(props.locale, '\u8df3\u8fc7', 'Skip');
        skipButton.setAttribute('aria-label', textByLocale(props.locale, '\u8df3\u8fc7\u5f15\u5bfc', 'Skip tour'));
        skipButton.classList.add('driver-popover-btn', 'driver-popover-skip-btn');
        const anchor = popover.previousButton ?? popover.footerButtons.firstChild;
        if (!anchor) {
          popover.footerButtons.appendChild(skipButton);
          return;
        }

        if (skipButton !== anchor.previousSibling) {
          popover.footerButtons.insertBefore(skipButton, anchor);
        }
      },
      onNextClick: (_element, _step, options) => {
        if (options.driver.isLastStep()) {
          finishTour('completed');
          return;
        }

        options.driver.moveNext();
      },
      onPrevClick: (_element, _step, options) => {
        options.driver.movePrevious();
      },
      onCloseClick: () => {
        finishTour('skipped');
      },
      onDestroyed: () => {
        clearSidebarRefreshTasks();
        pendingManualStartRef.current = false;
        tourRef.current = null;
        isStartingRef.current = false;
      },
    });

    tourRef.current = tour;
    tour.setSteps(steps);
    tour.drive();
    isStartingRef.current = false;
  }, [
    clearSidebarRefreshTasks,
    clearTimer,
    finishTour,
    navigate,
    pathname,
    props.locale,
    role,
    scheduleSidebarRefresh,
  ]);

  React.useEffect(() => {
    const runTour = (): void => startTour();
    window.addEventListener(ADMIN_TOUR_START_EVENT, runTour);
    return () => {
      window.removeEventListener(ADMIN_TOUR_START_EVENT, runTour);
    };
  }, [startTour]);

  React.useEffect(() => {
    if (!pendingManualStartRef.current || pathname !== '/admin') return;

    clearTimer();
    timerRef.current = window.setTimeout(() => {
      pendingManualStartRef.current = false;
      startTour();
    }, AUTO_START_DELAY_MS);

    return () => clearTimer();
  }, [clearTimer, pathname, startTour]);

  React.useEffect(() => {
    if (!hasHydrated) return;
    if (pathname !== '/admin') return;
    if (!autoStart) return;
    if (tourCompleted || tourSkipped || tourRef.current) return;

    clearTimer();
    timerRef.current = window.setTimeout(() => {
      startTour();
    }, AUTO_START_DELAY_MS);

    return () => clearTimer();
  }, [autoStart, clearTimer, hasHydrated, pathname, startTour, tourCompleted, tourSkipped]);

  React.useEffect(() => {
    return () => {
      clearTimer();
      destroyTour('cleanup');
    };
  }, [clearTimer, destroyTour]);

  if (hideTrigger) return null;

  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={startTour} data-tour="tour-start-button">
      <Sparkles className="size-4 text-blue-600" />
      {textByLocale(props.locale, '\u65b0\u624b\u5f15\u5bfc', 'Tour')}
    </Button>
  );
}
