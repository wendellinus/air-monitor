import React from 'react';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Dialog,
  DialogContent,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{props.t('admin.notices.create.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="notice-title">{props.t('admin.notices.create.fieldTitle')}</Label>
            <Input
              id="notice-title"
              placeholder={props.t('admin.notices.create.titlePlaceholder')}
              value={props.form.title}
              onChange={(event) =>
                props.onFormChange((current) => ({ ...current, title: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notice-content">{props.t('admin.notices.create.fieldContent')}</Label>
            <Textarea
              id="notice-content"
              placeholder={props.t('admin.notices.create.contentPlaceholder')}
              rows={3}
              value={props.form.content}
              onChange={(event) =>
                props.onFormChange((current) => ({ ...current, content: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>{props.t('admin.notices.create.fieldLevel')}</Label>
            <Select
              value={props.form.level}
              onValueChange={(value: 'info' | 'urgent') =>
                props.onFormChange((current) => ({ ...current, level: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">{props.t('admin.notices.level.info')}</SelectItem>
                <SelectItem value="urgent">{props.t('admin.notices.level.urgent')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="notice-start">{props.t('admin.notices.create.fieldStart')}</Label>
              <DateTimePicker
                id="notice-start"
                value={props.form.startTime}
                onChange={(value) =>
                  props.onFormChange((current) => ({ ...current, startTime: value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notice-end">{props.t('admin.notices.create.fieldEnd')}</Label>
              <DateTimePicker
                id="notice-end"
                value={props.form.endTime}
                onChange={(value) =>
                  props.onFormChange((current) => ({ ...current, endTime: value }))
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.setOpen(false)}>
            {props.t('admin.notices.create.cancel')}
          </Button>
          <AsyncButton
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
