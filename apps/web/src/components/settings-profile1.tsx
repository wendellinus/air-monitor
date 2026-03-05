import React from 'react';
import { Camera } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useI18n } from '@/shared/i18n';

export type ProfileFormData = {
  name: string;
  email: string;
  username: string;
  avatar?: string;
  bio?: string;
};

type SettingsProfile1Props = {
  defaultValues?: Partial<ProfileFormData>;
  onSave?: (data: ProfileFormData) => Promise<void> | void;
  saving?: boolean;
  className?: string;
};

function textByLocale(locale: string, zh: string, en: string): string {
  return locale.startsWith('zh') ? zh : en;
}

export function SettingsProfile1({
  defaultValues = {
    name: 'Air Monitor Admin',
    email: '',
    username: '',
    avatar: '',
    bio: '',
  },
  className,
  onSave,
  saving = false,
}: SettingsProfile1Props): React.ReactNode {
  const { locale } = useI18n();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [name, setName] = React.useState(defaultValues.name ?? '');
  const [email, setEmail] = React.useState(defaultValues.email ?? '');
  const [username, setUsername] = React.useState(defaultValues.username ?? '');
  const [bio, setBio] = React.useState(defaultValues.bio ?? '');

  React.useEffect(() => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    setAvatarFile(null);
    setName(defaultValues.name ?? '');
    setEmail(defaultValues.email ?? '');
    setUsername(defaultValues.username ?? '');
    setBio(defaultValues.bio ?? '');
  }, [defaultValues.avatar, defaultValues.bio, defaultValues.email, defaultValues.name, defaultValues.username]);

  const initials = React.useMemo(
    () =>
      (name || 'A')
        .split(' ')
        .map((chunk) => chunk[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
    [name],
  );

  const avatarPreview = React.useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : (defaultValues.avatar ?? '')),
    [avatarFile, defaultValues.avatar],
  );

  React.useEffect(
    () => () => {
      if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    },
    [avatarPreview],
  );

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > 2 * 1024 * 1024) {
      return;
    }
    setAvatarFile(file);
  }

  function handleReset(): void {
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setName(defaultValues.name ?? '');
    setEmail(defaultValues.email ?? '');
    setUsername(defaultValues.username ?? '');
    setBio(defaultValues.bio ?? '');
  }

  function handleSave(): void {
    void onSave?.({
      name: name.trim(),
      email: email.trim(),
      username: username.trim(),
      avatar: avatarPreview || undefined,
      bio: bio.trim(),
    });
  }

  return (
    <Card className={cn('w-full border-slate-200 bg-white shadow-sm', className)}>
      <CardHeader>
        <CardTitle>{textByLocale(locale, '账户资料', 'Profile')}</CardTitle>
        <CardDescription>
          {textByLocale(
            locale,
            '更新个人信息和头像，便于团队识别与管理。',
            'Update personal information and avatar for easier account management.',
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="group relative size-20 shrink-0 rounded-full border border-slate-200"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
          >
            <Avatar className="size-20">
              <AvatarImage src={avatarPreview} alt={name} className="object-cover" />
              <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-6 text-white" />
            </div>
          </button>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">
              {textByLocale(locale, '头像', 'Profile Photo')}
            </p>
            <p className="text-xs text-muted-foreground">
              {textByLocale(locale, '点击头像上传新图片。', 'Click avatar to upload a new image.')}
            </p>
            <p className="text-xs text-muted-foreground">
              {textByLocale(locale, '支持 JPG/PNG，最大 2MB。', 'Supports JPG/PNG, max 2MB.')}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={handleAvatarChange}
            disabled={saving}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name">{textByLocale(locale, '姓名', 'Full Name')}</Label>
            <Input
              id="profile-name"
              placeholder={textByLocale(locale, '请输入姓名', 'Enter your name')}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-username">{textByLocale(locale, '用户名', 'Username')}</Label>
            <Input
              id="profile-username"
              placeholder={textByLocale(locale, '请输入用户名', 'Enter username')}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-email">{textByLocale(locale, '邮箱', 'Email')}</Label>
          <Input
            id="profile-email"
            type="email"
            placeholder={textByLocale(locale, '请输入邮箱地址', 'Enter your email')}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-bio">{textByLocale(locale, '简介', 'Bio')}</Label>
          <Textarea
            id="profile-bio"
            placeholder={textByLocale(locale, '介绍一下你的职责或使用场景', 'Tell us about your role')}
            rows={4}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground">
            {textByLocale(locale, '建议控制在 160 字以内。', 'Recommended length: within 160 characters.')}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleReset} disabled={saving}>
          {textByLocale(locale, '重置', 'Reset')}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? textByLocale(locale, '保存中...', 'Saving...') : textByLocale(locale, '保存', 'Save')}
        </Button>
      </CardFooter>
    </Card>
  );
}

