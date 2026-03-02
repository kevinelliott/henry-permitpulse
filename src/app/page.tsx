"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase";
import type { User, SupabaseClient } from "@supabase/supabase-js";

const supabase = createBrowserClient();

// ========== TYPES ==========
interface Business { id: string; name: string; industry: string; state_code: string; }
interface Category { id: string; business_id: string; name: string; description: string; }
interface Permit {
  id: string; business_id: string; category_id: string | null;
  name: string; permit_number: string; issuing_authority: string;
  issue_date: string; expiration_date: string; renewal_cost: number;
  status: string; notes: string; reminder_days: number[];
}
interface RenewalRecord { id: string; permit_id: string; renewed_at: string; cost: number; was_on_time: boolean; notes: string; }

// ========== HELPERS ==========
function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}
function urgencyColor(days: number): string {
  if (days < 0) return "text-red-400 bg-red-900/30";
  if (days <= 7) return "text-red-300 bg-red-900/20";
  if (days <= 30) return "text-orange-300 bg-orange-900/20";
  if (days <= 60) return "text-yellow-300 bg-yellow-900/20";
  if (days <= 90) return "text-blue-300 bg-blue-900/20";
  return "text-green-300 bg-green-900/20";
}
function gradeFromScore(score: number): { letter: string; color: string } {
  if (score >= 90) return { letter: "A", color: "text-green-400" };
  if (score >= 80) return { letter: "B", color: "text-blue-400" };
  if (score >= 70) return { letter: "C", color: "text-yellow-400" };
  if (score >= 60) return { letter: "D", color: "text-orange-400" };
  return { letter: "F", color: "text-red-400" };
}

// ========== AUTH GATE ==========
function AuthGate({ onAuth }: { onAuth: (u: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { data, error: err } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message);
    else if (data.user) onAuth(data.user);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🛡️</div>
          <h1 className="text-2xl font-bold">PermitPulse</h1>
          <p className="text-gray-400 text-sm mt-1">Never miss a license renewal</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" required />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
            {loading ? "..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>
        <p className="text-center text-gray-500 text-sm mt-4">
          {isSignUp ? "Have an account?" : "No account?"}{" "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-emerald-400 hover:underline">
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ========== ADD PERMIT MODAL ==========
function AddPermitModal({ businessId, categories, onClose, onSaved }: {
  businessId: string; categories: Category[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "", permit_number: "", issuing_authority: "", category_id: "",
    issue_date: "", expiration_date: "", renewal_cost: "", notes: "", status: "active"
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await supabase.from("permits").insert({
      business_id: businessId, name: form.name, permit_number: form.permit_number || null,
      issuing_authority: form.issuing_authority || null,
      category_id: form.category_id || null,
      issue_date: form.issue_date || null, expiration_date: form.expiration_date || null,
      renewal_cost: form.renewal_cost ? parseFloat(form.renewal_cost) : null,
      notes: form.notes || null, status: form.status,
    });
    setSaving(false); onSaved(); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">Add Permit / License</h3>
        <form onSubmit={save} className="space-y-3">
          <input placeholder="Name *" required value={form.name} onChange={e => set("name", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Permit #" value={form.permit_number} onChange={e => set("permit_number", e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
            <input placeholder="Issuing Authority" value={form.issuing_authority} onChange={e => set("issuing_authority", e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
          </div>
          <select value={form.category_id} onChange={e => set("category_id", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
            <option value="">No Category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500">Issue Date</label>
              <input type="date" value={form.issue_date} onChange={e => set("issue_date", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" /></div>
            <div><label className="text-xs text-gray-500">Expiration Date</label>
              <input type="date" value={form.expiration_date} onChange={e => set("expiration_date", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.01" placeholder="Renewal Cost ($)" value={form.renewal_cost} onChange={e => set("renewal_cost", e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
            <select value={form.status} onChange={e => set("status", e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
              <option value="active">Active</option><option value="pending">Pending</option>
              <option value="expired">Expired</option><option value="revoked">Revoked</option>
            </select>
          </div>
          <textarea placeholder="Notes" rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
              {saving ? "Saving..." : "Add Permit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========== ADD CATEGORY MODAL ==========
function AddCategoryModal({ businessId, onClose, onSaved }: { businessId: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("permit_categories").insert({ business_id: businessId, name, description: desc || null });
    onSaved(); onClose();
  }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">Add Category</h3>
        <form onSubmit={save} className="space-y-3">
          <input placeholder="Category Name *" required value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
          <input placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-sm">Cancel</button>
            <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg text-sm font-semibold">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========== INTELLIGENCE PANEL ==========
function IntelligencePanel({ permits, renewals, categories }: { permits: Permit[]; renewals: RenewalRecord[]; categories: Category[] }) {
  const active = permits.filter(p => p.status === "active");
  const withExpiry = active.filter(p => p.expiration_date);

  // 1. Compliance Score
  const expired = permits.filter(p => p.status === "expired" || (p.expiration_date && daysUntil(p.expiration_date) < 0));
  const critical = withExpiry.filter(p => daysUntil(p.expiration_date) <= 7 && daysUntil(p.expiration_date) >= 0);
  const warning = withExpiry.filter(p => daysUntil(p.expiration_date) > 7 && daysUntil(p.expiration_date) <= 30);
  const total = permits.length || 1;
  const complianceScore = Math.max(0, Math.round(100 - (expired.length / total) * 50 - (critical.length / total) * 30 - (warning.length / total) * 10));
  const grade = gradeFromScore(complianceScore);

  // 2. Annual renewal cost forecast
  const annualCost = active.reduce((sum, p) => sum + (p.renewal_cost || 0), 0);

  // 3. Expiration radar
  const upcoming = withExpiry
    .map(p => ({ ...p, daysLeft: daysUntil(p.expiration_date) }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 10);

  // 4. Category risk analysis
  const catRisk = categories.map(cat => {
    const catPermits = permits.filter(p => p.category_id === cat.id);
    const catExpired = catPermits.filter(p => p.status === "expired" || (p.expiration_date && daysUntil(p.expiration_date) < 0));
    const catCritical = catPermits.filter(p => p.expiration_date && daysUntil(p.expiration_date) <= 30 && daysUntil(p.expiration_date) >= 0);
    return { name: cat.name, total: catPermits.length, expired: catExpired.length, critical: catCritical.length,
      risk: catExpired.length > 0 ? "High" : catCritical.length > 0 ? "Medium" : "Low" };
  }).filter(c => c.total > 0).sort((a, b) => b.expired - a.expired);

  // 5. Renewal history analysis
  const onTimeCount = renewals.filter(r => r.was_on_time).length;
  const lateCount = renewals.filter(r => !r.was_on_time).length;
  const onTimeRate = renewals.length > 0 ? Math.round((onTimeCount / renewals.length) * 100) : 100;

  // 6. Estimated fine exposure (industry avg: $500-$5000 per expired permit)
  const fineExposure = expired.length * 2500;

  return (
    <div className="space-y-6">
      {/* Compliance Score */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Compliance Score</h3>
        <div className="flex items-center gap-6">
          <div className={`text-6xl font-black ${grade.color}`}>{grade.letter}</div>
          <div>
            <div className="text-3xl font-bold">{complianceScore}<span className="text-lg text-gray-500">/100</span></div>
            <p className="text-gray-400 text-sm mt-1">
              {complianceScore >= 90 ? "Excellent — all permits current" :
               complianceScore >= 70 ? "Good — minor attention needed" :
               complianceScore >= 50 ? "Warning — renewals overdue" : "Critical — immediate action required"}
            </p>
          </div>
        </div>
        {fineExposure > 0 && (
          <div className="mt-4 bg-red-900/20 border border-red-800/50 rounded-lg p-3">
            <p className="text-red-300 text-sm font-semibold">⚠️ Estimated Fine Exposure: ${fineExposure.toLocaleString()}</p>
            <p className="text-red-400/70 text-xs mt-1">{expired.length} expired permit(s) × $2,500 avg fine</p>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase">Active Permits</p>
          <p className="text-2xl font-bold text-emerald-400">{active.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase">Expired</p>
          <p className="text-2xl font-bold text-red-400">{expired.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase">Annual Cost</p>
          <p className="text-2xl font-bold">${annualCost.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase">On-Time Rate</p>
          <p className="text-2xl font-bold text-blue-400">{onTimeRate}%</p>
          <p className="text-xs text-gray-500">{onTimeCount} on-time / {lateCount} late</p>
        </div>
      </div>

      {/* Expiration Radar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Expiration Radar</h3>
        {upcoming.length === 0 ? (
          <p className="text-gray-500 text-sm">No permits with expiration dates.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map(p => (
              <div key={p.id} className={`flex items-center justify-between rounded-lg px-4 py-2 ${urgencyColor(p.daysLeft)}`}>
                <div>
                  <span className="font-medium text-sm">{p.name}</span>
                  {p.permit_number && <span className="text-xs ml-2 opacity-60">#{p.permit_number}</span>}
                </div>
                <span className="text-sm font-semibold whitespace-nowrap">
                  {p.daysLeft < 0 ? `${Math.abs(p.daysLeft)}d overdue` : p.daysLeft === 0 ? "Expires today" : `${p.daysLeft}d left`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Risk */}
      {catRisk.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Category Risk Analysis</h3>
          <div className="space-y-2">
            {catRisk.map(c => (
              <div key={c.name} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3">
                <div>
                  <span className="font-medium text-sm">{c.name}</span>
                  <span className="text-xs text-gray-500 ml-2">{c.total} permits</span>
                </div>
                <div className="flex items-center gap-3">
                  {c.expired > 0 && <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded">{c.expired} expired</span>}
                  {c.critical > 0 && <span className="text-xs bg-orange-900/50 text-orange-300 px-2 py-0.5 rounded">{c.critical} due soon</span>}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    c.risk === "High" ? "bg-red-900/50 text-red-300" :
                    c.risk === "Medium" ? "bg-yellow-900/50 text-yellow-300" : "bg-green-900/50 text-green-300"
                  }`}>{c.risk}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Renewal Calendar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Monthly Renewal Forecast</h3>
        {(() => {
          const months: Record<string, { count: number; cost: number }> = {};
          withExpiry.forEach(p => {
            const d = new Date(p.expiration_date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            if (!months[key]) months[key] = { count: 0, cost: 0 };
            months[key].count++;
            months[key].cost += p.renewal_cost || 0;
          });
          const sorted = Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(0, 12);
          if (sorted.length === 0) return <p className="text-gray-500 text-sm">Add expiration dates to see your renewal calendar.</p>;
          return (
            <div className="space-y-2">
              {sorted.map(([month, data]) => (
                <div key={month} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-2">
                  <span className="text-sm font-medium">{new Date(month + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">{data.count} renewal{data.count > 1 ? "s" : ""}</span>
                    <span className="text-sm font-semibold text-emerald-400">${data.cost.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ========== REPORT GENERATOR ==========
function ReportGenerator({ permits, categories, renewals, businessName }: {
  permits: Permit[]; categories: Category[]; renewals: RenewalRecord[]; businessName: string;
}) {
  function generate() {
    const active = permits.filter(p => p.status === "active");
    const expired = permits.filter(p => p.status === "expired" || (p.expiration_date && daysUntil(p.expiration_date) < 0));
    const total = permits.length || 1;
    const score = Math.max(0, Math.round(100 - (expired.length / total) * 50));
    const grade = gradeFromScore(score);
    const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    let report = `COMPLIANCE REPORT\n${"=".repeat(60)}\n`;
    report += `Business: ${businessName}\nDate: ${now}\nCompliance Grade: ${grade.letter} (${score}/100)\n\n`;
    report += `SUMMARY\n${"-".repeat(40)}\n`;
    report += `Total Permits: ${permits.length}\nActive: ${active.length}\nExpired: ${expired.length}\n`;
    report += `Annual Renewal Cost: $${active.reduce((s, p) => s + (p.renewal_cost || 0), 0).toLocaleString()}\n`;
    if (expired.length > 0) {
      report += `\n⚠️ EXPIRED PERMITS REQUIRING IMMEDIATE ATTENTION\n${"-".repeat(40)}\n`;
      expired.forEach(p => {
        report += `• ${p.name}${p.permit_number ? ` (#${p.permit_number})` : ""} — expired ${Math.abs(daysUntil(p.expiration_date))} days ago\n`;
      });
    }
    const upcoming = active.filter(p => p.expiration_date && daysUntil(p.expiration_date) <= 90).sort((a, b) => daysUntil(a.expiration_date) - daysUntil(b.expiration_date));
    if (upcoming.length > 0) {
      report += `\nUPCOMING RENEWALS (90 days)\n${"-".repeat(40)}\n`;
      upcoming.forEach(p => {
        report += `• ${p.name} — ${daysUntil(p.expiration_date)} days (${p.expiration_date})${p.renewal_cost ? ` — $${p.renewal_cost}` : ""}\n`;
      });
    }
    if (categories.length > 0) {
      report += `\nBY CATEGORY\n${"-".repeat(40)}\n`;
      categories.forEach(cat => {
        const cp = permits.filter(p => p.category_id === cat.id);
        if (cp.length > 0) report += `${cat.name}: ${cp.length} permits (${cp.filter(p => p.status === "active").length} active)\n`;
      });
    }
    report += `\n${"=".repeat(60)}\nGenerated by PermitPulse — permitpulse.com\n`;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `compliance-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <button onClick={generate} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
      📄 Download Compliance Report
    </button>
  );
}

// ========== PERMIT LIST ==========
function PermitList({ permits, categories, onDelete }: { permits: Permit[]; categories: Category[]; onDelete: (id: string) => void }) {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
  const sorted = [...permits].sort((a, b) => {
    if (!a.expiration_date) return 1; if (!b.expiration_date) return -1;
    return daysUntil(a.expiration_date) - daysUntil(b.expiration_date);
  });

  return (
    <div className="space-y-2">
      {sorted.map(p => {
        const days = p.expiration_date ? daysUntil(p.expiration_date) : null;
        return (
          <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{p.name}</span>
                {p.permit_number && <span className="text-xs text-gray-500">#{p.permit_number}</span>}
                {p.category_id && catMap[p.category_id] && (
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{catMap[p.category_id]}</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded ${
                  p.status === "active" ? "bg-green-900/50 text-green-300" :
                  p.status === "expired" ? "bg-red-900/50 text-red-300" :
                  p.status === "pending" ? "bg-yellow-900/50 text-yellow-300" : "bg-gray-700 text-gray-400"
                }`}>{p.status}</span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                {p.issuing_authority && <span>{p.issuing_authority}</span>}
                {p.expiration_date && <span>Expires: {p.expiration_date}</span>}
                {p.renewal_cost && <span>${p.renewal_cost}/renewal</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {days !== null && (
                <span className={`text-sm font-semibold px-3 py-1 rounded-lg ${urgencyColor(days)}`}>
                  {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today!" : `${days}d`}
                </span>
              )}
              <button onClick={() => onDelete(p.id)} className="text-gray-600 hover:text-red-400 text-sm">✕</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ========== ONBOARDING ==========
function Onboarding({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [state, setState] = useState("");
  async function create(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("businesses").insert({ user_id: userId, name, industry: industry || null, state_code: state || null });
    onCreated();
  }
  const industries = ["Restaurant", "Construction", "Salon/Spa", "Daycare", "Auto Repair", "Real Estate", "Retail", "Healthcare", "Other"];
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-xl font-bold mb-2">Set up your business</h2>
        <p className="text-gray-400 text-sm mb-6">We&apos;ll track all your permits, licenses, and certifications.</p>
        <form onSubmit={create} className="space-y-4">
          <input placeholder="Business Name *" required value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
          <select value={industry} onChange={e => setIndustry(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500">
            <option value="">Select Industry</option>
            {industries.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <input placeholder="State (e.g., CA)" maxLength={2} value={state} onChange={e => setState(e.target.value.toUpperCase())}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" />
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg transition">
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
}

// ========== LANDING PAGE ==========
function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="text-5xl mb-4">🛡️</div>
        <h1 className="text-4xl md:text-5xl font-black mb-4">
          Never Miss a <span className="text-emerald-400">License Renewal</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-4">
          One expired permit can cost you <span className="text-red-400 font-bold">$1,000–$10,000 in fines</span> or shut you down entirely.
          PermitPulse tracks every license, certification, and permit — so you never get caught off guard.
        </p>
        <p className="text-lg text-gray-500 mb-8">
          Compliance intelligence for small businesses. <span className="text-white font-semibold">$15/mo</span>, not $500.
        </p>
        <button onClick={onGetStarted}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg px-8 py-4 rounded-xl transition shadow-lg shadow-emerald-900/30">
          Start Tracking Free →
        </button>
      </div>

      {/* Pain Points */}
      <div className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-6">
        {[
          { icon: "🚨", title: "280K+ businesses fined yearly", desc: "For expired permits they forgot to renew. Don't be one of them." },
          { icon: "📋", title: "Stop using spreadsheets", desc: "No more Post-Its, email reminders, or 'I thought someone renewed that.'" },
          { icon: "💰", title: "$15/mo vs $500+/mo", desc: "Enterprise compliance tools aren't built for you. PermitPulse is." },
        ].map(p => (
          <div key={p.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">{p.icon}</div>
            <h3 className="font-bold mb-2">{p.title}</h3>
            <p className="text-gray-400 text-sm">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Intelligence Features */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">6 Layers of Compliance Intelligence</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: "🎯", title: "Compliance Score (A–F)", desc: "One glance tells you if your business is compliant. Updated in real-time." },
            { icon: "📡", title: "Expiration Radar", desc: "90/60/30/7-day warnings with urgency coloring. Never surprised again." },
            { icon: "💸", title: "Fine Exposure Calculator", desc: "See exactly how much you'd pay in fines for expired permits. The number is motivating." },
            { icon: "📊", title: "Category Risk Analysis", desc: "Which permit categories have the most exposure? Focus your attention." },
            { icon: "📅", title: "Renewal Calendar Forecast", desc: "Monthly view of upcoming renewals with cost projections. Budget with confidence." },
            { icon: "📄", title: "Downloadable Compliance Report", desc: "Professional report for inspectors, landlords, or insurance audits." },
          ].map(f => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex gap-4">
              <div className="text-2xl">{f.icon}</div>
              <div>
                <h3 className="font-bold mb-1">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Who It's For */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Built for Regulated Small Businesses</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["🍳 Restaurants", "🔨 Contractors", "💇 Salons", "🏠 Property Managers", "👶 Daycares", "🔧 Auto Repair", "🏥 Healthcare", "🏪 Retail"].map(b => (
            <div key={b} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center text-sm font-medium">{b}</div>
          ))}
        </div>
      </div>

      {/* Competitor Comparison */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">Why PermitPulse?</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {[
            { feature: "License Tracking", us: "✅", them: "✅" },
            { feature: "Expiration Alerts", us: "✅", them: "✅" },
            { feature: "Compliance Scoring", us: "✅", them: "❌" },
            { feature: "Fine Exposure Calculator", us: "✅", them: "❌" },
            { feature: "Category Risk Analysis", us: "✅", them: "❌" },
            { feature: "Compliance Reports", us: "✅", them: "$$$" },
            { feature: "Price", us: "$15/mo", them: "$99-500/mo" },
          ].map((r, i) => (
            <div key={r.feature} className={`flex items-center justify-between px-6 py-3 text-sm ${i % 2 === 0 ? "bg-gray-800/30" : ""}`}>
              <span className="flex-1">{r.feature}</span>
              <span className="w-24 text-center font-semibold text-emerald-400">{r.us}</span>
              <span className="w-24 text-center text-gray-500">{r.them}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-6 py-2 text-xs text-gray-500">
            <span className="flex-1"></span>
            <span className="w-24 text-center">PermitPulse</span>
            <span className="w-24 text-center">Enterprise</span>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Simple Pricing</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { name: "Free", price: "$0", desc: "5 permits", features: ["5 permits", "Compliance score", "Expiration radar", "Email support"] },
            { name: "Pro", price: "$15", desc: "/month", features: ["50 permits", "All intelligence layers", "Fine exposure calculator", "Compliance reports", "Category risk analysis", "Priority support"], popular: true },
            { name: "Enterprise", price: "$39", desc: "/month", features: ["Unlimited permits", "Everything in Pro", "Multi-location", "Team access", "API access", "White-label reports"] },
          ].map(tier => (
            <div key={tier.name} className={`bg-gray-900 border rounded-xl p-6 ${tier.popular ? "border-emerald-500 ring-1 ring-emerald-500/30" : "border-gray-800"}`}>
              {tier.popular && <div className="text-xs font-bold text-emerald-400 uppercase mb-2">Most Popular</div>}
              <h3 className="text-xl font-bold">{tier.name}</h3>
              <div className="mt-2 mb-4"><span className="text-3xl font-black">{tier.price}</span><span className="text-gray-500 text-sm">{tier.desc}</span></div>
              <ul className="space-y-2 text-sm text-gray-300">
                {tier.features.map(f => <li key={f} className="flex items-center gap-2"><span className="text-emerald-400">✓</span>{f}</li>)}
              </ul>
              <button onClick={onGetStarted} className={`w-full mt-6 py-2 rounded-lg font-semibold text-sm transition ${
                tier.popular ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-gray-800 hover:bg-gray-700"
              }`}>Get Started</button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-12 text-gray-600 text-sm">
        <p>🛡️ PermitPulse — Compliance intelligence for small businesses</p>
        <p className="mt-1">Built by <a href="https://henry-the-great.com" className="text-emerald-500 hover:underline">Henry the Great</a></p>
      </div>
    </div>
  );
}

// ========== MAIN APP ==========
export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [renewals, setRenewals] = useState<RenewalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApp, setShowApp] = useState(false);
  const [tab, setTab] = useState<"overview" | "permits" | "intelligence" | "report">("overview");
  const [showAddPermit, setShowAddPermit] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data: biz } = await supabase.from("businesses").select("*").eq("user_id", user.id).limit(1).single();
    if (!biz) { setBusiness(null); setLoading(false); return; }
    setBusiness(biz);
    const [{ data: p }, { data: c }, { data: r }] = await Promise.all([
      supabase.from("permits").select("*").eq("business_id", biz.id),
      supabase.from("permit_categories").select("*").eq("business_id", biz.id),
      supabase.from("renewal_history").select("*").in("permit_id", (await supabase.from("permits").select("id").eq("business_id", biz.id)).data?.map((x: {id: string}) => x.id) || []),
    ]);
    setPermits(p || []);
    setCategories(c || []);
    setRenewals(r || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUser(data.session.user);
      else setLoading(false);
    });
  }, []);

  useEffect(() => { if (user) { setLoading(true); loadData(); } }, [user, loadData]);

  async function deletePermit(id: string) {
    await supabase.from("permits").delete().eq("id", id);
    loadData();
  }

  if (!showApp && !user) return <LandingPage onGetStarted={() => setShowApp(true)} />;
  if (!user) return <AuthGate onAuth={u => setUser(u)} />;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>;
  if (!business) return <Onboarding userId={user.id} onCreated={loadData} />;

  const active = permits.filter(p => p.status === "active");
  const expired = permits.filter(p => p.status === "expired" || (p.expiration_date && daysUntil(p.expiration_date) < 0));
  const dueSoon = active.filter(p => p.expiration_date && daysUntil(p.expiration_date) <= 30 && daysUntil(p.expiration_date) >= 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h1 className="font-bold">PermitPulse</h1>
            <p className="text-xs text-gray-500">{business.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ReportGenerator permits={permits} categories={categories} renewals={renewals} businessName={business.name} />
          <button onClick={() => { supabase.auth.signOut(); setUser(null); setBusiness(null); }}
            className="text-gray-500 hover:text-gray-300 text-sm">Sign Out</button>
        </div>
      </header>

      {/* Alert Banner */}
      {(expired.length > 0 || dueSoon.length > 0) && (
        <div className={`px-6 py-3 text-sm font-medium ${expired.length > 0 ? "bg-red-900/30 text-red-300" : "bg-yellow-900/30 text-yellow-300"}`}>
          {expired.length > 0 && `⚠️ ${expired.length} expired permit${expired.length > 1 ? "s" : ""} — immediate attention required. `}
          {dueSoon.length > 0 && `📅 ${dueSoon.length} permit${dueSoon.length > 1 ? "s" : ""} due within 30 days.`}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-6">
          {(["overview", "permits", "intelligence", "report"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-3 text-sm font-medium border-b-2 transition ${
                tab === t ? "border-emerald-400 text-emerald-400" : "border-transparent text-gray-500 hover:text-gray-300"
              }`}>
              {t === "overview" ? "Overview" : t === "permits" ? "Permits" : t === "intelligence" ? "Intelligence" : "Report"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-xs text-gray-500 uppercase">Total Permits</p>
                <p className="text-3xl font-bold">{permits.length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-xs text-gray-500 uppercase">Active</p>
                <p className="text-3xl font-bold text-emerald-400">{active.length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-xs text-gray-500 uppercase">Expired</p>
                <p className="text-3xl font-bold text-red-400">{expired.length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-xs text-gray-500 uppercase">Due ≤30d</p>
                <p className="text-3xl font-bold text-yellow-400">{dueSoon.length}</p>
              </div>
            </div>
            {permits.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                <p className="text-3xl mb-3">🛡️</p>
                <p className="text-lg font-semibold mb-2">Add your first permit</p>
                <p className="text-gray-400 text-sm mb-4">Start tracking your business licenses, permits, and certifications.</p>
                <button onClick={() => setShowAddPermit(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-semibold">+ Add Permit</button>
              </div>
            ) : (
              <IntelligencePanel permits={permits} renewals={renewals} categories={categories} />
            )}
          </div>
        )}

        {tab === "permits" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">All Permits</h2>
              <div className="flex gap-2">
                <button onClick={() => setShowAddCategory(true)} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm">+ Category</button>
                <button onClick={() => setShowAddPermit(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">+ Add Permit</button>
              </div>
            </div>
            {categories.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {categories.map(c => (
                  <span key={c.id} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs">{c.name} ({permits.filter(p => p.category_id === c.id).length})</span>
                ))}
              </div>
            )}
            {permits.length === 0 ? (
              <p className="text-gray-500 text-sm py-8 text-center">No permits yet. Add your first one above.</p>
            ) : (
              <PermitList permits={permits} categories={categories} onDelete={deletePermit} />
            )}
          </div>
        )}

        {tab === "intelligence" && (
          <IntelligencePanel permits={permits} renewals={renewals} categories={categories} />
        )}

        {tab === "report" && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">📄</div>
              <h3 className="text-lg font-bold mb-2">Compliance Report</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                Generate a professional compliance report for inspectors, landlords, insurance audits, or your own records.
              </p>
              <ReportGenerator permits={permits} categories={categories} renewals={renewals} businessName={business.name} />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddPermit && <AddPermitModal businessId={business.id} categories={categories} onClose={() => setShowAddPermit(false)} onSaved={loadData} />}
      {showAddCategory && <AddCategoryModal businessId={business.id} onClose={() => setShowAddCategory(false)} onSaved={loadData} />}
    </div>
  );
}
