"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase, INDUSTRIES, STATES, PermitTemplate } from "@/lib/supabase";
import Link from "next/link";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [industry, setIndustry] = useState("");
  const [state, setState] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [templates, setTemplates] = useState<PermitTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUserId(data.user.id);
    });
  }, [router]);

  const loadTemplates = async () => {
    setLoading(true);
    const supabase = getSupabase();
    const { data } = await supabase
      .from("permit_templates")
      .select("*")
      .eq("industry", industry)
      .eq("state_code", state)
      .order("sort_order");
    setTemplates(data || []);
    setLoading(false);
  };

  const handleStep1 = () => {
    if (industry && state) setStep(2);
  };

  const handleStep2 = async () => {
    if (!industry || !state) return;
    await loadTemplates();
    setStep(3);
  };

  const handleFinish = async () => {
    if (!userId || !businessName) return;
    setSaving(true);
    const supabase = getSupabase();

    // Generate slug from business name
    const slug = businessName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50) + "-" + Math.random().toString(36).slice(2, 6);

    // Update profile
    await supabase.from("profiles").upsert({
      id: userId,
      business_name: businessName,
      industry,
      state_code: state,
      city,
      slug,
      onboarding_complete: true,
    });

    // Insert permits from templates
    if (templates.length > 0) {
      const today = new Date();
      const permits = templates.map((t) => {
        let expiryDate: string | null = null;
        if (!t.is_one_time) {
          const expiry = new Date(today);
          if (t.typical_renewal_cycle === "annual") {
            expiry.setFullYear(expiry.getFullYear() + 1);
            // Vary dates slightly for demo feel
            expiry.setDate(expiry.getDate() - Math.floor(Math.random() * 300));
          } else if (t.typical_renewal_cycle === "biennial") {
            expiry.setFullYear(expiry.getFullYear() + 2);
            expiry.setDate(expiry.getDate() - Math.floor(Math.random() * 600));
          } else if (t.typical_renewal_cycle === "per_project") {
            expiry.setMonth(expiry.getMonth() + 3);
          }
          expiryDate = expiry.toISOString().split("T")[0];
        }
        return {
          user_id: userId,
          name: t.permit_name,
          category: t.category,
          issuing_agency: t.agency_name,
          agency_url: t.agency_url,
          expiry_date: expiryDate,
          renewal_cost: t.typical_cost_max || t.typical_cost_min,
          penalty_amount: t.penalty_range_max || t.penalty_range_min,
          filing_type: t.filing_type,
          required_docs: t.required_docs,
          tips: t.tips,
          is_one_time: t.is_one_time,
          status: t.is_one_time ? "one_time" : "active",
          type: t.typical_renewal_cycle || "annual",
        };
      });
      await supabase.from("permits").insert(permits);
    }

    setSaving(false);
    router.push("/dashboard");
  };

  const industryObj = INDUSTRIES.find((i) => i.value === industry);
  const stateObj = STATES.find((s) => s.value === state);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <span className="font-bold text-white">PermitPulse</span>
        </Link>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className={step >= 1 ? "text-emerald-400 font-semibold" : ""}>1. Business Info</span>
          <span>→</span>
          <span className={step >= 2 ? "text-emerald-400 font-semibold" : ""}>2. Review</span>
          <span>→</span>
          <span className={step >= 3 ? "text-emerald-400 font-semibold" : ""}>3. Done</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Step 1: Select Industry + State */}
        {step === 1 && (
          <div>
            <h1 className="text-3xl font-black text-white mb-2">Tell us about your business</h1>
            <p className="text-slate-400 mb-8">We'll automatically load every license and permit you need.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">Business Name *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
                  placeholder="e.g. Maria's Kitchen, ABC Contracting..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">Business Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.value}
                      onClick={() => setIndustry(ind.value)}
                      className={`p-4 rounded-xl border text-left transition ${
                        industry === ind.value
                          ? "bg-emerald-900/30 border-emerald-500 text-white"
                          : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <span className="text-2xl block mb-1">{ind.icon}</span>
                      <span className="text-sm font-medium">{ind.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">State *</label>
                <div className="grid grid-cols-3 gap-2">
                  {STATES.map((st) => (
                    <button
                      key={st.value}
                      onClick={() => setState(st.value)}
                      className={`p-3 rounded-lg border text-sm font-medium transition ${
                        state === st.value
                          ? "bg-emerald-900/30 border-emerald-500 text-white"
                          : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">City (optional)</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
                  placeholder="e.g. Los Angeles, Austin..."
                />
              </div>

              <button
                onClick={handleStep2}
                disabled={!industry || !state || !businessName}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white py-4 rounded-xl font-bold text-lg transition"
              >
                Show Me My Required Permits →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review Templates */}
        {step === 3 && (
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-black text-white mb-2">Your Compliance Requirements</h1>
              <p className="text-slate-400">
                Based on your business: <strong className="text-white">{industryObj?.icon} {industryObj?.label}</strong> in <strong className="text-white">{stateObj?.label}</strong>
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400">Loading compliance data...</div>
            ) : templates.length === 0 ? (
              <div className="bg-amber-950/30 border border-amber-800 rounded-xl p-6 mb-6">
                <p className="text-amber-300">We don't have specific templates for this combination yet, but your account is ready! You can manually add your permits.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {templates.map((t, i) => (
                  <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${t.is_one_time ? "bg-blue-400" : "bg-emerald-400"}`} />
                          <span className="font-semibold text-white text-sm">{t.permit_name}</span>
                          {t.is_one_time && <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full">One-Time</span>}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
                          {t.category && <span>{t.category}</span>}
                          {t.typical_renewal_cycle && !t.is_one_time && <span>• Renews {t.typical_renewal_cycle}</span>}
                          {t.typical_cost_max && <span>• ~${t.typical_cost_max.toLocaleString()}/yr</span>}
                          {t.penalty_range_max && <span className="text-red-400">• Up to ${t.penalty_range_max.toLocaleString()} fine</span>}
                        </div>
                      </div>
                      <span className="text-slate-600 text-sm ml-2">#{i + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-xl p-4 mb-6 text-sm text-emerald-300">
              🎉 <strong>{templates.length} permits</strong> will be added to your compliance dashboard. Expiry dates are estimated — update them with your actual dates.
            </div>

            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-lg transition"
            >
              {saving ? "Setting up your dashboard..." : "Open My Dashboard →"}
            </button>

            <button onClick={() => setStep(1)} className="w-full mt-3 text-slate-400 hover:text-white text-sm transition">
              ← Back to edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
