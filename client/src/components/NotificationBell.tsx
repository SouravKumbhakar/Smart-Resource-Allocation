import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, AlertCircle, UserCheck, ClipboardCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/api";
import { toast } from "sonner";

interface Notification {
  _id: string;
  type: "assignment_created" | "status_updated" | "system_alert";
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotifIcon({ type }: { type: Notification["type"] }) {
  if (type === "assignment_created") return <UserCheck className="h-4 w-4 text-primary" />;
  if (type === "status_updated") return <ClipboardCheck className="h-4 w-4 text-success" />;
  return <AlertCircle className="h-4 w-4 text-danger" />;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({ 
    queryKey: ["notifications"], 
    queryFn: getNotifications,
    refetchInterval: 30000, // Background polling 30s
    refetchOnWindowFocus: true // Real-time UX on tab focus
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    }
  });

  const handleMarkRead = (id: string, isRead: boolean) => {
    if (!isRead) markReadMutation.mutate(id);
  };

  const markAllRead = () => {
    if (unreadCount > 0) markAllReadMutation.mutate();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] rounded-2xl bg-card border shadow-elevated z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="font-semibold text-sm">Notifications</div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="text-xs bg-danger text-white rounded-full px-2 py-0.5 font-semibold">
                  {unreadCount} new
                </span>
              )}
              <button
                onClick={markAllRead}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n: Notification) => {
                return (
                  <div
                    key={n._id}
                    onClick={() => handleMarkRead(n._id, n.isRead)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-secondary/50 ${
                      n.isRead ? "opacity-60" : ""
                    }`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-lg ${
                      n.type === "assignment_created" ? "bg-primary/10" :
                      n.type === "status_updated" ? "bg-success/10" :
                      "bg-danger/10"
                    }`}>
                      <NotifIcon type={n.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                    {!n.isRead && (
                      <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="px-4 py-2 border-t text-[11px] text-muted-foreground text-center">
            Showing live data · Auto-refreshes every 30s
          </div>
        </div>
      )}
    </div>
  );
}
