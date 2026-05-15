'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import type { Locale } from '@/lib/i18n';

export interface UserSearchResult {
  id: string;
  name: string | null;
  username: string;
  empNo: string | null;
  email: string | null;
  avatar: string | null;
}

export interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  locale: Locale | null;
}

export async function getUserSettings(): Promise<{
  success: boolean;
  data?: UserSettings;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailNotifications: true,
        pushNotifications: true,
        locale: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const locale = user.locale === 'en' || user.locale === 'th' ? user.locale : null;

    return {
      success: true,
      data: {
        emailNotifications: user.emailNotifications,
        pushNotifications: user.pushNotifications,
        locale,
      },
    };
  } catch (error) {
    console.error('Error getting user settings:', error);
    return { success: false, error: 'Failed to load settings' };
  }
}

export async function updateUserSettings(input: {
  locale: Locale;
  emailNotif: boolean;
  pushNotif: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        locale: input.locale,
        emailNotifications: input.emailNotif,
        pushNotifications: input.pushNotif,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user settings:', error);
    return { success: false, error: 'Failed to save settings' };
  }
}

export async function searchUsers(
  query: string,
  allowedUserIds?: string[],
): Promise<UserSearchResult[]> {
  const q = query.trim();
  if (!q || q.length < 1) return [];

  const normalizedAllowedIds = allowedUserIds
    ? [...new Set(allowedUserIds.filter(Boolean))]
    : null;

  if (normalizedAllowedIds && normalizedAllowedIds.length === 0) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      AND: [
        ...(normalizedAllowedIds
          ? [{ id: { in: normalizedAllowedIds } }]
          : []),
        {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { username: { contains: q, mode: 'insensitive' } },
            { empNo: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      empNo: true,
      email: true,
      avatar: true,
    },
    take: 12,
    orderBy: { name: 'asc' },
  });

  return users;
}

export async function getCurrentUserAvatar(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    return user?.avatar ?? null;
  } catch (error) {
    console.error('Error getting current user avatar:', error);
    return null;
  }
}
