import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/PriorityBadge";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAssignments, completeAssignment as completeAssignmentApi } from "@/api";

export default function Assignments() {
  const queryClient = useQueryClient();
  const { data: list = [], isLoading } = useQuery({ queryKey: ["assignments"], queryFn: getAssignments });

  const { mutate: complete } = useMutation({
    mutationFn: (id: string) => completeAssignmentApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment marked complete");
    },
    onError: (err: any) => toast.error(err.message || "Failed to complete assignment")
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
        <p className="text-sm text-muted-foreground mt-1">{list.length} assignments tracked.</p>
      </div>

      <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Need</th>
                <th className="text-left px-3 py-3 font-medium">Volunteer</th>
                <th className="text-left px-3 py-3 font-medium">Score</th>
                <th className="text-left px-3 py-3 font-medium">Assigned at</th>
                <th className="text-left px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((a: any) => (
                <tr key={a._id} className="hover:bg-secondary/30">
                  <td className="px-5 py-4 font-medium">{a.needId?.title || a.needTitle}</td>
                  <td className="px-3 py-4">{a.volunteerId?.userId?.name || a.volunteerName}</td>
                  <td className="px-3 py-4 font-semibold">{(a.matchScore ?? a.score ?? 0).toFixed(2)}</td>
                  <td className="px-3 py-4 text-muted-foreground">{new Date(a.assignedAt).toLocaleString()}</td>
                  <td className="px-3 py-4"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-4 text-right">
                    {a.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => complete(a._id)}>
                        Mark Complete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
