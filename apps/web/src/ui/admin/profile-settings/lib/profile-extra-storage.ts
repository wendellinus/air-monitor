const PROFILE_EXTRA_STORAGE_PREFIX = 'air-monitor:admin-profile-extra:';

export type ProfileExtraStorage = {
  name?: string;
  bio?: string;
  avatar?: string;
};

function getProfileStorageKey(userId: number): string {
  return `${PROFILE_EXTRA_STORAGE_PREFIX}${userId}`;
}

export function readProfileExtra(userId: number): ProfileExtraStorage {
  try {
    const raw = window.localStorage.getItem(getProfileStorageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProfileExtraStorage;
    return {
      name: parsed.name?.trim() || undefined,
      bio: parsed.bio?.trim() || undefined,
      avatar: parsed.avatar?.trim() || undefined,
    };
  } catch {
    return {};
  }
}

export function writeProfileExtra(userId: number, data: ProfileExtraStorage): void {
  const payload: ProfileExtraStorage = {
    name: data.name?.trim() || undefined,
    bio: data.bio?.trim() || undefined,
    avatar: data.avatar?.trim() || undefined,
  };
  window.localStorage.setItem(getProfileStorageKey(userId), JSON.stringify(payload));
}

export function normalizeAvatarBeforeStore(avatar?: string): string | undefined {
  if (!avatar) return undefined;
  const trimmed = avatar.trim();
  if (!trimmed || trimmed.startsWith('blob:')) return undefined;
  return trimmed;
}
