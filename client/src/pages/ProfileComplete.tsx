import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMe, updateMyProfile } from "@/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

const SKILL_OPTIONS = [
  { name: "food",        label: "Food & Nutrition",  icon: "🍽️", color: "bg-orange-500/15 border-orange-500/40 text-orange-300" },
  { name: "medical",     label: "Medical Aid",        icon: "🏥", color: "bg-red-500/15 border-red-500/40 text-red-300" },
  { name: "education",   label: "Education",          icon: "📚", color: "bg-blue-500/15 border-blue-500/40 text-blue-300" },
  { name: "logistics",   label: "Logistics",          icon: "🚛", color: "bg-yellow-500/15 border-yellow-500/40 text-yellow-300" },
  { name: "disaster",    label: "Disaster Relief",    icon: "🆘", color: "bg-purple-500/15 border-purple-500/40 text-purple-300" },
  { name: "shelter",     label: "Shelter & Housing",  icon: "🏠", color: "bg-green-500/15 border-green-500/40 text-green-300" },
  { name: "counselling", label: "Counselling",        icon: "🤝", color: "bg-pink-500/15 border-pink-500/40 text-pink-300" },
];

export default function ProfileComplete() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useQuery({ queryKey: ["user"], queryFn: getMe, retry: false });
  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});

  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: () => {
      const skills = selectedSkills.map(name => ({
        name,
        description: descriptions[name] || "",
      }));
      return updateMyProfile(user.id, { skills, profileComplete: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Profile completed! Welcome to ReliefOps 🎉");
      navigate("/");
    },
    onError: (err: any) => toast.error(err.message || "Failed to save profile"),
  });

  const toggleSkill = (name: string) => {
    setSelectedSkills(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/20 mb-4">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-2">
            Tell us about your skills so we can match you with the right needs.
          </p>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mt-6">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>{s}</div>
                {s < 2 && <div className={`h-0.5 w-12 transition-all ${step > 1 ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-16 mt-2 text-xs text-muted-foreground">
            <span className={step === 1 ? "text-primary font-semibold" : ""}>Select Skills</span>
            <span className={step === 2 ? "text-primary font-semibold" : ""}>Describe Skills</span>
          </div>
        </div>

        <div className="rounded-2xl bg-card border shadow-lg p-6">
          {/* Step 1 — Select skills */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">What can you help with?</h2>
                <p className="text-sm text-muted-foreground mt-1">Select all that apply — you'll describe each one next.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SKILL_OPTIONS.map(skill => {
                  const selected = selectedSkills.includes(skill.name);
                  return (
                    <button
                      key={skill.name}
                      onClick={() => toggleSkill(skill.name)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02] ${
                        selected
                          ? `${skill.color} border-current shadow-md`
                          : "bg-secondary/40 border-border hover:border-primary/40"
                      }`}
                    >
                      {selected && (
                        <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-current" />
                      )}
                      <div className="text-2xl mb-2">{skill.icon}</div>
                      <div className="text-sm font-semibold">{skill.label}</div>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-muted-foreground">
                  {selectedSkills.length} skill{selectedSkills.length !== 1 ? "s" : ""} selected
                </span>
                <Button
                  onClick={() => setStep(2)}
                  disabled={selectedSkills.length === 0}
                  className="gap-2"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 — Describe each skill */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Describe your experience</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  For each skill, briefly explain how you can help (max ~100 words).
                </p>
              </div>
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                {selectedSkills.map(skillName => {
                  const skill = SKILL_OPTIONS.find(s => s.name === skillName)!;
                  const text = descriptions[skillName] || "";
                  const wc = wordCount(text);
                  return (
                    <div key={skillName} className={`rounded-xl border p-4 ${skill.color}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{skill.icon}</span>
                        <span className="font-semibold">{skill.label}</span>
                      </div>
                      <Textarea
                        placeholder={`How can you help with ${skill.label}?`}
                        value={text}
                        onChange={e => setDescriptions(prev => ({ ...prev, [skillName]: e.target.value }))}
                        rows={3}
                        className="bg-background/60 border-border resize-none"
                      />
                      <div className={`text-xs mt-1.5 text-right ${wc > 100 ? "text-destructive" : "text-muted-foreground"}`}>
                        {wc} / 100 words
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={() => saveProfile()}
                  disabled={isPending || selectedSkills.some(s => wordCount(descriptions[s] || "") > 100)}
                  className="flex-1 gap-2"
                >
                  {isPending ? "Saving…" : "Save Profile & Continue"}
                  {!isPending && <CheckCircle2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          You can update your skills anytime from your profile page.
          <button onClick={() => navigate("/")} className="text-primary ml-1 underline underline-offset-2">
            Skip for now
          </button>
        </p>
      </div>
    </div>
  );
}
