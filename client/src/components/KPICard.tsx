import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number | string;
  trend?: { delta: string; up?: boolean };
  icon: LucideIcon;
  tone?: "primary" | "danger" | "success" | "indigo";
}

const toneMap = {
  primary: "bg-primary/10 text-primary",
  danger:  "bg-danger/10 text-danger",
  success: "bg-success/10 text-success",
  indigo:  "bg-indigo/10 text-indigo",
};

export function KPICard({ label, value, trend, icon: Icon, tone = "primary" }: Props) {
  return (
    <div className="rounded-2xl bg-card border shadow-card p-5 flex flex-col gap-3 hover:shadow-elevated transition-shadow">
      <div className="flex items-start justify-between">
        <div className={cn("h-10 w-10 rounded-xl grid place-items-center", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className={cn(
            "inline-flex items-center gap-0.5 text-[11px] font-semibold rounded-full px-2 py-0.5",
            trend.up ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          )}>
            {trend.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend.delta}
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <div className="text-sm text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}
