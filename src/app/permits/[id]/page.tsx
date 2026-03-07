"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSupabase, Permit, daysUntil, getStatusFromDays, formatCurrency } from "@/lib/supabase";
import NavBar from "@/components/NavBar";
import Link from "next/link";

export default function PermitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const permitId = params.id as string;
  const [permit, setPermit] = useState<Permit | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Permit>>({});
  const [saving, setSaving] = useState(false);
  const [businessName, setBusinessName] = useState("");

  const loadData = useCallback(async () => {
    const supabase = getSupabase();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { router.push("/auth"); return; }
    const [permitRes, profileRes] = await Promise.all([
      supabase.from("permits").select("*").eq("id", permitId).eq("user_id", user.user.id).single(),
      supabase.from("profiles").select("business_name").eq("id", user.user.id).single(),
    ]);
    if (!permitRes.data) { router.push("/permits"); return; }
    setPermit(permitRes.data);
    setForm(permitRes.data);
    setBusinessName(profileRes.data?.business_name || "");
    setLoading(false);
  }, [router, permitId]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveChanges = async () => {
    if (!form.name) return;
    setSaving(true);
    const supabase = getSupabase();
    const { data } = await supabase.from("permits").update({
      name: form.name,
      category: form.category,
      issuing_agency: form.issuing_agency,
      agency_url: form.agency_url,
      expiry_date: form.expiry_date,
      renewal_cost: form.renewal_cost,
      penalty_amount: form.penalty_amount,
      notes: form.notes,
      permit_number: form.permit_number,
      is_one_time: form.is_one_time,
      tips: form.tips,
      updated_at: new Date().toISOString(),
    }).eq("id", permitId).select().single();
    if (data) { setPermit(data); setEditing(false); }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>;
  if (!permit) return null;

  const days = daysUntil(permit.expiry_date);
  const status = getStatusFromDays(days, permit.is_one_time);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavBar businessName={businessName} />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/permits" className="text-slate-400 hover:text-white text-sm">← Permits</Link>
        </div>

        {/* Header */}
        <div className={`rounded-2xl p-6 mb-6 border ${status.bg} border-slate-700/50`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{status.emoji}</span>
                <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
              </div>
              <h1 className="text-2xl font-black text-white">{permit.name}</h1>
              {permit.category && <p className="text-slate-400 text-sm mt-1">{permit.category}</p>}
              {permit.permit_number && <p className="text-slate-500 text-xs">License # {permit.permit_number}</p>}
            </div>
            <div className="text-right">
              {!permit.is_one_time && permit.expiry_date && (
                <>
                  <div className={`text-3xl font-black ${status.color}`}>
                    {days < 0 ? `${Math.abs(days)}d` : `${days}d`}
                  </div>
                  <div className="text-slate-400 text-sm">{days < 0 ? "overdue" : "remaining"}</div>
                  <div className="text-slate-500 text-xs mt-1">{new Date(permit.expiry_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                </>
              )}
            </div>
          </div>
          {permit.penalty_amount && !permit.is_one_time && days < 90 && (
            <div className="mt-4 bg-red-950/30 border border-red-800 rounded-lg px-4 py-2 text-sm text-red-300">
              ⚠️ Penalty for non-compliance: <strong>{formatCurrency(permit.penalty_amount)}</strong>
            </div>
          )}
        </div>

        {/* Details */}
        {!editing ? (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white">Details</h2>
                <button onClick={() => setEditing(true)} className="text-sm text-emerald-400 hover:text-emerald-300">Edit</button>
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {permit.issuing_agency && (
                  <>
                    <dt className="text-slate-400">Issuing Agency</dt>
                    <dd className="text-white">
                      {permit.agency_url ? <a href={permit.agency_url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">{permit.issuing_agency}</a> : permit.issuing_agency}
                    </dd>
                  </>
                )}
                {permit.renewal_cost && (
                  <>
                    <dt className="text-slate-400">Renewal Cost</dt>
                    <dd className="text-white">{formatCurrency(permit.renewal_cost)}</dd>
                  </>
                )}
                {permit.penalty_amount && (
                  <>
                    <dt className="text-slate-400">Max Penalty</dt>
                    <dd className="text-red-400 font-semibold">{formatCurrency(permit.penalty_amount)}</dd>
                  </>
                )}
                {permit.filing_type && (
                  <>
                    <dt className="text-slate-400">Filing Type</dt>
                    <dd className="text-white capitalize">{permit.filing_type.replace("_", " ")}</dd>
                  </>
                )}
              </dl>
              {permit.notes && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-slate-400 text-xs mb-1">Notes</p>
                  <p className="text-slate-300 text-sm">{permit.notes}</p>
                </div>
              )}
            </div>

            {/* Renewal Checklist */}
            {(permit.required_docs || permit.tips) && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 print-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-white">📋 Renewal Checklist</h2>
                  <button onClick={() => window.print()} className="text-sm text-slate-400 hover:text-white no-print">🖨️ Print</button>
                </div>
                {permit.required_docs && permit.required_docs.length > 0 && (
                  <div className="mb-4">
                    <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Required Documents</p>
                    <ul className="space-y-1.5">
                      {permit.required_docs.map((doc, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                          <span className="text-slate-600">☐</span>
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {permit.issuing_agency && (
                  <div className="mb-4">
                    <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Contact Agency</p>
                    <p className="text-sm text-white">{permit.issuing_agency}</p>
                    {permit.agency_url && (
                      <a href={permit.agency_url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 text-sm hover:underline">{permit.agency_url}</a>
                    )}
                  </div>
                )}
                {permit.tips && (
                  <div className="bg-amber-950/20 border border-amber-900/50 rounded-lg p-3">
                    <p className="text-amber-300 text-xs font-semibold mb-1">💡 Tips & Gotchas</p>
                    <p className="text-slate-300 text-sm">{permit.tips}</p>
                  </div>
                )}
                {permit.renewal_cost && (
                  <div className="mt-3 text-sm text-slate-400">
                    <strong className="text-white">Renewal Fee:</strong> {formatCurrency(permit.renewal_cost)}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Edit Form */
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="font-bold text-white">Edit Permit</h2>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Name *</label>
              <input value={form.name || ""} onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Category</label>
                <input value={form.category || ""} onChange={(e) => setForm({...form, category: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Permit #</label>
                <input value={form.permit_number || ""} onChange={(e) => setForm({...form, permit_number: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Issuing Agency</label>
              <input value={form.issuing_agency || ""} onChange={(e) => setForm({...form, issuing_agency: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Agency URL</label>
              <input value={form.agency_url || ""} onChange={(e) => setForm({...form, agency_url: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm" />
            </div>
            {!form.is_one_time && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Expiry Date</label>
                <input type="date" value={form.expiry_date || ""} onChange={(e) => setForm({...form, expiry_date: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Renewal Cost ($)</label>
                <input type="number" value={form.renewal_cost || ""} onChange={(e) => setForm({...form, renewal_cost: parseFloat(e.target.value)})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Max Penalty ($)</label>
                <input type="number" value={form.penalty_amount || ""} onChange={(e) => setForm({...form, penalty_amount: parseFloat(e.target.value)})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Notes</label>
              <textarea value={form.notes || ""} onChange={(e) => setForm({...form, notes: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm h-20 resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditing(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm transition">Cancel</button>
              <button onClick={saveChanges} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
