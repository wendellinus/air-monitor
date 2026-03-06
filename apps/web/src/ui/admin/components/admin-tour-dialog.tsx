import React from 'react';
import { Compass, HelpCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type TourStep = {
  title: string;
  desc: string;
  path: string;
};

const STORAGE_KEY = 'air-monitor:admin-tour:v1';

function textByLocale(locale: string, zh: string, en: string): string {
  return locale.startsWith('zh') ? zh : en;
}

export function AdminTourDialog(props: { locale: string }): React.ReactNode {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);

  const steps = React.useMemo<TourStep[]>(
    () => [
      {
        title: textByLocale(props.locale, '仪表盘总览', 'Dashboard Overview'),
        desc: textByLocale(props.locale, '先看关键指标和趋势图，快速确认系统运行状态。', 'Check key metrics and trend charts first.'),
        path: '/admin',
      },
      {
        title: textByLocale(props.locale, '用户与权限', 'Users & Permissions'),
        desc: textByLocale(props.locale, '在用户管理和权限管理中完成账号授权与角色控制。', 'Manage accounts, roles, and permissions here.'),
        path: '/admin/users',
      },
      {
        title: textByLocale(props.locale, '公告发布流程', 'Notice Workflow'),
        desc: textByLocale(props.locale, '在公告管理中创建、发布、撤销通知并追踪状态。', 'Create, publish, and revoke notices with status tracking.'),
        path: '/admin/notices',
      },
      {
        title: textByLocale(props.locale, '数据与配额', 'Data & Quota'),
        desc: textByLocale(props.locale, '在系统设置中查看和风/高德请求量与异常平台。', 'Check provider requests and health in System Settings.'),
        path: '/admin/system?tab=qweather',
      },
    ],
    [props.locale],
  );

  React.useEffect(() => {
    const hasSeen = window.localStorage.getItem(STORAGE_KEY) === '1';
    if (!hasSeen) setOpen(true);
  }, []);

  function markAsSeen(): void {
    window.localStorage.setItem(STORAGE_KEY, '1');
  }

  function handleClose(nextOpen: boolean): void {
    if (!nextOpen) markAsSeen();
    setOpen(nextOpen);
  }

  function gotoCurrentStep(): void {
    const step = steps[stepIndex];
    markAsSeen();
    setOpen(false);
    navigate(step.path);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <HelpCircle className="size-4" />
          {textByLocale(props.locale, '新手引导', 'Tour')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl border-slate-200 bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Sparkles className="size-4 text-blue-600" />
            {textByLocale(props.locale, '后台快速引导', 'Admin Quick Tour')}
          </DialogTitle>
          <DialogDescription>
            {textByLocale(
              props.locale,
              '按步骤快速了解后台核心功能。你可以随时从右上角再次打开引导。',
              'Learn core admin features step-by-step. You can reopen this tour anytime.',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[250px_minmax(0,1fr)]">
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            {steps.map((step, index) => (
              <button
                key={step.title}
                type="button"
                onClick={() => setStepIndex(index)}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-left transition-colors',
                  index === stepIndex
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-transparent bg-white text-slate-600 hover:border-slate-200',
                )}
              >
                <p className="text-xs font-medium">STEP {index + 1}</p>
                <p className="mt-0.5 text-sm font-semibold">{step.title}</p>
              </button>
            ))}
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 p-4">
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
              <Compass className="size-3.5" />
              {textByLocale(props.locale, '当前步骤', 'Current Step')}
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{steps[stepIndex].title}</h3>
            <p className="text-sm leading-6 text-slate-600">{steps[stepIndex].desc}</p>
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              {textByLocale(props.locale, '目标页面', 'Target page')}:
              {' '}
              <span className="font-mono text-slate-700">{steps[stepIndex].path}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2 flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
            disabled={stepIndex === 0}
          >
            {textByLocale(props.locale, '上一步', 'Previous')}
          </Button>
          <Button
            variant="outline"
            onClick={() => setStepIndex((prev) => Math.min(prev + 1, steps.length - 1))}
            disabled={stepIndex === steps.length - 1}
          >
            {textByLocale(props.locale, '下一步', 'Next')}
          </Button>
          <Button onClick={gotoCurrentStep}>
            {textByLocale(props.locale, '前往当前步骤', 'Go to Step')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
