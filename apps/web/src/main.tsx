import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';

import { Spinner } from './components/ui/spinner';
import { Toaster } from './components/ui/sonner';
import { I18nProvider } from './shared/i18n';
import { queryClient } from './shared/query-client';
import { router } from './shared/router';
import 'driver.js/dist/driver.css';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <React.Suspense
          fallback={(
            <div className="admin-theme flex min-h-svh items-center justify-center bg-[oklch(0.985_0.005_245)]">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                <Spinner className="size-4 text-slate-500" />
                页面加载中...
              </div>
            </div>
          )}
        >
          <RouterProvider router={router} />
        </React.Suspense>
      </QueryClientProvider>
    </I18nProvider>
    <Toaster position="top-center" />
  </React.StrictMode>,
);
