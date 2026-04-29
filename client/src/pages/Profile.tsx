import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMe, updateAvailability, updateProfile } from "@/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import {
  LogOut, Mail, ShieldAlert, Phone, MapPin, Star,
  CheckCircle2, Edit3, Save, X, Sparkles, ToggleLeft, ToggleRight,
} from "lucide-react";

const SKILL_COLORS: Record<string, string> = {
  food:        "bg-orange-500/15 text-orange-300 border-orange-500/30",
  medical:     "bg-red-500/15 text-red-300 border-red-500/30",
  education:   "bg-blue-500/15 text-blue-300 border-blue-500/30",
  disaster:    "bg-purple-500/15 text-purple-300 border-purple-500/30",
  logistics:   "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  shelter:     "bg-green-500/15 text-green-300 border-green-500/30",
  counselling: "bg-pink-500/15 text-pink-300 border-pink-500/30",
};

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({ queryKey: ["user"], queryFn: getMe, retry: false });

  const [editMode, setEditMode] = useState(false);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [form, setForm] = useState({ contactNumber: "", address: "", city: "" });

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const { mutate: saveBasic, isPending: saving } = useMutation({
    mutationFn: () => updateProfile(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Profile updated!");
      setEditMode(false);
    },
    onError: (e: any) => toast.error(e.message || "Update failed"),
  });

  const { mutate: toggleAvailability } = useMutation({
    mutationFn: (val: boolean) => updateAvailability(val),
    onMutate: async (newVal) => {
      await queryClient.cancelQueries({ queryKey: ["user"] });
      const previousUser = queryClient.getQueryData(["user"]);
      queryClient.setQueryData(["user"], (old: any) => ({
        ...old,
        profile: { ...old.profile, availability: newVal }
      }));
      return { previousUser };
    },
    onError: (err: any, newVal, context: any) => {
      queryClient.setQueryData(["user"], context.previousUser);
      toast.error(err.message || "Failed to update availability");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  if (isLoading) return <div className="p-8"><Skeleton className="h-[400px] w-full rounded-2xl" /></div>;
  if (!user) { handleLogout(); return null; }

  const profile = user.profile || {};
  const isVolunteer = user.role === "volunteer";
  const skills: { name: string; description?: string }[] = profile.skills || [];
  const profileComplete = profile.profileComplete;

  const startEdit = () => {
    setForm({
      contactNumber: profile.contactNumber || "",
      address: profile.address || "",
      city: profile.city || "",
    });
    setEditMode(true);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account details and preferences.</p>
      </div>

      {/* Soft prompt banner for volunteers who haven't completed profile */}
      {isVolunteer && !profileComplete && (
        <div className="rounded-xl bg-primary/10 border border-primary/30 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Complete your profile to get better matches!</p>
              <p className="text-xs text-muted-foreground mt-0.5">Add your skills so coordinators can match you to the right needs.</p>
            </div>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link to="/profile/complete">Add Skills</Link>
          </Button>
        </div>
      )}

      {/* Basic Info */}
      <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground text-2xl font-bold flex-shrink-0">
              {user.name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <div className="text-muted-foreground text-sm mt-0.5 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary text-xs font-semibold uppercase tracking-wider">
                <ShieldAlert className="h-3 w-3" /> {user.role.replace("_", " ")}
              </div>
            </div>
          </div>
          {!editMode ? (
            <Button variant="outline" size="sm" onClick={startEdit} className="gap-1.5">
              <Edit3 className="h-3.5 w-3.5" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditMode(false)} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button size="sm" onClick={() => saveBasic()} disabled={saving} className="gap-1.5">
                <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          {!editMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profile.contactNumber || <span className="text-muted-foreground italic">No phone added</span>}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{profile.city || <span className="text-muted-foreground italic">No city added</span>}</span>
              </div>
              <div className="flex items-center gap-2 text-sm col-span-1 sm:col-span-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{profile.address || <span className="italic">No address added</span>}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Contact Number</label>
                <Input placeholder="+91 98765 43210" value={form.contactNumber}
                  onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">City</label>
                <Input placeholder="Mumbai" value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <Input placeholder="123 Main St, Mumbai 400001" value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Skills Card — volunteers only */}
      {isVolunteer && (
        <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Skills & Expertise</h3>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/profile/complete"><Edit3 className="h-3.5 w-3.5" /> {skills.length ? "Update Skills" : "Add Skills"}</Link>
            </Button>
          </div>
          <div className="p-6">
            {skills.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No skills added yet.</p>
            ) : (
              <div className="space-y-2">
                {skills.map(skill => {
                  const colorClass = SKILL_COLORS[skill.name] || "bg-secondary text-foreground border-border";
                  const isExpanded = expandedSkill === skill.name;
                  return (
                    <div key={skill.name} className={`rounded-xl border p-3 transition-all ${colorClass}`}>
                      <button
                        className="w-full flex items-center justify-between"
                        onClick={() => setExpandedSkill(isExpanded ? null : skill.name)}
                      >
                        <span className="font-semibold text-sm capitalize">{skill.name}</span>
                        {skill.description && (
                          <span className="text-xs opacity-60">{isExpanded ? "▲ hide" : "▼ show"}</span>
                        )}
                      </button>
                      {isExpanded && skill.description && (
                        <p className="text-xs mt-2 leading-relaxed opacity-80">{skill.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Volunteer Stats */}
      {isVolunteer && (
        <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
          <div className="p-6 border-b flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <h3 className="font-semibold">Volunteer Stats</h3>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-secondary/40 p-4">
              <p className="text-3xl font-bold text-primary">{profile.completedCount || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Tasks Completed</p>
            </div>
            <div className="rounded-xl bg-secondary/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Availability</p>
                <button onClick={() => toggleAvailability(!profile.availability)}>
                  {profile.availability
                    ? <ToggleRight className="h-6 w-6 text-green-400" />
                    : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                </button>
              </div>
              <p className={`text-sm font-semibold ${profile.availability ? "text-green-400" : "text-muted-foreground"}`}>
                {profile.availability ? "Available" : "Unavailable"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="rounded-2xl bg-card border shadow-card p-6">
        <h3 className="font-semibold text-base mb-4">Account Actions</h3>
        <Button variant="destructive" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>
    </div>
  );
}
