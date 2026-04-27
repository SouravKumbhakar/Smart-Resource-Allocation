import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminStats, getAdminUsers, updateUserRole, deleteAdminUser, getAuditLogs, getNgoPerformance } from "@/api";
import { toast } from "sonner";
import {
  ShieldCheck, Users, ClipboardList, CheckCircle, AlertTriangle,
  Flame, TrendingUp, Trash2, RefreshCw, Activity, Building2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/PriorityBadge";

// ── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="rounded-2xl bg-card border shadow-card p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value ?? "—"}</div>
        <div className="text-sm font-medium">{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ── Role badge ────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-orange-100 text-orange-700",
  ngo_admin:   "bg-blue-100 text-blue-700",
  coordinator: "bg-purple-100 text-purple-700",
  volunteer:   "bg-green-100 text-green-700",
};

function RolePill({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[role] ?? "bg-secondary"}`}>
      {role.replace("_", " ")}
    </span>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────
const TABS = ["Overview", "User Management", "NGO Performance", "Audit Log"];

export default function SuperAdmin() {
  const [tab, setTab] = useState("Overview");
  const [auditPage, setAuditPage] = useState(1);
  const qc = useQueryClient();

  const { data: stats, isLoading: statsLoading }   = useQuery({ queryKey: ["admin-stats"],        queryFn: getAdminStats });
  const { data: users = [], isLoading: usersLoading } = useQuery({ queryKey: ["admin-users"],     queryFn: getAdminUsers,     enabled: tab === "User Management" });
  const { data: ngoPerf = [], isLoading: ngoLoading } = useQuery({ queryKey: ["ngo-performance"], queryFn: getNgoPerformance,  enabled: tab === "NGO Performance" });
  const { data: auditData, isLoading: auditLoading }  = useQuery({ queryKey: ["audit-logs", auditPage], queryFn: () => getAuditLogs(auditPage), enabled: tab === "Audit Log" });

  const { mutate: changeRole } = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => updateUserRole(id, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Role updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const { mutate: removeUser } = useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("User deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const o = stats?.overview;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-orange-100">
          <ShieldCheck className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">System-wide control · Super Admin only</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 rounded-xl bg-secondary p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ─────────────────────────────────────────────────── */}
      {tab === "Overview" && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-24 rounded-2xl bg-secondary animate-pulse" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard icon={Users}        label="Total Users"         value={o?.totalUsers}           color="bg-blue-100 text-blue-600" />
                <KpiCard icon={ClipboardList} label="Total Needs"        value={o?.totalNeeds}           color="bg-violet-100 text-violet-600" />
                <KpiCard icon={Activity}     label="Active Needs"        value={o?.activeNeeds}          sub="status=open" color="bg-amber-100 text-amber-600" />
                <KpiCard icon={Flame}        label="High Priority"       value={o?.highPriorityNeeds}    sub="urgency ≥ 4 · open" color="bg-red-100 text-red-600" />
                <KpiCard icon={Users}        label="Total Volunteers"    value={o?.totalVolunteers}      color="bg-green-100 text-green-600" />
                <KpiCard icon={CheckCircle}  label="Available Now"       value={o?.availableVolunteers}  color="bg-emerald-100 text-emerald-600" />
                <KpiCard icon={CheckCircle}  label="Assignments Done"    value={o?.completedAssignments} sub={`${o?.completionRate}% completion rate`} color="bg-teal-100 text-teal-600" />
                <KpiCard icon={Building2}    label="NGO Admins"          value={o?.ngoAdmins}            color="bg-orange-100 text-orange-600" />
              </div>

              {/* Needs by Category */}
              <div className="rounded-2xl bg-card border shadow-card p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Needs by Category</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(stats?.needsByCategory ?? []).map((c: any) => (
                    <div key={c._id} className="rounded-xl bg-secondary p-3 text-center">
                      <div className="text-2xl font-bold">{c.count}</div>
                      <div className="text-xs text-muted-foreground capitalize mt-1">{c._id}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignment Trend */}
              <div className="rounded-2xl bg-card border shadow-card p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity className="h-4 w-4" /> Assignments (Last 7 Days)</h3>
                <div className="flex items-end gap-2 h-20">
                  {(stats?.assignmentTrend ?? []).map((d: any) => (
                    <div key={d._id} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary/20 rounded-sm"
                        style={{ height: `${Math.min(100, (d.count / 5) * 100)}%`, minHeight: 4 }}
                        title={`${d._id}: ${d.count} assignments`}
                      />
                      <span className="text-[9px] text-muted-foreground">{d._id?.slice(5)}</span>
                    </div>
                  ))}
                  {(stats?.assignmentTrend ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No recent assignments</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── User Management Tab ───────────────────────────────────────────── */}
      {tab === "User Management" && (
        <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">All Users</h3>
            <span className="text-sm text-muted-foreground">{users.length} accounts</span>
          </div>
          {usersLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading users…</div>
          ) : (
            <div className="divide-y">
              {users.map((u: any) => (
                <div key={u._id} className="flex items-center gap-4 px-4 py-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                    {u.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    {u.volunteerProfile && (
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {u.volunteerProfile.completedCount} completed · {u.volunteerProfile.availability ? "Available" : "Unavailable"}
                      </div>
                    )}
                  </div>
                  <RolePill role={u.role} />
                  <Select
                    value={u.role}
                    onValueChange={role => changeRole({ id: u._id, role })}
                  >
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                      <SelectItem value="ngo_admin">NGO Admin</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-danger hover:bg-danger/10"
                    onClick={() => {
                      if (confirm(`Delete ${u.name}? This cannot be undone.`)) removeUser(u._id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── NGO Performance Tab ───────────────────────────────────────────── */}
      {tab === "NGO Performance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ngoLoading ? (
            [1,2].map(i => <div key={i} className="h-36 rounded-2xl bg-secondary animate-pulse" />)
          ) : ngoPerf.length === 0 ? (
            <div className="col-span-2 rounded-2xl bg-card border p-12 text-center text-muted-foreground">
              No NGO admins found.
            </div>
          ) : ngoPerf.map((p: any) => (
            <div key={p.admin.id} className="rounded-2xl bg-card border shadow-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {p.admin.name?.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{p.admin.name}</div>
                  <div className="text-xs text-muted-foreground">{p.admin.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-secondary p-2">
                  <div className="text-xl font-bold">{p.metrics.totalNeeds}</div>
                  <div className="text-[10px] text-muted-foreground">Total Needs</div>
                </div>
                <div className="rounded-xl bg-secondary p-2">
                  <div className="text-xl font-bold text-success">{p.metrics.completionRate}%</div>
                  <div className="text-[10px] text-muted-foreground">Completion</div>
                </div>
                <div className="rounded-xl bg-secondary p-2">
                  <div className="text-xl font-bold">{p.metrics.totalPeopleImpacted.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">People Impacted</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Badge className="text-[10px]">{p.metrics.activeNeeds} active</Badge>
                <Badge variant="secondary" className="text-[10px]">{p.metrics.totalAssignments} assignments</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Audit Log Tab ─────────────────────────────────────────────────── */}
      {tab === "Audit Log" && (
        <div className="rounded-2xl bg-card border shadow-card overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Audit Trail</h3>
            <Button variant="ghost" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["audit-logs"] })}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
            </Button>
          </div>
          {auditLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading logs…</div>
          ) : (
            <>
              <div className="divide-y text-sm">
                {(auditData?.data ?? []).length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No audit logs yet. Actions will appear here.</div>
                ) : (auditData?.data ?? []).map((log: any) => (
                  <div key={log._id} className="flex items-start gap-3 px-4 py-3">
                    <div className="mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-secondary shrink-0">
                      {log.action}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{log.performedBy?.name ?? "Unknown"}</span>
                      <span className="text-muted-foreground text-xs"> · {log.performedBy?.role?.replace('_',' ')}</span>
                      {log.details && (
                        <pre className="text-[10px] text-muted-foreground mt-0.5 whitespace-pre-wrap font-mono">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              {/* Pagination */}
              {(auditData?.pagination?.pages ?? 0) > 1 && (
                <div className="flex items-center justify-between p-3 border-t text-sm">
                  <Button variant="ghost" size="sm" disabled={auditPage <= 1} onClick={() => setAuditPage(p => p - 1)}>Previous</Button>
                  <span className="text-muted-foreground">Page {auditData.pagination.page} of {auditData.pagination.pages}</span>
                  <Button variant="ghost" size="sm" disabled={auditPage >= (auditData?.pagination?.pages ?? 1)} onClick={() => setAuditPage(p => p + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
