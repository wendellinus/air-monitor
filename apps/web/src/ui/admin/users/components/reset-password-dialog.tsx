import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AsyncButton } from '@/ui/admin/components/feedback';
import type { TranslateFn, UserItem } from '@/ui/admin/users/lib/types';

type ResetPasswordDialogProps = {
  t: TranslateFn;
  target: UserItem | null;
  newPassword: string;
  resetting: boolean;
  onPasswordChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function ResetPasswordDialog(props: ResetPasswordDialogProps): React.ReactNode {
  return (
    <Dialog open={props.target !== null} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{props.t('admin.users.reset.dialogTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            {props.t('admin.users.reset.newPasswordFor', { username: props.target?.username ?? '-' })}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">{props.t('admin.users.reset.passwordLabel')}</Label>
            <Input
              id="new-password"
              type="password"
              placeholder={props.t('admin.users.reset.passwordPlaceholder')}
              value={props.newPassword}
              onChange={(event) => props.onPasswordChange(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            {props.t('admin.users.reset.cancel')}
          </Button>
          <AsyncButton
            onClick={props.onConfirm}
            isLoading={props.resetting}
            loadingText={props.t('admin.users.reset.confirming')}
          >
            {props.t('admin.users.reset.confirm')}
          </AsyncButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
