import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, User as UserIcon, Mail, ShieldAlert } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useQuery({ queryKey: ["user"], queryFn: getMe, retry: false });

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-[400px] w-full rounded-2xl" /></div>;
  if (!user) {
    handleLogout();
    return null;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account details and preferences.</p>
      </div>

      <div className="rounded-2xl bg-card border shadow-card overflow-hidden p-8">
        <div className="flex items-center gap-6 border-b pb-8">
          <div className="h-24 w-24 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground text-3xl font-bold">
            {user.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <div className="text-muted-foreground mt-1 flex items-center gap-2">
              <Mail className="h-4 w-4" /> {user.email}
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-xs font-semibold uppercase tracking-wider">
              <ShieldAlert className="h-3.5 w-3.5" /> {user.role.replace('_', ' ')}
            </div>
          </div>
        </div>

        <div className="pt-8 space-y-4">
          <h3 className="font-semibold text-lg">Account Actions</h3>
          <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
