"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase, Permit, daysUntil, getStatusFromDays, formatCurrency } from "@/lib/supabase";
import NavBar from "@/components/NavBar";
import Link from "next/link";

function AddPermitModal({ onClose, onSaved, userId }: { onClose: () => void; onSaved: () => void; userId: string }) {
  const [form, setForm] = useState({
    name: "", category: "", issuing_agency: "", agency_url: "",
    expiry_date: "", renewal_cost: "", penalty_amount: "", notes: "", permit_number: "",
    is_one_time: false, filing_type: "online",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    const supabase = getSupabase();
    await supabase.from("permits").insert({
      user_id: userId,
      name: form.name,
      category: form.category || null,
      issuing_agency: form.issuing_agency || null,
      agency_url: form.agency_url || null,
      expiry_date: form.expiry_date || null,
      renewal_cost: form.renewal_cost ? parseFloat(form.renewal_cost) : null,
      penalty_amount: form.penalty_amount ? parseFloat(form.penalty_amount) : null,
      notes: form.notes || null,
      permit_number: form.permit_number || null,
      is_one_time: form.is_one_time,
      filing_type: form.filing_type,
      status: form.is_one_time ? "one_time" : "active",
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-white">Add Permit / License</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Permit Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
              placeholder="e.g. Health Department Permit" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Category</label>
              <input type="text" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                placeholder="e.g. Health & Safety" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Permit #</label>
              <input type="text" value={form.permit_number} onChange={(e) => setForm({...form, permit_number: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                placeholder="Optional" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Issuing Agency</label>
            <input type="text" value={form.issuing_agency} onChange={(e) => setForm({...form, issuing_agency: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
              placeholder="e.g. County Health Department" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="oneTime" checked={form.is_one_time} onChange={(e) => setForm({...form, is_one_time: e.target.checked})}
              className="w-4 h-4 accent-emerald-500" />
            <label htmlFor="oneTime" className="text-sm text-slate-300">One-time permit (no renewal needed)</label>
          </div>
          {!form.is_one_time && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Expiry Date</label>
              <input type="date" value={form.expiry_date} onChange={(e) => setForm({...form, expiry_date: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Renewal Cost ($)</label>
              <input type="number" value={form.renewal_cost} onChange={(e) => setForm({...form, renewal_cost: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                placeholder="0" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Max Penalty ($)</label>
              <input type="number" value={form.penalty_amount} onChange={(e) => setForm({...form, penalty_amount: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm h-20 resize-none"
              placeholder="Any notes about this permit..." />
          </div>
        </div>
        <div className="p-6 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm transition">Cancel</button>
          <button onClick={save} disabled={!form.name || saving} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition">
            {saving ? "Saving..." : "Add Permit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PermitsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(searchParams.get("new") === "1");
  const [businessName, setBusinessName] = useState("");
  const [sortBy, setSortBy] = useState<"expiry" | "name" | "category">("expiry");
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    const supabase = getSupabase();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { router.push("/auth"); return; }
    setUserId(user.user.id);
    const [permitsRes, profileRes] = await Promise.all([
      supabase.from("permits").select("*").eq("user_id", user.user.id),
      supabase.from("profiles").select("business_name").eq("id", user.user.id).single(),
    ]);
    setPermits(permitsRes.data || []);
    setBusinessName(profileRes.data?.business_name || "");
    setLoading(false);
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const deletePermit = async (id: string) => {
    if (!confirm("Delete this permit?")) return;
    const supabase = getSupabase();
    await supabase.from("permits").delete().eq("id", id);
    setPermits(permits.filter((p) => p.id !== id));
  };

  const categories = [...new Set(permits.map((p) => p.category).filter(Boolean))] as string[];

  let sorted = [...permits];
  if (sortBy === "expiry") sorted.sort((a, b) => (a.expiry_date || "9999") > (b.expiry_date || "9999") ? 1 : -1);
  else if (sortBy === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === "category") sorted.sort((a, b) => (a.category || "").localeCompare(b.category || ""));

  if (filterCategory !== "all") sorted = sorted.filter((p) => p.category === filterCategory);
  if (search) sorted = sorted.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.issuing_agency?.toLowerCase().includes(search.toLowerCase()));

  const overdueCount = permits.filter((p) => !p.is_one_time && daysUntil(p.expiry_date) < 0).length;
  const totalRenewalCost = permits.reduce((sum, p) => sum + (p.renewal_cost || 0), 0);

  if (loading) return <div className="text-center py-20 text-slate-400">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Permits & Licenses</h1>
          <p className="text-slate-400 text-sm mt-1">{permits.length} tracked · Annual cost: {formatCurrency(totalRenewalCost)}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
          + Add Permit
        </button>
      </div>

      {overdueCount > 0 && (
        <div className="bg-red-950/30 border border-red-800 rounded-xl p-3 mb-4 text-sm text-red-300">
          🚨 {overdueCount} permit(s) are expired. Renew immediately to avoid fines.
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search permits..."
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 flex-1 min-w-32"
        />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "expiry" | "name" | "category")}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
          <option value="expiry">Sort: Expiry Date</option>
          <option value="name">Sort: Name</option>
          <option value="category">Sort: Category</option>
        </select>
      </div>

      {/* Permits Table */}
      {sorted.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-400 mb-4">No permits found.</p>
          <button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-semibold">
            + Add First Permit
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((permit) => {
            const days = daysUntil(permit.expiry_date);
            const status = getStatusFromDays(days, permit.is_one_time);
            return (
              <div key={permit.id} className={`bg-slate-900 border rounded-xl p-4 flex items-center gap-4 ${status.bg} border-slate-700/50 hover:border-slate-600 transition`}>
                <span className="text-xl shrink-0">{status.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{permit.name}</span>
                    {permit.category && <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{permit.category}</span>}
                    {permit.permit_number && <span className="text-xs text-slate-500">#{permit.permit_number}</span>}
                  </div>
                  <p className="text-sm text-slate-500 truncate">{permit.issuing_agency || "No agency specified"}</p>
                </div>
                <div className="text-right shrink-0">
                  {permit.is_one_time ? (
                    <span className="text-xs text-blue-400 font-medium">One-Time</span>
                  ) : permit.expiry_date ? (
                    <>
                      <div className={`text-sm font-bold ${status.color}`}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                      </div>
                      <div className="text-xs text-slate-500">{new Date(permit.expiry_date).toLocaleDateString()}</div>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500">No date</span>
                  )}
                  {permit.renewal_cost && <div className="text-xs text-slate-500">{formatCurrency(permit.renewal_cost)}/yr</div>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/permits/${permit.id}`} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition">
                    View
                  </Link>
                  <button onClick={() => deletePermit(permit.id)} className="text-xs bg-red-950/50 hover:bg-red-900/50 text-red-400 px-2 py-1 rounded transition">
                    Del
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && userId && (
        <AddPermitModal onClose={() => setShowAdd(false)} onSaved={loadData} userId={userId} />
      )}
    </div>
  );
}

export default function PermitsPage() {
  const [businessName, setBusinessName] = useState("");
  useEffect(() => {
    getSupabase().auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await getSupabase().from("profiles").select("business_name").eq("id", data.user.id).single();
        if (p) setBusinessName(p.business_name || "");
      }
    });
  }, []);
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavBar businessName={businessName} />
      <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading...</div>}>
        <PermitsContent />
      </Suspense>
    </div>
  );
}
