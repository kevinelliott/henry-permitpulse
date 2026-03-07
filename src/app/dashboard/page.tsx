"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase, Permit, Profile, Employee, Certification, daysUntil, getStatusFromDays, formatCurrency } from "@/lib/supabase";
import NavBar from "@/components/NavBar";

function ComplianceScore({ permits }: { permits: Permit[] }) {
  const active = permits.filter((p) => !p.is_one_time);
  if (active.length === 0) return null;
  const compliant = active.filter((p) => daysUntil(p.expiry_date) >= 30).length;
  const score = Math.round((compliant / active.length) * 100);
  const color = score >= 90 ? "text-emerald-400" : score >= 70 ? "text-amber-400" : "text-red-400";
  const bgColor = score >= 90 ? "from-emerald-600 to-emerald-400" : score >= 70 ? "from-amber-600 to-amber-400" : "from-red-600 to-red-400";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white">Compliance Score</h3>
        <span className="text-xs text-slate-500">{compliant}/{active.length} compliant</span>
      </div>
      <div className="flex items-end gap-4">
        <span className={`text-6xl font-black ${color}`}>{score}%</span>
        <div className="flex-1 pb-2">
          <div className="bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${bgColor} transition-all duration-500`}
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="text-slate-400 text-xs mt-2">
            {score === 100 ? "🎉 Fully compliant!" : score >= 90 ? "✅ Looking good" : score >= 70 ? "⚠️ Attention needed" : "🚨 Action required"}
          </p>
        </div>
      </div>
    </div>
  );
}

function PermitCard({ permit }: { permit: Permit }) {
  const days = daysUntil(permit.expiry_date);
  const status = getStatusFromDays(days, permit.is_one_time);

  return (
    <div className={`border rounded-xl p-4 ${status.bg} border-slate-700/50`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span>{status.emoji}</span>
            <span className="font-semibold text-white text-sm truncate">{permit.name}</span>
          </div>
          {permit.category && (
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{permit.category}</span>
          )}
          {permit.issuing_agency && (
            <p className="text-xs text-slate-500 mt-1 truncate">{permit.issuing_agency}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          {permit.is_one_time ? (
            <span className="text-xs text-blue-400">One-Time</span>
          ) : permit.expiry_date ? (
            <>
              <div className={`text-sm font-bold ${status.color}`}>
                {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
              </div>
              <div className="text-xs text-slate-500">{new Date(permit.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </>
          ) : (
            <span className="text-xs text-slate-500">No date set</span>
          )}
        </div>
      </div>
      {permit.penalty_amount && !permit.is_one_time && days < 90 && (
        <div className="mt-2 text-xs text-red-400">
          ⚠️ Fine if expired: {formatCurrency(permit.penalty_amount)}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "overdue" | "warning" | "upcoming" | "current">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const loadData = useCallback(async () => {
    const supabase = getSupabase();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { router.push("/auth"); return; }

    const profileRes: any = await supabase.from("profiles").select("*").eq("id", user.user.id).single();
    const permitsRes: any = await supabase.from("permits").select("*").eq("user_id", user.user.id).order("expiry_date");
    const employeesRes: any = await supabase.from("employees").select("*").eq("user_id", user.user.id);
    const certsRes: any = await supabase.from("certifications").select("*").eq("user_id", user.user.id);

    if (profileRes.data) setProfile(profileRes.data);
    else if (!profileRes.error) router.push("/onboarding");

    setPermits(permitsRes.data || []);
    setEmployees(employeesRes.data || []);
    setCertifications(certsRes.data || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🛡️</div>
          <p className="text-slate-400">Loading your compliance dashboard...</p>
        </div>
      </div>
    );
  }

  // Check onboarding
  if (profile && !profile.onboarding_complete) {
    router.push("/onboarding");
    return null;
  }

  // Stats
  const activePermits = permits.filter((p) => !p.is_one_time);
  const overduePermits = activePermits.filter((p) => daysUntil(p.expiry_date) < 0);
  const warningPermits = activePermits.filter((p) => { const d = daysUntil(p.expiry_date); return d >= 0 && d < 30; });
  const upcomingPermits = activePermits.filter((p) => { const d = daysUntil(p.expiry_date); return d >= 30 && d < 90; });
  const currentPermits = activePermits.filter((p) => daysUntil(p.expiry_date) >= 90);
  const totalPenalty = overduePermits.reduce((sum, p) => sum + (p.penalty_amount || 0), 0) +
                       warningPermits.reduce((sum, p) => sum + (p.penalty_amount || 0) * 0.5, 0);

  // Filter permits
  let filteredPermits = permits;
  if (filter === "overdue") filteredPermits = overduePermits;
  else if (filter === "warning") filteredPermits = warningPermits;
  else if (filter === "upcoming") filteredPermits = upcomingPermits;
  else if (filter === "current") filteredPermits = currentPermits;

  const categories = [...new Set(permits.map((p) => p.category).filter(Boolean))] as string[];
  if (categoryFilter !== "all") {
    filteredPermits = filteredPermits.filter((p) => p.category === categoryFilter);
  }

  // Cert stats
  const expiredCerts = certifications.filter((c) => daysUntil(c.expiry_date) < 0).length;
  const pendingCerts = certifications.filter((c) => c.status === "pending").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavBar businessName={profile?.business_name || undefined} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">{profile?.business_name || "Your Dashboard"}</h1>
            <p className="text-slate-400 mt-1">
              {profile?.industry && profile?.state_code ? `${profile.industry.replace("_", " ")} · ${profile.state_code}` : "Compliance Dashboard"}
              {profile?.slug && (
                <Link href={`/verify/${profile.slug}`} className="ml-3 text-emerald-400 hover:text-emerald-300 text-sm">
                  View Badge →
                </Link>
              )}
            </p>
          </div>
          <Link
            href="/permits?new=1"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            + Add Permit
          </Link>
        </div>

        {/* Alert Banner */}
        {(overduePermits.length > 0 || warningPermits.length > 0) && (
          <div className={`rounded-xl p-4 mb-6 border ${overduePermits.length > 0 ? "bg-red-950/30 border-red-800" : "bg-orange-950/30 border-orange-800"}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{overduePermits.length > 0 ? "🚨" : "⚠️"}</span>
              <div>
                <p className="font-bold text-white">
                  {overduePermits.length > 0 ? `${overduePermits.length} permit(s) EXPIRED — Action Required` : `${warningPermits.length} permit(s) expiring within 30 days`}
                </p>
                <p className="text-sm text-slate-400">
                  At-risk penalty exposure: <span className="text-red-400 font-semibold">{formatCurrency(totalPenalty)}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button onClick={() => setFilter("overdue")} className={`rounded-xl p-5 text-left transition border ${filter === "overdue" ? "bg-red-900/30 border-red-600" : "bg-slate-900 border-slate-800 hover:border-slate-700"}`}>
            <p className="text-xs text-slate-500 uppercase mb-1">Overdue</p>
            <p className="text-3xl font-black text-red-400">{overduePermits.length}</p>
            <p className="text-xs text-slate-500 mt-1">🔴 Need renewal now</p>
          </button>
          <button onClick={() => setFilter("warning")} className={`rounded-xl p-5 text-left transition border ${filter === "warning" ? "bg-orange-900/30 border-orange-600" : "bg-slate-900 border-slate-800 hover:border-slate-700"}`}>
            <p className="text-xs text-slate-500 uppercase mb-1">&lt;30 Days</p>
            <p className="text-3xl font-black text-orange-400">{warningPermits.length}</p>
            <p className="text-xs text-slate-500 mt-1">🟠 Start renewal process</p>
          </button>
          <button onClick={() => setFilter("upcoming")} className={`rounded-xl p-5 text-left transition border ${filter === "upcoming" ? "bg-amber-900/30 border-amber-600" : "bg-slate-900 border-slate-800 hover:border-slate-700"}`}>
            <p className="text-xs text-slate-500 uppercase mb-1">30–90 Days</p>
            <p className="text-3xl font-black text-amber-400">{upcomingPermits.length}</p>
            <p className="text-xs text-slate-500 mt-1">🟡 Schedule renewal</p>
          </button>
          <button onClick={() => setFilter("current")} className={`rounded-xl p-5 text-left transition border ${filter === "current" ? "bg-emerald-900/30 border-emerald-600" : "bg-slate-900 border-slate-800 hover:border-slate-700"}`}>
            <p className="text-xs text-slate-500 uppercase mb-1">Current</p>
            <p className="text-3xl font-black text-emerald-400">{currentPermits.length}</p>
            <p className="text-xs text-slate-500 mt-1">✅ Good for 90+ days</p>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Compliance Score */}
          <ComplianceScore permits={permits} />

          {/* At-Risk Penalties */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">At-Risk Penalties</h3>
            <div className="text-5xl font-black text-red-400 mb-2">{formatCurrency(totalPenalty)}</div>
            <p className="text-slate-400 text-sm">
              Maximum fine exposure from {overduePermits.length + warningPermits.length} non-compliant items
            </p>
            {totalPenalty > 0 && (
              <Link href="/renewals" className="mt-4 inline-block text-sm text-red-400 hover:text-red-300">
                View renewal checklists →
              </Link>
            )}
          </div>

          {/* Employee Certs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Employee Certs</h3>
              <Link href="/employees" className="text-xs text-emerald-400 hover:text-emerald-300">Manage →</Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Total Employees</span>
                <span className="font-bold text-white">{employees.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Total Certifications</span>
                <span className="font-bold text-white">{certifications.length}</span>
              </div>
              {expiredCerts > 0 && (
                <div className="flex items-center justify-between text-red-400">
                  <span className="text-sm">Expired Certs</span>
                  <span className="font-bold">{expiredCerts}</span>
                </div>
              )}
              {pendingCerts > 0 && (
                <div className="flex items-center justify-between text-amber-400">
                  <span className="text-sm">Pending Upload</span>
                  <span className="font-bold">{pendingCerts}</span>
                </div>
              )}
            </div>
            {employees.length === 0 && (
              <Link href="/employees?new=1" className="mt-4 block text-center text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition">
                + Add employees
              </Link>
            )}
          </div>
        </div>

        {/* Permits List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-white text-lg">Permits</h2>
                <button
                  onClick={() => setFilter("all")}
                  className={`text-xs px-2 py-1 rounded-full transition ${filter === "all" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-white"}`}
                >
                  All ({permits.length})
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {filteredPermits.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-slate-400 mb-4">{permits.length === 0 ? "No permits tracked yet." : "No permits match this filter."}</p>
              {permits.length === 0 && (
                <Link href="/onboarding" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-semibold inline-block">
                  Run Industry Wizard →
                </Link>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3 p-4">
              {filteredPermits.map((permit) => (
                <Link key={permit.id} href={`/permits/${permit.id}`}>
                  <PermitCard permit={permit} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
