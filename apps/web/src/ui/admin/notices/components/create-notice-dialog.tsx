import React from 'react';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AsyncButton } from '@/ui/admin/components/feedback';
import type { CreateNoticeForm, TranslateFn } from '@/ui/admin/notices/lib/types';

type CreateNoticeDialogProps = {
  t: TranslateFn;
  open: boolean;
  submitting: boolean;
  form: CreateNoticeForm;
  setOpen: (open: boolean) => void;
  onFormChange: React.Dispatch<React.SetStateAction<CreateNoticeForm>>;
  onConfirm: () => void;
};

export function CreateNoticeDialog(props: CreateNoticeDialogProps): React.ReactNode {
  return (
    <Dialog open={props.open} onOpenChange={props.setOpen}>
      <DialogContent className="overflow-hidden border-border/70 bg-background p-0 shadow-2xl sm:max-w-[760px]">
        <DialogHeader className="border-b border-border/70 bg-muted/25 px-6 py-5 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {props.t('admin.notices.create.title')}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {props.t('admin.notices.create.fieldTitle')}
            {' / '}
            {props.t('admin.notices.create.fieldContent')}
            {' / '}
            {props.t('admin.notices.create.fieldLevel')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-2 rounded-xl border border-border/70 bg-card/60 p-4">
            <Label htmlFor="notice-title">{props.t('admin.notices.create.fieldTitle')}</Label>
            <Input
              id="notice-title"
              className="h-10 rounded-lg border-border/70"
              placeholder={props.t('admin.notices.create.titlePlaceholder')}
              value={props.form.title}
              onChange={(event) =>
                props.onFormChange((current) => ({ ...current, title: event.target.value }))
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <div className="space-y-2 rounded-xl border border-border/70 bg-card/60 p-4">
              <Label htmlFor="notice-content">{props.t('admin.notices.create.fieldContent')}</Label>
              <Textarea
                id="notice-content"
                className="min-h-[128px] rounded-lg border-border/70"
                placeholder={props.t('admin.notices.create.contentPlaceholder')}
                rows={5}
                value={props.form.content}
                onChange={(event) =>
                  props.onFormChange((current) => ({ ...current, content: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2 rounded-xl border border-border/70 bg-card/60 p-4">
              <Label>{props.t('admin.notices.create.fieldLevel')}</Label>
              <Select
                value={props.form.level}
                onValueChange={(value: 'info' | 'urgent') =>
                  props.onFormChange((current) => ({ ...current, level: value }))
                }
              >
                <SelectTrigger className="h-10 rounded-lg border-border/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">{props.t('admin.notices.level.info')}</SelectItem>
                  <SelectItem value="urgent">{props.t('admin.notices.level.urgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/60 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="notice-start">{props.t('admin.notices.create.fieldStart')}</Label>
                <DateTimePicker
                  id="notice-start"
                  modal
                  className="h-10 rounded-lg"
                  value={props.form.startTime}
                  onChange={(value) =>
                    props.onFormChange((current) => ({ ...current, startTime: value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notice-end">{props.t('admin.notices.create.fieldEnd')}</Label>
                <DateTimePicker
                  id="notice-end"
                  modal
                  className="h-10 rounded-lg"
                  value={props.form.endTime}
                  onChange={(value) =>
                    props.onFormChange((current) => ({ ...current, endTime: value }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border/70 px-6 py-4 sm:justify-end">
          <Button variant="outline" className="h-10 rounded-lg px-5" onClick={() => props.setOpen(false)}>
            {props.t('admin.notices.create.cancel')}
          </Button>
          <AsyncButton
            className="h-10 rounded-lg px-5"
            onClick={props.onConfirm}
            isLoading={props.submitting}
            loadingText={props.t('admin.notices.create.confirming')}
          >
            {props.t('admin.notices.create.confirm')}
          </AsyncButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
