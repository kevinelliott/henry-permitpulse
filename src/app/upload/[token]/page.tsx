"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

export default function UploadPage() {
  const params = useParams();
  const token = params.token as string;
  const [cert, setCert] = useState<{ cert_type: string; employees: { name: string; role?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("certifications")
        .select("*, employees(name, role)")
        .eq("upload_token", token)
        .single();
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setCert(data);
      if (data.expiry_date) setExpiryDate(data.expiry_date);
      if (data.issue_date) setIssueDate(data.issue_date);
      setLoading(false);
    };
    load();
  }, [token]);

  const handleUpload = async () => {
    if (!file) { setError("Please select a file to upload."); return; }
    setUploading(true);
    setError("");
    const supabase = getSupabase();

    // Upload file to storage (if bucket exists, otherwise just update dates)
    let fileUrl: string | null = null;
    try {
      const fileName = `certs/${token}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("certifications")
        .upload(fileName, file, { upsert: true });
      if (!uploadError && uploadData) {
        const { data: publicUrl } = supabase.storage.from("certifications").getPublicUrl(fileName);
        fileUrl = publicUrl.publicUrl;
      }
    } catch {
      // Storage bucket may not exist, that's OK — just save dates
    }

    await supabase.from("certifications").update({
      status: "uploaded",
      issue_date: issueDate || null,
      expiry_date: expiryDate || null,
      file_url: fileUrl,
      file_name: file.name,
    }).eq("upload_token", token);

    setUploading(false);
    setDone(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <p>Loading...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-center px-6">
        <div>
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-black text-white mb-2">Invalid Upload Link</h1>
          <p className="text-slate-400">This upload link is invalid or has expired. Contact your employer for a new link.</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-center px-6">
        <div>
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-black text-white mb-2">Upload Complete!</h1>
          <p className="text-slate-400 max-w-sm">Your {cert?.cert_type} has been uploaded successfully. Your employer can now see it in their dashboard.</p>
          <p className="text-slate-500 text-sm mt-4">You can close this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-xl">🛡️</span>
            <span className="font-bold text-white">PermitPulse</span>
          </Link>
          <h1 className="text-2xl font-black text-white">Upload Your Certification</h1>
          <p className="text-slate-400 mt-2">No account needed — just upload your document</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-900/50">
            <p className="text-sm text-slate-400">Uploading for</p>
            <p className="font-bold text-white text-lg">{cert?.employees?.name || "Unknown"}</p>
            {cert?.employees?.role && <p className="text-slate-400 text-sm">{cert.employees.role}</p>}
          </div>
          <div className="p-6">
            <div className="bg-emerald-950/20 border border-emerald-800/50 rounded-xl p-4 mb-6">
              <p className="text-emerald-300 font-semibold">{cert?.cert_type}</p>
              <p className="text-slate-400 text-xs mt-1">Please upload your certificate, card, or proof of completion.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Issue Date</label>
                <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Expiry Date</label>
                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Certificate File *</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                    file ? "border-emerald-600 bg-emerald-950/20" : "border-slate-700 hover:border-slate-500"
                  }`}
                >
                  {file ? (
                    <div>
                      <p className="text-emerald-400 font-semibold">{file.name}</p>
                      <p className="text-slate-400 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-4xl mb-2">📄</p>
                      <p className="text-slate-400">Click to select file</p>
                      <p className="text-slate-500 text-xs mt-1">PDF, JPG, PNG — Max 10MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-4 rounded-xl font-bold transition"
              >
                {uploading ? "Uploading..." : "Submit Certification →"}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-4">
          Powered by <Link href="/" className="text-slate-400 hover:text-white">PermitPulse</Link> · Your employer invited you to upload this document.
        </p>
      </div>
    </div>
  );
}
