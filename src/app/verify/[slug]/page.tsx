import { createServiceClient, daysUntil, getStatusFromDays, INDUSTRIES } from "@/lib/supabase";
import Link from "next/link";

export default async function VerifyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-center px-6">
        <div>
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-black text-white mb-2">Business Not Found</h1>
          <p className="text-slate-400">This compliance badge link is invalid or has been removed.</p>
          <Link href="/" className="mt-6 inline-block text-emerald-400 hover:text-emerald-300">← PermitPulse Home</Link>
        </div>
      </div>
    );
  }

  const { data: permits } = await supabase
    .from("permits")
    .select("*")
    .eq("user_id", profile.id)
    .order("expiry_date");

  const activePermits = (permits || []).filter((p) => !p.is_one_time);
  const compliantCount = activePermits.filter((p) => daysUntil(p.expiry_date) >= 0).length;
  const complianceScore = activePermits.length > 0 ? Math.round((compliantCount / activePermits.length) * 100) : 100;
  const industry = INDUSTRIES.find((i) => i.value === profile.industry);
  const lastUpdated = new Date(profile.updated_at || profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const badgeColor = complianceScore === 100 ? "emerald" : complianceScore >= 70 ? "amber" : "red";
  const badgeLabel = complianceScore === 100 ? "Fully Compliant" : complianceScore >= 70 ? "Mostly Compliant" : "Compliance Issues";

  const embedCode = `<a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://permitpulse.com'}/verify/${slug}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;background:#1e293b;color:white;padding:8px 16px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:14px;border:1px solid ${complianceScore === 100 ? '#10b981' : '#f59e0b'}">🛡️ <span>Verified Compliance — ${complianceScore}% — PermitPulse</span></a>`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <span className="font-bold text-white">PermitPulse</span>
          </Link>
          <span className="text-slate-400 text-sm">Public Compliance Certificate</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Badge */}
        <div className={`rounded-2xl border-2 p-8 text-center mb-8 ${
          badgeColor === "emerald" ? "bg-emerald-950/20 border-emerald-600" :
          badgeColor === "amber" ? "bg-amber-950/20 border-amber-600" :
          "bg-red-950/20 border-red-600"
        }`}>
          <div className="text-5xl mb-3">🛡️</div>
          <h1 className="text-3xl font-black text-white mb-1">{profile.business_name}</h1>
          {industry && <p className="text-slate-400 mb-1">{industry.icon} {industry.label}</p>}
          {profile.state_code && <p className="text-slate-400 text-sm mb-4">{profile.state_code}{profile.city ? `, ${profile.city}` : ""}</p>}

          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold ${
            badgeColor === "emerald" ? "bg-emerald-600 text-white" :
            badgeColor === "amber" ? "bg-amber-600 text-white" :
            "bg-red-600 text-white"
          }`}>
            <span>{complianceScore === 100 ? "✅" : complianceScore >= 70 ? "⚠️" : "🚨"}</span>
            {badgeLabel} · {complianceScore}%
          </div>

          <p className="text-slate-400 text-sm mt-4">Last updated: {lastUpdated}</p>
          <p className="text-slate-500 text-xs mt-1">Verified by PermitPulse · permitpulse.com</p>
        </div>

        {/* License Summary */}
        {(permits?.length || 0) > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-white mb-4">License & Permit Summary</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-black text-white">{permits?.length || 0}</div>
                <div className="text-slate-400 text-xs">Total Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-emerald-400">{compliantCount}</div>
                <div className="text-slate-400 text-xs">Current</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-white">{complianceScore}%</div>
                <div className="text-slate-400 text-xs">Compliance Score</div>
              </div>
            </div>

            <div className="space-y-2">
              {permits?.slice(0, 10).map((permit) => {
                const days = daysUntil(permit.expiry_date);
                const status = getStatusFromDays(days, permit.is_one_time);
                return (
                  <div key={permit.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-2">
                      <span>{status.emoji}</span>
                      <span className="text-slate-300">{permit.name}</span>
                    </div>
                    <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
                  </div>
                );
              })}
              {(permits?.length || 0) > 10 && (
                <p className="text-center text-slate-500 text-sm pt-2">+{(permits?.length || 0) - 10} more</p>
              )}
            </div>
          </div>
        )}

        {/* Embed Code */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="font-bold text-white mb-2">Add to Your Website</h2>
          <p className="text-slate-400 text-sm mb-4">Copy this HTML snippet to display your compliance badge on your website.</p>
          <div className="bg-slate-800 rounded-lg p-4 mb-3">
            <code className="text-xs text-emerald-400 break-all">{embedCode}</code>
          </div>
          <button
            onClick={() => {
              if (typeof navigator !== "undefined") navigator.clipboard.writeText(embedCode);
            }}
            className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition"
          >
            Copy Embed Code
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            This compliance badge is maintained by the business owner via{" "}
            <Link href="/" className="text-emerald-400 hover:text-emerald-300">PermitPulse</Link>.
            Information is self-reported and not independently verified.
          </p>
        </div>
      </div>
    </div>
  );
}
