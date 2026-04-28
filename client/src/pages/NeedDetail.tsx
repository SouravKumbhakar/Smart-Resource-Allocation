import { lazy, Suspense, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, MapPin, Calendar, CheckCircle2, Circle, Trash2, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryBadge, PriorityBadge, StatusBadge } from "@/components/PriorityBadge";
import { MatchingPanel } from "@/components/MatchingPanel";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNeedById, getMatches, updateNeed, deleteNeed, getMe } from "@/api";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MapView = lazy(() => import("@/components/MapView"));

export default function NeedDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<{ title?: string; description?: string; urgency?: number; peopleAffected?: number }>({});

  const { data: user } = useQuery({ queryKey: ["user"], queryFn: getMe, retry: false });
  const isAdmin = user?.role === "ngo_admin" || user?.role === "admin";

  const { data: need, isLoading: loadingNeed } = useQuery({
    queryKey: ["need", id],
    queryFn: () => getNeedById(id as string)
  });

  const { data: matches = [], isLoading: loadingMatches } = useQuery({
    queryKey: ["matches", id],
    queryFn: () => getMatches(id as string),
    enabled: !!need && need.status === "open",
  });

  const { mutate: saveEdit, isPending: saving } = useMutation({
    mutationFn: () => updateNeed(id as string, editData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["need", id] });
      queryClient.invalidateQueries({ queryKey: ["needs"] });
      toast.success("Need updated successfully");
      setEditing(false);
      setEditData({});
    },
    onError: (err: any) => toast.error(err.message || "Failed to update need"),
  });

  const { mutate: handleDelete, isPending: deleting } = useMutation({
    mutationFn: () => deleteNeed(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["needs"] });
      toast.success("Need deleted");
      navigate("/needs");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete need"),
  });

  const startEdit = () => {
    setEditData({
      title: need.title,
      description: need.description,
      urgency: need.urgency,
      peopleAffected: need.peopleAffected,
    });
    setEditing(true);
  };

  if (loadingNeed) return <div className="p-8"><Skeleton className="h-[400px] w-full rounded-2xl" /></div>;
  if (!need) return <div className="p-8">Need not found. <Link to="/needs" className="text-primary underline">Back</Link></div>;

  const steps = [
    { label: "Created", done: true },
    { label: "Assigned", done: need.status !== "open" },
    { label: "Completed", done: need.status === "completed" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/needs"><ArrowLeft className="h-4 w-4 mr-1" /> Back to needs</Link>
        </Button>
        {isAdmin && !editing && need.status === "open" && (
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this need?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove "{need.title}". This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        {editing && (
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" onClick={() => saveEdit()} disabled={saving}>
              <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? "Saving…" : "Save"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setEditing(false); setEditData({}); }}>
              <X className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl bg-card border shadow-card p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <CategoryBadge category={need.category} />
              <PriorityBadge urgency={editing ? (editData.urgency ?? need.urgency) : need.urgency} />
              <StatusBadge status={need.status} assigneeName={need.assignedVolunteerId?.name} />
            </div>

            {editing ? (
              <div className="space-y-3">
                <Input
                  value={editData.title ?? ""}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="text-2xl font-bold h-auto py-1.5"
                  placeholder="Need title"
                />
                <Input
                  value={editData.description ?? ""}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  placeholder="Description"
                />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold tracking-tight">{need.title}</h1>
                <p className="text-muted-foreground mt-2">{need.description}</p>
              </>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" /> People affected</div>
                {editing ? (
                  <Input type="number" min="1" value={editData.peopleAffected ?? ""} onChange={(e) => setEditData({ ...editData, peopleAffected: +e.target.value })} className="mt-1 h-8 text-sm" />
                ) : (
                  <div className="text-xl font-bold mt-1">{need.peopleAffected}</div>
                )}
              </div>
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Location</div>
                <div className="text-xl font-bold mt-1">{need.location.lat.toFixed(4)}, {need.location.lng.toFixed(4)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Created</div>
                <div className="text-xl font-bold mt-1">{new Date(need.createdAt).toLocaleDateString()}</div>
              </div>
              {editing && (
                <div>
                  <div className="text-xs text-muted-foreground">Urgency (1–5)</div>
                  <Input type="number" min="1" max="5" value={editData.urgency ?? ""} onChange={(e) => setEditData({ ...editData, urgency: +e.target.value })} className="mt-1 h-8 text-sm" />
                </div>
              )}
            </div>
          </div>

          <Suspense fallback={<Skeleton className="h-[300px] rounded-2xl" />}>
            <div className="h-[300px]">
              <MapView needs={[need]} />
            </div>
          </Suspense>

          <div className="rounded-2xl bg-card border shadow-card p-6">
            <h2 className="font-semibold mb-4">Status timeline</h2>
            <div className="flex items-center justify-between gap-2">
              {steps.map((s, i) => (
                <div key={s.label} className="flex-1 flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    {s.done ? <CheckCircle2 className="h-6 w-6 text-success" /> : <Circle className="h-6 w-6 text-muted-foreground" />}
                    <span className="text-xs font-medium">{s.label}</span>
                  </div>
                  {i < steps.length - 1 && <div className={`h-0.5 flex-1 ${steps[i + 1].done ? "bg-success" : "bg-border"}`} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {loadingMatches ? (
            <Skeleton className="h-[300px] rounded-2xl" />
          ) : (
            <MatchingPanel need={need} matches={matches} />
          )}
        </div>
      </div>
    </div>
  );
}
