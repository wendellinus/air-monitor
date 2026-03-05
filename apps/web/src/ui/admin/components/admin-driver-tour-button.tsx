import React from 'react';
import type { UserRole } from '@air-monitor/shared';
import { Sparkles } from 'lucide-react';
import { driver, type DriveStep } from 'driver.js';

import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/ui/admin/stores/onboarding-store';

export const ADMIN_TOUR_STORAGE_KEY = 'air-monitor:admin-driver-tour:v2';
export const ADMIN_TOUR_START_EVENT = 'air-monitor:start-admin-tour';

const AUTO_START_DELAY_MS = 560;

function textByLocale(locale: string, zh: string, en: string): string {
  return locale.startsWith('zh') ? zh : en;
}

function buildBaseSteps(locale: string): DriveStep[] {
  return [
    {
      element: '[data-tour="header-sidebar-toggle"]',
      popover: {
        title: textByLocale(locale, '侧边栏开关', 'Sidebar Toggle'),
        description: textByLocale(locale, '点击这里可展开或收起侧边栏。', 'Click here to collapse or expand the sidebar.'),
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="header-search"]',
      popover: {
        title: textByLocale(locale, '全局搜索', 'Global Search'),
        description: textByLocale(
          locale,
          '可快速搜索并跳转后台页面，支持键盘上下选择结果。',
          'Search and jump between pages, with keyboard up/down selection.',
        ),
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="nav-dashboard"]',
      popover: {
        title: textByLocale(locale, '仪表盘导航', 'Dashboard Entry'),
        description: textByLocale(locale, '这里可以回到仪表盘总览。', 'Use this menu to return to dashboard overview.'),
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '[data-tour="dashboard-widget-chart-trend"]',
      popover: {
        title: textByLocale(locale, '图表区', 'Chart Area'),
        description: textByLocale(locale, '此处展示核心趋势图，可拖拽调整布局。', 'Core trend charts are shown here and can be rearranged.'),
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
          title: textByLocale(locale, '用户管理', 'User Management'),
          description: textByLocale(locale, '维护用户状态、角色和密码重置。', 'Manage user status, role and reset actions.'),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="nav-permissions"]',
        popover: {
          title: textByLocale(locale, '权限管理', 'Permissions'),
          description: textByLocale(locale, '按角色配置菜单和操作权限。', 'Configure menu and action permissions by role.'),
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
          title: textByLocale(locale, '公告管理', 'Notice Management'),
          description: textByLocale(locale, '处理公告发布与生效状态。', 'Handle notice publishing and active state.'),
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="nav-cities"]',
        popover: {
          title: textByLocale(locale, '城市监控', 'City Monitor'),
          description: textByLocale(locale, '查看城市监控数据与变化。', 'Browse city monitoring data and changes.'),
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
        title: textByLocale(locale, '收藏管理', 'Favorites'),
        description: textByLocale(locale, '可在这里查看常用收藏。', 'Check your frequently used favorites here.'),
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

export function AdminDriverTourButton(props: AdminDriverTourButtonProps): React.ReactNode {
  const role: UserRole = props.role ?? 'user';
  const autoStart = props.autoStart ?? true;
  const hideTrigger = props.hideTrigger ?? false;
  const tourCompleted = useOnboardingStore((state) => state.tourCompleted);
  const tourSkipped = useOnboardingStore((state) => state.tourSkipped);
  const setTourCompleted = useOnboardingStore((state) => state.setTourCompleted);
  const setTourSkipped = useOnboardingStore((state) => state.setTourSkipped);
  const tourRef = React.useRef<DriverController | null>(null);
  const timerRef = React.useRef<number | null>(null);
  const isStartingRef = React.useRef(false);
  const skipClickedRef = React.useRef(false);

  const clearTimer = React.useCallback((): void => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const destroyTour = React.useCallback((): void => {
    const current = tourRef.current;
    if (!current) return;
    current.destroy();
    tourRef.current = null;
    isStartingRef.current = false;
  }, []);

  const startTour = React.useCallback((): void => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    const steps = filterMountedSteps([...buildBaseSteps(props.locale), ...buildRoleSteps(role, props.locale)]);
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
      showButtons: ['previous', 'next'],
      popoverClass: 'admin-driver-popover',
      nextBtnText: textByLocale(props.locale, '下一步', 'Next'),
      prevBtnText: textByLocale(props.locale, '上一步', 'Previous'),
      doneBtnText: textByLocale(props.locale, '完成', 'Done'),
      progressText: '{{current}} / {{total}}',
      onPopoverRender: (popover, options) => {
        const existing = popover.footerButtons.querySelector<HTMLButtonElement>('[data-tour-skip="true"]');
        if (existing) return;

        const skipButton = document.createElement('button');
        skipButton.type = 'button';
        skipButton.setAttribute('data-tour-skip', 'true');
        skipButton.className = 'driver-popover-btn driver-popover-skip-btn';
        skipButton.textContent = textByLocale(props.locale, '跳过', 'Skip');
        skipButton.addEventListener('click', () => {
          skipClickedRef.current = true;
          options.driver.destroy();
        });

        const anchor = popover.previousButton ?? popover.footerButtons.firstChild;
        if (anchor) {
          popover.footerButtons.insertBefore(skipButton, anchor);
        } else {
          popover.footerButtons.appendChild(skipButton);
        }
      },
      onDestroyed: () => {
        if (skipClickedRef.current) {
          setTourSkipped();
          skipClickedRef.current = false;
        } else {
          setTourCompleted();
        }
        window.localStorage.setItem(ADMIN_TOUR_STORAGE_KEY, '1');
        tourRef.current = null;
        isStartingRef.current = false;
      },
    });

    tourRef.current = tour;
    tour.setSteps(steps);
    tour.drive();
    isStartingRef.current = false;
  }, [props.locale, role]);

  React.useEffect(() => {
    const runTour = (): void => startTour();
    window.addEventListener(ADMIN_TOUR_START_EVENT, runTour);
    return () => {
      window.removeEventListener(ADMIN_TOUR_START_EVENT, runTour);
    };
  }, [startTour]);

  React.useEffect(() => {
    if (!autoStart) return;
    const seen = window.localStorage.getItem(ADMIN_TOUR_STORAGE_KEY) === '1';
    if (seen || tourCompleted || tourSkipped || tourRef.current) return;

    clearTimer();
    timerRef.current = window.setTimeout(() => {
      startTour();
    }, AUTO_START_DELAY_MS);

    return () => clearTimer();
  }, [autoStart, clearTimer, startTour, tourCompleted, tourSkipped]);

  React.useEffect(() => {
    return () => {
      clearTimer();
      destroyTour();
    };
  }, [clearTimer, destroyTour]);

  if (hideTrigger) return null;

  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={startTour} data-tour="tour-start-button">
      <Sparkles className="size-4 text-blue-600" />
      {textByLocale(props.locale, '新手引导', 'Tour')}
    </Button>
  );
}
