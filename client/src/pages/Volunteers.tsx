import { useMemo, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CategoryBadge } from "@/components/PriorityBadge";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVolunteers, updateVolunteer } from "@/api";

export default function Volunteers() {
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState("all");
  const [avail, setAvail] = useState("all");

  const queryClient = useQueryClient();
  const { data: list = [], isLoading } = useQuery({ queryKey: ["volunteers"], queryFn: getVolunteers });

  const { mutate: toggle } = useMutation({
    mutationFn: (volunteer: any) => updateVolunteer(volunteer._id, { availability: !volunteer.availability }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      toast.success("Availability updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update availability")
  });

  const filtered = useMemo(() =>
    list.filter((v: any) =>
      (skill === "all" || v.skills.includes(skill)) &&
      (avail === "all" || (avail === "yes" ? v.availability : !v.availability)) &&
      (q === "" || (v.userId?.name || v.name || "").toLowerCase().includes(q.toLowerCase()))
    ), [list, q, skill, avail]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Volunteers</h1>
        <p className="text-sm text-muted-foreground mt-1">{filtered.length} volunteers in network.</p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl bg-card border shadow-card p-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name…" className="pl-9" />
        </div>
        <Select value={skill} onValueChange={setSkill}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All skills</SelectItem>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="medical">Medical</SelectItem>
            <SelectItem value="education">Education</SelectItem>
            <SelectItem value="disaster">Disaster</SelectItem>
          </SelectContent>
        </Select>
        <Select value={avail} onValueChange={setAvail}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All availability</SelectItem>
            <SelectItem value="yes">Available</SelectItem>
            <SelectItem value="no">Unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v: any) => {
          const name = v.userId?.name || v.name || 'Unknown';
          return (
          <div key={v._id} className="rounded-2xl bg-card border shadow-card p-5 hover:shadow-elevated transition-shadow">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                  {name.split(" ").map((s: string) => s[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold flex items-center gap-2">
                  {name}
                  <span className={`h-2 w-2 rounded-full ${v.availability ? "bg-success animate-pulse" : "bg-muted-foreground/50"}`} />
                </div>
                <div className="text-xs text-muted-foreground">{v.availability ? "Available" : "Unavailable"}</div>
              </div>
              <Switch checked={v.availability} onCheckedChange={() => toggle(v)} />
            </div>

            <div className="flex flex-wrap gap-1.5 mt-4">
              {v.skills.map((s) => <CategoryBadge key={s} category={s} />)}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Kolkata region</span>
              <span><span className="font-bold text-foreground">{v.completedCount ?? 0}</span> completed</span>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
