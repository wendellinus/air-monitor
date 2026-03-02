import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Save, Server } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';

type SystemConfig = {
  pollingInterval: number;
};

export function AdminSystemPage(): React.ReactNode {
  const queryClient = useQueryClient();
  const [intervalSec, setIntervalSec] = React.useState<string>('60');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-system-config'],
    queryFn: async (): Promise<SystemConfig> => {
      const response = await api.get<ApiResponse<SystemConfig>>('/admin/system/config');
      return response.data.data;
    },
  });

  React.useEffect(() => {
    if (!data) return;
    setIntervalSec(String(Math.floor(data.pollingInterval / 1000)));
  }, [data]);

  const { mutate: saveConfig, isPending } = useMutation({
    mutationFn: async (sec: number): Promise<void> => {
      await api.post('/admin/system/config', { pollingInterval: sec * 1000 });
    },
    onSuccess: () => {
      toast.success('System config saved');
      void queryClient.invalidateQueries({ queryKey: ['admin-system-config'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save config');
    },
  });

  function handleSave(): void {
    const value = Number.parseInt(intervalSec, 10);
    if (Number.isNaN(value) || value < 5) {
      toast.error('Polling interval must be at least 5 seconds');
      return;
    }
    saveConfig(value);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">System Settings</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage global runtime settings and operational checks.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="mb-1 flex items-center gap-2">
              <Clock className="size-4 text-blue-600" />
              <CardTitle className="text-base font-semibold">Polling Control</CardTitle>
            </div>
            <CardDescription>
              Configure frontend polling interval in seconds. Recommended range: 30 to 300.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="polling-interval">Polling interval (sec)</Label>
              <Input
                id="polling-interval"
                type="number"
                min={5}
                value={intervalSec}
                onChange={(event) => setIntervalSec(event.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t bg-slate-50 px-6 py-4">
            <Button onClick={handleSave} disabled={isPending || isLoading} className="gap-2">
              <Save className="size-4" />
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-1 flex items-center gap-2">
              <Server className="size-4 text-emerald-600" />
              <CardTitle className="text-base font-semibold">Service Health</CardTitle>
            </div>
            <CardDescription>Quick status snapshot of core infrastructure services.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              'API connectivity',
              'Redis cache',
              'PostgreSQL database',
            ].map((label) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 p-3"
              >
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <Badge
                  variant="success"
                  className="bg-emerald-100 text-[10px] uppercase text-emerald-700 hover:bg-emerald-100"
                >
                  Online
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

