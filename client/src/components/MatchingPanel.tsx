import { useState } from "react";
import { Sparkles, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { Match, Need } from "@/lib/types";
import { cn } from "@/lib/utils";

function scoreTone(score: number) {
  if (score >= 0.7) return { cls: "bg-success/10 text-success border-success/30", label: "Strong Match" };
  if (score >= 0.4) return { cls: "bg-warning/10 text-warning border-warning/30", label: "Partial Match" };
  return { cls: "bg-danger/10 text-danger border-danger/30", label: "Weak Match" };
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAssignment } from "@/api";

export function MatchingPanel({ need, matches }: { need: Need; matches: Match[] }) {
  const queryClient = useQueryClient();
  const { mutate: assignVolunteer, isPending } = useMutation({
    mutationFn: (volunteerId: string) => createAssignment({ needId: need._id, volunteerId }),
    onSuccess: (_, volunteerId) => {
      queryClient.invalidateQueries({ queryKey: ["need"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      toast.success("Volunteer assigned!", { description: need.title });
    },
    onError: (err: any) => toast.error(err.message || "Failed to assign volunteer")
  });

  return (
    <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
      <div className="p-5 border-b bg-gradient-primary text-primary-foreground">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
          <Sparkles className="h-4 w-4" /> Smart Match Results
        </div>
        <div className="font-semibold mt-1 text-[15px]">for: "{need.title}"</div>
      </div>

      <div className="divide-y">
        {matches.map((m, idx) => {
          const tone = scoreTone(m.score);
          const isAssigned = need.status !== "open";
          return (
            <div key={m.volunteerId} className="p-4 flex flex-col gap-3 hover:bg-secondary/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-sm font-bold">
                  #{idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{m.volunteerName}</div>
                  <div className="text-xs text-muted-foreground">{m.distance} km away</div>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={cn("text-xs font-bold rounded-full px-2.5 py-1 border cursor-help", tone.cls)}>
                        {m.score.toFixed(2)} ✦
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-xs">
                      <div className="font-semibold mb-1">Why this score?</div>
                      <div>Skill: +{m.scoreBreakdown.skillScore.toFixed(2)}</div>
                      <div>Distance: +{m.scoreBreakdown.distanceScore.toFixed(2)}</div>
                      <div>Availability: +{m.scoreBreakdown.availabilityScore.toFixed(2)}</div>
                      <div className="border-t mt-1 pt-1 font-semibold">Total: {m.score.toFixed(2)} / 1.00</div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="text-xs space-y-1 pl-12">
                <div className="flex items-center gap-2">
                  {m.reasons.skillMatch ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <XCircle className="h-3.5 w-3.5 text-danger" />}
                  Skill {m.reasons.skillMatch ? "match" : "mismatch"} (+{m.scoreBreakdown.skillScore.toFixed(2)})
                </div>
                <div className="flex items-center gap-2">
                  {m.distance < 5 ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                  Distance: {m.reasons.distanceLabel} (+{m.scoreBreakdown.distanceScore.toFixed(2)})
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Available now (+0.20)
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    disabled={isAssigned || isPending}
                    className={cn(
                      "ml-12 w-fit",
                      isAssigned ? "" : "bg-gradient-primary text-primary-foreground hover:opacity-90"
                    )}
                    variant={isAssigned ? "secondary" : "default"}
                  >
                    {isAssigned ? "✓ Assigned" : isPending ? "Assigning..." : "Assign Now"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Assign {m.volunteerName}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will assign {m.volunteerName} to "{need.title}" and mark them unavailable.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => assignVolunteer(m.volunteerId)}
                    >
                      Confirm Assign
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        })}
      </div>
    </div>
  );
}
