import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { login as loginApi } from "@/api";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const { mutate: handleLogin, isPending } = useMutation({
    mutationFn: () => loginApi(formData),
    onSuccess: (data: any) => {
      localStorage.setItem("token", data.token); // Save token
      toast.success("Welcome back!");
      navigate("/dashboard"); // Navigate to dashboard
    },
    onError: (err: any) => {
      toast.error(err.message || "Invalid credentials");
    }
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-primary p-4">
      <div className="w-full max-w-md rounded-3xl glass shadow-elevated p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold">ReliefOps</div>
            <div className="text-xs text-muted-foreground">Sign in to your command center</div>
          </div>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@relief.org" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" placeholder="••••••••" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
          </div>
          <Button type="submit" disabled={isPending} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <div className="text-center text-sm text-muted-foreground mt-6">
          New here? <Link to="/register" className="text-primary font-semibold">Create account</Link>
        </div>
      </div>
    </div>
  );
}
