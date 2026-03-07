"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabase, Permit, daysUntil, getStatusFromDays, formatCurrency } from "@/lib/supabase";
import NavBar from "@/components/NavBar";
import Link from "next/link";

function CalendarView({ permits }: { permits: Permit[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getPermitsOnDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return permits.filter((p) => p.expiry_date === dateStr);
  };

  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-white">{monthName}</h3>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-slate-800 text-sm">‹</button>
          <button onClick={() => setCurrentMonth(new Date())} className="text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-slate-800 text-sm">Today</button>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-slate-800 text-sm">›</button>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs text-slate-500 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dayPermits = getPermitsOnDay(day);
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
            return (
              <div key={day} className={`aspect-square rounded-lg p-1 text-center ${isToday ? "bg-emerald-900/30 border border-emerald-600" : "bg-slate-800/30"}`}>
                <span className={`text-xs ${isToday ? "text-emerald-400 font-bold" : "text-slate-400"}`}>{day}</span>
                {dayPermits.map((p, i) => {
                  const days = daysUntil(p.expiry_date);
                  const status = getStatusFromDays(days, false);
                  return (
                    <div key={i} className={`mt-0.5 text-xs rounded px-0.5 truncate ${status.bg} ${status.color}`} title={p.name}>
                      •
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function RenewalsPage() {
  const router = useRouter();
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [showChecklist, setShowChecklist] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const supabase = getSupabase();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { router.push("/auth"); return; }
    const [permitsRes, profileRes] = await Promise.all([
      supabase.from("permits").select("*").eq("user_id", user.user.id).not("expiry_date", "is", null).order("expiry_date"),
      supabase.from("profiles").select("business_name").eq("id", user.user.id).single(),
    ]);
    setPermits(permitsRes.data?.filter((p) => !p.is_one_time) || []);
    setBusinessName(profileRes.data?.business_name || "");
    setLoading(false);
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const generateIcal = () => {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//PermitPulse//EN",
    ];
    permits.forEach((p) => {
      if (!p.expiry_date) return;
      const d = p.expiry_date.replace(/-/g, "");
      // 30-day reminder
      const reminderDate = new Date(p.expiry_date);
      reminderDate.setDate(reminderDate.getDate() - 30);
      const rDate = reminderDate.toISOString().slice(0, 10).replace(/-/g, "");
      lines.push("BEGIN:VEVENT");
      lines.push(`DTSTART:${d}`);
      lines.push(`DTEND:${d}`);
      lines.push(`SUMMARY:PERMIT EXPIRES: ${p.name}`);
      lines.push(`DESCRIPTION:${p.issuing_agency || ""}\\nRenewal cost: $${p.renewal_cost || 0}`);
      lines.push("END:VEVENT");
      // 30-day warning event
      lines.push("BEGIN:VEVENT");
      lines.push(`DTSTART:${rDate}`);
      lines.push(`DTEND:${rDate}`);
      lines.push(`SUMMARY:⚠️ 30 DAYS: ${p.name} expires soon`);
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "permitpulse-renewals.ics";
    a.click();
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>;

  const overdue = permits.filter((p) => daysUntil(p.expiry_date) < 0);
  const warning = permits.filter((p) => { const d = daysUntil(p.expiry_date); return d >= 0 && d < 30; });
  const upcoming = permits.filter((p) => { const d = daysUntil(p.expiry_date); return d >= 30 && d < 90; });
  const current = permits.filter((p) => daysUntil(p.expiry_date) >= 90);

  const urgentPermits = [...overdue, ...warning, ...upcoming, ...current];
  const selectedPermit = showChecklist ? permits.find((p) => p.id === showChecklist) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavBar businessName={businessName} />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Renewal Calendar</h1>
            <p className="text-slate-400 text-sm mt-1">{overdue.length + warning.length} items need attention</p>
          </div>
          <div className="flex gap-2">
            <button onClick={generateIcal} className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition">
              📅 Export iCal
            </button>
            <div className="flex bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
              <button onClick={() => setView("list")} className={`px-3 py-2 text-sm transition ${view === "list" ? "bg-slate-700 text-white" : "text-slate-400"}`}>List</button>
              <button onClick={() => setView("calendar")} className={`px-3 py-2 text-sm transition ${view === "calendar" ? "bg-slate-700 text-white" : "text-slate-400"}`}>Calendar</button>
            </div>
          </div>
        </div>

        {/* Print Checklist Modal */}
        {selectedPermit && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white text-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between no-print">
                <h2 className="font-bold text-lg">Renewal Checklist</h2>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg">🖨️ Print</button>
                  <button onClick={() => setShowChecklist(null)} className="text-xl text-slate-400 hover:text-slate-600">×</button>
                </div>
              </div>
              <div className="p-6 print-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-xl font-black">{selectedPermit.name}</h1>
                    <p className="text-slate-500 text-sm">{businessName}</p>
                  </div>
                  {selectedPermit.expiry_date && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-600">Expires</p>
                      <p className="font-bold">{new Date(selectedPermit.expiry_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                <hr className="my-4" />
                {selectedPermit.issuing_agency && (
                  <div className="mb-4">
                    <p className="font-semibold text-xs uppercase text-slate-500 mb-1">Issuing Agency</p>
                    <p className="font-medium">{selectedPermit.issuing_agency}</p>
                    {selectedPermit.agency_url && <p className="text-sm text-blue-600">{selectedPermit.agency_url}</p>}
                  </div>
                )}
                {selectedPermit.renewal_cost && (
                  <div className="mb-4">
                    <p className="font-semibold text-xs uppercase text-slate-500 mb-1">Renewal Fee</p>
                    <p className="font-medium">{formatCurrency(selectedPermit.renewal_cost)}</p>
                  </div>
                )}
                {selectedPermit.filing_type && (
                  <div className="mb-4">
                    <p className="font-semibold text-xs uppercase text-slate-500 mb-1">Filing Method</p>
                    <p className="font-medium capitalize">{selectedPermit.filing_type.replace("_", " ")}</p>
                  </div>
                )}
                {selectedPermit.required_docs && selectedPermit.required_docs.length > 0 && (
                  <div className="mb-4">
                    <p className="font-semibold text-xs uppercase text-slate-500 mb-2">Required Documents</p>
                    <ul className="space-y-2">
                      {selectedPermit.required_docs.map((doc, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-4 h-4 border border-slate-400 rounded inline-block shrink-0" />
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedPermit.tips && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-amber-800 mb-1">💡 Important Notes</p>
                    <p className="text-amber-900">{selectedPermit.tips}</p>
                  </div>
                )}
                {selectedPermit.penalty_amount && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-red-800">⚠️ Penalty for non-compliance: {formatCurrency(selectedPermit.penalty_amount)}</p>
                  </div>
                )}
                <div className="mt-6 pt-4 border-t text-xs text-slate-400 text-center">
                  Generated by PermitPulse · {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "calendar" ? (
          <CalendarView permits={permits} />
        ) : (
          <div className="space-y-3">
            {urgentPermits.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-slate-400">No permits with expiry dates tracked yet.</p>
                <Link href="/permits?new=1" className="mt-4 inline-block text-emerald-400 hover:text-emerald-300 text-sm">Add a permit →</Link>
              </div>
            ) : (
              <>
                {overdue.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-red-400 uppercase mb-2">🔴 Overdue — Renew Immediately ({overdue.length})</h2>
                    <div className="space-y-2">
                      {overdue.map((p) => <RenewalItem key={p.id} permit={p} onChecklist={() => setShowChecklist(p.id)} />)}
                    </div>
                  </div>
                )}
                {warning.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-orange-400 uppercase mb-2">🟠 Expiring in &lt;30 Days ({warning.length})</h2>
                    <div className="space-y-2">
                      {warning.map((p) => <RenewalItem key={p.id} permit={p} onChecklist={() => setShowChecklist(p.id)} />)}
                    </div>
                  </div>
                )}
                {upcoming.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-amber-400 uppercase mb-2">🟡 Upcoming 30–90 Days ({upcoming.length})</h2>
                    <div className="space-y-2">
                      {upcoming.map((p) => <RenewalItem key={p.id} permit={p} onChecklist={() => setShowChecklist(p.id)} />)}
                    </div>
                  </div>
                )}
                {current.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-emerald-400 uppercase mb-2">✅ Current — 90+ Days ({current.length})</h2>
                    <div className="space-y-2">
                      {current.map((p) => <RenewalItem key={p.id} permit={p} onChecklist={() => setShowChecklist(p.id)} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RenewalItem({ permit, onChecklist }: { permit: Permit; onChecklist: () => void }) {
  const days = daysUntil(permit.expiry_date);
  const status = getStatusFromDays(days, false);
  return (
    <div className={`bg-slate-900 border rounded-xl p-4 flex items-center gap-4 ${status.bg} border-slate-700/50`}>
      <span className="text-xl shrink-0">{status.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white">{permit.name}</p>
        <p className="text-slate-500 text-xs">{permit.issuing_agency || "No agency"}</p>
      </div>
      <div className="text-right shrink-0">
        <div className={`text-sm font-bold ${status.color}`}>
          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
        </div>
        <div className="text-xs text-slate-500">{permit.expiry_date ? new Date(permit.expiry_date).toLocaleDateString() : ""}</div>
      </div>
      {permit.renewal_cost && <div className="text-xs text-slate-500 shrink-0">{formatCurrency(permit.renewal_cost)}</div>}
      {(permit.required_docs || permit.tips) && (
        <button onClick={onChecklist} className="text-xs bg-emerald-900/50 hover:bg-emerald-900/70 text-emerald-400 px-3 py-1.5 rounded-lg shrink-0 transition">
          Checklist
        </button>
      )}
    </div>
  );
}
