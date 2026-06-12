import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";

interface NotifyInput {
  type: string;
  title: string;
  body?: string;
  link?: string;
}

/** Create a notification for a user. Best-effort: never throws into the caller. */
export async function notify(organizationId: string, userId: string, input: NotifyInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        organizationId,
        userId,
        type: input.type,
        title: input.title,
        body: input.body ?? "",
        link: input.link ?? null,
      },
    });
  } catch {
    /* notifications are non-critical — swallow errors */
  }
}

export async function listNotifications(ctx: TenantContext) {
  const [rows, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({ where: { userId: ctx.userId, read: false } }),
  ]);
  return {
    unread,
    notifications: rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

export async function markRead(ctx: TenantContext, id: string): Promise<void> {
  await prisma.notification.updateMany({ where: { id, userId: ctx.userId }, data: { read: true } });
}

export async function markAllRead(ctx: TenantContext): Promise<void> {
  await prisma.notification.updateMany({ where: { userId: ctx.userId, read: false }, data: { read: true } });
}
