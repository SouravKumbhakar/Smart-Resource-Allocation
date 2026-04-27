import { lazy, Suspense, useState } from "react";
import { AlertCircle, Flame, UserCheck, CheckSquare, Users } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { NeedCard } from "@/components/NeedCard";
import { CategoryBadge, PriorityBadge, StatusBadge } from "@/components/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getNeeds, getVolunteers, getAssignments, getMe, getUsers } from "@/api";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, CartesianGrid } from "recharts";
import { CreateNeedModal } from "@/components/CreateNeedModal";

const MapView = lazy(() => import("@/components/MapView"));

export default function Dashboard() {
  const { data: user } = useQuery({ queryKey: ["user"], queryFn: getMe, retry: false });
  const isAdmin = user?.role === "admin" || user?.role === "ngo_admin";

  const { data: needs = [], isLoading: loadingNeeds } = useQuery({ queryKey: ["needs"], queryFn: getNeeds, refetchInterval: 30000 });
  const { data: volunteers = [], isLoading: loadingVols } = useQuery({ queryKey: ["volunteers"], queryFn: getVolunteers });
  const { data: assignments = [], isLoading: loadingAssns } = useQuery({ queryKey: ["assignments"], queryFn: getAssignments });
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({ 
    queryKey: ["users"], queryFn: getUsers, enabled: isAdmin 
  });

  const [mapClickLatLng, setMapClickLatLng] = useState<{lat: number, lng: number} | null>(null);

  if (loadingNeeds || loadingVols || loadingAssns || (isAdmin && loadingUsers)) return <div className="p-8"><Skeleton className="h-[400px] w-full rounded-2xl" /></div>;

  const activeNeeds = needs.filter((n: any) => n.status !== "completed");
  const highPriority = needs.filter((n: any) => n.urgency >= 4 && n.status !== "completed");
  const availableVols = volunteers.filter((v: any) => v.availability);
  const recent = [...needs].filter((n: any) => n.status === "open").sort((a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5);

  const chartData = ["food", "medical", "education", "disaster", "logistics"].map((c) => ({
    category: c[0].toUpperCase() + c.slice(1),
    count: needs.filter((n: any) => n.category === c).length,
  })).filter(d => d.count > 0);

  const handleMapClick = (lat: number, lng: number) => {
    if (isAdmin) setMapClickLatLng({ lat, lng });
  };

  return (
    <div className="space-y-6">
      {mapClickLatLng && (
        <CreateNeedModal 
          open={!!mapClickLatLng} 
          onOpenChange={(v) => !v && setMapClickLatLng(null)} 
          lat={mapClickLatLng.lat} 
          lng={mapClickLatLng.lng} 
        />
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Operations Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Live overview of needs, volunteers, and active assignments.</p>
      </div>

      {isAdmin && (
        <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 shadow-sm p-5 mb-6">
          <div className="flex items-center gap-2 mb-4 text-indigo-700 dark:text-indigo-400 font-semibold">
            <Users className="h-5 w-5" /> Admin Overview
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">Total Users</div>
              <div className="font-bold text-xl">{allUsers.length}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">NGO Admins</div>
              <div className="font-bold text-xl">{allUsers.filter((u: any) => u.role === 'ngo_admin').length}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Total Volunteers</div>
              <div className="font-bold text-xl">{volunteers.length}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Assignments Taken</div>
              <div className="font-bold text-xl">{assignments.length}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Completion Rate</div>
              <div className="font-bold text-xl">
                {assignments.length ? Math.round((assignments.filter((a: any) => a.status === 'completed').length / assignments.length) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Active Needs" value={activeNeeds.length} icon={AlertCircle} tone="primary" trend={{ delta: "+3 today", up: true }} />
        <KPICard label="High Priority" value={highPriority.length} icon={Flame} tone="danger" trend={{ delta: "+1 today", up: true }} />
        <KPICard label="Available Volunteers" value={availableVols.length} icon={UserCheck} tone="success" trend={{ delta: "+2 today", up: true }} />
        <KPICard label="Assignments Today" value={assignments.filter((a: any) => a.status === "active").length} icon={CheckSquare} tone="indigo" trend={{ delta: "−1", up: false }} />
      </div>

      {/* Map + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <Suspense fallback={<Skeleton className="h-[460px] w-full rounded-2xl" />}>
            <MapView needs={activeNeeds} onMapClick={handleMapClick} />
            {isAdmin && <div className="text-xs text-muted-foreground mt-1 text-center">Tip: Click anywhere on the map to create a custom Need at that location.</div>}
          </Suspense>
        </div>
        <div className="lg:col-span-2 rounded-2xl bg-card border shadow-card flex flex-col">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Recent Needs</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/needs">View all</Link>
            </Button>
          </div>
          <div className="flex-1 divide-y overflow-auto max-h-[395px]">
            {recent.length === 0 && <div className="p-8 text-center text-muted-foreground">No open needs found.</div>}
            {recent.map((n: any) => (
              <Link key={n._id} to={`/needs/${n._id}`} className="block p-4 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <CategoryBadge category={n.category} />
                  <PriorityBadge urgency={n.urgency} />
                </div>
                <div className="font-medium text-sm">{n.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{n.location.lat.toFixed(3)}, {n.location.lng.toFixed(3)} • {n.peopleAffected} people</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Chart + Top Need cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card border shadow-card p-5">
          <h2 className="font-semibold mb-4">Needs by Category</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--indigo))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...activeNeeds].sort((a: any, b: any) => b.priorityScore - a.priorityScore).slice(0, 2).map((n: any) => (
            <NeedCard key={n._id} need={n} />
          ))}
        </div>
      </div>

      {/* Needs Table */}
      <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">All Needs</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/needs">Manage needs</Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Title</th>
                <th className="text-left px-3 py-3 font-medium">Category</th>
                <th className="text-left px-3 py-3 font-medium">Urgency</th>
                <th className="text-left px-3 py-3 font-medium">People</th>
                <th className="text-left px-3 py-3 font-medium">Status</th>
                <th className="text-left px-3 py-3 font-medium">Priority</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {needs.map((n: any) => (
                <tr key={n._id} className="hover:bg-secondary/30">
                  <td className="px-5 py-3 font-medium">{n.title}</td>
                  <td className="px-3 py-3"><CategoryBadge category={n.category} /></td>
                  <td className="px-3 py-3"><PriorityBadge urgency={n.urgency} /></td>
                  <td className="px-3 py-3">{n.peopleAffected}</td>
                  <td className="px-3 py-3"><StatusBadge status={n.status} /></td>
                  <td className="px-3 py-3 font-semibold">{n.priorityScore.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/needs/${n._id}`}>Assign →</Link>
                    </Button>
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
