"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase, Employee, Certification, daysUntil, getStatusFromDays } from "@/lib/supabase";
import NavBar from "@/components/NavBar";

const CERT_TYPES = [
  "Food Handler Card", "ServSafe Manager", "OSHA 10-Hour", "OSHA 30-Hour",
  "CPR/AED", "First Aid", "TABC Certification", "MAST Permit",
  "Cosmetology License", "Esthetician License", "Barber License",
  "Real Estate License", "Driver's License (CDL)", "Forklift Certification",
  "HIPAA Training", "BLS (Basic Life Support)", "Custom...",
];

function AddEmployeeModal({ onClose, onSaved, userId }: { onClose: () => void; onSaved: () => void; userId: string }) {
  const [form, setForm] = useState({ name: "", role: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    const supabase = getSupabase();
    await supabase.from("employees").insert({ user_id: userId, ...form });
    setSaving(false);
    onSaved();
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-white">Add Employee</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Role / Position</label>
            <input type="text" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
              placeholder="e.g. Line Cook, Manager, Stylist..." />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm" />
          </div>
        </div>
        <div className="p-5 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm">Cancel</button>
          <button onClick={save} disabled={!form.name || saving} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold">
            {saving ? "Adding..." : "Add Employee"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddCertModal({ employeeId, userId, onClose, onSaved }: { employeeId: string; userId: string; onClose: () => void; onSaved: () => void }) {
  const [certType, setCertType] = useState("");
  const [customType, setCustomType] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadLink, setUploadLink] = useState("");

  const save = async () => {
    const type = certType === "Custom..." ? customType : certType;
    if (!type) return;
    setSaving(true);
    const supabase = getSupabase();
    const { data } = await supabase.from("certifications").insert({
      employee_id: employeeId,
      user_id: userId,
      cert_type: type,
      expiry_date: expiryDate || null,
      status: "pending",
    }).select().single();
    if (data) {
      setUploadLink(`${window.location.origin}/upload/${data.upload_token}`);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-white">Add Certification</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Certification Type</label>
            <select value={certType} onChange={(e) => setCertType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm">
              <option value="">Select type...</option>
              {CERT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {certType === "Custom..." && (
            <div>
              <input type="text" value={customType} onChange={(e) => setCustomType(e.target.value)}
                placeholder="Enter certification name..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm" />
            </div>
          )}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Expiry Date (optional)</label>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm" />
          </div>
          {uploadLink && (
            <div className="bg-emerald-950/30 border border-emerald-800 rounded-lg p-3">
              <p className="text-emerald-300 text-xs font-semibold mb-1">📤 Employee Upload Link</p>
              <p className="text-emerald-400 text-xs break-all">{uploadLink}</p>
              <button onClick={() => navigator.clipboard.writeText(uploadLink)} className="mt-2 text-xs text-slate-400 hover:text-white">Copy link</button>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm">
            {uploadLink ? "Done" : "Cancel"}
          </button>
          {!uploadLink && (
            <button onClick={save} disabled={(!certType || (certType === "Custom..." && !customType)) || saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold">
              {saving ? "Adding..." : "Add + Generate Upload Link"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmployeesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(searchParams.get("new") === "1");
  const [addCertEmployee, setAddCertEmployee] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");

  const loadData = useCallback(async () => {
    const supabase = getSupabase();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { router.push("/auth"); return; }
    setUserId(user.user.id);
    const [empRes, certRes, profileRes] = await Promise.all([
      supabase.from("employees").select("*").eq("user_id", user.user.id).order("name"),
      supabase.from("certifications").select("*").eq("user_id", user.user.id),
      supabase.from("profiles").select("business_name").eq("id", user.user.id).single(),
    ]);
    setEmployees(empRes.data || []);
    setCertifications(certRes.data || []);
    setBusinessName(profileRes.data?.business_name || "");
    setLoading(false);
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const deleteEmployee = async (id: string) => {
    if (!confirm("Delete this employee and all their certifications?")) return;
    const supabase = getSupabase();
    await supabase.from("employees").delete().eq("id", id);
    setEmployees(employees.filter((e) => e.id !== id));
    setCertifications(certifications.filter((c) => c.employee_id !== id));
  };

  const copyUploadLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/upload/${token}`);
    alert("Upload link copied!");
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading...</div>;

  const getCertsForEmployee = (empId: string) => certifications.filter((c) => c.employee_id === empId);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Employee Certifications</h1>
          <p className="text-slate-400 text-sm mt-1">{employees.length} employees · {certifications.length} certifications tracked</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
          + Add Employee
        </button>
      </div>

      <div className="bg-blue-950/20 border border-blue-800/50 rounded-xl p-4 mb-6 text-sm text-blue-300">
        <p><strong>How it works:</strong> Add employees → Generate upload link → Employee uploads their own cert without creating an account → Dashboard updates automatically.</p>
      </div>

      {employees.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-slate-400 mb-4">No employees tracked yet.</p>
          <button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-semibold">
            Add First Employee
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {employees.map((emp) => {
            const certs = getCertsForEmployee(emp.id);
            const expiredCerts = certs.filter((c) => daysUntil(c.expiry_date) < 0);
            const pendingCerts = certs.filter((c) => c.status === "pending");
            return (
              <div key={emp.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-lg">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{emp.name}</p>
                      <p className="text-slate-500 text-xs">{emp.role || "No role specified"} {emp.email ? `· ${emp.email}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {expiredCerts.length > 0 && (
                      <span className="text-xs bg-red-950/50 text-red-400 border border-red-800 px-2 py-0.5 rounded-full">{expiredCerts.length} expired</span>
                    )}
                    {pendingCerts.length > 0 && (
                      <span className="text-xs bg-amber-950/50 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full">{pendingCerts.length} pending</span>
                    )}
                    <button onClick={() => setAddCertEmployee(emp.id)} className="text-xs bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/70 px-3 py-1 rounded-lg transition">
                      + Cert
                    </button>
                    <button onClick={() => deleteEmployee(emp.id)} className="text-xs text-slate-500 hover:text-red-400 transition">×</button>
                  </div>
                </div>
                {certs.length > 0 && (
                  <div className="border-t border-slate-800 px-4 py-3">
                    <div className="space-y-2">
                      {certs.map((cert) => {
                        const days = daysUntil(cert.expiry_date);
                        const status = cert.expiry_date ? getStatusFromDays(days, false) : null;
                        return (
                          <div key={cert.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span>{status?.emoji || "🔵"}</span>
                              <span className="text-slate-300">{cert.cert_type}</span>
                              {cert.status === "pending" && <span className="text-xs text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded">Awaiting upload</span>}
                              {cert.status === "uploaded" && <span className="text-xs text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded">Uploaded</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              {cert.expiry_date && (
                                <span className={`text-xs ${status?.color}`}>
                                  {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                                </span>
                              )}
                              {cert.status === "pending" && (
                                <button onClick={() => copyUploadLink(cert.upload_token)} className="text-xs text-slate-400 hover:text-emerald-400 transition">
                                  Copy link
                                </button>
                              )}
                              {cert.file_url && (
                                <a href={cert.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline">View</a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {certs.length === 0 && (
                  <div className="border-t border-slate-800 px-4 py-3 text-sm text-slate-500">
                    No certifications tracked. <button onClick={() => setAddCertEmployee(emp.id)} className="text-emerald-400 hover:text-emerald-300">Add one →</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAdd && userId && (
        <AddEmployeeModal onClose={() => setShowAdd(false)} onSaved={loadData} userId={userId} />
      )}
      {addCertEmployee && userId && (
        <AddCertModal employeeId={addCertEmployee} userId={userId} onClose={() => setAddCertEmployee(null)} onSaved={loadData} />
      )}
    </div>
  );
}

export default function EmployeesPage() {
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
        <EmployeesContent />
      </Suspense>
    </div>
  );
}
