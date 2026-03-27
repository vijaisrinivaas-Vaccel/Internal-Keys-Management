import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Activity, 
  FolderKanban, 
  ShieldCheck, 
  Users, 
  Key, 
  Clock,
  TrendingUp,
  ChevronRight,
  Database,
  Plus,
  AlertCircle,
} from "lucide-react";
import { authFetch, API_BASE_URL } from "../../lib/auth";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Pie, Bar} from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler
);

interface AuditStats {
  auth?: { count: number; lastEntry: string | null };
  user?: { count: number; lastEntry: string | null };
  permission?: { count: number; lastEntry: string | null };
  activity?: { count: number; lastEntry: string | null };
  admin?: { count: number; lastEntry: string | null };
  config?: { count: number; lastEntry: string | null };
}

interface DashboardSummary {
  projectsCount: number;
  projectsRecentCount: number;
  projectsAssignedCount: number;
  usersCount: number;
  activeUsersCount: number;
  environmentsCount: number;
  modulesCount: number;
  configKeysCount: number;
  keyStatus: {
    active: number;
    new: number;
    near_expiry: number;
    expired: number;
    revoked: number;
  };
  roleBreakdown: Record<string, number>;
}

export default function Dashboard() {
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [auditStats, setAuditStats] = useState<AuditStats>({});
  const [configStatus, setConfigStatus] = useState({ active: 0, expired: 0, nearExpiry: 0 });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setRole(user.role || "");

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [summaryRes, auditRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/dashboard/summary`),
          authFetch(`${API_BASE_URL}/audit-logs/stats`),
        ]);

        if (auditRes.ok) {
          const data = await auditRes.json();
          setAuditStats(data || {});
        } else {
          setAuditStats({});
        }

        if (summaryRes.ok) {
          const data = await summaryRes.json();
          setSummary(data);
          setConfigStatus({
            active: data?.keyStatus?.active || 0,
            expired: data?.keyStatus?.expired || 0,
            nearExpiry: data?.keyStatus?.near_expiry || 0,
          });
        } else {
          setSummary(null);
          setConfigStatus({ active: 0, expired: 0, nearExpiry: 0 });
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setSummary(null);
        setAuditStats({});
        setConfigStatus({ active: 0, expired: 0, nearExpiry: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const userCounts = useMemo(() => {
    const total = summary?.usersCount || 0;
    const active = summary?.activeUsersCount || 0;
    const inactive = Math.max(0, total - active);
    const byRole = summary?.roleBreakdown || {};
    return { total, active, inactive, byRole };
  }, [summary]);

  const projectStats = useMemo(() => {
    const total = summary?.projectsCount || 0;
    const recent = summary?.projectsRecentCount || 0;
    const withAssignments = summary?.projectsAssignedCount || 0;
    return { total, recent, withAssignments };
  }, [summary]);

  const environmentStats = useMemo(() => {
    const total = summary?.environmentsCount || 0;
    const modulesCount = summary?.modulesCount || 0;
    const configsCount = summary?.configKeysCount || 0;
    return { total, modulesCount, configsCount };
  }, [summary]);

  const roleSegments = useMemo(() => {
    const total = userCounts.total || 1;
    const base = [
      { label: "Superadmin", key: "superadmin", color: "#7c3aed", icon: Crown },
      { label: "Admin", key: "admin", color: "#2563eb", icon: ShieldCheck },
      { label: "User", key: "user", color: "#f97316", icon: Users },
    ];

    const used = new Set(base.map((b) => b.key));
    const extraRoles = Object.keys(userCounts.byRole || {})
      .filter((key) => !used.has(key))
      .map((key, idx) => ({
        key,
        label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        color: ["#16a34a", "#0ea5e9", "#14b8a6", "#a855f7", "#eab308"][idx % 5],
        icon: ShieldCheck,
      }));

    return [...base, ...extraRoles].map((seg) => ({
      ...seg,
      count: userCounts.byRole[seg.key] || 0,
      percent: Math.round(((userCounts.byRole[seg.key] || 0) / total) * 100),
    }));
  }, [userCounts]);

  const pieChartData = {
    labels: roleSegments.map(s => s.label),
    datasets: [{
      data: roleSegments.map(s => s.count),
      backgroundColor: roleSegments.map(s => s.color),
      borderWidth: 0,
      borderRadius: 8,
    }]
  };

  const barChartData = {
    labels: ['Projects', 'Environments', 'Modules', 'Configs'],
    datasets: [{
      label: 'Resources',
      data: [projectStats.total, environmentStats.total, environmentStats.modulesCount, environmentStats.configsCount],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
      borderRadius: 8,
    }]
  };

  const auditBarData = {
    labels: ['Auth', 'User', 'Permission', 'Activity', 'Admin', 'Config'],
    datasets: [{
      label: 'Activity Count',
      data: [
        auditStats.auth?.count || 0,
        auditStats.user?.count || 0,
        auditStats.permission?.count || 0,
        auditStats.activity?.count || 0,
        auditStats.admin?.count || 0,
        auditStats.config?.count || 0
      ],
      backgroundColor: ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec489a'],
      borderRadius: 8,
    }]
  };

  const configStatusData = {
    labels: ['Active', 'Expired', 'Near Expiry'],
    datasets: [{
      data: [configStatus.active, configStatus.expired, configStatus.nearExpiry],
      backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
      borderWidth: 0,
      borderRadius: 8,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { font: { size: 11 } }
      }
    }
  };

  const isUserOnly = role === "user";
  const isAdmin = role === "admin" || role === "superadmin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="space-y-6 p-6">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg overflow-hidden">
          <div className="relative px-8 py-8">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
            </div>
            
            <div className="relative flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <Activity size={28} className="text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-white">Key Management Dashboard</h1>
                </div>
                <p className="text-blue-100 mt-1">
                  Overview of your key management system, projects, and security metrics
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <span className="text-white text-sm font-medium">
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-gray-500 tracking-wider">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {loading ? "-" : projectStats.total}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp size={12} className="text-green-500" />
                  <span className="text-xs text-gray-500">{projectStats.recent} new this week</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                <FolderKanban size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-gray-500 tracking-wider">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {loading ? "-" : userCounts.total}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Users size={12} className="text-green-500" />
                  <span className="text-xs text-gray-500">{userCounts.active} active</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-gray-500 tracking-wider">Configurations</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {loading ? "-" : environmentStats.configsCount}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Key size={12} className="text-green-500" />
                  <span className="text-xs text-gray-500">{configStatus.active} active keys</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform">
                <Key size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-gray-500 tracking-wider">Environments</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {loading ? "-" : environmentStats.total}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Database size={12} className="text-blue-500" />
                  <span className="text-xs text-gray-500">{environmentStats.modulesCount} modules</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-cyan-100 text-cyan-600 group-hover:scale-110 transition-transform">
                <Database size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Role Distribution Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">User Role Distribution</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                {userCounts.total} total
              </span>
            </div>
            <div className="h-64">
              <Pie data={pieChartData} options={options} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {roleSegments.slice(0, 3).map((seg) => (
                <div key={seg.key} className="text-center">
                  <div className="text-lg font-bold text-gray-800">{seg.count}</div>
                  <div className="text-xs text-gray-500">{seg.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Resources Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Resource Distribution</h2>
              <span className="text-xs text-gray-400">Projects & Configs</span>
            </div>
            <div className="h-64">
              <Bar data={barChartData} options={options} />
            </div>
          </div>

          {/* Config Status Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Key Status</h2>
              <span className="text-xs text-gray-400">Health Overview</span>
            </div>
            <div className="h-64">
              <Pie data={configStatusData} options={options} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{configStatus.active}</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-amber-600">{configStatus.nearExpiry}</div>
                <div className="text-xs text-gray-500">Near Expiry</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{configStatus.expired}</div>
                <div className="text-xs text-gray-500">Expired</div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity & Audit Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Audit Activity Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Audit Activity Summary</h2>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={12} />
                <span>Recent activity</span>
              </div>
            </div>
            <div className="h-72">
              <Bar data={auditBarData} options={options} />
            </div>
            <div className="mt-4 grid grid-cols-6 gap-2">
              {[
                { label: "Auth", value: auditStats.auth?.count || 0, color: "text-cyan-600" },
                { label: "User", value: auditStats.user?.count || 0, color: "text-emerald-600" },
                { label: "Permission", value: auditStats.permission?.count || 0, color: "text-purple-600" },
                { label: "Activity", value: auditStats.activity?.count || 0, color: "text-amber-600" },
                { label: "Admin", value: auditStats.admin?.count || 0, color: "text-rose-600" },
                { label: "Config", value: auditStats.config?.count || 0, color: "text-pink-600" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className={`text-lg font-bold ${item.color}`}>{loading ? "-" : item.value}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & Security Tips */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link to="/projects/new-project" className="flex items-center justify-between p-3 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform">
                      <Plus size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Create New Project</p>
                      <p className="text-xs text-gray-500">Add a new project to the system</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/projects/manage-assignments" className="flex items-center justify-between p-3 bg-purple-50 rounded-xl cursor-pointer hover:bg-purple-100 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform">
                      <Key size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Add Configuration Key</p>
                      <p className="text-xs text-gray-500">Manage environment variables</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/user-management" className="flex items-center justify-between p-3 bg-green-50 rounded-xl cursor-pointer hover:bg-green-100 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:scale-110 transition-transform">
                      <Users size={16} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Manage Users</p>
                      <p className="text-xs text-gray-500">Assign roles and permissions</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Security Tips */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Security Tips</h2>
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Key Rotation Reminder</p>
                      <p className="text-xs text-amber-700 mt-1">
                        {configStatus.nearExpiry > 0 
                          ? `${configStatus.nearExpiry} key${configStatus.nearExpiry !== 1 ? 's are' : ' is'} approaching expiry. Consider rotating them soon.`
                          : "All keys are healthy. Remember to rotate keys every 90 days for security."}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <ShieldCheck size={18} className="text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Access Monitoring</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Regularly review audit logs for unusual access patterns.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Notes */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Admin Overview</h3>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  System health: All systems operational. {configStatus.nearExpiry} key{configStatus.nearExpiry !== 1 ? 's are' : ' is'} approaching expiry.
                </p>
              </div>
              <div className="text-xs bg-white/80 px-3 py-1.5 rounded-full text-blue-700 font-medium">
                {role === "superadmin" ? "Superadmin Access" : "Admin Access"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Crown icon component
function Crown({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 4 L3 10 L5 7 L8 14 L12 12 L16 14 L19 7 L21 10 L22 4 L12 8 L2 4Z" />
      <path d="M5 17 L19 17 L17 21 L7 21 L5 17Z" />
    </svg>
  );
}
