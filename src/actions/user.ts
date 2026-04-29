'use server';

import prisma from '@/lib/prisma';

export interface UserSearchResult {
  id: string;
  name: string | null;
  username: string;
  empNo: string | null;
  email: string | null;
  avatar: string | null;
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const q = query.trim();
  if (!q || q.length < 1) return [];

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        { empNo: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
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
