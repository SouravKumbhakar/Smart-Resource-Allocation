import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAssignmentById, getMe, submitAssignment as submitApi,
  approveAssignment as approveApi, rejectAssignment as rejectApi, uploadFile,
} from "@/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/PriorityBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, Users, AlertTriangle, Calendar,
  Upload, X, CheckCircle2, XCircle, Clock, FileText,
} from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  food: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  medical: "bg-red-500/20 text-red-300 border-red-500/30",
  education: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  disaster: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  logistics: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  shelter: "bg-green-500/20 text-green-300 border-green-500/30",
  counselling: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

function StatusStepper({ status }: { status: string }) {
  const steps = [
    { key: "active", label: "Assigned", icon: Clock },
    { key: "submitted", label: "Submitted", icon: FileText },
    { key: "completed", label: "Completed", icon: CheckCircle2 },
  ];
  const currentIdx = steps.findIndex(s => s.key === status);
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done = i <= currentIdx;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center">
            <div className={`flex flex-col items-center gap-1.5 px-3`}>
              <div className={`h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all ${
                done ? "bg-primary border-primary text-primary-foreground" : "border-border text-muted-foreground"
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${done ? "text-primary" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-12 mb-5 ${i < currentIdx ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ["user"], queryFn: getMe, retry: false });
  const { data: assignment, isLoading } = useQuery({
    queryKey: ["assignment", id],
    queryFn: () => getAssignmentById(id!),
    enabled: !!id,
  });

  const isAdmin = user?.role === "ngo_admin" || user?.role === "coordinator" || user?.role === "super_admin";

  // Submission state
  const [submitText, setSubmitText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const { mutate: doSubmit, isPending: submitting } = useMutation({
    mutationFn: () => submitApi(id!, { text: submitText, images }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment", id] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Task submitted for review!");
      setSubmitText(""); setImages([]);
    },
    onError: (e: any) => toast.error(e.message || "Submission failed"),
  });

  const { mutate: doApprove, isPending: approving } = useMutation({
    mutationFn: () => approveApi(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment", id] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment approved and marked complete!");
    },
    onError: (e: any) => toast.error(e.message || "Approval failed"),
  });

  const { mutate: doReject, isPending: rejecting } = useMutation({
    mutationFn: () => rejectApi(id!, rejectFeedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment", id] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Submission rejected. Volunteer has been notified.");
      setShowRejectForm(false); setRejectFeedback("");
    },
    onError: (e: any) => toast.error(e.message || "Rejection failed"),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - images.length);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadFile(f)));
      setImages(prev => [...prev, ...urls]);
      toast.success(`${urls.length} image(s) uploaded`);
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[400px] w-full rounded-2xl" />
    </div>
  );

  if (!assignment) return (
    <div className="text-center py-20 text-muted-foreground">Assignment not found.</div>
  );

  const need = assignment.needId;
  const volunteer = assignment.volunteerId;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/assignments"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
      </div>

      {/* Need Info Card */}
      <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold uppercase tracking-wider mb-3 ${CATEGORY_COLORS[need?.category] || "bg-secondary"}`}>
                {need?.category}
              </div>
              <h1 className="text-2xl font-bold">{need?.title}</h1>
              <p className="text-muted-foreground mt-2 leading-relaxed">{need?.description}</p>
            </div>
            <StatusBadge status={assignment.status} />
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-secondary/20 border-b">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Urgency</span>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold">{need?.urgency} / 5</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">People Affected</span>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-400" />
              <span className="font-semibold">{need?.peopleAffected?.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Location</span>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-green-400" />
              <span className="font-semibold text-xs">{need?.location?.lat?.toFixed(3)}, {need?.location?.lng?.toFixed(3)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Assigned</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-purple-400" />
              <span className="font-semibold text-xs">{new Date(assignment.assignedAt || assignment.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Assignment info */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Assigned Volunteer</p>
              <p className="font-semibold">{volunteer?.name}</p>
              <p className="text-xs text-muted-foreground">{volunteer?.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Match Score</p>
              <p className="font-bold text-primary text-xl">{assignment.matchScore?.toFixed(0) ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* Status Stepper */}
        <div className="p-6 border-b">
          <p className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-xs">Progress</p>
          <StatusStepper status={assignment.status} />
        </div>

        {/* Admin feedback banner */}
        {assignment.adminFeedback && (
          <div className="px-6 py-4 bg-destructive/10 border-b border-destructive/20">
            <p className="text-sm font-semibold text-destructive mb-1">Rejection Feedback</p>
            <p className="text-sm text-muted-foreground">{assignment.adminFeedback}</p>
          </div>
        )}

        {/* ─── VOLUNTEER: Submit Task ─── */}
        {!isAdmin && assignment.status === "active" && (
          <div className="p-6 space-y-4">
            <h2 className="font-semibold text-base">Submit Your Work</h2>
            <Textarea
              placeholder="Describe what you did and how you helped..."
              value={submitText}
              onChange={e => setSubmitText(e.target.value)}
              rows={4}
              className="resize-none"
            />
            {/* Image upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Proof Images (up to 3)</label>
              <div className="flex flex-wrap gap-3">
                {images.map((url, i) => (
                  <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden border group">
                    <img src={url} alt={`proof-${i}`} className="h-full w-full object-cover" />
                    <button
                      onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                ))}
                {images.length < 3 && (
                  <label className="h-20 w-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                )}
              </div>
              {uploading && <p className="text-xs text-muted-foreground animate-pulse">Uploading…</p>}
            </div>
            <Button
              onClick={() => doSubmit()}
              disabled={submitting || !submitText.trim()}
              className="w-full gap-2"
            >
              <FileText className="h-4 w-4" />
              {submitting ? "Submitting…" : "Submit for Review"}
            </Button>
          </div>
        )}

        {/* ─── VOLUNTEER: Submitted state ─── */}
        {!isAdmin && assignment.status === "submitted" && (
          <div className="p-6">
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Pending Admin Review</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your submission is being reviewed. You'll be notified once it's approved.</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── ADMIN: Review Submission ─── */}
        {isAdmin && assignment.status === "submitted" && assignment.submission && (
          <div className="p-6 space-y-4">
            <h2 className="font-semibold text-base">Volunteer Submission</h2>
            <div className="rounded-xl bg-secondary/50 p-4">
              <p className="text-sm leading-relaxed">{assignment.submission.text}</p>
              <p className="text-xs text-muted-foreground mt-3">
                Submitted {new Date(assignment.submission.submittedAt).toLocaleString()}
              </p>
            </div>
            {assignment.submission.images?.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {assignment.submission.images.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`proof-${i}`} className="h-24 w-24 object-cover rounded-xl border hover:opacity-80 transition-opacity" />
                  </a>
                ))}
              </div>
            )}
            {!showRejectForm ? (
              <div className="flex gap-3">
                <Button onClick={() => doApprove()} disabled={approving} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {approving ? "Approving…" : "Approve & Complete"}
                </Button>
                <Button variant="destructive" onClick={() => setShowRejectForm(true)} className="flex-1 gap-2">
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-destructive/30 p-4 bg-destructive/5">
                <p className="text-sm font-semibold text-destructive">Provide rejection feedback</p>
                <Textarea
                  placeholder="Explain why the submission was rejected..."
                  value={rejectFeedback}
                  onChange={e => setRejectFeedback(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowRejectForm(false)} size="sm">Cancel</Button>
                  <Button variant="destructive" onClick={() => doReject()} disabled={rejecting || !rejectFeedback.trim()} size="sm" className="gap-1.5">
                    <XCircle className="h-3.5 w-3.5" />
                    {rejecting ? "Rejecting…" : "Send Rejection"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Completed state */}
        {assignment.status === "completed" && (
          <div className="p-6">
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-green-400">Task Completed</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Completed on {new Date(assignment.completedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
