import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, AlertCircle, UserCheck, ClipboardCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAssignments, getNeeds } from "@/api";

interface Notification {
  id: string;
  type: "assignment" | "need" | "completion";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

function buildNotifications(assignments: any[], needs: any[]): Notification[] {
  const notes: Notification[] = [];

  // Notifications from recent assignments
  const recentAssignments = [...assignments]
    .sort((a, b) => new Date(b.assignedAt || b.createdAt).getTime() - new Date(a.assignedAt || a.createdAt).getTime())
    .slice(0, 5);

  recentAssignments.forEach(a => {
    if (a.status === "active") {
      notes.push({
        id: `assign-${a._id}`,
        type: "assignment",
        title: "Volunteer Assigned",
        message: `${a.volunteerId?.userId?.name || "A volunteer"} assigned to "${a.needId?.title || "a need"}"`,
        time: a.assignedAt || a.createdAt,
        read: false,
      });
    } else if (a.status === "completed") {
      notes.push({
        id: `complete-${a._id}`,
        type: "completion",
        title: "Assignment Completed",
        message: `"${a.needId?.title || "A need"}" has been resolved ✓`,
        time: a.completedAt || a.updatedAt,
        read: false,
      });
    }
  });

  // High-urgency open needs (urgency 5) as alerts
  const criticalNeeds = needs.filter(n => n.urgency === 5 && n.status === "open").slice(0, 3);
  criticalNeeds.forEach(n => {
    notes.push({
      id: `urgent-${n._id}`,
      type: "need",
      title: "🔴 Critical Need Unassigned",
      message: `"${n.title}" affects ${n.peopleAffected} people`,
      time: n.createdAt,
      read: false,
    });
  });

  return notes.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);
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
  if (type === "assignment") return <UserCheck className="h-4 w-4 text-primary" />;
  if (type === "completion") return <ClipboardCheck className="h-4 w-4 text-success" />;
  return <AlertCircle className="h-4 w-4 text-danger" />;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const { data: assignments = [] } = useQuery({ queryKey: ["assignments"], queryFn: getAssignments });
  const { data: needs = [] } = useQuery({ queryKey: ["needs"], queryFn: getNeeds });

  const notifications = buildNotifications(assignments, needs);
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

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

  const markAllRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)));
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
              notifications.map(n => {
                const isRead = readIds.has(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => setReadIds(prev => new Set([...prev, n.id]))}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-secondary/50 ${
                      isRead ? "opacity-60" : ""
                    }`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-lg ${
                      n.type === "assignment" ? "bg-primary/10" :
                      n.type === "completion" ? "bg-success/10" :
                      "bg-danger/10"
                    }`}>
                      <NotifIcon type={n.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(n.time)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                    {!isRead && (
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
