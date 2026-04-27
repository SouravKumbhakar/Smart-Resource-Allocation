import { Users, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CategoryBadge, PriorityBadge } from "./PriorityBadge";
import type { Need } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NeedCard({ need }: { need: Need }) {
  const ageHours = (Date.now() - new Date(need.createdAt).getTime()) / 3600_000;
  const escalating = ageHours > 48 && need.status === "open";

  return (
    <div
      className={cn(
        "rounded-2xl bg-card border p-5 flex flex-col gap-3 transition-all hover:shadow-elevated",
        need.urgency === 5 ? "shadow-glow-danger" : "shadow-card"
      )}
    >
      <div className="flex items-center justify-between">
        <CategoryBadge category={need.category} />
        <PriorityBadge urgency={need.urgency} />
      </div>

      <div>
        <h3 className="font-bold text-[15px] leading-snug">{need.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{need.description}</p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {need.peopleAffected} people</span>
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {need.location.lat.toFixed(3)}, {need.location.lng.toFixed(3)}</span>
        {escalating && (
          <span className="inline-flex items-center gap-1 text-danger font-semibold">
            <Clock className="h-3.5 w-3.5" /> Escalating
          </span>
        )}
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">Priority Score</span>
                <span className="font-bold">{need.priorityScore.toFixed(2)} / 5</span>
              </div>
              <Progress value={(need.priorityScore / 5) * 100} className="h-2" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <div className="font-semibold mb-1">📊 Priority breakdown</div>
            <div>Urgency: {(need.urgency * 0.5).toFixed(2)} ({need.urgency} × 0.5)</div>
            <div>People affected: {(Math.min(need.peopleAffected / 100, 1) * 5 * 0.3).toFixed(2)}</div>
            <div>Time urgency: {(Math.max(0, 5 - ageHours / 24) * 0.2).toFixed(2)}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex gap-2 pt-1">
        <Button asChild variant="secondary" size="sm" className="flex-1">
          <Link to={`/needs/${need._id}`}>View Details</Link>
        </Button>
        <Button asChild size="sm" className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90">
          <Link to={`/needs/${need._id}`}>Quick Assign</Link>
        </Button>
      </div>
    </div>
  );
}
