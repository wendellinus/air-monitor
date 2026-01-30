export const UserRoles = ['user', 'operator', 'admin'] as const;

export type UserRole = (typeof UserRoles)[number];

