"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, UserPlus, Trophy, CheckSquare, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";

type Notif = { id: string; type: string; title: string; body: string; link: string | null; read: boolean; createdAt: string };

const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  LEAD_ASSIGNED: UserPlus,
  DEAL_WON: Trophy,
  TASK_ASSIGNED: CheckSquare,
  FOLLOW_UP: BellRing,
};

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/app/notifications");
      if (!res.ok) throw new Error();
      return (await res.json()) as { unread: number; notifications: Notif[] };
    },
    refetchInterval: 30000,
  });

  const unread = data?.unread ?? 0;
  const items = data?.notifications ?? [];

  const markAll = useMutation({
    mutationFn: async () => { await fetch("/api/app/notifications", { method: "PATCH" }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  async function openItem(n: Notif) {
    if (!n.read) {
      await fetch(`/api/app/notifications/${n.id}`, { method: "PATCH" });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-border bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && (
                <button onClick={() => markAll.mutate()} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
                  <CheckCheck className="h-6 w-6 text-emerald-500" />
                  You’re all caught up
                </div>
              ) : (
                items.map((n) => {
                  const Icon = ICON[n.type] ?? Bell;
                  return (
                    <button
                      key={n.id}
                      onClick={() => openItem(n)}
                      className={cn(
                        "flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-accent/30",
                        !n.read && "bg-accent/20"
                      )}
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium leading-snug">{n.title}</span>
                        {n.body && <span className="block text-xs text-muted-foreground">{n.body}</span>}
                        <span className="block text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                      </span>
                      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
