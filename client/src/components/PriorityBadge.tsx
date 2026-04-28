import { Flame, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function PriorityBadge({ urgency }: { urgency: number }) {
  if (urgency === 5)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 text-danger px-2 py-0.5 text-[11px] font-semibold border border-danger/20">
        <Flame className="h-3 w-3" /> Critical
      </span>
    );
  if (urgency === 4)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 text-warning px-2 py-0.5 text-[11px] font-semibold border border-warning/20">
        <AlertTriangle className="h-3 w-3" /> High
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary text-muted-foreground px-2 py-0.5 text-[11px] font-semibold">
      <Info className="h-3 w-3" /> Medium
    </span>
  );
}

const catMap: Record<string, { label: string; emoji: string; cls: string }> = {
  food:      { label: "Food",      emoji: "🍞", cls: "bg-amber-100 text-amber-800" },
  medical:   { label: "Medical",   emoji: "🏥", cls: "bg-rose-100 text-rose-800" },
  education: { label: "Education", emoji: "📚", cls: "bg-sky-100 text-sky-800" },
  disaster:  { label: "Disaster",  emoji: "⚡", cls: "bg-violet-100 text-violet-800" },
};

export function CategoryBadge({ category }: { category: string }) {
  const c = catMap[category] ?? catMap.food;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", c.cls)}>
      <span>{c.emoji}</span> {c.label}
    </span>
  );
}

export function StatusBadge({ status, assigneeName }: { status: string; assigneeName?: string }) {
  if (status === 'open') {
    return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">Quick assign</span>;
  }
  if (status === 'assigned') {
    return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-warning/10 text-warning border border-warning/20">Assigned {assigneeName ? `(${assigneeName})` : ''}</span>;
  }
  if (status === 'completed') {
    return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-success/10 text-success border border-success/20">Completed</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize bg-secondary">{status}</span>;
}
