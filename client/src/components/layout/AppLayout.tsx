import { useState, useCallback, useRef } from "react";
import { LayoutDashboard, ClipboardList, Users, Link2, Search, Shield, LogOut, User as UserIcon, Menu, ShieldCheck } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api";
import NotificationBell from "@/components/NotificationBell";

const nav = [
  { to: "/",           label: "Dashboard",  icon: LayoutDashboard, end: true },
  { to: "/needs",      label: "Needs",       icon: ClipboardList },
  { to: "/volunteers", label: "Volunteers",  icon: Users },
  { to: "/assignments",label: "Assignments", icon: Link2 },
];

function SidebarContent({ user, onLogout, onNavClick }: { user: any; onLogout: () => void; onNavClick?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2 px-5 h-16 border-b shrink-0">
        <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <div className="font-bold text-[15px] leading-none">ReliefOps</div>
          <div className="text-[11px] text-muted-foreground mt-1">Resource Intelligence</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gradient-primary text-primary-foreground shadow-elevated"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {item.label}
          </NavLink>
        ))}
        {user?.role === 'super_admin' && (
          <NavLink
            to="/admin"
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-orange-500 text-white shadow-elevated"
                  : "text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              }`
            }
          >
            <ShieldCheck className="h-[18px] w-[18px] shrink-0" />
            Admin Panel
          </NavLink>
        )}
      </nav>

      <div className="p-3 border-t shrink-0">
        <NavLink
          to="/profile"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <UserIcon className="h-[18px] w-[18px]" /> Profile
        </NavLink>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground mb-2"
        >
          <LogOut className="h-[18px] w-[18px]" /> Logout
        </button>

        {user && (
          <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-lg bg-secondary">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                {user.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{user.role?.replace('_', ' ')}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: user } = useQuery({ queryKey: ["user"], queryFn: getMe, retry: false });

  const handleGlobalSearch = useCallback((value: string) => {
    setGlobalSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      if (value.trim()) navigate(`/needs?q=${encodeURIComponent(value.trim())}`);
    }, 400);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r bg-card">
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-[240px] bg-card border-r flex flex-col shadow-elevated animate-fade-in">
            <SidebarContent
              user={user}
              onLogout={handleLogout}
              onNavClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40 flex items-center gap-4 px-4 md:px-6">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={globalSearch}
              onChange={e => handleGlobalSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && globalSearch.trim()) navigate(`/needs?q=${encodeURIComponent(globalSearch.trim())}`); }}
              placeholder="Search needs, volunteers, locations…"
              className="pl-9 bg-secondary/60 border-0"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <Badge className="bg-success/10 text-success hover:bg-success/15 border-0 hidden sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success mr-1.5 animate-pulse" /> Live
            </Badge>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
