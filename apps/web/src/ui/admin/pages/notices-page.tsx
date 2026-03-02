import React from 'react';
import { Bell, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { NoticeAdminListData, NoticeItem } from '@air-monitor/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';

const PAGE_SIZE = 15;

type CreateForm = {
  title: string;
  content: string;
  level: 'info' | 'urgent';
  startTime: string;
  endTime: string;
};

function getDefaultForm(): CreateForm {
  const start = new Date();
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    title: '',
    content: '',
    level: 'info',
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
}

function statusBadge(status: string): React.ReactNode {
  if (status === 'active') return <Badge variant="success">Active</Badge>;
  if (status === 'pending') return <Badge variant="warning">Pending</Badge>;
  return <Badge variant="outline">Expired</Badge>;
}

function levelBadge(level: string): React.ReactNode {
  return level === 'urgent' ? <Badge variant="destructive">Urgent</Badge> : <Badge variant="secondary">Info</Badge>;
}

export function AdminNoticesPage(): React.ReactNode {
  const [notices, setNotices] = React.useState<NoticeItem[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [page, setPage] = React.useState<number>(1);
  const [loading, setLoading] = React.useState<boolean>(false);

  const [createOpen, setCreateOpen] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [form, setForm] = React.useState<CreateForm>(getDefaultForm);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadNotices = React.useCallback(async (targetPage: number): Promise<void> => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<NoticeAdminListData>>('/admin/notices', {
        params: { page: targetPage, pageSize: PAGE_SIZE },
      });
      setNotices(response.data.data.list);
      setTotal(response.data.data.total);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadNotices(page);
  }, [loadNotices, page]);

  async function togglePublish(notice: NoticeItem): Promise<void> {
    const currentlyActive = notice.status === 'active';
    const action = currentlyActive ? 'unpublish' : 'publish';

    try {
      await api.post(`/admin/notices/${notice.id}/${action}`);
      setNotices((prev) =>
        prev.map((item) =>
          item.id === notice.id ? { ...item, status: currentlyActive ? 'pending' : 'active' } : item,
        ),
      );
      toast.success(currentlyActive ? 'Notice unpublished' : 'Notice published');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update notice status');
    }
  }

  async function createNotice(): Promise<void> {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/notices', {
        title: form.title.trim(),
        content: form.content.trim() || undefined,
        level: form.level,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      });
      toast.success('Notice created');
      setCreateOpen(false);
      setForm(getDefaultForm());
      setPage(1);
      await loadNotices(1);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create notice');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Notice Management</h2>
          <p className="text-sm text-muted-foreground">Total {total} notices</p>
        </div>
        <Button
          onClick={() => {
            setForm(getDefaultForm());
            setCreateOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Notice
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : notices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8">
                  <Empty>
                    <EmptyMedia variant="icon">
                      <Bell />
                    </EmptyMedia>
                    <EmptyTitle>No notices</EmptyTitle>
                    <EmptyDescription>Create your first notice from the top-right button.</EmptyDescription>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              notices.map((notice) => (
                <TableRow key={notice.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{notice.id}</TableCell>
                  <TableCell className="max-w-[280px] truncate font-medium" title={notice.title}>
                    {notice.title}
                  </TableCell>
                  <TableCell>{levelBadge(notice.level)}</TableCell>
                  <TableCell>{statusBadge(notice.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(notice.startTime).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(notice.endTime).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void togglePublish(notice)}
                      disabled={notice.status === 'expired'}
                    >
                      {notice.status === 'active' ? 'Unpublish' : 'Publish'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Notice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="notice-title">Title *</Label>
              <Input
                id="notice-title"
                placeholder="Enter notice title"
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notice-content">Content</Label>
              <Textarea
                id="notice-content"
                placeholder="Enter notice details (optional)"
                rows={3}
                value={form.content}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, content: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select
                value={form.level}
                onValueChange={(value: 'info' | 'urgent') =>
                  setForm((prev) => ({ ...prev, level: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="notice-start">Start time</Label>
                <DateTimePicker
                  id="notice-start"
                  value={form.startTime}
                  onChange={(value) => setForm((prev) => ({ ...prev, startTime: value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notice-end">End time</Label>
                <DateTimePicker
                  id="notice-end"
                  value={form.endTime}
                  onChange={(value) => setForm((prev) => ({ ...prev, endTime: value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void createNotice()} disabled={submitting}>
              {submitting ? 'Saving...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

