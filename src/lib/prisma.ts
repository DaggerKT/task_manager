import { PrismaClient } from '../generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString, options: '-c client_encoding=UTF8' });
const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal?: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const cachedClient = globalThis.prismaGlobal;
const shouldRecreateClient =
  process.env.NODE_ENV !== 'production' &&
  !!cachedClient &&
  (
    !(cachedClient as unknown as { invitation?: unknown }).invitation ||
    !(cachedClient as unknown as { taskAssignee?: unknown }).taskAssignee
  );

const prisma = shouldRecreateClient
  ? prismaClientSingleton()
  : cachedClient ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;