import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationsOptions,
  getNotificationsUnreadCountOptions,
  patchNotificationsReadAllMutation,
  patchNotificationsByIdReadMutation,
  getNotificationsQueryKey,
  getNotificationsUnreadCountQueryKey,
} from "@/lib/api/@tanstack/react-query.gen";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export function NotificationBell({ size = "icon" }: { size?: "icon" | "icon-lg" }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: countData } = useQuery({
    ...getNotificationsUnreadCountOptions(),
    refetchInterval: 30_000,
  });
  const unreadCount = countData?.count ?? 0;

  const { data: notifData } = useQuery({
    ...getNotificationsOptions({ query: { limit: 20 } }),
    enabled: open,
  });
  const notifications = notifData?.notifications ?? [];

  const markRead = useMutation({
    ...patchNotificationsByIdReadMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getNotificationsUnreadCountQueryKey() });
      qc.invalidateQueries({ queryKey: getNotificationsQueryKey() });
    },
  });

  const markAllRead = useMutation({
    ...patchNotificationsReadAllMutation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getNotificationsUnreadCountQueryKey() });
      qc.invalidateQueries({ queryKey: getNotificationsQueryKey() });
    },
  });

  const handleClick = (id: number | undefined, url: string | undefined) => {
    if (!id) return;
    markRead.mutate({ path: { id: String(id) } });
    if (url) {
      setOpen(false);
      navigate({ to: url as never });
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size={size} aria-label="Notifikasi" />
        }
      >
        <div className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-semibold">Notifikasi</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllRead.mutate({})}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Tandai semua dibaca
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            Tidak ada notifikasi
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={cn(
                "flex flex-col items-start gap-0.5 px-2 py-2",
                !n.is_read && "bg-muted/50"
              )}
              onClick={() => handleClick(n.id, n.url)}
            >
              <span className="text-sm font-medium leading-tight">{n.title}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">{n.body}</span>
              <span className="text-[10px] text-muted-foreground">{n.created_at}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
