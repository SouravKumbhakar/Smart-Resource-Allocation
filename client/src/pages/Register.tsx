import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { register as registerApi, getNeeds } from "@/api";

export default function Register() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    role: "volunteer",
    inviteCode: "",
    contactNumber: "",
    address: "",
    city: "",
    profile: {
      organizationName: "",
      organizationLocation: "",
      contactNumber: ""
    }
  });
  const [nudge, setNudge] = useState<{ count: number; needIds: string[] } | null>(null);

  const { mutate: handleRegister, isPending } = useMutation({
    mutationFn: () => registerApi(formData),
    onSuccess: async (data: any) => {
      localStorage.setItem("token", data.token);
      toast.success("Account created! Welcome to ReliefOps.");

      // Volunteer Onboarding Nudge — show how many open needs exist
      if (formData.role === "volunteer") {
        try {
          const needs = await getNeeds();
          const openNeeds = needs.filter((n: any) => n.status === "open");
          if (openNeeds.length > 0) {
            setNudge({ count: openNeeds.length, needIds: openNeeds.slice(0, 3).map((n: any) => n._id) });
            return; // Don't navigate yet — show nudge first
          }
        } catch {
          // If needs fetch fails, just navigate normally
        }
      }
      navigate("/dashboard");
    },
    onError: (err: any) => {
      toast.error(err.message || "Registration failed");
    }
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRegister();
  };

  // Nudge screen shown to volunteers after registration
  if (nudge) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-primary p-4">
        <div className="w-full max-w-md rounded-3xl glass shadow-elevated p-8 text-center space-y-5">
          <div className="h-16 w-16 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground mx-auto">
            <Target className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold">You're all set! 🎯</h2>
            <p className="text-muted-foreground mt-2">
              <span className="font-bold text-foreground">{nudge.count} high-priority needs</span> in your network
              are waiting for volunteers like you. Ready to make an impact?
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90"
              onClick={() => navigate("/needs")}
            >
              View Needs
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-primary p-4">
      <div className="w-full max-w-md rounded-3xl glass shadow-elevated p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold">Join ReliefOps</div>
            <div className="text-xs text-muted-foreground">Coordinate relief, faster.</div>
          </div>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" required placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required placeholder="you@relief.org" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" required placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
          </div>
          {formData.role === 'volunteer' && (
            <div className="space-y-4 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Contact Details</p>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Contact Number</Label>
                <Input id="phone" placeholder="+91 98765 43210" value={formData.contactNumber} onChange={(e) => setFormData({...formData, contactNumber: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Mumbai" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="123 Relief Road, Mumbai" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="volunteer">Volunteer</SelectItem>
                <SelectItem value="ngo_admin">NGO Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            {formData.role === 'ngo_admin' && (
              <p className="text-[11px] text-muted-foreground">Your account will require Super Admin approval.</p>
            )}
          </div>

          {formData.role === 'ngo_admin' && (
            <div className="space-y-4 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input id="orgName" required placeholder="Relief Org" value={formData.profile.organizationName} onChange={(e) => setFormData({...formData, profile: {...formData.profile, organizationName: e.target.value}})} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="orgLoc">Location (City, Country)</Label>
                <Input id="orgLoc" required placeholder="New York, USA" value={formData.profile.organizationLocation} onChange={(e) => setFormData({...formData, profile: {...formData.profile, organizationLocation: e.target.value}})} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="orgPhone">Contact Number</Label>
                <Input id="orgPhone" required placeholder="+1 234 567 890" value={formData.profile.contactNumber} onChange={(e) => setFormData({...formData, profile: {...formData.profile, contactNumber: e.target.value}})} />
              </div>
            </div>
          )}

          {formData.role === 'super_admin' && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              <Label htmlFor="inviteCode">Admin Invite Code</Label>
              <Input id="inviteCode" type="password" required placeholder="Secret Key" value={formData.inviteCode} onChange={(e) => setFormData({...formData, inviteCode: e.target.value})} />
            </div>
          )}
          <Button type="submit" disabled={isPending} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
            {isPending ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <div className="text-center text-sm text-muted-foreground mt-6">
          Already a member? <Link to="/login" className="text-primary font-semibold">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
