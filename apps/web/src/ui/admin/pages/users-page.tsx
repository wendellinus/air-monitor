import React from 'react';
import { MoreHorizontal, RotateCcw, Search, ShieldCheck, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import type { UserListData, UserRole } from '@air-monitor/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';

type UserItem = UserListData['list'][number];

const PAGE_SIZE = 15;

function roleBadge(role: UserRole): React.ReactNode {
  if (role === 'admin') return <Badge variant="default">Admin</Badge>;
  if (role === 'operator') return <Badge variant="secondary">Operator</Badge>;
  return <Badge variant="outline">User</Badge>;
}

function statusBadge(isActive: boolean): React.ReactNode {
  return isActive ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Disabled</Badge>;
}

export function AdminUsersPage(): React.ReactNode {
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [page, setPage] = React.useState<number>(1);
  const [keyword, setKeyword] = React.useState<string>('');
  const [inputValue, setInputValue] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);

  const [resetTarget, setResetTarget] = React.useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = React.useState<string>('');
  const [resetting, setResetting] = React.useState<boolean>(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadUsers = React.useCallback(async (targetPage: number, kw: string): Promise<void> => {
    setLoading(true);
    try {
      const endpoint = kw.trim() ? '/users/search' : '/users';
      const response = await api.get<ApiResponse<UserListData>>(endpoint, {
        params: kw.trim()
          ? { keyword: kw.trim(), page: targetPage, pageSize: PAGE_SIZE }
          : { page: targetPage, pageSize: PAGE_SIZE },
      });
      setUsers(response.data.data.list);
      setTotal(response.data.data.total);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadUsers(page, keyword);
  }, [loadUsers, page, keyword]);

  function handleSearch(): void {
    setPage(1);
    setKeyword(inputValue.trim());
  }

  async function toggleActive(user: UserItem): Promise<void> {
    try {
      await api.patch(`/admin/users/${user.id}/status`, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)));
      toast.success(`${user.username} ${user.isActive ? 'disabled' : 'enabled'}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  }

  async function setRole(user: UserItem, role: UserRole): Promise<void> {
    if (user.role === role) return;
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
      toast.success(`${user.username} role updated to ${role}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    }
  }

  async function submitResetPassword(): Promise<void> {
    if (!resetTarget) return;
    if (newPassword.trim().length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setResetting(true);
    try {
      await api.post(`/admin/users/${resetTarget.id}/reset-password`, {
        newPassword: newPassword.trim(),
      });
      toast.success(`Password reset for ${resetTarget.username}`);
      setResetTarget(null);
      setNewPassword('');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">User Management</h2>
          <p className="text-sm text-muted-foreground">Total {total} users</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search username..."
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              handleSearch();
            }}
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
        {keyword ? (
          <Button
            variant="ghost"
            onClick={() => {
              setInputValue('');
              setKeyword('');
              setPage(1);
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8">
                  <Empty>
                    <EmptyMedia variant="icon">
                      <Search />
                    </EmptyMedia>
                    <EmptyTitle>No users found</EmptyTitle>
                    <EmptyDescription>
                      No users match the current query. Try a different keyword.
                    </EmptyDescription>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{user.id}</TableCell>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{roleBadge(user.role)}</TableCell>
                  <TableCell>{statusBadge(user.isActive)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => void toggleActive(user)}>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          {user.isActive ? 'Disable account' : 'Enable account'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void setRole(user, 'admin')}>
                          <UserCog className="mr-2 h-4 w-4" />
                          Set role: admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void setRole(user, 'operator')}>
                          <UserCog className="mr-2 h-4 w-4" />
                          Set role: operator
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void setRole(user, 'user')}>
                          <UserCog className="mr-2 h-4 w-4" />
                          Set role: user
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setResetTarget(user);
                            setNewPassword('');
                          }}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset password
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      <Dialog open={resetTarget !== null} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              New password for <span className="font-medium">{resetTarget?.username ?? '-'}</span>
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button onClick={() => void submitResetPassword()} disabled={resetting}>
              {resetting ? 'Saving...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

