import React from 'react';
import type { UserRole } from '@air-monitor/shared';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AsyncButton } from '@/ui/admin/components/feedback';
import { Button } from '@/components/ui/button';
import type { CreateUserDialogValues, TranslateFn } from '@/ui/admin/users/lib/types';

type CreateUserDialogProps = {
  t: TranslateFn;
  open: boolean;
  isSubmitting: boolean;
  canAssignRole: boolean;
  canSetStatus: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateUserDialogValues) => Promise<void>;
};

const DEFAULT_VALUES: CreateUserDialogValues = {
  username: '',
  password: '',
  role: 'user',
  isActive: true,
};

export function CreateUserDialog(props: CreateUserDialogProps): React.ReactNode {
  const [values, setValues] = React.useState<CreateUserDialogValues>(DEFAULT_VALUES);

  React.useEffect(() => {
    if (props.open) {
      setValues(DEFAULT_VALUES);
    }
  }, [props.open]);

  const username = values.username.trim();
  const password = values.password.trim();
  const canSubmit = username.length >= 2 && password.length >= 6 && !props.isSubmitting;

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      if (!canSubmit) return;
      await props.onSubmit({
        username,
        password,
        role: props.canAssignRole ? values.role : 'user',
        isActive: props.canSetStatus ? values.isActive : true,
      });
    },
    [canSubmit, password, props, username, values.isActive, values.role],
  );

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
          <DialogHeader>
            <DialogTitle>{props.t('admin.users.create.title')}</DialogTitle>
            <DialogDescription>{props.t('admin.users.create.desc')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="create-user-username">{props.t('admin.users.create.username')}</Label>
              <Input
                id="create-user-username"
                autoComplete="off"
                spellCheck={false}
                placeholder={props.t('admin.users.create.usernamePlaceholder')}
                value={values.username}
                onChange={(event) => setValues((current) => ({ ...current, username: event.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="create-user-password">{props.t('admin.users.create.password')}</Label>
              <Input
                id="create-user-password"
                type="password"
                autoComplete="new-password"
                placeholder={props.t('admin.users.create.passwordPlaceholder')}
                value={values.password}
                onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-user-role">{props.t('admin.users.create.role')}</Label>
              <Select
                value={values.role}
                onValueChange={(value: UserRole) => setValues((current) => ({ ...current, role: value }))}
                disabled={!props.canAssignRole}
              >
                <SelectTrigger id="create-user-role" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{props.t('admin.users.role.user')}</SelectItem>
                  <SelectItem value="operator">{props.t('admin.users.role.operator')}</SelectItem>
                  <SelectItem value="admin">{props.t('admin.users.role.admin')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {props.canAssignRole
                  ? props.t('admin.users.create.roleHint')
                  : props.t('admin.users.create.roleReadonly')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-user-status">{props.t('admin.users.create.status')}</Label>
              <div className="flex min-h-10 items-center justify-between rounded-md border border-input bg-background px-3">
                <span className="text-sm text-foreground">
                  {values.isActive ? props.t('admin.users.status.active') : props.t('admin.users.status.disabled')}
                </span>
                <Switch
                  id="create-user-status"
                  checked={values.isActive}
                  disabled={!props.canSetStatus}
                  onCheckedChange={(next) => setValues((current) => ({ ...current, isActive: next }))}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {props.canSetStatus
                  ? props.t('admin.users.create.statusHint')
                  : props.t('admin.users.create.statusReadonly')}
              </p>
            </div>
          </div>

          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            {props.t('admin.users.create.permissionsHint')}
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
              {props.t('admin.users.create.cancel')}
            </Button>
            <AsyncButton
              type="submit"
              isLoading={props.isSubmitting}
              loadingText={props.t('admin.users.create.confirming')}
              disabled={!canSubmit}
            >
              {props.t('admin.users.create.confirm')}
            </AsyncButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
